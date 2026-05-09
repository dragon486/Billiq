import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "shop") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Always scope to the authenticated shop — never trust query param shopId
  const shopId = session.user.id;

  try {
    const messages = await prisma.message.findMany({
      where: { shopId },
      orderBy: { createdAt: "asc" },
      include: {
        customer: {
          select: { phone: true },
        },
      },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Messages API GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "shop") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { customerId, content } = body;

    // shopId always comes from session — never from request body
    const shopId = session.user.id;

    if (!customerId || !content?.trim()) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify the customer belongs to this shop before writing
    const relationship = await prisma.shopCustomer.findUnique({
      where: { shopId_customerId: { shopId, customerId } },
    });
    if (!relationship) {
      return NextResponse.json({ error: "Customer not found in your shop" }, { status: 404 });
    }

    const message = await prisma.message.create({
      data: {
        shopId,
        customerId,
        content: content.trim(),
        isFromStore: true,
      },
      include: {
        customer: {
          select: { phone: true },
        },
      },
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Messages API POST Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
