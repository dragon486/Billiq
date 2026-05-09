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

    const shops = await prisma.shop.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        businessType: true,
        category: true,
        enabledModules: true,
        createdAt: true,
        _count: {
          select: { bills: true, customers: true }
        }
      }
    });

    return NextResponse.json({ shops });
  } catch (error) {
    console.error("[GET /api/admin/shops]", error);
    return NextResponse.json({ error: "Failed to fetch shops" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { shopId, enabledModules } = await request.json();

    if (!shopId || !enabledModules) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify it's valid JSON
    let parsed;
    try {
      parsed = JSON.parse(enabledModules);
      if (!Array.isArray(parsed)) throw new Error("Must be array");
    } catch {
      return NextResponse.json({ error: "enabledModules must be a valid JSON array string" }, { status: 400 });
    }

    const shop = await prisma.shop.update({
      where: { id: shopId },
      data: { enabledModules }
    });

    return NextResponse.json({ success: true, enabledModules: shop.enabledModules });
  } catch (error) {
    console.error("[PATCH /api/admin/shops]", error);
    return NextResponse.json({ error: "Failed to update shop modules" }, { status: 500 });
  }
}
