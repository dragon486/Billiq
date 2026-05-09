import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "shop") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const shopId = session.user.id;
  const { searchParams } = new URL(request.url);
  const daysParam = searchParams.get("days") || "7";

  let dateFilter = {};
  if (daysParam !== "all") {
    const days = parseInt(daysParam, 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    dateFilter = { gte: startDate };
  }

  try {
    const bills = await prisma.bill.findMany({
      where: { 
        shopId,
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
      },
      include: { items: true },
      orderBy: { createdAt: 'asc' }
    });

    const customers = await prisma.shopCustomer.findMany({
      where: { shopId },
      include: { customer: true },
      orderBy: { totalSpent: 'desc' }
    });

    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { 
        onboardingStep: true, 
        name: true, 
        category: true,
        primaryColor: true,
        secondaryColor: true,
        logoUrl: true,
        enabledModules: true
      }
    });

    const totalSales = bills.reduce((acc, bill) => acc + bill.total, 0);
    const activeOrders = bills.length;

    const categories = bills.reduce((acc, bill) => {
      acc[bill.category] = (acc[bill.category] || 0) + bill.total;
      return acc;
    }, {});
    const pieData = Object.keys(categories).map(key => ({
      name: key,
      value: categories[key]
    }));

    const dates = bills.reduce((acc, bill) => {
      const dateStr = bill.createdAt.toISOString().split('T')[0];
      acc[dateStr] = (acc[dateStr] || 0) + bill.total;
      return acc;
    }, {});
    const barData = Object.keys(dates).map(dateStr => ({
      name: dateStr,
      sales: dates[dateStr]
    }));

    const productSales = {};
    bills.forEach(bill => {
      bill.items.forEach(item => {
        if (!productSales[item.name]) {
          productSales[item.name] = { revenue: 0, quantity: 0 };
        }
        productSales[item.name].revenue += (item.price * item.quantity);
        productSales[item.name].quantity += item.quantity;
      });
    });

    const topProducts = Object.entries(productSales)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    const recentOrders = bills.map(bill => ({
      id: bill.id,
      total: bill.total,
      date: bill.createdAt.toISOString(),
      customerPhone: bill.customerPhone || "N/A"
    })).sort((a, b) => new Date(b.date) - new Date(a.date));

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const completedOrders = await prisma.kitchenOrder.findMany({
      where: {
        shopId,
        status: "served",
        preparingStartedAt: { not: null },
        readyAt: { not: null },
        servedAt: { not: null },
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
      }
    });

    const servedOrders = completedOrders.filter(o => o.servedAt && o.createdAt);

    let avgPrepTime = 0;
    let etaAccuracy = 0;

    if (completedOrders.length > 0) {
      const totalPrepMs = completedOrders.reduce((sum, o) => sum + (o.readyAt.getTime() - o.preparingStartedAt.getTime()), 0);
      avgPrepTime = Math.round((totalPrepMs / completedOrders.length) / 60000);
      const onTimeOrders = completedOrders.filter(o => {
        const actualMins = (o.readyAt.getTime() - o.preparingStartedAt.getTime()) / 60000;
        return actualMins <= (o.estimatedMinutes || 15) + 2;
      });
      etaAccuracy = Math.round((onTimeOrders.length / completedOrders.length) * 100);
    }

    const now = new Date();
    const dayOfWeek = now.getDay();
    const todayStr = now.toISOString().split('T')[0];
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const yesterdayDate = new Date(todayDate);
    yesterdayDate.setDate(todayDate.getDate() - 1);
    const todayBills = bills.filter(b => b.createdAt >= todayDate);
    const yesterdayBills = bills.filter(b => b.createdAt >= yesterdayDate && b.createdAt < todayDate);
    const todayRevenue = todayBills.reduce((acc, b) => acc + b.total, 0);
    const yesterdayRevenue = yesterdayBills.reduce((acc, b) => acc + b.total, 0);

    const lastWeekSameDay = new Date(todayDate);
    lastWeekSameDay.setDate(todayDate.getDate() - 7);
    const lastWeekNextDay = new Date(lastWeekSameDay);
    lastWeekNextDay.setDate(lastWeekSameDay.getDate() + 1);
    
    const lastWeekBills = bills.filter(b => b.createdAt >= lastWeekSameDay && b.createdAt < lastWeekNextDay);
    const lastWeekSales = lastWeekBills.reduce((acc, b) => acc + b.total, 0);
    
    let salesChange = 0;
    if (lastWeekSales > 0) {
      salesChange = Math.round(((todayRevenue - lastWeekSales) / lastWeekSales) * 100);
    } else if (todayRevenue > 0) {
      salesChange = 100;
    }

    const hourlyDistribution = bills.reduce((acc, bill) => {
      const hour = new Date(bill.createdAt).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});
    const peakHour = Object.entries(hourlyDistribution).sort((a, b) => b[1] - a[1])[0]?.[0] || 19;

    const insights = {
      salesChange,
      peakHour: parseInt(peakHour),
      todaySales: todayRevenue,
      lastWeekSales,
      dayName: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayOfWeek]
    };
    let dayOverDayChange = 0;
    if (yesterdayRevenue > 0) {
      dayOverDayChange = Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100);
    } else if (todayRevenue > 0) {
      dayOverDayChange = 100;
    }

    const uniqueCustomerIds = new Set(bills.filter(b => b.customerId).map(b => b.customerId));
    const returningCount = Array.from(uniqueCustomerIds).filter(cid => {
      const c = customers.find(cust => cust.customerId === cid);
      return c && c.visitCount > 1;
    }).length;
    const totalTimeframeCustomers = uniqueCustomerIds.size;
    const returningRate = totalTimeframeCustomers > 0 ? Math.round((returningCount / totalTimeframeCustomers) * 100) : 0;

    const delayedToday = completedOrders.filter(o => {
      const actualMins = (o.readyAt.getTime() - o.preparingStartedAt.getTime()) / 60000;
      return actualMins > (o.estimatedMinutes || 15);
    }).length;

    const tableCount = await prisma.table.count({ where: { shopId } });
    let avgTableTurnover = 0;
    if (tableCount > 0 && servedOrders.length > 0) {
      const totalTurnoverMs = servedOrders.reduce((sum, o) => {
        const diff = (o.servedAt.getTime() - o.createdAt.getTime()) / 60000;
        return sum + Math.min(diff, 120);
      }, 0);
      avgTableTurnover = Math.round(totalTurnoverMs / servedOrders.length) + 15;
    }

    return NextResponse.json({
      metrics: {
        totalSales,
        activeOrders,
        todayRevenue,
        yesterdayRevenue,
        dayOverDayChange,
        returningRate,
        newRate: 100 - returningRate,
        onboardingStep: shop?.onboardingStep || 1,
        kitchen: {
          avgPrepTime,
          etaAccuracy,
          completedToday: completedOrders.length,
          delayedToday
        }
      },
      charts: {
        barData,
        pieData
      },
      topProducts,
      recentOrders,
      crm: customers.map(c => ({
        customerId: c.customerId,
        phone: c.customer.phone,
        totalSpent: c.totalSpent,
        visitCount: c.visitCount,
        lastVisit: c.lastVisit
      })),
      insights: {
        ...insights,
        avgTableTurnover
      }
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Failed to load dashboard data" }, { status: 500 });
  }
}
