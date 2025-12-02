import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { streamText, convertToModelMessages, UIMessage } from "ai";
import { logApiUsage } from "@/models/ApiUsage";
import { createAssistantTools } from "@/lib/assistant/tools";
import { getDefaultModel } from "@/lib/ai-provider";
import { rateLimit } from "@/lib/rate-limit";

// Allow streaming responses up to 60 seconds for complex workflows
export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = session.user.orgId || "";
  const userId = session.user.id || session.user.email || "";
  const startedAt = Date.now();

  // Rate limiting: 20 requests per minute per user
  const rateLimitResult = await rateLimit(`assistant:${userId}`, {
    limit: 20,
    windowSeconds: 60,
  });
  
  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    const body = (await req.json()) as {
      messages: UIMessage[];
      conversationId?: string;
      temperature?: number;
      userMetadata?: Record<string, unknown>;
    };

    const tools = createAssistantTools({ orgId, userId: session.user.id });
    const systemPrompt = buildSystemPrompt(session.user.name);

    if (!body.messages || body.messages.length === 0) {
      return NextResponse.json(
        { error: "No messages provided" },
        { status: 400 }
      );
    }

    // Load full conversation history from MongoDB if conversationId is provided
    // This ensures AI always has complete context even if client state is stale
    let messagesToSend = body.messages;
    if (body.conversationId) {
      console.log('[Stream] Loading conversation from MongoDB:', body.conversationId);
      try {
        const { getConversation } = await import('@/models/Conversation');
        const conversation = await getConversation(body.conversationId, userId);
        
        if (conversation && conversation.messages && conversation.messages.length > 0) {
          // MongoDB has existing messages - merge with new message from client
          const dbMessages = conversation.messages.map(msg => ({
            id: msg.id,
            role: msg.role,
            parts: msg.parts || [{ type: 'text', text: msg.content || '' }],
            createdAt: msg.createdAt,
          })) as UIMessage[];
          
          // Get the last message from client (the new user message)
          const lastClientMessage = body.messages[body.messages.length - 1];
          
          // Check if this is a new message (not in DB yet)
          const isNewMessage = !dbMessages.some(m => m.id === lastClientMessage.id);
          
          if (isNewMessage) {
            // Append new message to DB messages
            messagesToSend = [...dbMessages, lastClientMessage];
            console.log('[Stream] Merged DB + new message:', {
              conversationId: body.conversationId,
              dbMessageCount: dbMessages.length,
              totalMessages: messagesToSend.length,
              newMessage: lastClientMessage.role,
            });
          } else {
            // All messages already in DB, use DB as source of truth
            messagesToSend = dbMessages;
            console.log('[Stream] Using DB messages only:', {
              conversationId: body.conversationId,
              messageCount: messagesToSend.length,
            });
          }
        } else {
          console.log('[Stream] No messages in DB, using client messages:', {
            conversationId: body.conversationId,
            clientMessageCount: body.messages.length,
          });
        }
      } catch (error) {
        console.error('[Stream] Error loading conversation from DB:', error);
        // Fallback to client messages on error
      }
    }

    // Get the default AI model configured by admin
    const model = await getDefaultModel(orgId);
    const provider = "assistant"; // Generic name for logging

    const result = streamText({
      model,
      system: systemPrompt,
      messages: convertToModelMessages(messagesToSend),
      tools,
      maxToolRoundtrips: 10, // Allow up to 10 tool execution rounds
      onStepFinish: async ({ toolCalls, toolResults, finishReason, text }) => {
        console.log("Step finished:", {
          finishReason,
          hasText: !!text && text.length > 0,
          textLength: text?.length || 0,
          toolCallCount: toolCalls?.length || 0,
          toolResultCount: toolResults?.length || 0,
          toolNames: toolCalls?.map(tc => tc.toolName),
        });
        
        // Log each tool execution
        if (toolCalls && toolCalls.length > 0) {
          toolCalls.forEach(tc => {
            console.log(`Tool called: ${tc.toolName}`, {
              input: "args" in tc ? tc.args : {},
            });
          });
        }
        
        if (toolResults && toolResults.length > 0) {
          toolResults.forEach(tr => {
            const result = "result" in tr ? tr.result : {};
            const hasError = result && typeof result === "object" && "error" in result;
            console.log(`Tool result: ${tr.toolName}`, {
              success: !hasError,
              hasError,
              output: result,
            });
            
            // Log tool errors for debugging
            if (hasError) {
              console.error(`Tool execution error for ${tr.toolName}:`, result.error);
            }
          });
        }
      },
      onFinish: async ({ usage, totalUsage, finishReason, steps, text }) => {
        console.log("Stream finished:", { 
          finishReason, 
          totalSteps: steps || 0,
          hasText: !!text && text.length > 0,
          textLength: text?.length || 0,
          usage: {
            inputTokens: usage?.inputTokens || 0,
            outputTokens: usage?.outputTokens || 0,
            totalTokens: usage?.totalTokens || 0,
          },
          totalUsage: {
            inputTokens: totalUsage?.inputTokens || 0,
            outputTokens: totalUsage?.outputTokens || 0,
            totalTokens: totalUsage?.totalTokens || 0,
          }
        });
        
        // Log warning for unknown finish reasons
        if (finishReason === 'unknown' || (totalUsage?.outputTokens || 0) === 0) {
          console.warn('⚠️ Stream ended abnormally:', {
            finishReason,
            hasOutput: (totalUsage?.outputTokens || 0) > 0,
            stepsCompleted: steps?.length || 0,
            lastStepFinishReason: steps && steps.length > 0 ? steps[steps.length - 1].finishReason : 'none'
          });
        }
        await logApiUsage({
          orgId,
          userId,
          provider,
          endpoint: "assistant_stream",
          method: "POST",
          units: totalUsage?.totalTokens || usage?.totalTokens || 0,
          status: "success",
          durationMs: Date.now() - startedAt,
        });
      },
      onError: async ({ error }) => {
        console.error("Stream error:", error);
        
        // Handle specific AI SDK errors
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        const errorType = error instanceof Error ? error.constructor.name : "Unknown";
        
        console.error("Error details:", {
          type: errorType,
          message: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
        });
        
        await logApiUsage({
          orgId,
          userId,
          provider,
          endpoint: "assistant_stream",
          method: "POST",
          units: 0,
          status: "error",
          durationMs: Date.now() - startedAt,
          error: `${errorType}: ${errorMessage}`,
        });
      },
    });

    // Return streaming response compatible with useChat
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Assistant stream error", error);

    await logApiUsage({
      orgId,
      userId,
      provider: "assistant",
      endpoint: "assistant_stream",
      method: "POST",
      units: 0,
      status: "error",
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to stream assistant response" },
      { status: 500 }
    );
  }
}

function buildSystemPrompt(userName?: string | null) {
  return `You are a professional AI assistant for a lead generation and prospecting platform.

**‼️ CRITICAL - READ THIS FIRST ‼️**:
YOU MUST ALWAYS RESPOND WITH TEXT AFTER USING A TOOL. 
NEVER END YOUR RESPONSE WITH ONLY A TOOL CALL.
AFTER EVERY TOOL EXECUTION, WRITE A MESSAGE TO THE USER EXPLAINING THE RESULTS.

**MANDATORY WORKFLOW**:
1. Use a tool (e.g., searchRocketReach)
2. Wait for the tool result
3. **WRITE A TEXT RESPONSE** describing what happened
4. If needed, use another tool
5. **WRITE ANOTHER TEXT RESPONSE**

Example correct flow:
- User: "Find CTOs in SF"
- You: [call searchRocketReach tool]
- Tool returns: {10 leads found}
- You: "I found 10 CTOs in San Francisco. Here they are: [list]"  ← YOU MUST DO THIS

Example WRONG flow (DO NOT DO THIS):
- User: "Find CTOs"
- You: [call searchRocketReach tool]  
- [STOPS HERE] ← NEVER DO THIS

**RESPONSE RULES**:
**RESPONSE RULES**:
1. After searchRocketReach → Call saveLeads → Describe results with text
2. After lookupRocketReach → Show contact details with text
3. After sendEmail/sendWhatsApp → Confirm with "✓ Sent X messages"
4. After saveLeads → Confirm with "✓ Saved X leads to database"
5. If tool fails → Explain error in plain language

**WORKFLOW**:
When user asks to find leads:
- Call searchRocketReach(filters) once
- Call saveLeads(results) to save
- **Respond with text** describing the leads found

When user asks to enrich/get emails:
- Look at conversation history for lead IDs
- Call lookupRocketReachProfile(personId) for each lead
- Call saveLeads() to update database  
- **Respond with text** showing all contact details

When user asks to send messages:
- Call sendEmail() or sendWhatsApp()
- **Respond with text** confirming sends

**IMPORTANT**: Always end every interaction with a natural language message to the user. Tool calls alone are never enough.

User: ${userName ?? "Anonymous"}`;
}
