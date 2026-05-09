import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "shop") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const shopId = session.user.id;
    const { orderId, status } = await request.json();

    if (!orderId || !status) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Verify ownership and module access
    const order = await prisma.kitchenOrder.findUnique({
      where: { id: orderId },
      include: { shop: true }
    });

    if (!order || order.shopId !== shopId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const activeModules = JSON.parse(order.shop.enabledModules || "[]");
    if ((order.shop.businessType !== "RESTAURANT" && !["Restaurant", "Cafe"].includes(order.shop.category)) || !activeModules.includes("kitchen")) {
      return NextResponse.json({ error: "Forbidden - Kitchen Module is locked" }, { status: 403 });
    }

    const { notifyOrderStage } = require("@/lib/kitchen-notifications");
    const updateData = { status };
    
    if (status === "preparing") {
      updateData.preparingStartedAt = new Date();
    } else if (status === "ready") {
      updateData.readyAt = new Date();
    } else if (status === "served") {
      updateData.servedAt = new Date();
    }

    const updatedOrder = await prisma.kitchenOrder.update({
      where: { id: orderId },
      data: updateData
    });

    // ─── EMIT REAL-TIME EVENT ───────────────────────────────────────────────
    try {
      const { emitOrderEvent } = require("@/lib/eventBus");
      emitOrderEvent({
        type: 'order:status_changed',
        billId: updatedOrder.billId,
        orderId: updatedOrder.id,
        shopId: updatedOrder.shopId,
        status: updatedOrder.status,
        estimatedMinutes: updatedOrder.estimatedMinutes || 15,
        updatedAt: new Date().toISOString(),
      });
    } catch (eErr) {
      console.error("[EVENT_EMIT_ERROR]", eErr);
    }

    // Notify customer (WhatsApp)
    if (["preparing", "ready"].includes(status)) {
      notifyOrderStage(orderId, status).catch(console.error);
    }

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (err) {
    console.error("[PATCH /api/kitchen/update]", err);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}
