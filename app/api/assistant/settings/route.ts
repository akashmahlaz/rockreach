import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { getDb, Collections } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = session.user.orgId || "";
    const db = await getDb();

    // Get Gmail settings
    const gmailSettings = await db
      .collection("email_settings")
      .findOne({
        organizationId: orgId,
        provider: "gmail",
      });

    // Get Resend settings
    const resendSettings = await db
      .collection("email_settings")
      .findOne({
        organizationId: orgId,
        provider: "resend",
      });

    return NextResponse.json({
      gmail: gmailSettings
        ? {
            email: gmailSettings.fromEmail || "",
            appPassword: "", // Don't return password
            isEnabled: gmailSettings.isEnabled || false,
            isVerified: gmailSettings.isVerified || false,
          }
        : null,
      resend: resendSettings
        ? {
            apiKey: "", // Don't return API key
            fromEmail: resendSettings.fromEmail || "",
            fromName: resendSettings.fromName || "",
            isEnabled: resendSettings.isEnabled || false,
            isVerified: resendSettings.isVerified || false,
          }
        : null,
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = session.user.orgId || "";
    const body = await req.json();
    const { gmail, resend } = body;

    const db = await getDb();

    // Save Gmail settings
    if (gmail) {
      await db.collection("email_settings").updateOne(
        {
          organizationId: orgId,
          provider: "gmail",
        },
        {
          $set: {
            organizationId: orgId,
            provider: "gmail",
            fromEmail: gmail.email,
            smtpConfig: {
              host: "smtp.gmail.com",
              port: 587,
              secure: false,
              user: gmail.email,
              password: gmail.appPassword,
            },
            isEnabled: gmail.isEnabled || false,
            isVerified: gmail.isVerified || false,
            updatedAt: new Date(),
            updatedBy: session.user.email || "",
          },
          $setOnInsert: {
            createdAt: new Date(),
            createdBy: session.user.email || "",
          },
        },
        { upsert: true }
      );
    }

    // Save Resend settings
    if (resend) {
      await db.collection("email_settings").updateOne(
        {
          organizationId: orgId,
          provider: "resend",
        },
        {
          $set: {
            organizationId: orgId,
            provider: "resend",
            apiKey: resend.apiKey,
            fromEmail: resend.fromEmail,
            fromName: resend.fromName,
            isEnabled: resend.isEnabled || false,
            isVerified: resend.isVerified || false,
            updatedAt: new Date(),
            updatedBy: session.user.email || "",
          },
          $setOnInsert: {
            createdAt: new Date(),
            createdBy: session.user.email || "",
          },
        },
        { upsert: true }
      );
    }

    return NextResponse.json({
      success: true,
      gmail: gmail ? { isVerified: gmail.isVerified } : null,
      resend: resend ? { isVerified: resend.isVerified } : null,
    });
  } catch (error) {
    console.error("Error saving settings:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}

