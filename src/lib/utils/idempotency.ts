import { v4 as uuidv4 } from "uuid";

/**
 * Generates a unique idempotency key for a payment order.
 * Format: order_{timestamp}_{uuid_fragment}
 */
export function generateOrderId(): string {
  const timestamp = Date.now();
  const fragment = uuidv4().replace(/-/g, "").slice(0, 8);
  return `order_${timestamp}_${fragment}`;
}

/**
 * Generates a unique customer ID.
 */
export function generateCustomerId(): string {
  return `cust_${uuidv4().replace(/-/g, "").slice(0, 12)}`;
}
