import { prisma } from "./prisma";
import { sendBillEmail, sendWhatsAppMessage } from "./notifications";
import webpush from "web-push";

// VAPID keys should be in .env. For now, using placeholders or generating them.
// In a real app, run: npx web-push generate-vapid-keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:support@billiq.in",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

/**
 * Unified notification engine for BILLIQ
 */
export async function notify({
  userId,
  userType,
  type,
  title,
  body,
  data = {},
  channels = ["inapp", "email"]
}) {
  try {
    // 1. ALWAYS save to DB for in-app drawer
    await prisma.notification.create({
      data: {
        userId,
        userType,
        type,
        title,
        body,
        data,
        channel: "inapp"
      }
    });

    // 2. Fetch User Preferences
    const prefs = await prisma.notificationPreference.findUnique({
      where: { userId }
    });

    // If no prefs exist, we assume default (all on)
    const isEmailEnabled = prefs ? prefs.emailEnabled : true;
    const isWhatsAppEnabled = prefs ? prefs.whatsappEnabled : true;
    const isPushEnabled = prefs ? prefs.pushEnabled : false;
    const emailDigest = prefs ? prefs.emailDigest : "instant";

    // 3. CHANNEL: Push Notifications (Instant)
    if (isPushEnabled && channels.includes("push")) {
      const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId }
      });

      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth }
            },
            JSON.stringify({ title, body, data, type })
          );
        } catch (err) {
          if (err.statusCode === 404 || err.statusCode === 410) {
            // Subscription expired, remove it
            await prisma.pushSubscription.delete({ where: { id: sub.id } });
          }
        }
      }
    }

    // 4. CHANNEL: Email
    if (isEmailEnabled && channels.includes("email") && emailDigest === "instant") {
      // Get user email based on type
      let targetEmail = "";
      if (userType === "customer") {
        const user = await prisma.customer.findUnique({ where: { id: userId } });
        targetEmail = user?.email;
      } else {
        const user = await prisma.shop.findUnique({ where: { id: userId } });
        targetEmail = user?.email;
      }

      if (targetEmail) {
        // Using existing email service (simplified wrapper here)
        await sendBillEmail({
          toEmail: targetEmail,
          storeName: "BILLIQ", // Generic header for system notifications
          total: data.amount || 0,
          items: [],
          billId: data.billId,
          customTitle: title,
          customBody: body
        });
      }
    }

    // 5. CHANNEL: WhatsApp (High Priority Only)
    const HIGH_PRIORITY = ["NEW_BILL", "OFFER_RECEIVED"];
    if (isWhatsAppEnabled && channels.includes("whatsapp") && HIGH_PRIORITY.includes(type)) {
      let targetPhone = "";
      if (userType === "customer") {
        const user = await prisma.customer.findUnique({ where: { id: userId } });
        targetPhone = user?.phone;
      } else {
        const user = await prisma.shop.findUnique({ where: { id: userId } });
        targetPhone = user?.phone;
      }

      if (targetPhone) {
        await sendWhatsAppMessage({
          phone: targetPhone,
          storeName: "BILLIQ",
          total: data.amount || 0,
          billId: data.billId,
          customText: `${title}\n\n${body}`
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error("[NOTIFY_SERVICE_ERROR]", error);
    return { success: false, error: error.message };
  }
}
