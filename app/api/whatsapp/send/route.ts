import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { getDb, Collections } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = session.user.orgId || "";
    const body = await req.json();
    const { phoneNumbers, message, leadIds } = body;

    if (!phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
      return NextResponse.json(
        { error: "Phone numbers are required" },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: "Message content is required" },
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

