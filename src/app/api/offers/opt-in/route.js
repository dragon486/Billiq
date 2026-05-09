import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "customer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const customerId = session.user.id;
    const { shopId, optedIn } = await request.json();

    if (!shopId || typeof optedIn !== "boolean") {
      return NextResponse.json({ error: "shopId and optedIn (boolean) required" }, { status: 400 });
    }

    const record = await prisma.optIn.upsert({
      where: { customerId_shopId: { customerId, shopId } },
      update: { optedIn },
      create: { customerId, shopId, optedIn },
    });

    return NextResponse.json({ success: true, optedIn: record.optedIn });
  } catch (err) {
    console.error("[offers/opt-in]", err.message);
    return NextResponse.json({ error: "Failed to update opt-in" }, { status: 500 });
  }
}
