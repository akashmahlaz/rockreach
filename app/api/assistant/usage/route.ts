import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { getDb, Collections } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = session.user.orgId || "";

  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "30d"; // 24h, 7d, 30d, all

    const db = await getDb();
    const collection = db.collection(Collections.API_USAGE);

    // Calculate date range
    const now = new Date();
    let startDate = new Date(0); // Beginning of time
    
    if (period === "24h") {
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else if (period === "7d") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === "30d") {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get usage stats
    const stats = await collection.aggregate([
      {
        $match: {
          orgId,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: null,
          totalTokens: { $sum: "$units" },
          totalCalls: { $sum: 1 },
          successCalls: {
            $sum: { $cond: [{ $eq: ["$status", "success"] }, 1, 0] },
          },
          errorCalls: {
            $sum: { $cond: [{ $eq: ["$status", "error"] }, 1, 0] },
          },
          avgDurationMs: { $avg: "$durationMs" },
        },
      },
    ]).toArray();

    const result = stats[0] || {
      totalTokens: 0,
      totalCalls: 0,
      successCalls: 0,
      errorCalls: 0,
      avgDurationMs: 0,
    };

    // Calculate cost based on OpenAI pricing (GPT-4)
    // Input: $0.03 per 1K tokens, Output: $0.06 per 1K tokens
    // Simplified: Average $0.045 per 1K tokens
    const estimatedCost = (result.totalTokens / 1000) * 0.045;

    return NextResponse.json({
      period,
      totalTokens: result.totalTokens,
      totalCalls: result.totalCalls,
      successCalls: result.successCalls,
      errorCalls: result.errorCalls,
      avgDurationMs: Math.round(result.avgDurationMs || 0),
      estimatedCost: estimatedCost.toFixed(2),
      costPerCall: result.totalCalls > 0 ? (estimatedCost / result.totalCalls).toFixed(4) : "0.0000",
    });
  } catch (error) {
    console.error("Error fetching usage stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage statistics" },
      { status: 500 }
    );
  }
}
