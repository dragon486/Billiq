import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "shop") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const shopId = session.user.id;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const [offers, total] = await Promise.all([
      prisma.offer.findMany({
        where: { shopId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { recipients: true } },
        },
      }),
      prisma.offer.count({ where: { shopId } }),
    ]);

    // Get sent/failed counts per offer
    const offerIds = offers.map((o) => o.id);
    const recipientStats = await prisma.offerRecipient.groupBy({
      by: ["offerId", "status"],
      where: { offerId: { in: offerIds } },
      _count: { id: true },
    });

    const statsMap = {};
    for (const s of recipientStats) {
      if (!statsMap[s.offerId]) statsMap[s.offerId] = {};
      statsMap[s.offerId][s.status] = s._count.id;
    }

    const enriched = offers.map((o) => ({
      ...o,
      stats: statsMap[o.id] || {},
    }));

    return NextResponse.json({ offers: enriched, total, page, limit });
  } catch (err) {
    console.error("[offers GET]", err.message);
    return NextResponse.json({ error: "Failed to fetch offers" }, { status: 500 });
  }
}
