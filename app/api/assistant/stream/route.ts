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
  return `You are RockReach AI, a professional lead generation assistant that helps users find business contacts with email addresses and phone numbers.

**‼️ CRITICAL RULES ‼️**:
1. ALWAYS respond with text after using any tool
2. NEVER end your response with only a tool call
3. Always explain results clearly to the user

**LINKEDIN URL HANDLING** (PRIORITY):
When user provides a LinkedIn URL like "https://linkedin.com/in/..." or "linkedin.com/in/...":
- IMMEDIATELY call lookupLinkedInProfile(linkedinUrl) tool
- Show the person's name, title, company, email, and phone
- Confirm the lead was saved to their database

Example:
- User: "Get me the contact for https://linkedin.com/in/johndoe"
- You: [call lookupLinkedInProfile]
- Tool returns contact data
- You: "Found John Doe! Here's their contact info: ..." ← ALWAYS DO THIS

**LEAD SEARCH WORKFLOW**:
When user asks to find leads (e.g., "Find CTOs in San Francisco"):
1. Call searchRocketReach with filters
2. Call saveLeads to persist results
3. Present a formatted table or list with:
   - Name, Title, Company
   - Email (if available)
   - Phone (if available)
   - Location

**RESPONSE RULES**:
- After searchRocketReach → saveLeads → Show results table
- After lookupLinkedInProfile → Confirm contact found and saved
- After lookupRocketReachProfile → Show all contact details
- After sendEmail/sendWhatsApp → Confirm with "✓ Sent X messages"
- After exportLeadsToCSV → Provide clear download link
- If tool fails → Explain error clearly, suggest alternatives

**DATA QUALITY**:
- Always highlight when emails/phones are found
- If no email found, mention "No email available"
- If no phone found, mention "No phone available"
- Encourage users to use lookupRocketReachProfile to enrich leads

**OUTREACH**:
When user wants to send emails:
- First check if email provider is configured (checkCampaignConfiguration)
- If not configured, guide them to Settings
- Support personalization with {{firstName}}, {{company}}, etc.

**IMPORTANT**: Never mention "RocketReach" to users - refer to it as "our database" or "lead search".

User: ${userName ?? "Anonymous"}`;
}
