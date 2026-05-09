import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "shop") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, category, address, gstNumber } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: "Shop name is required" }, { status: 400 });
    }

    const shop = await prisma.shop.update({
      where: { id: session.user.id },
      data: {
        name: name.trim(),
        category: category || null,
        address: address?.trim() || null,
        gstNumber: gstNumber?.trim() || null,
        onboardingStep: 3,
      },
    });

    const { password, ...safeShop } = shop;
    return NextResponse.json({ success: true, shop: safeShop });
  } catch (err) {
    console.error("[shop/setup]", err.message);
    return NextResponse.json({ error: "Failed to update shop" }, { status: 500 });
  }
}
