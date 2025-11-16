import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createConversation } from "@/models/Conversation";

/**
 * API route to create a new conversation and redirect to it.
 * This is called when user clicks "Agentic AI Search" in navbar.
 * Creates conversation in MongoDB upfront, then redirects to /c/[mongodb-id]
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.redirect(new URL("/api/auth/signin", req.url));
    }

    // Create conversation in MongoDB with default title
    const conversationId = `conv-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    await createConversation({
      id: conversationId,
      userId: session.user.id || session.user.email || "",
      orgId: session.user.orgId || session.user.email || "",
      title: "New chat",
      messages: [],
    });

    console.log("[New Conversation] Created in DB:", conversationId);

    // Redirect to the new conversation page with MongoDB ID
    return NextResponse.redirect(new URL(`/c/${conversationId}`, req.url));
  } catch (error) {
    console.error("[New Conversation] Error:", error);
    // Fallback to /c/new on error
    return NextResponse.redirect(new URL("/c/new", req.url));
  }
}
