import { type NextRequest, NextResponse } from "next/server";
import { getCashfreeOrder } from "@/lib/cashfree/server";
import { createLogger } from "@/lib/utils/logger";
import type { ApiResponse, CreateOrderResponse } from "@/types/payment";

const logger = createLogger("order-status");

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
): Promise<NextResponse<ApiResponse<CreateOrderResponse>>> {
  try {
    const { orderId } = await params;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "orderId is required" },
        { status: 400 },
      );
    }

    logger.info("Fetching order status", { orderId });
    const order = await getCashfreeOrder(orderId);

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    logger.error("Failed to fetch order status", error);

    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as {
        response: { data: unknown; status: number };
      };
      if (axiosError.response.status === 404) {
        return NextResponse.json(
          { success: false, error: "Order not found" },
          { status: 404 },
        );
      }
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
