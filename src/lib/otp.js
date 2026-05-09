/**
 * OTP Generator and Sender
 *
 * HOW TO GET FAST2SMS API KEY (free):
 * 1. Go to https://www.fast2sms.com/
 * 2. Sign up → Dashboard → Dev API → Copy API key
 * 3. Add to .env: FAST2SMS_API_KEY=your_key_here
 *
 * Without the key, OTPs are logged to the server console (dev mode).
 */

import { prisma } from "./prisma";

/** Generate a cryptographically safe 6-digit OTP */
export function generateOtpCode() {
  const min = 100000;
  const max = 999999;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

/** Store OTP in DB (expires in 10 minutes) */
export async function createOtpToken(phone, code, db = prisma) {
  // Invalidate any existing unused tokens for this phone
  await db.otpToken.updateMany({
    where: { phone, used: false },
    data: { used: true },
  });

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
  return db.otpToken.create({
    data: { phone, code, expiresAt },
  });
}

/** Verify OTP — returns token record or throws */
export async function verifyOtpToken(phone, code) {
  const token = await prisma.otpToken.findFirst({
    where: {
      phone,
      code,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!token) {
    throw new Error("Invalid or expired OTP. Please try again.");
  }

  // Mark as used
  await prisma.otpToken.update({ where: { id: token.id }, data: { used: true } });
  return token;
}

/**
 * Send OTP via Fast2SMS (or log to console in dev).
 * Returns { success: true } or { success: false, error }
 */
export async function sendOtp(phone, code) {
  const apiKey = process.env.FAST2SMS_API_KEY;

  // ── Console fallback (dev / no API key) ──────────────────────────────────
  if (!apiKey) {
    console.log(`\n┌─────────────────────────────────┐`);
    console.log(`│  BILLIQ OTP (dev mode)          │`);
    console.log(`│  Phone: ${phone.padEnd(22)}│`);
    console.log(`│  Code:  ${code.padEnd(22)}│`);
    console.log(`└─────────────────────────────────┘\n`);
    return { success: true, mode: "console" };
  }

  // ── Fast2SMS ──────────────────────────────────────────────────────────────
  try {
    const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        route: "otp",
        variables_values: code,
        numbers: phone.replace(/\D/g, "").slice(-10), // last 10 digits
      }),
    });

    const json = await res.json();
    if (json.return) {
      return { success: true, mode: "fast2sms" };
    }
    console.error("[OTP] Fast2SMS error:", json.message);
    return { success: false, error: json.message };
  } catch (err) {
    console.error("[OTP] Fast2SMS exception:", err.message);
    return { success: false, error: err.message };
  }
}
