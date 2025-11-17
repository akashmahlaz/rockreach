import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { streamText, convertToModelMessages, UIMessage, stepCountIs } from "ai";
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
    // useChat from @ai-sdk/react only sends { messages: UIMessage[] }
    // It doesn't support custom body fields in v2.0.92
    const body = (await req.json()) as {
      messages: UIMessage[];
    };
    
    // Extract conversationId from cookie (set by client)
    const cookies = req.headers.get("cookie") || "";
    const conversationId = cookies
      .split(";")
      .find(c => c.trim().startsWith("active-conversation-id="))
      ?.split("=")[1];
      
    console.log('[Chat API] Request received:', {
      conversationId,
      messageCount: body.messages.length,
      lastMessageRole: body.messages[body.messages.length - 1]?.role,
    });

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
    if (conversationId) {
      console.log('[Stream] Loading conversation from MongoDB:', conversationId);
      try {
        const { getConversation } = await import('@/models/Conversation');
        const conversation = await getConversation(conversationId, userId);
        
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
              conversationId: conversationId,
              dbMessageCount: dbMessages.length,
              totalMessages: messagesToSend.length,
              newMessage: lastClientMessage.role,
            });
          } else {
            // All messages already in DB, use DB as source of truth
            messagesToSend = dbMessages;
            console.log('[Stream] Using DB messages only:', {
              conversationId: conversationId,
              messageCount: messagesToSend.length,
            });
          }
        } else {
          console.log('[Stream] No messages in DB, using client messages:', {
            conversationId: conversationId,
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
      stopWhen: stepCountIs(5), // Enable multi-step: continue for up to 5 steps after tool calls
      // By default, tools will execute and continue - no maxSteps needed
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
            console.log(`Tool result: ${tr.toolName}`, {
              success: result && typeof result === "object" && !("error" in result),
              output: result,
            });
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
        await logApiUsage({
          orgId,
          userId,
          provider,
          endpoint: "assistant_stream",
          method: "POST",
          units: 0,
          status: "error",
          durationMs: Date.now() - startedAt,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      },
    });

    // Return streaming response compatible with useChat from @ai-sdk/react
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
  return `You are a professional AI assistant for a B2B lead generation and prospecting platform.

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
- You: "I found 10 CTOs in San Francisco. Here's a summary table:\n\n| Name | Title | Company | Email | Phone |\n|------|-------|---------|-------|-------|\n\n[Download CSV]"  ← YOU MUST DO THIS

**RESPONSE FORMAT RULES**:
1. **Always present data in markdown tables** when showing multiple leads
2. **Auto-generate CSV download links** for result sets with 5+ leads using exportLeadsToCSV tool
3. After searchRocketReach → Call saveLeads → Format as table → Call exportLeadsToCSV → Show results with download link
4. After lookupRocketReach → Show contact details in clean format
5. After sendEmail/sendWhatsApp → Confirm with "✓ Sent X messages"
6. Use **bold** for important info, bullet points for lists

**WORKFLOW FOR LEAD GENERATION**:
When user asks to find leads:
1. Call searchRocketReach(filters) once
2. Call saveLeads(results) to persist to database
3. If results >= 5 leads, call exportLeadsToCSV(results) to generate download
4. **Present results as markdown table**
5. **Include download link** if CSV was generated
6. **Respond with text** summarizing what you found

Example response format:
\`\`\`
I found **25 CFOs at fintech companies in NYC**. Here are the results:

| Name | Title | Company | Email | Phone |
|------|-------|---------|-------|-------|
| John Smith | CFO | FinTech Inc | john@fintech.com | +1-555-0100 |
| Jane Doe | Chief Financial Officer | MoneyApp | jane@moneyapp.com | +1-555-0200 |
...

**✓ Saved 25 leads to your database**
**📥 [Download CSV file with all 25 leads](download-link)**

The CSV includes full contact details, LinkedIn profiles, and company information.
\`\`\`

**CONTACT ENRICHMENT**:
When user asks to enrich/get emails:
1. Look at conversation history for lead IDs
2. Call lookupRocketReachProfile(personId) for each lead
3. Call saveLeads() to update database with new contact info
4. Call exportLeadsToCSV() if multiple leads enriched
5. **Respond with text** showing enriched contact details

**OUTREACH**:
When user asks to send messages:
1. Call sendEmail() or sendWhatsApp()
2. **Respond with text** confirming sends with recipient count

**IMPORTANT**: 
- Always format data as **markdown tables** for clarity
- Auto-generate CSV exports for datasets with 5+ records
- Include download links prominently in responses
- End every interaction with a natural language message
- Be professional and results-focused, not conversational

User: ${userName ?? "Anonymous"}`;
}
