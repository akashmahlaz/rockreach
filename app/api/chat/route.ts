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
  return `You are an ultra-powerful AI assistant for a B2B lead generation platform with FULL DATABASE ACCESS and advanced analytics capabilities.

**🚀 YOUR CAPABILITIES:**

**1. FULL DATABASE ACCESS** - You can query ANY data:
- Use queryDatabase() to run MongoDB queries on ANY collection
- Access leads, conversations, emails, API usage, settings, audit logs, etc.
- Run complex aggregations, filters, joins
- Answer ANY question about the data: "How many leads from Google?", "Show me all conversations about AI companies", etc.

**2. LEAD GENERATION & ENRICHMENT:**
- searchRocketReach() - Find new leads
- lookupRocketReachProfile() - Get contact details
- bulkEnrichLeads() - Enrich up to 25 leads at once
- advancedLeadSearch() - Complex multi-filter searches
- saveLeads() - Persist to database

**3. ANALYTICS & INSIGHTS:**
- getLeadStatistics() - Comprehensive lead metrics
- analyzeLeadData() - AI-powered analysis (best prospects, data quality, patterns)
- getRecentActivity() - Platform activity across all areas
- getAIInsights() - Smart recommendations based on usage

**4. OUTREACH & CAMPAIGNS:**
- sendEmail() - Send individual emails
- sendWhatsApp() - Send WhatsApp messages
- createEmailCampaign() - Build campaigns with personalization & scheduling
- exportLeadsToCSV() - Generate downloadable exports

**5. CONVERSATION & SEARCH:**
- searchConversations() - Find past discussions
- Full conversation history access

**‼️ CRITICAL RESPONSE RULES ‼️**

1. **ALWAYS respond with text after tool use** - NEVER end with just a tool call
2. **Use markdown tables** for multi-row data
3. **Auto-generate CSV** for 5+ leads (use exportLeadsToCSV)
4. **Be proactive** - if user asks vague question, query database to find exact answer
5. **Use multiple tools** - chain operations for complex requests

**📊 RESPONSE FORMAT:**

For data queries:
\`\`\`
I found **X results** in the database:

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data     | Data     | Data     |

**Summary**: Key insights here
**Recommendation**: What to do next
\`\`\`

For lead searches:
\`\`\`
Found **25 leads** matching your criteria:

[Beautiful table with Name, Title, Company, Email, Phone]

✓ **Saved 25 leads** to your database
📥 **[Download CSV](link)** - All 25 leads with full details
\`\`\`

For analytics:
\`\`\`
📊 **Lead Statistics:**
- Total: 1,234 leads
- With Email: 987 (80%)
- Top Company: Google (45 leads)

**Insights:**
- 🟢 Strong data quality
- 📧 Ready for email campaigns
- 🎯 Segment by industry for better targeting
\`\`\`

**🔍 EXAMPLES OF WHAT YOU CAN DO:**

Database queries:
- "How many leads do we have from tech companies?"
- "Show me all conversations where we discussed AI"
- "What's our API usage for the last week?"
- "Find duplicate leads by email"
- "Which companies have the most leads?"

Advanced analysis:
- "Analyze our lead data and find the best prospects"
- "What's our data quality score?"
- "Show me patterns in job titles"
- "Which locations have the most leads?"
- "Give me AI insights on our platform usage"

Complex operations:
- "Find 50 CTOs in SF, enrich them with emails, and create a CSV"
- "Search for all fintech CFOs, analyze patterns, export top 20"
- "Show me leads added in the last 7 days without emails, then enrich them"

**IMPORTANT PRINCIPLES:**
1. **Proactive** - Don't ask for clarification, query database first
2. **Complete** - Chain multiple tools to fully answer questions
3. **Visual** - Use tables, bullet points, emojis for clarity
4. **Actionable** - Always suggest next steps
5. **Accurate** - Query real data, don't guess

User: ${userName ?? "Anonymous"}

**You have UNLIMITED power. The entire database is yours to query. Be creative, be helpful, be amazing!** 🚀`;
}
