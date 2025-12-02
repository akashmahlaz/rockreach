import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { getDb, Collections } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { logApiUsage } from "@/models/ApiUsage";

// Maximum messages per request
const MAX_MESSAGES_PER_REQUEST = 25;

export async function POST(req: Request) {
  const startedAt = Date.now();
  
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = session.user.orgId || "";
    const userId = session.user.id || session.user.email || "";
    
    // Rate limiting: 50 WhatsApp messages per minute per user
    const rateLimitResult = await rateLimit(`whatsapp:${userId}`, {
      limit: 50,
      windowSeconds: 60,
    });
    
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const body = await req.json();
    const { phoneNumbers, message, leadIds } = body;

    if (!phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
      return NextResponse.json(
        { error: "Phone numbers are required" },
        { status: 400 }
      );
    }
    
    // Validate phone number format (basic international format)
    const phoneRegex = /^\+?[1-9]\d{6,14}$/;
    const invalidPhones = phoneNumbers.filter((phone: string) => !phoneRegex.test(phone.replace(/[\s-()]/g, '')));
    if (invalidPhones.length > 0) {
      return NextResponse.json(
        { error: `Invalid phone numbers: ${invalidPhones.slice(0, 3).join(', ')}${invalidPhones.length > 3 ? '...' : ''}` },
        { status: 400 }
      );
    }
    
    // Limit batch size
    if (phoneNumbers.length > MAX_MESSAGES_PER_REQUEST) {
      return NextResponse.json(
        { error: `Maximum ${MAX_MESSAGES_PER_REQUEST} messages per request. You requested ${phoneNumbers.length}.` },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }
    
    // Validate message length (WhatsApp limit)
    if (message.length > 4096) {
      return NextResponse.json(
        { error: "Message too long (max 4096 characters for WhatsApp)" },
        { status: 400 }
      );
    }

    // Get WhatsApp settings
    const db = await getDb();
    const whatsappSettings = await db
      .collection("whatsapp_settings")
      .findOne({
        organizationId: orgId,
        isEnabled: true,
      });

    if (!whatsappSettings) {
      return NextResponse.json(
        { error: "WhatsApp integration is not configured. Please configure it in Settings." },
        { status: 400 }
      );
    }

    // For now, return a placeholder response
    // In production, you would integrate with WhatsApp Business API or WhatsApp Web API
    // This could use libraries like whatsapp-web.js for WhatsApp Web
    // or Twilio WhatsApp API for Business API

    const results = phoneNumbers.map((phone) => ({
      phoneNumber: phone,
      success: true,
      message: "WhatsApp message queued (integration pending)",
      note: "WhatsApp integration requires configuration. This is a placeholder response.",
    }));

    return NextResponse.json({
      success: true,
      sent: results.length,
      total: phoneNumbers.length,
      results,
      note: "WhatsApp integration is in development. Messages are queued but not actually sent yet.",
    });
  } catch (error) {
    console.error("WhatsApp send error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to send WhatsApp message",
      },
      { status: 500 }
    );
  }
}

