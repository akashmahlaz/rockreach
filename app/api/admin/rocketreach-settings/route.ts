import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getRocketReachSettings, upsertRocketReachSettings } from '@/models/RocketReachSettings';
import { createAuditLog } from '@/models/AuditLog';
import { encryptSecret } from '@/lib/crypto';
import { clearSettingsCache } from '@/lib/rocketreach';

// Helper to check if user is admin
async function requireAdmin() {
  const session = await auth();
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // TODO: Add proper role-based access control
  // For now, all authenticated users can access admin settings
  // You should add a role field to your user model and check it here
  
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  try {
    // TODO: Get orgId from session/user
    const orgId = 'default';
    
    const doc = await getRocketReachSettings(orgId);
    
    if (!doc) {
      return NextResponse.json({ ok: true, data: null });
    }

    return NextResponse.json({
      ok: true,
      data: {
        orgId: doc.orgId,
        isEnabled: doc.isEnabled,
        baseUrl: doc.baseUrl,
        dailyLimit: doc.dailyLimit,
        concurrency: doc.concurrency,
        retryPolicy: doc.retryPolicy,
        hasApiKey: !!doc.apiKeyEncrypted,
        updatedAt: doc.updatedAt,
        updatedBy: doc.updatedBy,
      },
    });
  } catch (error) {
    console.error('Failed to fetch RocketReach settings:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  try {
    const body = await req.json();
    const {
      baseUrl,
      apiKey,
      isEnabled,
      dailyLimit,
      concurrency,
      retryPolicy,
    } = body;

    // TODO: Get orgId from session/user
    const orgId = 'default';
    
    const update: Record<string, unknown> = {
      orgId,
      isEnabled: !!isEnabled,
      baseUrl: baseUrl || 'https://api.rocketreach.co',
      dailyLimit: Number(dailyLimit ?? 1000),
      concurrency: Number(concurrency ?? 2),
      retryPolicy: {
        maxRetries: Number(retryPolicy?.maxRetries ?? 5),
        baseDelayMs: Number(retryPolicy?.baseDelayMs ?? 500),
        maxDelayMs: Number(retryPolicy?.maxDelayMs ?? 30000),
      },
      updatedAt: new Date(),
      updatedBy: session.user?.email || 'unknown',
    };

    // Only update API key if provided
    if (apiKey && apiKey.trim()) {
      update.apiKeyEncrypted = encryptSecret(apiKey.trim());
    }

    const result = await upsertRocketReachSettings(orgId, update);

    // Clear cache so new settings take effect
    clearSettingsCache(orgId);

    // Log the change
    await createAuditLog({
      orgId,
      actorId: session.user?.email || undefined,
      actorEmail: session.user?.email || undefined,
      action: 'update_rocketreach_settings',
      target: 'rocketreach_settings',
      targetId: result?._id?.toString(),
      meta: {
        isEnabled,
        baseUrl,
        apiKeyUpdated: !!apiKey,
      },
    });

    return NextResponse.json({
      ok: true,
      hasApiKey: !!result?.apiKeyEncrypted,
      message: 'Settings saved successfully',
    });
  } catch (error) {
    console.error('Failed to update RocketReach settings:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
