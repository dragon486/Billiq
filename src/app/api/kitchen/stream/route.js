import { prisma } from "@/lib/prisma";
import { eventBus } from "@/lib/eventBus";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "shop") {
    return new Response("Unauthorized", { status: 401 });
  }

  const shopId = session.user.id;

  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  const activeModules = JSON.parse(shop?.enabledModules || "[]");
  
  if (!shop || (shop.businessType !== "RESTAURANT" && !["Restaurant", "Cafe"].includes(shop.category)) || !activeModules.includes("kitchen")) {
    return new Response(JSON.stringify({ error: "Forbidden - Kitchen Module is locked" }), { 
      status: 403, 
      headers: { "Content-Type": "application/json" } 
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event, data) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch (err) {}
      };

      const fetchState = async () => {
        const orders = await prisma.kitchenOrder.findMany({
          where: { 
            shopId,
            status: { in: ["pending", "preparing", "ready"] } 
          },
          include: {
            bill: { include: { table: true } },
            items: {
              select: {
                id: true,
                name: true,
                qty: true,
                completedAt: true
              }
            }
          },
          orderBy: { createdAt: "asc" }
        });

        const stats = {
          pending: orders.filter(o => o.status === "pending").length,
          preparing: orders.filter(o => o.status === "preparing").length,
          ready: orders.filter(o => o.status === "ready").length,
          avgWait: 0
        };

        const startOfToday = new Date();
        startOfToday.setHours(0,0,0,0);
        
        const readyToday = await prisma.kitchenOrder.findMany({
          where: {
            shopId,
            status: "ready",
            createdAt: { gte: startOfToday },
            preparingStartedAt: { not: null },
            readyAt: { not: null }
          },
          select: { preparingStartedAt: true, readyAt: true }
        });

        if (readyToday.length > 0) {
          const totalMs = readyToday.reduce((sum, o) => sum + (o.readyAt.getTime() - o.preparingStartedAt.getTime()), 0);
          stats.avgWait = Math.round((totalMs / readyToday.length) / 60000);
        }

        return { orders, stats };
      };

      // 1. Send initial state
      const initialState = await fetchState();
      send('initial_state', initialState);

      // 2. Heartbeat
      const heartbeat = setInterval(() => send('heartbeat', { ts: Date.now() }), 25000);

      // 3. Event Bus
      const handler = async (event) => {
        // When any order changes, we can either send just the change or the full state
        // For simplicity and to keep the KDS robust, we send the full state on any change
        const state = await fetchState();
        send('order:update', state);
      };

      eventBus.on(`shop:${shopId}`, handler);

      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        eventBus.off(`shop:${shopId}`, handler);
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
