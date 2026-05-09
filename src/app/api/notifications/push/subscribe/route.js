import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const subscription = await request.json(); // { endpoint, keys: { p256dh, auth } }
    
    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: { 
        userId: session.user.id,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      },
      create: {
        userId: session.user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      }
    });

    // Also enable push in preferences
    await prisma.notificationPreference.upsert({
      where: { userId: session.user.id },
      update: { pushEnabled: true },
      create: { userId: session.user.id, pushEnabled: true }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PUSH_SUBSCRIBE]", error);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}
