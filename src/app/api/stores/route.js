import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const data = await request.json();
    
    if (!data.name || !data.phone) {
      return NextResponse.json(
        { error: "Shop name and phone are required" },
        { status: 400 }
      );
    }

    // Check if shop with phone already exists
    let shop = await prisma.shop.findUnique({
      where: { phone: data.phone }
    });

    if (!shop) {
      shop = await prisma.shop.create({
        data: {
          name: data.name,
          phone: data.phone
        }
      });
    }

    return NextResponse.json({ success: true, shop });
  } catch (error) {
    console.error("Error onboarding shop:", error);
    return NextResponse.json({ error: "Failed to onboard shop" }, { status: 500 });
  }
}
