"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createOrder } from "@/lib/api/payment";

/**
 * Demo page — simulates initiating a payment from your app.
 * In production this would live inside your order confirmation flow.
 */
export default function DemoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStartPayment() {
    setLoading(true);
    setError(null);

    try {
      const order = await createOrder({
        order_amount: 99,
        order_currency: "INR",
        customer_id: "demo_user_001",
        customer_name: "Demo User",
        customer_email: "demo@example.com",
        customer_phone: "9999999999",
      });

      router.push(`/checkout?order_id=${order.order_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create order");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-6 rounded-2xl bg-white p-8 shadow-md text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Cashfree Demo</h1>
          <p className="text-sm text-gray-500">
            Click below to initiate a ₹99 test payment
          </p>
        </div>

        <div className="rounded-xl bg-orange-50 border border-orange-100 p-4">
          <p className="text-2xl font-bold text-orange-600">₹99</p>
          <p className="text-xs text-gray-500 mt-1">Test Order</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-100 px-3 py-2.5 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleStartPayment}
          disabled={loading}
          className="w-full rounded-xl bg-orange-500 py-3.5 text-sm font-semibold text-white transition hover:bg-orange-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Creating order…" : "Pay ₹99"}
        </button>

        <p className="text-xs text-gray-400">
          Sandbox mode — no real money charged
        </p>
      </div>
    </div>
  );
}
