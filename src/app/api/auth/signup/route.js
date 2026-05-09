import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    const data = await request.json();
    const { name, email, phone, password } = data;

    if (!name || !email || !phone || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // Normalize phone number (strip +91 and non-numeric)
    const normalizedPhone = phone.replace(/\D/g, '').slice(-10);

    const existingShop = await prisma.shop.findFirst({
      where: { OR: [{ email }, { phone: normalizedPhone }] }
    });

    if (existingShop) {
      return NextResponse.json({ error: "Shop with this email or phone already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const shop = await prisma.shop.create({
      data: {
        name,
        email,
        phone: normalizedPhone,
        password: hashedPassword
      }
    });

    return NextResponse.json({ success: true, shop: { id: shop.id, email: shop.email, name: shop.name } });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
