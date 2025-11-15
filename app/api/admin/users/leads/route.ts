import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { getDb, Collections } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized - Admin only" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const orgId = session.user.orgId || "";

  if (!userId) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 });
  }

  try {
    const db = await getDb();

    // Get all leads for the user
    const leads = await db.collection(Collections.LEADS)
      .find({ 
        userId,
        organizationId: orgId,
      })
      .sort({ createdAt: -1 })
      .limit(100) // Limit for performance
      .toArray();

    return NextResponse.json(leads);
  } catch (error) {
    console.error("Error fetching user leads:", error);
    return NextResponse.json(
      { error: "Failed to fetch leads" },
      { status: 500 }
    );
  }
}
