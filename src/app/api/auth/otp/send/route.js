import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOtpCode, createOtpToken, sendOtp } from "@/lib/otp";

// In-memory rate limiter: 5 OTPs per phone per hour
const otpRateLimiter = new Map();

function checkRateLimit(phone) {
  const now = Date.now();
  const key = phone;
  const rec = otpRateLimiter.get(key);
  if (!rec || now > rec.reset) {
    otpRateLimiter.set(key, { count: 1, reset: now + 3_600_000 });
    return true;
  }
  if (rec.count >= 5) return false;
  rec.count++;
  return true;
}

export async function POST(request) {
  try {
    const { phone } = await request.json();

    if (!phone || !/^[6-9]\d{9}$/.test(phone.replace(/\D/g, "").slice(-10))) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit Indian mobile number" },
        { status: 400 }
      );
    }

    const cleaned = phone.replace(/\D/g, "").slice(-10);

    if (!checkRateLimit(cleaned)) {
      return NextResponse.json(
        { error: "Too many OTP requests. Please wait an hour." },
        { status: 429 }
      );
    }

    const code = generateOtpCode();
    await createOtpToken(cleaned, code);
    const result = await sendOtp(cleaned, code);

    return NextResponse.json({
      success: true,
      mode: result.mode || "sent",
      // In dev (no Fast2SMS key), return the code so we can test
      ...(result.mode === "console" ? { devCode: code } : {}),
    });
  } catch (err) {
    console.error("[OTP/send] Error:", err);
    return NextResponse.json({ error: "Failed to send OTP", details: err.message }, { status: 500 });
  }
}
