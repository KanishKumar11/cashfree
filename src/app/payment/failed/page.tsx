"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useOrderStatus, usePayments } from "@/hooks/usePaymentQueries";

export default function PaymentFailedPage() {
  const params = useSearchParams();
  const orderId = params.get("order_id");

  const { data: order } = useOrderStatus(orderId);
  const { data: payments } = usePayments(orderId);

  const payment = payments?.[0];
  const errorReason =
    payment?.error_details?.error_description ??
    "Your payment could not be processed.";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 15 }}
        className="w-full max-w-sm space-y-6 rounded-2xl bg-white p-8 shadow-md text-center"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100"
        >
          <span className="text-4xl">❌</span>
        </motion.div>

        <div className="space-y-1">
          <h1 className="text-xl font-bold text-gray-900">Payment Failed</h1>
          <p className="text-sm text-gray-500">{errorReason}</p>
        </div>

        {order && (
          <div className="rounded-xl bg-gray-50 p-4 text-left space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Amount</span>
              <span className="text-xs font-medium text-gray-800">
                ₹{order.order_amount.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Order ID</span>
              <span className="font-mono text-xs text-gray-800">
                {order.order_id}
              </span>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {orderId && (
            <Link
              href={`/checkout?order_id=${orderId}`}
              className="block w-full rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
            >
              Try Again
            </Link>
          )}
          <Link
            href="/"
            className="block w-full rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Go Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
