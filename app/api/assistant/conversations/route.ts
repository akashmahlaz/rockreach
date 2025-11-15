import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { 
  createConversation, 
  updateConversation, 
  getConversations, 
  getConversation,
  deleteConversation 
} from "@/models/Conversation";
import { cacheGet, cacheSet, cacheDel } from "@/lib/redis";

export async function GET(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get("id");
  const orgId = session.user.orgId || "";
  const userId = session.user.id || "";

  try {
    // Get single conversation
    if (conversationId) {
      const cacheKey = `conversation:${userId}:${conversationId}`;
      
      // Try cache first
      let conversation = await cacheGet(cacheKey);
      
      if (!conversation) {
        conversation = await getConversation(conversationId, userId);
        if (conversation) {
          await cacheSet(cacheKey, conversation, 300); // 5 min cache
        }
      }

      if (!conversation) {
        return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
      }

      return NextResponse.json(conversation);
    }

    // Get all conversations
    const cacheKey = `conversations:${userId}`;
    let conversations = await cacheGet(cacheKey);

    if (!conversations) {
      conversations = await getConversations(userId, orgId);
      await cacheSet(cacheKey, conversations, 60); // 1 min cache
    }

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = session.user.orgId || "";
  const userId = session.user.id || "";

  try {
    const body = await req.json();
    
    if (!body.id) {
      return NextResponse.json(
        { error: "Conversation ID is required" },
        { status: 400 }
      );
    }
    
    const conversationId = await createConversation({
      id: body.id,
      orgId,
      userId,
      title: body.title || "New chat",
      messages: body.messages || [],
      metadata: body.metadata,
    });

    // Invalidate cache
    await cacheDel(`conversations:${userId}`);

    console.log('[POST /api/assistant/conversations] Created:', conversationId);

    return NextResponse.json({ 
      success: true, 
      id: conversationId 
    });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id || "";

  try {
    const body = await req.json();
    const { id, ...update } = body;

    if (!id) {
      return NextResponse.json({ error: "Conversation ID required" }, { status: 400 });
    }

    console.log('[PATCH /api/assistant/conversations] Updating:', {
      id,
      userId,
      hasMessages: !!update.messages,
      messageCount: update.messages?.length || 0,
    });

    const success = await updateConversation(id, userId, update);

    if (!success) {
      console.warn('[PATCH /api/assistant/conversations] Conversation not found:', id);
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Invalidate cache
    await cacheDel(`conversation:${userId}:${id}`);
    await cacheDel(`conversations:${userId}`);

    console.log('[PATCH /api/assistant/conversations] Updated successfully:', id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating conversation:", error);
    return NextResponse.json(
      { error: "Failed to update conversation" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const userId = session.user.id || "";

  if (!id) {
    return NextResponse.json({ error: "Conversation ID required" }, { status: 400 });
  }

  try {
    const success = await deleteConversation(id, userId);

    if (!success) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Invalidate cache
    await cacheDel(`conversation:${userId}:${id}`);
    await cacheDel(`conversations:${userId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return NextResponse.json(
      { error: "Failed to delete conversation" },
      { status: 500 }
    );
  }
}
