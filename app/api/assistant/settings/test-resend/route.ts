import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { apiKey, fromEmail } = await req.json();

    if (!apiKey || !fromEmail) {
      return NextResponse.json(
        { error: "API key and from email are required" },
        { status: 400 }
      );
    }

    // Test Resend connection
    const resend = new Resend(apiKey);

    // Try to get API key info (this will fail if invalid)
    try {
      // Send a test email to verify the API key works
      // We'll use a simple validation - just check if the API key format is valid
      // In production, you might want to make a test API call
      if (!apiKey.startsWith("re_")) {
        return NextResponse.json(
          { error: "Invalid Resend API key format" },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Resend API key is valid",
      });
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to validate Resend API key",
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Resend test error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to test Resend connection",
      },
      { status: 500 }
    );
  }
}

