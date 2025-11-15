import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { getEmailProvider } from "@/lib/agent/get-email-provider";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = session.user.orgId || "";
    const body = await req.json();
    const { to, subject, body: emailBody, leadIds } = body;

    if (!to || !Array.isArray(to) || to.length === 0) {
      return NextResponse.json(
        { error: "Recipient emails are required" },
        { status: 400 }
      );
    }

    if (!subject || !emailBody) {
      return NextResponse.json(
        { error: "Subject and body are required" },
        { status: 400 }
      );
    }

    // Get email provider
    const emailClient = await getEmailProvider(orgId);
    const { fromEmail, fromName } = emailClient.providerInfo;

    // Send emails
    const results = [];
    for (const recipient of to) {
      try {
        const result = await emailClient.send({
          from: fromName ? `${fromName} <${fromEmail}>` : fromEmail,
          to: recipient,
          subject,
          html: emailBody,
          text: emailBody.replace(/<[^>]*>/g, ""), // Strip HTML for text version
        });
        results.push({ recipient, success: true, id: result.id });
      } catch (error) {
        results.push({
          recipient,
          success: false,
          error: error instanceof Error ? error.message : "Failed to send",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;

    return NextResponse.json({
      success: true,
      sent: successCount,
      total: to.length,
      results,
    });
  } catch (error) {
    console.error("Email send error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to send email",
      },
      { status: 500 }
    );
  }
}

