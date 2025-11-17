import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import clientPromise from '@/lib/db';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('rockreach');

    // Get user's organization
    const user = await db.collection('users').findOne({ email: session.user.email });
    const orgId = user?.orgId ? String(user.orgId) : session.user.orgId ?? session.user.email;

    // Check RocketReach configuration
    const rocketreachSettings = await db.collection('rocketreach_settings').findOne({
      $or: [
        { organizationId: orgId },
        { isGlobal: true }
      ]
    });

    // Check Email provider configuration
    const emailProvider = await db.collection('email_providers').findOne({
      organizationId: orgId,
      isActive: true,
    });

    // Check WhatsApp configuration
    const whatsappSettings = await db.collection('whatsapp_settings').findOne({
      organizationId: orgId,
      isEnabled: true,
    });

    return NextResponse.json({
      rocketreach: !!rocketreachSettings && !!rocketreachSettings.apiKey,
      email: !!emailProvider,
      whatsapp: !!whatsappSettings,
      orgId,
    });
  } catch (error) {
    console.error('System check error:', error);
    return NextResponse.json(
      { error: 'System check failed' },
      { status: 500 }
    );
  }
}
