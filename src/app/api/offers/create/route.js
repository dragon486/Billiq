import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { resolveAudience } from "@/lib/audience";
import { sendBroadcastToRecipient, sendOfferWithImage } from "@/lib/notifications";
import { notify } from "@/lib/notify";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "shop") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const shopId = session.user.id;

    const body = await request.json();
    const { title, message, discountType, discountValue, validUntil, audienceType, scheduledAt, theme, imageMode, imageUrl } = body;

    // Validation
    if (!title?.trim()) return NextResponse.json({ error: "Title is required" }, { status: 400 });
    if (!message?.trim()) return NextResponse.json({ error: "Message is required" }, { status: 400 });
    if (message.length > 160) return NextResponse.json({ error: "Message must be ≤ 160 characters" }, { status: 400 });
    if (validUntil && new Date(validUntil) < new Date()) {
      return NextResponse.json({ error: "validUntil must be in the future" }, { status: 400 });
    }

    // Resolve audience
    const audience = await resolveAudience(shopId, audienceType || "all");
    if (audience.length === 0) {
      return NextResponse.json({ error: "No eligible recipients for this audience" }, { status: 400 });
    }

    // Get shop name
    const shop = await prisma.shop.findUnique({ where: { id: shopId }, select: { name: true } });

    // Create offer + recipients
    const offer = await prisma.offer.create({
      data: {
        shopId,
        title: title.trim(),
        message: message.trim(),
        discountType: discountType || null,
        discountValue: discountValue ? parseFloat(discountValue) : null,
        validUntil: validUntil ? new Date(validUntil) : null,
        audienceType: audienceType || "all",
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        theme: theme || "dark",
        imageMode: imageMode || "generated",
        imageUrl: imageUrl || null,
        status: scheduledAt ? "scheduled" : "pending",
        recipients: {
          create: audience.map((a) => ({
            customerId: a.customerId || null,
            phone: a.phone || "",
            email: a.email || null,
            status: "queued",
          })),
        },
      },
      include: { recipients: true },
    });

    // If scheduled, return early
    if (scheduledAt) {
      return NextResponse.json({
        success: true,
        offerId: offer.id,
        audienceCount: audience.length,
        scheduled: scheduledAt,
      });
    }

    // Update offer status to "sending"
    await prisma.offer.update({ where: { id: offer.id }, data: { status: "sending", sentAt: new Date() } });

    // Send in background (non-blocking response)
    const shopName = shop?.name || "BILLIQ Shop";
    void (async () => {
      let sentCount = 0;
      let failCount = 0;
      for (let i = 0; i < offer.recipients.length; i++) {
        const rec = offer.recipients[i];
        try {
          const result = await sendOfferWithImage({
            phone: rec.phone || null,
            offer: { ...offer, id: offer.id },
            storeName: shopName,
          });
          await prisma.offerRecipient.update({
            where: { id: rec.id },
            data: {
              status: result.success ? "sent" : "failed",
              sentAt: result.success ? new Date() : null,
              error: result.success ? null : result.error,
            },
          });
          if (result.success) sentCount++;
          else failCount++;
        } catch (err) {
          await prisma.offerRecipient.update({
            where: { id: rec.id },
            data: { status: "failed", error: err.message },
          });
          failCount++;
        }
        // Rate limit: 10 per second
        if ((i + 1) % 10 === 0) await new Promise((r) => setTimeout(r, 1000));
      }
      await prisma.offer.update({
        where: { id: offer.id },
        data: { status: "completed" },
      });
      
      await notify({
        userId: shopId,
        userType: "shop",
        type: "OFFER_DELIVERED",
        title: "Offer Broadcast Complete",
        body: `Your offer reached ${sentCount}/${offer.recipients.length} customers`,
        channels: ["inapp"]
      });

      console.log(`[OFFERS] Offer ${offer.id} completed: ${sentCount} sent, ${failCount} failed`);
    })();

    return NextResponse.json({
      success: true,
      offerId: offer.id,
      audienceCount: audience.length,
      estimatedMinutes: Math.ceil(audience.length / 600), // 10/sec
    });
  } catch (err) {
    console.error("[offers/create]", err.message);
    return NextResponse.json({ error: "Failed to create offer" }, { status: 500 });
  }
}
