import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { streamText, convertToModelMessages, UIMessage, stepCountIs } from "ai";
import { logApiUsage } from "@/models/ApiUsage";
import { createAssistantTools } from "@/lib/assistant/tools";
import { getDefaultModel } from "@/lib/ai-provider";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = session.user.orgId || "";
  const startedAt = Date.now();

  try {
    const body = (await req.json()) as {
      messages: UIMessage[];
      temperature?: number;
      userMetadata?: Record<string, unknown>;
    };

    const tools = createAssistantTools({ orgId, userId: session.user.id });
    const systemPrompt = buildSystemPrompt(session.user.name, body.userMetadata);

    if (!body.messages || body.messages.length === 0) {
      return NextResponse.json(
        { error: "No messages provided" },
        { status: 400 }
      );
    }

    // Get the default AI model configured by admin
    const model = await getDefaultModel(orgId);
    const provider = "assistant"; // Generic name for logging

    const result = streamText({
      model,
      system: systemPrompt,
      messages: convertToModelMessages(body.messages),
      tools,
      toolChoice: "auto",
      temperature: typeof body.temperature === "number" ? body.temperature : 0.3,
      stopWhen: stepCountIs(10), // Allow up to 10 steps for complex workflows
      onStepFinish: async ({ toolCalls, toolResults, finishReason }) => {
        console.log("Step finished:", {
          finishReason,
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
      onFinish: async ({ usage, totalUsage, finishReason, steps }) => {
        console.log("Stream finished:", { 
          finishReason, 
          totalSteps: steps || 0,
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
        await logApiUsage({
          orgId,
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

    return result.toUIMessageStreamResponse({
      onError: (error) => {
        console.error("Stream response error:", error);
        if (error instanceof Error) {
          return error.message;
        }
        return "An error occurred while processing your request.";
      },
    });
  } catch (error) {
    console.error("Assistant stream error", error);

    await logApiUsage({
      orgId,
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

function buildSystemPrompt(userName?: string | null, metadata?: Record<string, unknown>) {
  const persona = metadata?.persona ?? "assistant";

  return `You are a professional AI assistant for a lead generation and prospecting platform.

WORKFLOW - Follow this exact sequence:

1. **SEARCH PHASE**: When user asks to find leads (e.g., "Find 10 CTOs at Series B SaaS companies in San Francisco"):
   - Call searchRocketReach() FIRST with appropriate filters (title, location, company, etc.)
   - ALWAYS call saveLeads() immediately after to save ALL results to database (even without contact details)
   - Display the results in a beautiful, easy-to-read format
   - Tell user: "I found X leads and saved them to your database."

2. **ENRICHMENT PHASE**: After showing search results, ALWAYS proactively ask:
   - "Would you like me to find their emails and phone numbers?"
   - If user says yes/affirmative:
     - For each lead, call lookupRocketReachProfile(personId) to get enriched data
     - Call saveLeads() again to update the database with contact information
     - Show: "I've found contact details for X leads and updated your database."

3. **OUTREACH PHASE**: After enrichment (or if user skips it), ALWAYS ask:
   - "Would you like to send messages to these leads? I can send via Email or WhatsApp."
   - If user chooses Email:
     - Ask for email subject and message content (if not provided)
     - Call sendEmail() with recipient emails, subject, and body
   - If user chooses WhatsApp:
     - Ask for message content (if not provided)
     - Call sendWhatsApp() with phone numbers and message
   - Confirm: "I've sent X messages successfully."

IMPORTANT RULES:
- NEVER mention "RocketReach" or "API" - just say "database" or "system"
- ALWAYS save leads immediately after searching (don't wait for enrichment)
- Save ALL leads to database, even if they don't have email/phone yet
- ALWAYS ask before enriching or sending messages (be proactive but not pushy)
- Format responses in clear, easy-to-read text (avoid ** for bold)
- Be conversational and helpful
- If search returns few results, suggest adjusting filters
- Always confirm actions with clear success messages

TOOLS AVAILABLE:
- searchRocketReach: Search for leads based on filters
- lookupRocketReachProfile: Get detailed contact info for a specific lead
- saveLeads: Save leads to database (call after EVERY search and enrichment)
- sendEmail: Send emails to leads
- sendWhatsApp: Send WhatsApp messages to leads

User: ${userName ?? "Anonymous"}
Persona: ${persona}`;
}
