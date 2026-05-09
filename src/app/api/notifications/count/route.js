import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ unread: 0 });

  try {
    const unread = await prisma.notification.count({
      where: { userId: session.user.id, read: false }
    });
    return NextResponse.json({ unread });
  } catch (error) {
    return NextResponse.json({ unread: 0 });
  }
}
