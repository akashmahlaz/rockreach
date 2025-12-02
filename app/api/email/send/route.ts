import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { getEmailProvider } from "@/lib/agent/get-email-provider";
import { rateLimit } from "@/lib/rate-limit";
import { logApiUsage } from "@/models/ApiUsage";

// Maximum emails per request
const MAX_EMAILS_PER_REQUEST = 50;

export async function POST(req: Request) {
  const startedAt = Date.now();
  
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = session.user.orgId || "";
    const userId = session.user.id || session.user.email || "";
    
    // Rate limiting: 100 emails per minute per user
    const rateLimitResult = await rateLimit(`email:${userId}`, {
      limit: 100,
      windowSeconds: 60,
    });
    
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const body = await req.json();
    const { to, subject, body: emailBody, leadIds } = body;

    if (!to || !Array.isArray(to) || to.length === 0) {
      return NextResponse.json(
        { error: "Recipient emails are required" },
        { status: 400 }
      );
    }
    
    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = to.filter((email: string) => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { error: `Invalid email addresses: ${invalidEmails.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Limit batch size
    if (to.length > MAX_EMAILS_PER_REQUEST) {
      return NextResponse.json(
        { error: `Maximum ${MAX_EMAILS_PER_REQUEST} emails per request. You requested ${to.length}.` },
        { status: 400 }
      );
    }

    if (!subject || !emailBody) {
      return NextResponse.json(
        { error: "Subject and body are required" },
        { status: 400 }
      );
    }
    
    // Validate subject length
    if (subject.length > 200) {
      return NextResponse.json(
        { error: "Subject line too long (max 200 characters)" },
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
    const failedCount = results.filter((r) => !r.success).length;

    // Log API usage
    await logApiUsage({
      orgId,
      userId,
      provider: "email",
      endpoint: "/api/email/send",
      method: "POST",
      units: successCount,
      status: failedCount === 0 ? "success" : failedCount === to.length ? "error" : "partial",
      durationMs: Date.now() - startedAt,
      error: failedCount > 0 ? `${failedCount}/${to.length} emails failed` : undefined,
    });

    return NextResponse.json({
      success: true,
      sent: successCount,
      failed: failedCount,
      total: to.length,
      results,
    });
  } catch (error) {
    console.error("Email send error:", error);
    
    // Log error
    try {
      const session = await auth();
      if (session?.user) {
        await logApiUsage({
          orgId: session.user.orgId || "",
          userId: session.user.id || session.user.email || "",
          provider: "email",
          endpoint: "/api/email/send",
          method: "POST",
          units: 0,
          status: "error",
          durationMs: Date.now() - startedAt,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    } catch (logError) {
      console.error("Failed to log API usage:", logError);
    }
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to send email",
      },
      { status: 500 }
    );
  }
}

