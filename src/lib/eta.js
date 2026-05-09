import { prisma } from "./prisma";

// Default ETAs by keyword matching (used when no history exists)
function getDefaultETA(itemName) {
  const lower = itemName.toLowerCase();
  if (lower.includes('chai') || lower.includes('tea') || lower.includes('coffee')) return 3;
  if (lower.includes('dosa') || lower.includes('idli')) return 8;
  if (lower.includes('rice') || lower.includes('biryani')) return 15;
  if (lower.includes('burger') || lower.includes('sandwich')) return 10;
  if (lower.includes('juice') || lower.includes('lassi')) return 4;
  return 12; // default for unknown items
}

/**
 * ETA is calculated per-order based on the items it contains.
 * We learn from historical data: how long did past orders with similar items take?
 */
export async function calculateETA(items, shopId) {
  // Step 1: For each item, look up historical avg prep time
  const itemETAs = await Promise.all(items.map(async (item) => {
    // Note: SQLite doesn't support complex JSON path contains like PG
    // So we'll find orders for this shop and filter in memory if needed, 
    // or just use the name if we had a specific Item model.
    // Since we now have KitchenOrderItem model, we can query it!
    
    const history = await prisma.kitchenOrderItem.findMany({
      where: {
        name: item.name,
        order: {
          shopId,
          status: 'ready',
          preparingStartedAt: { not: null },
          readyAt: { not: null }
        }
      },
      include: { order: true },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    if (history.length === 0) {
      // No history → use category defaults
      return { name: item.name, minutes: getDefaultETA(item.name), confidence: 'low' };
    }

    const totalMs = history.reduce((sum, h) => {
      return sum + (new Date(h.order.readyAt).getTime() - new Date(h.order.preparingStartedAt).getTime());
    }, 0);
    
    const avgMs = totalMs / history.length;
    const minutes = Math.round(avgMs / 60000);
    const confidence = history.length >= 10 ? 'high' : history.length >= 5 ? 'medium' : 'low';
    
    // Scale by quantity (linear assumption for now)
    return { name: item.name, minutes: minutes * item.qty, confidence };
  }));

  // Step 2: Total ETA = max of all item ETAs (items cooked in parallel)
  // Add buffer: +2min for plating and delivery to table
  const maxItemMinutes = Math.max(...itemETAs.map(e => e.minutes));
  const totalMinutes = maxItemMinutes + 2;

  // Step 3: Add queue penalty if kitchen is busy
  const pendingCount = await prisma.kitchenOrder.count({
    where: { shopId, status: { in: ['pending', 'preparing'] } }
  });
  
  // +2min per 3 orders in queue
  const queuePenalty = Math.floor(pendingCount / 3) * 2; 

  return {
    estimatedMinutes: totalMinutes + queuePenalty,
    confidence: itemETAs[0]?.confidence ?? 'low',
    breakdown: itemETAs.map(e => ({ item: e.name, minutes: e.minutes }))
  };
}
