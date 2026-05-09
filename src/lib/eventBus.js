import { EventEmitter } from 'events';

// Singleton EventEmitter - survives hot reloads in development
// Global type safety for the event bus
if (!global.__billiqEventBus) {
  global.__billiqEventBus = new EventEmitter();
  global.__billiqEventBus.setMaxListeners(500); // Support many concurrent SSE clients
}

export const eventBus = global.__billiqEventBus;

/**
 * Emits an order status update to both the shop channel (KDS) 
 * and the specific bill channel (Customer View).
 */
export function emitOrderEvent(event) {
  // Event structure: { type, billId, orderId, shopId, status, estimatedMinutes, updatedAt }
  
  // Emit on shop channel (KDS listens here for real-time column updates)
  eventBus.emit(`shop:${event.shopId}`, event);
  
  // Emit on bill channel (individual customer bill page listens here)
  eventBus.emit(`bill:${event.billId}`, event);
  
  console.log(`[EVENT_BUS] Emitted order update for bill ${event.billId}: ${event.status}`);
}
