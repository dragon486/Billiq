import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "shop") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const shopId = session.user.id;

  try {
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      include: {
        bills: { include: { items: true } },
        customers: true
      }
    });

    if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

    // Stats calculation
    const totalRevenue = shop.bills.reduce((sum, b) => sum + b.total, 0);
    const avgBill = shop.bills.length > 0 ? (totalRevenue / shop.bills.length) : 0;
    
    const itemCounts = {};
    shop.bills.forEach(b => {
      b.items.forEach(it => {
        itemCounts[it.name] = (itemCounts[it.name] || 0) + it.quantity;
      });
    });
    const bestSeller = Object.entries(itemCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || "N/A";

    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayCounts = [0,0,0,0,0,0,0];
    shop.bills.forEach(b => dayCounts[new Date(b.createdAt).getDay()]++);
    const busiestDay = days[dayCounts.indexOf(Math.max(...dayCounts))];

    const stats = {
      totalBills: shop.bills.length,
      totalCustomers: shop.customers.length,
      totalRevenue,
      avgBill,
      bestSeller,
      busiestDay
    };

    // Notification Prefs (Create if missing)
    let prefs = await prisma.notificationPreference.findUnique({ where: { userId: shopId } });
    if (!prefs) {
      prefs = await prisma.notificationPreference.create({ data: { userId: shopId } });
    }

    return NextResponse.json({
      profile: {
        name: shop.name || "",
        category: shop.category || "Grocery",
        address: shop.address || "",
        gstNumber: shop.gstNumber || "",
        phone: shop.phone,
        billingPrefix: shop.billingPrefix || "",
        autoSendWA: shop.autoSendWA,
        autoSendEmail: shop.autoSendEmail,
        defaultTheme: shop.defaultTheme,
        defaultValidity: shop.defaultValidity,
        avatarColor: shop.avatarColor,
      },
      stats,
      preferences: prefs
    });
  } catch (error) {
    console.error("[GET /api/shop/profile]", error);
    return NextResponse.json({ error: "Failed to fetch shop profile" }, { status: 500 });
  }
}

export async function PATCH(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "shop") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.json();
    const updated = await prisma.shop.update({
      where: { id: session.user.id },
      data: {
        name: data.name,
        category: data.category,
        address: data.address,
        gstNumber: data.gstNumber,
        invoicePrefix: data.invoicePrefix,
        autoSendWA: data.autoSendWA,
        autoSendEmail: data.autoSendEmail,
        defaultTheme: data.defaultTheme,
        defaultValidity: parseInt(data.defaultValidity) || 7,
        avatarColor: data.avatarColor
      }
    });
    const { password, ...safeProfile } = updated;
    return NextResponse.json({ success: true, profile: safeProfile });
  } catch (error) {
    console.error("[PATCH /api/shop/profile]", error);
    return NextResponse.json({ error: "Failed to update shop profile" }, { status: 500 });
  }
}
