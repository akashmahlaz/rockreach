import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { rrSearchPeople } from '@/lib/rocketreach';
import { createLeadSearch } from '@/models/LeadSearch';

async function requireAuth() {
  const session = await auth();
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return session;
}

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;

  try {
    const body = await req.json();
    const { name, title, company, domain, location, page, page_size } = body;

    // TODO: Get orgId from session/user
    const orgId = 'default';
    
    const result = await rrSearchPeople(orgId, {
      name,
      title,
      company,
      domain,
      location,
      page,
      page_size,
    });

    // Log the search
    await createLeadSearch({
      orgId,
      query: { name, title, company, domain, location },
      filters: { page, page_size },
      resultCount: result?.profiles?.length || result?.data?.length || 0,
      executedBy: session.user?.email || undefined,
    });

    return NextResponse.json({
      ok: true,
      data: result,
    });
  } catch (error) {
    console.error('Lead search failed:', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Search failed' },
      { status: 500 }
    );
  }
}
