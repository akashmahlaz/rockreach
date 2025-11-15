import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  getAIProviders,
  upsertAIProvider,
  deleteAIProvider,
} from '@/models/ProviderSettings';
import { createAuditLog } from '@/models/AuditLog';

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only admins can manage providers
  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const orgId = session.user.orgId || '';
    const providers = await getAIProviders(orgId);

    // Don't send secrets to the client
    const safeProviders = providers.map(({ apiKey, apiKeyEncrypted, ...rest }) => ({
      ...rest,
      hasCredentials: Boolean(apiKeyEncrypted || apiKey || rest.hasCredentials),
    }));

    return NextResponse.json({ providers: safeProviders });
  } catch (error) {
    console.error('Failed to fetch AI providers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI providers' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      _id,
      provider,
      name,
      apiKey,
      baseUrl,
      defaultModel,
      isEnabled,
      isDefault,
      config,
    } = body;

    if (!provider || !name || !defaultModel) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!_id && !apiKey) {
      return NextResponse.json(
        { error: 'API key is required for new providers' },
        { status: 400 }
      );
    }

    const orgId = session.user.orgId || '';
    const userId = session.user.id!;

    const result = await upsertAIProvider(orgId, userId, {
      _id,
      provider,
      name,
      apiKey,
      baseUrl,
      defaultModel,
      isEnabled: isEnabled ?? true,
      isDefault: isDefault ?? false,
      config,
    });

    // Audit log
    if (result) {
      await createAuditLog({
        orgId,
        actorId: userId,
        action: _id ? 'update_ai_provider' : 'create_ai_provider',
        target: 'ai_provider',
        targetId: result._id as string,
        meta: {
          provider,
          name,
          isDefault,
        },
      });
    }

    const safeResult = result
      ? {
          ...result,
          apiKey: undefined,
          apiKeyEncrypted: undefined,
        }
      : null;

    return NextResponse.json({ success: true, provider: safeResult });
  } catch (error) {
    console.error('Failed to upsert AI provider:', error);
    return NextResponse.json(
      { error: 'Failed to save AI provider' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const providerId = searchParams.get('id');

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID required' },
        { status: 400 }
      );
    }

    const orgId = session.user.orgId || '';
    const deleted = await deleteAIProvider(orgId, providerId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    // Audit log
    await createAuditLog({
      orgId,
      actorId: session.user.id!,
      action: 'delete_ai_provider',
      target: 'ai_provider',
      targetId: providerId,
      meta: {},
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete AI provider:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete AI provider';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
