import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// ─── GET /api/tables — Fetch all tables for the shop ─────────────────────────
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "shop") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const shopId = session.user.id;
    const tables = await prisma.table.findMany({
      where: { shopId },
      orderBy: { number: "asc" }
    });

    return NextResponse.json({ tables });
  } catch (error) {
    console.error("[GET /api/tables]", error);
    return NextResponse.json({ error: "Failed to fetch tables" }, { status: 500 });
  }
}

// ─── POST /api/tables — Create a new table ───────────────────────────────────
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "shop") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const shopId = session.user.id;
    const data = await request.json();

    if (!data.number) {
      return NextResponse.json({ error: "Table number required" }, { status: 400 });
    }

    const newTable = await prisma.table.create({
      data: {
        shopId,
        number: parseInt(data.number, 10),
        capacity: parseInt(data.capacity || 4, 10),
        status: "empty"
      }
    });

    return NextResponse.json({ success: true, table: newTable });
  } catch (error) {
    console.error("[POST /api/tables]", error);
    return NextResponse.json({ error: "Failed to create table" }, { status: 500 });
  }
}

// ─── PATCH /api/tables — Update a table ──────────────────────────────────────
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

    const table = await prisma.table.findUnique({ where: { id } });
    if (!table || table.shopId !== shopId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updatedTable = await prisma.table.update({
      where: { id },
      data: {
        ...updates,
        number: updates.number ? parseInt(updates.number, 10) : undefined,
        capacity: updates.capacity ? parseInt(updates.capacity, 10) : undefined
      }
    });

    return NextResponse.json({ success: true, table: updatedTable });
  } catch (error) {
    console.error("[PATCH /api/tables]", error);
    return NextResponse.json({ error: "Failed to update table" }, { status: 500 });
  }
}

// ─── DELETE /api/tables — Remove a table ─────────────────────────────────────
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

    const table = await prisma.table.findUnique({ where: { id } });
    if (!table || table.shopId !== shopId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.table.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/tables]", error);
    return NextResponse.json({ error: "Failed to delete table" }, { status: 500 });
  }
}
