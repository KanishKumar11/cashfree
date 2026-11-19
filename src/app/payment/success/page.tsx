"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useOrderStatus, usePayments } from "@/hooks/usePaymentQueries";

export default function PaymentSuccessPage() {
  const params = useSearchParams();
  const orderId = params.get("order_id");

  const { data: order } = useOrderStatus(orderId);
  const { data: payments } = usePayments(orderId);

  const payment = payments?.[0];

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
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100"
        >
          <span className="text-4xl">✅</span>
        </motion.div>

        <div className="space-y-1">
          <h1 className="text-xl font-bold text-gray-900">
            Payment Successful!
          </h1>
          <p className="text-sm text-gray-500">
            Your payment has been confirmed.
          </p>
        </div>

        {/* Details */}
        {order && (
          <div className="rounded-xl bg-gray-50 p-4 text-left space-y-2">
            <DetailRow
              label="Amount Paid"
              value={`₹${order.order_amount.toLocaleString("en-IN")}`}
            />
            <DetailRow label="Order ID" value={order.order_id} mono />
            {payment && (
              <>
                <DetailRow
                  label="Payment ID"
                  value={String(payment.cf_payment_id)}
                  mono
                />
                {payment.bank_reference && (
                  <DetailRow
                    label="Bank Reference"
                    value={payment.bank_reference}
                    mono
                  />
                )}
              </>
            )}
          </div>
        )}

        <Link
          href="/"
          className="block w-full rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
        >
          Continue Shopping
        </Link>
      </motion.div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-gray-500 shrink-0">{label}</span>
      <span
        className={`text-xs font-medium text-gray-800 truncate ${mono ? "font-mono" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
