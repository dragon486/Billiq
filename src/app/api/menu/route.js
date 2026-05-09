import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// ─── GET /api/menu — Fetch all menu items for the shop ───────────────────────
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "shop") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const shopId = session.user.id;
    const items = await prisma.menuItem.findMany({
      where: { shopId },
      orderBy: [
        { category: "asc" },
        { sortOrder: "asc" },
        { name: "asc" }
      ]
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("[GET /api/menu]", error);
    return NextResponse.json({ error: "Failed to fetch menu" }, { status: 500 });
  }
}

// ─── POST /api/menu — Create a new menu item ─────────────────────────────────
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "shop") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const shopId = session.user.id;
    const data = await request.json();

    if (!data.name || !data.price || !data.category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newItem = await prisma.menuItem.create({
      data: {
        shopId,
        name: data.name,
        price: parseFloat(data.price),
        category: data.category,
        description: data.description || "",
        isAvailable: data.isAvailable !== undefined ? data.isAvailable : true,
        sortOrder: parseInt(data.sortOrder || 0, 10)
      }
    });

    return NextResponse.json({ success: true, item: newItem });
  } catch (error) {
    console.error("[POST /api/menu]", error);
    return NextResponse.json({ error: "Failed to create menu item" }, { status: 500 });
  }
}

// ─── PATCH /api/menu — Update a menu item ────────────────────────────────────
export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "shop") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const shopId = session.user.id;
    const data = await request.json();
    const { id, ...updates } = data;

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    // Verify ownership
    const item = await prisma.menuItem.findUnique({ where: { id } });
    if (!item || item.shopId !== shopId) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    const updatedItem = await prisma.menuItem.update({
      where: { id },
      data: {
        ...updates,
        price: updates.price ? parseFloat(updates.price) : undefined,
        sortOrder: updates.sortOrder !== undefined ? parseInt(updates.sortOrder, 10) : undefined
      }
    });

    return NextResponse.json({ success: true, item: updatedItem });
  } catch (error) {
    console.error("[PATCH /api/menu]", error);
    return NextResponse.json({ error: "Failed to update menu item" }, { status: 500 });
  }
}

// ─── DELETE /api/menu — Remove a menu item ───────────────────────────────────
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "shop") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const shopId = session.user.id;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    // Verify ownership
    const item = await prisma.menuItem.findUnique({ where: { id } });
    if (!item || item.shopId !== shopId) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    await prisma.menuItem.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/menu]", error);
    return NextResponse.json({ error: "Failed to delete menu item" }, { status: 500 });
  }
}
