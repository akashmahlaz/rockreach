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
    // Get all providers (system-wide)
    const providers = await getAIProviders();

    // Don't send secrets to the client
    const safeProviders = providers.map(({ apiKey, ...rest }) => ({
      ...rest,
      hasCredentials: Boolean(apiKey || rest.hasCredentials),
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

    const userId = session.user.id!;

    // Smart default: if no default provider exists and this is a new provider, make it default
    let shouldBeDefault = isDefault ?? false;
    if (!_id && !shouldBeDefault) {
      const existingProviders = await getAIProviders();
      const hasDefault = existingProviders.some(p => p.isDefault && p.isEnabled);
      if (!hasDefault) {
        shouldBeDefault = true;
        console.log('🎯 Auto-setting first provider as default');
      }
    }

    // Save provider (works for all users automatically)
    const result = await upsertAIProvider('global', userId, {
      _id,
      provider,
      name,
      apiKey,
      baseUrl,
      defaultModel,
      isEnabled: isEnabled ?? true,
      isDefault: shouldBeDefault,
      config,
    });

    // Audit log
    if (result) {
      await createAuditLog({
        orgId: session.user.orgId || '',
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

    const deleted = await deleteAIProvider('', providerId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    // Audit log
    await createAuditLog({
      orgId: session.user.orgId || '',
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
