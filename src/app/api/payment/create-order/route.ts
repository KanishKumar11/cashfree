import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createCashfreeOrder } from "@/lib/cashfree/server";
import { generateOrderId } from "@/lib/utils/idempotency";
import { createLogger } from "@/lib/utils/logger";
import type { ApiResponse, CreateOrderResponse } from "@/types/payment";

function getAppUrl(request: NextRequest): string {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (configuredUrl) return configuredUrl;

  const forwardedProto =
    request.headers.get("x-forwarded-proto") || request.headers.get("x-forwarded-protocol");
  const host =
    request.headers.get("x-forwarded-host") || request.headers.get("host");

  if (forwardedProto && host) {
    return `${forwardedProto.replace(/\/$/, "")}://${host.replace(/\/$/, "")}`;
  }

  if (request.nextUrl?.origin) {
    return request.nextUrl.origin.replace(/\/$/, "");
  }

  if (host) {
    return `https://${host.replace(/\/$/, "")}`;
  }

  return "http://localhost:3000";
}

const logger = createLogger("create-order");

const createOrderSchema = z.object({
  order_amount: z.number().positive(),
  order_currency: z.string().default("INR"),
  customer_id: z.string().min(1),
  customer_name: z.string().min(1),
  customer_email: z.string().email(),
  customer_phone: z
    .string()
    .regex(/^\d{10}$/),
  return_url: z.string().url().optional(),
  order_tags: z.record(z.string(), z.string()).optional(),
});

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<CreateOrderResponse>>> {
  try {
    const body = await request.json();
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          message: parsed.error.issues.map((issue) => issue.message).join(", "),
        },
        { status: 400 },
      );
    }

    const {
      order_amount,
      order_currency,
      customer_id,
      customer_name,
      customer_email,
      customer_phone,
      return_url,
      order_tags,
    } = parsed.data;

    const order_id = generateOrderId();
    const appUrl = getAppUrl(request);

    logger.info("Creating order", { order_id, order_amount, customer_id, appUrl });

    const orderData = await createCashfreeOrder({
      order_id,
      order_amount,
      order_currency,
      customer_details: {
        customer_id,
        customer_name,
        customer_email,
        customer_phone,
      },
      order_meta: {
        return_url:
          return_url ?? `${appUrl}/payment/status?order_id={order_id}`,
        notify_url: `${appUrl}/api/payment/webhook`,
      },
      ...(order_tags && { order_tags }),
    });

    logger.info("Order created", {
      order_id: orderData.order_id,
      cf_order_id: orderData.cf_order_id,
    });

    return NextResponse.json(
      { success: true, data: orderData },
      { status: 201 },
    );
  } catch (error) {
    logger.error("Failed to create order", error);

    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as {
        response: { data: unknown; status: number };
      };
      logger.error("Cashfree API error", axiosError.response.data);
      return NextResponse.json(
        {
          success: false,
          error: "Payment provider error",
          message: "Failed to create order with payment provider",
        },
        { status: axiosError.response.status },
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
