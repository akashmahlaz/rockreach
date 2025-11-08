import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { upsertLead } from '@/models/Lead';
import { createAuditLog } from '@/models/AuditLog';

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
    const { leads } = body; // Array of lead objects from RocketReach

    if (!Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'No leads provided' },
        { status: 400 }
      );
    }

    // TODO: Get orgId from session/user
    const orgId = 'default';
    
    const savedLeads = [];
    
    for (const lead of leads) {
      // Normalize lead data from RocketReach format
      const leadData = {
        orgId,
        personId: lead.id || lead.rocketreach_id,
        source: 'rocketreach',
        name: lead.name,
        firstName: lead.first_name,
        lastName: lead.last_name,
        title: lead.current_title || lead.title,
        company: lead.current_employer || lead.company,
        domain: lead.email_domain,
        emails: lead.emails || [],
        phones: lead.phones || [],
        linkedin: lead.linkedin_url,
        location: lead.location,
        tags: [],
        raw: lead,
      };

      // Upsert lead (avoid duplicates)
      const result = await upsertLead(orgId, leadData.personId, leadData);
      if (result) {
        savedLeads.push(result);
      }
    }

    // Log the action
    await createAuditLog({
      orgId,
      actorId: session.user?.email || undefined,
      actorEmail: session.user?.email || undefined,
      action: 'save_leads',
      target: 'leads',
      meta: {
        count: savedLeads.length,
        leadIds: savedLeads.map(l => l._id?.toString()),
      },
    });

    return NextResponse.json({
      ok: true,
      data: savedLeads,
      message: `${savedLeads.length} lead(s) saved successfully`,
    });
  } catch (error) {
    console.error('Failed to save leads:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to save leads' },
      { status: 500 }
    );
  }
}
