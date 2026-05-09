import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const prefs = await prisma.notificationPreference.findUnique({
      where: { userId: session.user.id }
    });
    return NextResponse.json({ preferences: prefs });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 });
  }
}

export async function PATCH(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await request.json();
    const updated = await prisma.notificationPreference.upsert({
      where: { userId: session.user.id },
      update: data,
      create: { ...data, userId: session.user.id }
    });
    return NextResponse.json({ success: true, preferences: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  }
}
