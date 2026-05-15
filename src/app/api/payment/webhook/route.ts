import { type NextRequest, NextResponse } from "next/server";
import { serverConfig } from "@/lib/config/server-config";
import {
  verifyWebhookSignature,
  extractWebhookHeaders,
  isWebhookTimestampValid,
  isWebhookPayload,
} from "@/lib/utils/webhook";
import { createLogger } from "@/lib/utils/logger";
import type { WebhookPayload } from "@/types/payment";

const logger = createLogger("webhook");

// In-memory idempotency store for duplicate webhook protection.
// In production, replace this with Redis or a database table.
const processedWebhooks = new Set<string>();

export async function POST(request: NextRequest): Promise<NextResponse> {
  let rawBody: string;

  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json(
      { error: "Failed to read request body" },
      { status: 400 },
    );
  }

  // ── Extract and validate signature headers ────────────────────────────────
  const extracted = extractWebhookHeaders(request.headers);
  if (!extracted) {
    logger.warn("Webhook missing required headers");
    return NextResponse.json(
      { error: "Missing webhook headers" },
      { status: 400 },
    );
  }

  const { timestamp, signature } = extracted;

  // ── Replay attack protection ───────────────────────────────────────────────
  if (!isWebhookTimestampValid(timestamp)) {
    logger.warn("Webhook timestamp too old", { timestamp });
    return NextResponse.json({ error: "Webhook expired" }, { status: 400 });
  }

  // ── Signature verification ─────────────────────────────────────────────────
  const isValid = verifyWebhookSignature(
    rawBody,
    timestamp,
    signature,
    serverConfig.cashfree.webhookSecret,
  );

  if (!isValid) {
    logger.warn("Invalid webhook signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isWebhookPayload(body)) {
    logger.warn("Invalid webhook payload shape");
    return NextResponse.json(
      { error: "Invalid payload structure" },
      { status: 400 },
    );
  }

  const payload = body as WebhookPayload;

  // ── Idempotency check ─────────────────────────────────────────────────────
  const idempotencyKey = `${payload.data.order.order_id}:${payload.data.payment.cf_payment_id}`;

  if (processedWebhooks.has(idempotencyKey)) {
    logger.info("Duplicate webhook ignored", { idempotencyKey });
    return NextResponse.json({ received: true });
  }

  processedWebhooks.add(idempotencyKey);

  // ── Handle event ──────────────────────────────────────────────────────────
  try {
    await handleWebhookEvent(payload);
  } catch (error) {
    // Remove from processed set so it can be retried
    processedWebhooks.delete(idempotencyKey);
    logger.error("Failed to handle webhook event", error);
    return NextResponse.json(
      { error: "Internal processing error" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}

async function handleWebhookEvent(payload: WebhookPayload): Promise<void> {
  const { type, data } = payload;
  const { order, payment } = data;

  logger.info("Processing webhook", {
    type,
    orderId: order.order_id,
    paymentId: payment.cf_payment_id,
    status: payment.payment_status,
  });

  switch (type) {
    case "PAYMENT_SUCCESS_WEBHOOK": {
      logger.info("Payment succeeded", {
        orderId: order.order_id,
        paymentId: payment.cf_payment_id,
        amount: payment.payment_amount,
        bankReference: payment.bank_reference,
      });
      // TODO: Update your database with the successful payment
      // e.g. await db.orders.update({ order_id: order.order_id }, { status: "PAID" })
      break;
    }

    case "PAYMENT_FAILED_WEBHOOK": {
      logger.warn("Payment failed", {
        orderId: order.order_id,
        paymentId: payment.cf_payment_id,
        message: payment.payment_message,
      });
      // TODO: Update order status to FAILED in your database
      break;
    }

    case "PAYMENT_USER_DROPPED_WEBHOOK": {
      logger.info("User dropped payment", {
        orderId: order.order_id,
        paymentId: payment.cf_payment_id,
      });
      // TODO: Handle dropped payment
      break;
    }

    default: {
      logger.warn("Unknown webhook type", { type });
    }
  }
}
