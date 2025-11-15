import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function ChatIndexPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  // Redirect to new chat
  redirect("/c/new");
}
