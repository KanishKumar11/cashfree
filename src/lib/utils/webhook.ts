import crypto from "crypto";
import type { WebhookPayload } from "@/types/payment";

/**
 * Verifies the Cashfree webhook signature.
 * Cashfree signs webhooks using HMAC-SHA256.
 *
 * Algorithm:
 *   signature = HMAC-SHA256(timestamp + rawBody, webhookSecret)
 *   encoded   = base64(signature)
 */
export function verifyWebhookSignature(
  rawBody: string,
  timestamp: string,
  signature: string,
  secret: string,
): boolean {
  if (!secret) {
    console.warn("[webhook] CASHFREE_WEBHOOK_SECRET not set — skipping verification");
    return false;
  }

  try {
    const payload = timestamp + rawBody;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("base64");

    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signature),
    );
  } catch {
    return false;
  }
}

/**
 * Extracts and validates webhook headers from a NextRequest.
 * Returns null if required headers are missing.
 */
export function extractWebhookHeaders(headers: Headers): {
  timestamp: string;
  signature: string;
} | null {
  const timestamp = headers.get("x-webhook-timestamp");
  const signature = headers.get("x-webhook-signature");

  if (!timestamp || !signature) {
    return null;
  }

  return { timestamp, signature };
}

/**
 * Validates that a webhook timestamp is recent (within 5 minutes).
 * Prevents replay attacks.
 */
export function isWebhookTimestampValid(timestamp: string): boolean {
  const webhookTime = Number.parseInt(timestamp, 10) * 1000; // convert to ms
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;

  return Math.abs(now - webhookTime) < fiveMinutes;
}

/**
 * Type guard: checks if a parsed JSON body is a valid WebhookPayload.
 */
export function isWebhookPayload(body: unknown): body is WebhookPayload {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.type === "string" &&
    typeof b.event_time === "string" &&
    b.data !== null &&
    typeof b.data === "object"
  );
}
