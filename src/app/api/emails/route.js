import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const shopId = searchParams.get('shopId');

  if (!shopId) {
    return NextResponse.json({ error: "shopId is required" }, { status: 400 });
  }

  try {
    const campaigns = await prisma.emailCampaign.findMany({
      where: { shopId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error("Emails API GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { shopId, name, subject, messageBody, sentToCount } = body;

    if (!shopId || !name || !subject || !messageBody) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const campaign = await prisma.emailCampaign.create({
      data: {
        shopId,
        name,
        subject,
        body: messageBody,
        sentToCount: sentToCount || 0
      }
    });

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error("Emails API POST Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
