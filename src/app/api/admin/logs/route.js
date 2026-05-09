import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100, // Fetch recent 100 logs
      include: {
        shop: {
          select: { name: true, phone: true }
        }
      }
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("[GET /api/admin/logs]", error);
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}
