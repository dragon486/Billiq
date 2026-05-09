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

    // Fetch the 500 most recent bills to reconcile
    const bills = await prisma.bill.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      include: {
        items: true,
        shop: { select: { name: true, phone: true } }
      }
    });

    const discrepancies = [];

    for (const bill of bills) {
      // Calculate expected total
      const subtotal = bill.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      const taxAmount = Math.round((subtotal * (bill.taxRate / 100)) * 100) / 100;
      const expectedTotal = subtotal + taxAmount - bill.discountAmount + bill.tipAmount;

      // Use a small epsilon for floating point comparison issues
      if (Math.abs(expectedTotal - bill.total) > 0.05) {
        discrepancies.push({
          billId: bill.id,
          invoiceNum: bill.invoiceNum,
          shopName: bill.shop.name,
          shopPhone: bill.shop.phone,
          savedTotal: bill.total,
          expectedTotal: expectedTotal,
          diff: Math.abs(expectedTotal - bill.total),
          createdAt: bill.createdAt
        });
      }
    }

    return NextResponse.json({
      checkedCount: bills.length,
      discrepanciesCount: discrepancies.length,
      discrepancies
    });
  } catch (error) {
    console.error("[GET /api/admin/reconciliation]", error);
    return NextResponse.json({ error: "Reconciliation failed" }, { status: 500 });
  }
}
