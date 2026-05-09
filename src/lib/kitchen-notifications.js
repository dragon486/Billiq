import { prisma } from "./prisma";
import { sendWhatsAppMessage } from "./notifications";

export async function notifyOrderStage(orderId, stage) {
  try {
    const order = await prisma.kitchenOrder.findUnique({
      where: { id: orderId },
      include: { 
        bill: { include: { shop: true } },
        items: true
      }
    });

    if (!order || !order.bill.customerPhone) return;

    const shop = order.bill.shop;
    const phone = order.bill.customerPhone;
    const shopName = shop.name;
    const itemsList = order.items.map(i => `• ${i.qty}× ${i.name}`).join("\n");

    let message = "";

    switch (stage) {
      case "confirmed":
        message = `🧾 *Order confirmed at ${shopName}*\n\nYour items:\n${itemsList}\n\n⏱️ Estimated ready time: *~${order.estimatedMinutes || 15} minutes*\n📍 Table: ${order.tableNum ? `Table ${order.tableNum}` : "Takeaway"}\n\nWe'll message you when your order is ready!`;
        break;

      case "preparing":
        // Remaining time = estimated - (now - preparingStartedAt)
        const elapsed = Math.floor((Date.now() - new Date(order.preparingStartedAt).getTime()) / 60000);
        const remaining = Math.max(2, (order.estimatedMinutes || 15) - elapsed);
        message = `👨‍🍳 *${shopName} is preparing your order!*\n\nOrder #${order.billId.slice(-4).toUpperCase()} is now being made.\nShould be ready in about *${remaining} minutes*.\n\nSit tight! ☕`;
        break;

      case "ready":
        const isTakeaway = !order.tableNum;
        message = `✅ *Your order is ready!*\n\nOrder #${order.billId.slice(-4).toUpperCase()} from ${shopName} ${isTakeaway ? "is ready for pickup! Please collect at the counter. 🏃" : "is on its way to your table. Enjoy your meal! 😊🙏"}\n\nThank you for choosing ${shopName}!`;
        break;

      case "delayed":
        message = `⏳ *Quick update from ${shopName}*\n\nWe're a little busier than usual right now.\nYour order #${order.billId.slice(-4).toUpperCase()} will be ready very shortly.\n\nWe sincerely apologise for the wait! 🙏`;
        break;
    }

    if (message) {
      await sendWhatsAppMessage({
        phone,
        storeName: shopName,
        total: order.bill.total,
        billId: order.billId,
        customText: message
      });

      if (stage === "confirmed") {
        await prisma.kitchenOrder.update({
          where: { id: orderId },
          data: { waNotified: true }
        });
      }
    }
  } catch (err) {
    console.error("[KITCHEN_NOTIFY_ERROR]", err);
  }
}
