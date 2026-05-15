"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Suspense } from "react";

function StatusRedirectInner() {
  const params = useSearchParams();
  const router = useRouter();
  const orderId = params.get("order_id");

  useEffect(() => {
    if (!orderId) {
      router.replace("/");
      return;
    }
    // Cashfree return_url lands here; redirect to the pending page
    // which polls until it can determine success/failure.
    router.replace(`/payment/pending?order_id=${orderId}`);
  }, [orderId, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
    </div>
  );
}

export default function PaymentStatusPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" /></div>}>
      <StatusRedirectInner />
    </Suspense>
  );
}
