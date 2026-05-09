import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendBroadcastToRecipient, sendOfferWithImage } from "@/lib/notifications";
import { notify } from "@/lib/notify";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    const authHeader = request.headers.get('authorization');
    const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;

    if (!session && !isCron) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { offerId } = await request.json();
    if (!offerId) return NextResponse.json({ error: "offerId required" }, { status: 400 });

    // Verify ownership if requested via session
    if (session) {
      const offerCheck = await prisma.offer.findUnique({ where: { id: offerId } });
      if (!offerCheck || offerCheck.shopId !== session.user.id) {
        return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
      }
    }

    // 1. Mark offer as sending
    await prisma.offer.update({
      where: { id: offerId },
      data: { status: "sending" }
    });

    // 2. Process in batches of 10 to avoid rate limits / timeouts
    // Fetch offer once to avoid N+1 queries inside the loop
    const offerWithShop = await prisma.offer.findUnique({ where: { id: offerId }, include: { shop: true } });
    if (!offerWithShop) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }

    let processed = 0;
    while (true) {
      const recipients = await prisma.offerRecipient.findMany({
        where: { offerId, status: "queued" },
        take: 10,
      });

      if (recipients.length === 0) break;

      for (const recipient of recipients) {
        try {
          const result = await sendOfferWithImage({ 
            phone: recipient.phone, 
            offer: offerWithShop, 
            storeName: offerWithShop.shop.name 
          });
          if (result.success) {
            await prisma.offerRecipient.update({
              where: { id: recipient.id },
              data: { status: "sent", sentAt: new Date() }
            });
          } else {
            await prisma.offerRecipient.update({
              where: { id: recipient.id },
              data: { status: "failed", error: result.error || "Unknown error" }
            });
          }
        } catch (err) {
          await prisma.offerRecipient.update({
            where: { id: recipient.id },
            data: { status: "failed", error: err.message }
          });
        }
        processed++;
      }

      // Small delay between batches to be nice to APIs
      await new Promise(r => setTimeout(r, 1000));
    }

    // 3. Mark offer as completed and notify shop
    const offer = await prisma.offer.update({
      where: { id: offerId },
      data: { status: "completed" },
      include: { _count: { select: { recipients: true } } }
    });

    const sentCount = await prisma.offerRecipient.count({ where: { offerId, status: "sent" } });
    const totalCount = offer._count.recipients;

    await notify({
      userId: offer.shopId,
      userType: "shop",
      type: "OFFER_DELIVERED",
      title: "Offer Broadcast Complete",
      body: `Your offer reached ${sentCount}/${totalCount} customers (${Math.round((sentCount/totalCount)*100)}% delivery)`,
      channels: ["inapp"]
    });

    return NextResponse.json({ success: true, processed });
  } catch (err) {
    console.error("[broadcast-worker-error]", err.message);
    return NextResponse.json({ error: "Worker failed" }, { status: 500 });
  }
}
