import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { getDb, Collections } from "@/lib/db";
import { getRedisClient } from "@/lib/redis";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
  const filterPhone = searchParams.get('filterPhone') === 'true';
  const filterEmail = searchParams.get('filterEmail') === 'true';
  const search = searchParams.get('search') || '';

  const orgId = session.user.orgId ?? session.user.email;
  const skip = (page - 1) * limit;

  try {
    // Try Redis cache first
    const redis = await getRedisClient();
    const cacheKey = `leads:list:${orgId}:${page}:${limit}:${sortBy}:${sortOrder}:${filterPhone}:${filterEmail}:${search}`;
    
    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        console.log('[Leads API] Cache hit:', cacheKey);
        return NextResponse.json(JSON.parse(cached));
      }
    }

    // Build query
    const db = await getDb();
    const query: any = { orgId };

    if (filterPhone) {
      query['phones.0'] = { $exists: true };
    }

    if (filterEmail) {
      query['emails.0'] = { $exists: true };
    }

    if (search) {
      // Use text search index or regex fallback
      if (search.length > 2) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { company: { $regex: search, $options: 'i' } },
          { title: { $regex: search, $options: 'i' } },
          { emails: { $regex: search, $options: 'i' } },
          { phones: { $regex: search, $options: 'i' } },
        ];
      }
    }

    // Get total count
    const total = await db.collection(Collections.LEADS).countDocuments(query);

    // Get paginated results with projection
    const leads = await db.collection(Collections.LEADS)
      .find(query, {
        projection: {
          personId: 1,
          name: 1,
          title: 1,
          company: 1,
          emails: { $slice: 1 }, // Only first email
          phones: { $slice: 1 }, // Only first phone
          linkedin: 1,
          createdAt: 1,
        }
      })
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .toArray();

    const response = {
      leads,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasMore: skip + leads.length < total,
      },
    };

    // Cache for 5 minutes
    if (redis) {
      await redis.setEx(cacheKey, 300, JSON.stringify(response));
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Leads API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}
