import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { sendBillEmail, sendWhatsAppMessage, buildWhatsAppLink } from "@/lib/notifications";
import { notify } from "@/lib/notify";
import { calculateETA } from "@/lib/eta";
import { notifyOrderStage } from "@/lib/kitchen-notifications";

// ─── Auto-categorise items ────────────────────────────────────────────────────
function autoCategorize(items, shopName = "") {
  const text =
    items.map((i) => i.name.toLowerCase()).join(" ") +
    " " +
    shopName.toLowerCase();
  if (/coffee|coffe|cafe|burger|food|pizza|dining|restaurant|bakery|chai|tea/.test(text))
    return "Food & Dining";
  if (/ticket|ride|uber|travel|flight|hotel|bus|auto/.test(text)) return "Travel";
  if (/shirt|jeans|shoes|fashion|clothing|shopping|mall|dress/.test(text))
    return "Shopping";
  if (/medicine|pill|health|doctor|hospital|pharmacy|tablet|syrup/.test(text))
    return "Medical";
  if (/grocery|milk|bread|zepto|blinkit|supermarket|rice|dal|atta|vegetables/.test(text))
    return "Grocery";
  return "General";
}

// ─── POST /api/bills — create a bill ─────────────────────────────────────────
export async function POST(request) {
  try {
    // Auth check — shop must be logged in
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "shop") {
      return NextResponse.json({ error: "Unauthorized — shop login required" }, { status: 401 });
    }

    const data = await request.json();

    // Validation
    if (!data.items || data.items.length === 0) {
      return NextResponse.json({ error: "At least one item is required" }, { status: 400 });
    }
    if (!data.customerPhone && !data.customerEmail && !data.tableNum && !data.tableId) {
      return NextResponse.json(
        { error: "Customer contact or Table number is required" },
        { status: 400 }
      );
    }

    // Validate items to prevent negative values (fraud prevention)
    for (const item of data.items) {
      if (typeof item.price !== 'number' || item.price < 0) {
        return NextResponse.json({ error: "Invalid item price" }, { status: 400 });
      }
      if (typeof item.quantity !== 'number' || item.quantity <= 0) {
        return NextResponse.json({ error: "Invalid item quantity" }, { status: 400 });
      }
    }

    // Use shopId from session — never trust client-supplied shopId
    const shopId = session.user.id;
    
    // Fetch shop settings for invoice generation
    const shop = await prisma.shop.findUnique({
      where: { id: shopId }
    });

    if (!shop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    // Module Permission Check
    const enabledModules = JSON.parse(shop.enabledModules || "[]");
    if (!enabledModules.includes("billing")) {
      return NextResponse.json({ error: "Billing module is disabled for this shop" }, { status: 403 });
    }

    const subtotal = data.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const taxRate = shop.category === "Medical" ? 5 : (shop.category === "Food & Dining" ? 5 : 18); // Example rules
    const taxAmount = Math.round((subtotal * (taxRate / 100)) * 100) / 100;
    const discountAmount = data.discountAmount || 0;
    const tipAmount = data.tipAmount || 0;
    let total = subtotal + taxAmount - discountAmount + tipAmount;

    // Prevent negative total
    if (total < 0) {
      return NextResponse.json({ error: "Total cannot be negative" }, { status: 400 });
    }

    const category = autoCategorize(data.items, shop.name || "");

    // Upsert customer (optional now if table is provided)
    let customer = null;
    if (data.customerEmail || data.customerPhone) {
      if (data.customerEmail) {
        customer = await prisma.customer.upsert({
          where: { email: data.customerEmail },
          update: { ...(data.customerPhone ? { phone: data.customerPhone } : {}) },
          create: {
            email: data.customerEmail,
            phone: data.customerPhone || null,
          },
        });
      } else {
        customer = await prisma.customer.upsert({
          where: { phone: data.customerPhone },
          update: { ...(data.customerEmail ? { email: data.customerEmail } : {}) },
          create: {
            phone: data.customerPhone,
            email: data.customerEmail || null,
          },
        });
      }

      // Upsert shop-customer relationship
      await prisma.shopCustomer.upsert({
        where: { shopId_customerId: { shopId, customerId: customer.id } },
        update: {
          totalSpent: { increment: total },
          visitCount: { increment: 1 },
          lastVisit: new Date(),
        },
        create: { shopId, customerId: customer.id, totalSpent: total, visitCount: 1 },
      });
    }

    // Create bill within a transaction to ensure counter consistency
    const newBill = await prisma.$transaction(async (tx) => {
      // 1. Atomic increment and get updated shop
      const updatedShop = await tx.shop.update({
        where: { id: shopId },
        data: { invoiceCounter: { increment: 1 } }
      });

      const invoiceNum = `${updatedShop.invoicePrefix || "BILL"}-${updatedShop.invoiceCounter}`;

      // 2. Create bill
      return await tx.bill.create({
        data: {
          shopId,
          invoiceNum,
          customerId: customer?.id || null,
          tableNum: data.tableNum ? String(data.tableNum) : null,
          tableId: data.tableId || null,
          customerPhone: data.customerPhone || null,
          customerEmail: data.customerEmail || null,
          subtotal,
          taxRate,
          taxAmount,
          discountAmount,
          total,
          category,
          paymentMethod: data.paymentMethod || "UPI",
          cashierName: session.user.name,
          items: {
            create: data.items.map(item => ({
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              modifiers: JSON.stringify(item.modifiers || [])
            }))
          }
        },
        include: { items: true, shop: true }
      });
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        shopId,
        action: "CREATE_BILL",
        entityType: "Bill",
        entityId: newBill.id,
        userId: session.user.id,
        description: `Generated invoice ${invoiceNum} for ₹${total}`
      }
    });

    // ─── KITCHEN ORDER ──────────────────────────────────────────────────────────
    // Only for Restaurants/Cafe types
    if (shop.businessType === "RESTAURANT" || ["Restaurant", "Cafe"].includes(shop.category)) {
      try {
        const etaData = await calculateETA(data.items, shopId);

        const kOrder = await prisma.kitchenOrder.create({
          data: {
            billId: newBill.id,
            shopId,
          tableNum: newBill.tableNum || (data.tableNum ? parseInt(data.tableNum, 10) : null),
          estimatedMinutes: etaData.estimatedMinutes,
          items: {
            create: data.items.map(i => ({
              name: i.name,
              qty: i.quantity
            }))
          },
          status: "pending"
        }
      });

      // ─── EMIT REAL-TIME EVENT ───────────────────────────────────────────────
      try {
        const { emitOrderEvent } = require("@/lib/eventBus");
        emitOrderEvent({
          type: 'order:status_changed', // Using same type for simplicity so KDS reloads
          billId: newBill.id,
          orderId: kOrder.id,
          shopId: shopId,
          status: "pending",
          estimatedMinutes: etaData.estimatedMinutes,
          updatedAt: new Date().toISOString(),
        });
      } catch (eErr) {
        console.error("[EVENT_EMIT_ERROR]", eErr);
      }

      // Fire & Forget confirmed notification
      notifyOrderStage(kOrder.id, "confirmed").catch(err => console.error("[CONFIRM_NOTIFY_ERROR]", err));
    } catch (kErr) {
      console.error("[KITCHEN_ORDER_ERROR]", kErr);
    }
  }

  // ─── NOTIFICATIONS ──────────────────────────────────────────────────────────
    try {
      const shopName = newBill.shop.name;
      
      // 1. Notify Customer of New Bill (if customer exists)
      if (customer) {
        await notify({
          userId: customer.id,
          userType: "customer",
          type: "NEW_BILL",
          title: `New bill from ${shopName}`,
          body: `₹${total} · ${data.items.map(i => i.name).join(", ")}`,
          data: { billId: newBill.id, amount: total },
          channels: ["inapp", "email", "whatsapp"]
        });

        // 3. Notify Shop (if it's a new customer)
        const isNewCustomer = await prisma.bill.count({ where: { shopId, customerId: customer.id } }) === 1;
        if (isNewCustomer) {
          await notify({
            userId: shopId,
            userType: "shop",
            type: "NEW_CUSTOMER",
            title: `New customer!`,
            body: `${customer.name || 'A customer'} (${maskPhone(customer.phone)}) just got their first bill`,
            channels: ["inapp"]
          });
        }
      }
    } catch (nErr) {
      console.error("[NOTIFICATION_ERROR]", nErr);
    }

    // 4. Build wa.me fallback link for the POS UI
    const waLink = data.customerPhone ? buildWhatsAppLink({ phone: data.customerPhone, storeName: newBill.shop.name, total, billId: newBill.id }) : null;

    if (newBill.shop && newBill.shop.password) {
      delete newBill.shop.password;
    }

    return NextResponse.json({
      success: true,
      bill: newBill,
      waLink
    });
  } catch (error) {
    console.error("[POST /api/bills] CRITICAL ERROR:", error);
    return NextResponse.json({ error: "Failed to create bill: " + error.message }, { status: 500 });
  }
}

function maskPhone(p) {
  if (!p) return "N/A";
  const cleaned = p.replace(/\D/g, "");
  return `${cleaned.slice(0, 5)}***${cleaned.slice(-2)}`;
}

// ─── GET /api/bills — fetch shop's bills ─────────────────────────────────────
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "shop") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const shopId = session.user.id;

    const bills = await prisma.bill.findMany({
      where: { shopId },
      include: { customer: true, items: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ bills });
  } catch (error) {
    console.error("[GET /api/bills]", error.message);
    return NextResponse.json({ error: "Failed to fetch bills" }, { status: 500 });
  }
}
