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

  try {
    const db = await getDb();

    if (userId) {
      // Get specific user with their leads count
      const user = await db.collection(Collections.USERS).findOne({ 
        id: userId,
        organizationId: orgId 
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const leadsCount = await db.collection(Collections.LEADS).countDocuments({
        userId,
        organizationId: orgId,
      });

      const apiUsageCount = await db.collection(Collections.API_USAGE).countDocuments({
        userId,
        orgId,
      });

      return NextResponse.json({
        ...user,
        leadsCount,
        apiUsageCount,
      });
    }

    // Get all users in organization
    const users = await db.collection(Collections.USERS)
      .find({ organizationId: orgId })
      .sort({ createdAt: -1 })
      .toArray();

    // Get leads count for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const leadsCount = await db.collection(Collections.LEADS).countDocuments({
          userId: user.id,
          organizationId: orgId,
        });

        const apiUsageCount = await db.collection(Collections.API_USAGE).countDocuments({
          userId: user.id,
          orgId,
        });

        return {
          ...user,
          leadsCount,
          apiUsageCount,
        };
      })
    );

    return NextResponse.json(usersWithStats);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized - Admin only" }, { status: 403 });
  }

  const orgId = session.user.orgId || "";

  try {
    const body = await req.json();
    const { userId, action, role } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const db = await getDb();
    const update: { 
      updatedAt: Date; 
      banned?: boolean; 
      bannedAt?: Date | null; 
      bannedBy?: string | null;
      role?: string;
    } = { updatedAt: new Date() };

    if (action === "ban") {
      update.banned = true;
      update.bannedAt = new Date();
      update.bannedBy = session.user.id;
    } else if (action === "unban") {
      update.banned = false;
      update.bannedAt = null;
      update.bannedBy = null;
    } else if (action === "changeRole" && role) {
      update.role = role;
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const result = await db.collection(Collections.USERS).updateOne(
      { id: userId, organizationId: orgId },
      { $set: update }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
