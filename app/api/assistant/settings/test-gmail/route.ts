import { auth } from "@/auth";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, appPassword } = await req.json();

    if (!email || !appPassword) {
      return NextResponse.json(
        { error: "Email and app password are required" },
        { status: 400 }
      );
    }

    // Test Gmail connection
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: email,
        pass: appPassword,
      },
    });

    // Verify connection
    await transporter.verify();

    return NextResponse.json({
      success: true,
      message: "Gmail connection successful",
    });
  } catch (error) {
    console.error("Gmail test error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to connect to Gmail. Please check your credentials.",
      },
      { status: 400 }
    );
  }
}

