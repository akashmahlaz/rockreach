import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SimpleChatClient } from "../simple-chat-client";

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  // Await params since it's a Promise in Next.js 15+
  const { id } = await params;

  // If user navigates to /c/new, redirect to API that creates conversation first
  if (id === "new") {
    redirect("/api/assistant/new-conversation");
  }

  return (
    <SimpleChatClient
      conversationId={id}
      user={{
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        role: session.user.role,
      }}
    />
  );
}
