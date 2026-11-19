"use client";

import type { CreateOrderResponse } from "@/types/payment";

interface OrderSummaryProps {
  order: CreateOrderResponse;
}

export function OrderSummary({ order }: OrderSummaryProps) {
  return (
    <div className="border-b border-gray-100 bg-white px-4 py-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            Order Total
          </p>
          <p className="mt-0.5 text-2xl font-bold text-gray-900">
            ₹{order.order_amount.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Order ID</p>
          <p className="mt-0.5 font-mono text-xs text-gray-600">
            {order.order_id}
          </p>
        </div>
      </div>
    </div>
  );
}
