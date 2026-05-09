import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyOtpToken } from "@/lib/otp";
import { getServerSession, signIn } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(request) {
  try {
    const { phone, code } = await request.json();

    if (!phone || !code) {
      return NextResponse.json({ error: "Phone and code required" }, { status: 400 });
    }

    const cleaned = phone.replace(/\D/g, "").slice(-10);

    // Verify the OTP token (throws if invalid/expired)
    await verifyOtpToken(cleaned, code);

    // Upsert the Shop record
    const shop = await prisma.shop.upsert({
      where: { phone: cleaned },
      update: {},
      create: { phone: cleaned },
    });

    return NextResponse.json({
      success: true,
      shopId: shop.id,
      phone: cleaned,
      onboardingStep: shop.onboardingStep,
    });
  } catch (err) {
    console.error("[OTP/verify]", err.message);
    return NextResponse.json({ error: err.message || "Verification failed" }, { status: 400 });
  }
}
