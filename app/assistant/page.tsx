import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AssistantClient } from "./assistant-client";

export default async function AssistantPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  return (
    <AssistantClient
      user={{
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        role: session.user.role,
      }}
    />
  );
}
