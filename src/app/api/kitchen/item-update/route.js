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

    const { itemId, completed } = await request.json();

    if (!itemId) {
      return NextResponse.json({ error: "Missing itemId" }, { status: 400 });
    }

    // Verify ownership to prevent cross-tenant IDOR
    const itemToUpdate = await prisma.kitchenOrderItem.findUnique({
      where: { id: itemId },
      include: { order: true }
    });

    if (!itemToUpdate || itemToUpdate.order.shopId !== session.user.id) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    const shop = await prisma.shop.findUnique({ where: { id: session.user.id } });
    const activeModules = JSON.parse(shop?.enabledModules || "[]");
    if (!activeModules.includes("kitchen")) {
      return NextResponse.json({ error: "Forbidden - Kitchen Module is locked" }, { status: 403 });
    }

    const item = await prisma.kitchenOrderItem.update({
      where: { id: itemId },
      data: {
        completedAt: completed ? new Date() : null
      }
    });

    return NextResponse.json({ success: true, item });
  } catch (err) {
    console.error("[PATCH /api/kitchen/item-update]", err);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}
