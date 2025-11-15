import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { convertToCoreMessages, streamText } from "ai";
import { getAIProvider } from "@/lib/agent/get-provider";
import { logApiUsage } from "@/models/ApiUsage";
import { createAssistantTools } from "@/lib/assistant/tools";

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = session.user.orgId || "";
  const startedAt = Date.now();

  try {
    const body = (await req.json()) as {
      messages?: unknown[];
      providerId?: string;
      temperature?: number;
      userMetadata?: Record<string, unknown>;
    };

    const provider = await getAIProvider(orgId, body.providerId);
    const tools = createAssistantTools({ orgId });
    const systemPrompt = buildSystemPrompt(session.user.name, body.userMetadata);

    const result = await streamText({
      model: provider.model,
      system: systemPrompt,
      messages: convertToCoreMessages(body.messages || []),
      tools,
      toolChoice: "auto",
      temperature:
        typeof body.temperature === "number"
          ? body.temperature
          : (provider.config?.temperature as number | undefined) ?? 0.3,
    });

    await logApiUsage({
      orgId,
      provider: provider.providerInfo?.type ?? "assistant-model",
      endpoint: "assistant_stream",
      method: "POST",
      units: 1,
      status: "streaming",
      durationMs: Date.now() - startedAt,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Assistant stream error", error);

    await logApiUsage({
      orgId,
      provider: "assistant-model",
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
  const persona = metadata?.persona ?? "rockreach-hero";

  return `You are the RockReach GPT-style assistant running inside a hero-colored UI.
Stay factual, cite RocketReach results when available, and be transparent about sources.
Keep replies concise, helpful, and styled for a professional lead-generation workflow.
You have structured tools:
- searchRocketReach(company?, title?, location?, domain?, name?, limit?) => pull live contacts.
- lookupRocketReachProfile(personId) => enrich a specific contact.
Always call these tools before answering lead or contact questions so results are grounded in real RocketReach data.
Summaries should reference the actual leads by name and role.
User: ${userName ?? "Anonymous"}
Persona: ${persona}`;
}
