import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const shopId = searchParams.get('shopId');

  if (!shopId) {
    return NextResponse.json({ error: "shopId is required" }, { status: 400 });
  }

  try {
    const messages = await prisma.message.findMany({
      where: { shopId },
      orderBy: { createdAt: 'asc' },
      include: {
        customer: {
          select: { phone: true }
        }
      }
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Messages API GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { shopId, customerId, content } = body;

    if (!shopId || !customerId || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        shopId,
        customerId,
        content,
        isFromStore: true
      },
      include: {
        customer: {
          select: { phone: true }
        }
      }
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Messages API POST Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
