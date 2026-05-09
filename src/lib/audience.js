import { prisma } from "./prisma.js";

/**
 * Resolve the audience for a broadcast offer.
 * Returns [{ customerId, phone, email }] for opted-in customers only.
 */
export async function resolveAudience(shopId, type) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  switch (type) {
    // ── All customers who ever got a bill from this shop ────────────────────
    case "all": {
      const rows = await prisma.bill.findMany({
        where: {
          shopId,
          customerId: { not: null },
        },
        distinct: ["customerId"],
        select: {
          customerId: true,
          customer: { select: { phone: true, email: true } },
        },
      });
      return rows
        .filter((r) => r.customer?.phone || r.customer?.email)
        .map((r) => ({
          customerId: r.customerId,
          phone: r.customer.phone,
          email: r.customer.email,
        }));
    }

    // ── Regular: 3+ visits ───────────────────────────────────────────────────
    case "regular": {
      const sc = await prisma.shopCustomer.findMany({
        where: { shopId, visitCount: { gte: 3 } },
        include: { customer: { select: { id: true, phone: true, email: true } } },
      });
      return sc
        .filter((r) => r.customer?.phone || r.customer?.email)
        .map((r) => ({
          customerId: r.customerId,
          phone: r.customer.phone,
          email: r.customer.email,
        }));
    }

    // ── Inactive: no visit in last 30 days ───────────────────────────────────
    case "inactive": {
      // Customers who've visited but not in the last 30 days
      const sc = await prisma.shopCustomer.findMany({
        where: {
          shopId,
          lastVisit: { lt: thirtyDaysAgo },
        },
        include: { customer: { select: { id: true, phone: true, email: true } } },
      });
      return sc
        .filter((r) => r.customer?.phone || r.customer?.email)
        .map((r) => ({
          customerId: r.customerId,
          phone: r.customer.phone,
          email: r.customer.email,
        }));
    }

    // ── High spenders: top 20% by total spend ────────────────────────────────
    case "highspender": {
      const all = await prisma.shopCustomer.findMany({
        where: { shopId },
        orderBy: { totalSpent: "desc" },
        include: { customer: { select: { id: true, phone: true, email: true } } },
      });
      const top20 = all.slice(0, Math.max(1, Math.ceil(all.length * 0.2)));
      return top20
        .filter((r) => r.customer?.phone || r.customer?.email)
        .map((r) => ({
          customerId: r.customerId,
          phone: r.customer.phone,
          email: r.customer.email,
        }));
    }

    default:
      return [];
  }
}

/** Count audience without fetching all records */
export async function countAudience(shopId, type) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  switch (type) {
    case "all":
      return prisma.bill
        .groupBy({ by: ["customerId"], where: { shopId, customerId: { not: null } } })
        .then((r) => r.length);

    case "regular":
      return prisma.shopCustomer.count({ where: { shopId, visitCount: { gte: 3 } } });

    case "inactive":
      return prisma.shopCustomer.count({ where: { shopId, lastVisit: { lt: thirtyDaysAgo } } });

    case "highspender": {
      const total = await prisma.shopCustomer.count({ where: { shopId } });
      return Math.max(1, Math.ceil(total * 0.2));
    }

    default:
      return 0;
  }
}
