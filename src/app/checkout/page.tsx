"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { PaymentContainer } from "@/components/payment/PaymentContainer";
import { usePaymentStore } from "@/store/paymentStore";
import { useOrderStatus } from "@/hooks/usePaymentQueries";

/**
 * /checkout?order_id=...
 *
 * The checkout page expects an order_id query param created by your backend
 * (e.g. from your cart / order confirmation flow).
 * It fetches the full order details and renders the payment UI.
 */
export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const setOrder = usePaymentStore((s) => s.setOrder);

  const { data: orderData, isLoading, error } = useOrderStatus(orderId);

  useEffect(() => {
    if (orderData) {
      setOrder(orderData);
    }
  }, [orderData, setOrder]);

  if (!orderId) {
    return (
      <ErrorState message="No order ID provided. Please go back and try again." />
    );
  }

  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !orderData) {
    return (
      <ErrorState message="Could not load order details. The order may have expired." />
    );
  }

  if (orderData.order_status === "PAID") {
    return <ErrorState message="This order has already been paid." />;
  }

  if (orderData.order_status === "EXPIRED") {
    return (
      <ErrorState message="This order has expired. Please create a new order." />
    );
  }

  return <PaymentContainer />;
}

function LoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center space-y-3">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
        <p className="text-sm text-gray-500">Loading payment details…</p>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="max-w-sm text-center space-y-4">
        <span className="text-5xl">⚠️</span>
        <p className="text-sm text-gray-600">{message}</p>
        <a
          href="/"
          className="inline-block rounded-xl bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white"
        >
          Go Home
        </a>
      </div>
    </div>
  );
}
