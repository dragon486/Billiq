import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "shop") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;

    const offer = await prisma.offer.findUnique({
      where: { id },
      include: {
        recipients: {
          select: { id: true, phone: true, email: true, status: true, sentAt: true, error: true },
          orderBy: { status: "asc" },
        },
      },
    });

    if (!offer || offer.shopId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const stats = {
      total: offer.recipients.length,
      queued:    offer.recipients.filter((r) => r.status === "queued").length,
      sent:      offer.recipients.filter((r) => r.status === "sent").length,
      failed:    offer.recipients.filter((r) => r.status === "failed").length,
    };

    return NextResponse.json({ offer, stats });
  } catch (err) {
    console.error("[offers/status]", err.message);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
