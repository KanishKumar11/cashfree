"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { usePayments } from "@/hooks/usePaymentQueries";

export default function PaymentPendingPage() {
  const params = useSearchParams();
  const router = useRouter();
  const orderId = params.get("order_id");

  // Poll every 3 seconds
  const { data: payments } = usePayments(orderId, { refetchInterval: 3_000 });

  useEffect(() => {
    if (!payments?.length) return;
    const status = payments[0].payment_status;

    if (status === "SUCCESS") {
      router.replace(`/payment/success?order_id=${orderId}`);
    } else if (status === "FAILED" || status === "USER_DROPPED") {
      router.replace(`/payment/failed?order_id=${orderId}`);
    }
  }, [payments, orderId, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm space-y-6 rounded-2xl bg-white p-8 shadow-md text-center"
      >
        {/* Spinner */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100">
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            className="text-4xl inline-block"
          >
            ⏳
          </motion.span>
        </div>

        <div className="space-y-1">
          <h1 className="text-xl font-bold text-gray-900">Payment Pending</h1>
          <p className="text-sm text-gray-500">
            We're confirming your payment. This usually takes a few seconds.
          </p>
        </div>

        <div className="rounded-xl bg-yellow-50 border border-yellow-100 p-3 text-xs text-yellow-700">
          Please do not close this page or press the back button.
        </div>

        {orderId && (
          <p className="font-mono text-xs text-gray-400">Order: {orderId}</p>
        )}
      </motion.div>
    </div>
  );
}
