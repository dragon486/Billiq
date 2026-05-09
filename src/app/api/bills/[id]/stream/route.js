import { prisma } from "@/lib/prisma";
import { eventBus } from "@/lib/eventBus";

export const runtime = 'nodejs'; 
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { id } = await params;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event, data) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch (err) {
          // Client closed
        }
      };

      // 1. Send initial state immediately
      const bill = await prisma.bill.findUnique({
        where: { id },
        include: { kitchenOrder: true }
      });
      
      send('connected', {
        status: bill?.kitchenOrder?.status || "placed",
        estimatedMinutes: bill?.kitchenOrder?.estimatedMinutes || 15
      });

      // 2. Heartbeat to keep connection alive (every 25s)
      const heartbeat = setInterval(() => send('heartbeat', { ts: Date.now() }), 25000);

      // 3. Listen to the Event Bus for this specific bill
      const handler = (event) => {
        send('order:update', {
          status: event.status,
          estimatedMinutes: event.estimatedMinutes
        });
      };

      eventBus.on(`bill:${id}`, handler);

      // Cleanup
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        eventBus.off(`bill:${id}`, handler);
        try { controller.close(); } catch {}
      });
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    }
  });
}
