"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { usePaymentStore } from "@/store/paymentStore";
import { usePaymentPolling } from "@/hooks/usePaymentPolling";
import { debugJSON } from "@/lib/toErrMsg";
import type { CashfreeElement } from "@/types/cashfree";

export function CardSection() {
  const router = useRouter();
  const { cashfree, order, setLoading, setError, isLoading } =
    usePaymentStore();

  const [cardHolder, setCardHolder] = useState("");
  const [saveCard, setSaveCard] = useState(false);
  const [cardReady, setCardReady] = useState({
    number: false,
    expiry: false,
    cvv: false,
  });

  const cardNumberRef = useRef<CashfreeElement | null>(null);
  const cardExpiryRef = useRef<CashfreeElement | null>(null);
  const cardCvvRef = useRef<CashfreeElement | null>(null);
  const mounted = useRef(false);

  const { startPolling } = usePaymentPolling({
    onSuccess: (id) => router.push(`/payment/success?order_id=${id}`),
    onFailed: (id) => router.push(`/payment/failed?order_id=${id}`),
    onTimeout: () =>
      router.push(`/payment/pending?order_id=${order?.order_id}`),
  });

  // Mount Cashfree secure card elements
  useEffect(() => {
    if (!cashfree || mounted.current) return;
    mounted.current = true;

    const numberEl = cashfree.create("cardNumber", {
      placeholder: "Card number",
      style: {
        base: { color: "#111827", fontSize: "14px" },
        placeholder: { color: "#9ca3af" },
      },
    });
    numberEl.mount("#cf-card-number");
    numberEl.on("change", (e) =>
      setCardReady((prev) => ({ ...prev, number: !!e.complete && !e.error })),
    );
    cardNumberRef.current = numberEl;

    const expiryEl = cashfree.create("cardExpiry", {
      placeholder: "MM / YY",
      style: {
        base: { color: "#111827", fontSize: "14px" },
        placeholder: { color: "#9ca3af" },
      },
    });
    expiryEl.mount("#cf-card-expiry");
    expiryEl.on("change", (e) =>
      setCardReady((prev) => ({ ...prev, expiry: !!e.complete && !e.error })),
    );
    cardExpiryRef.current = expiryEl;

    const cvvEl = cashfree.create("cardCvv", {
      placeholder: "CVV",
      style: {
        base: { color: "#111827", fontSize: "14px" },
        placeholder: { color: "#9ca3af" },
      },
    });
    cvvEl.mount("#cf-card-cvv");
    cvvEl.on("change", (e) =>
      setCardReady((prev) => ({ ...prev, cvv: !!e.complete && !e.error })),
    );
    cardCvvRef.current = cvvEl;

    return () => {
      cardNumberRef.current?.unmount();
      cardExpiryRef.current?.unmount();
      cardCvvRef.current?.unmount();
      mounted.current = false;
    };
  }, [cashfree]);

  const canSubmit =
    cardReady.number &&
    cardReady.expiry &&
    cardReady.cvv &&
    cardHolder.trim().length >= 2;

  async function handleCardPay(e: React.FormEvent) {
    e.preventDefault();
    if (!cashfree || !order || !canSubmit || !cardNumberRef.current) return;
    setLoading(true);
    setError(null);

    try {
      // cardNumber element is the "paying" element — it has isPayable: true
      // and declares cardCvv/cardExpiry as paymentDependencies which the SDK
      // reads automatically from the other mounted elements.
      const result = await cashfree.pay({
        paymentSessionId: order.payment_session_id,
        paymentMethod: cardNumberRef.current,
      });

      if (result?.error) {
        setError(debugJSON(result.error));
        setLoading(false);
        return;
      }

      // OTP flow: Cashfree handles the redirect; after return, poll for status
      if (result?.redirect) {
        return; // page will navigate via return_url
      }

      startPolling();
    } catch {
      setError("Card payment failed. Please check your details and try again.");
      setLoading(false);
    }
  }

  if (!cashfree) {
    return (
      <div className="p-4 space-y-3">
        <CardSkeleton />
      </div>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4 p-4"
      onSubmit={handleCardPay}
    >
      {/* Card Holder */}
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-600">
          Card Holder Name
        </label>
        <input
          type="text"
          value={cardHolder}
          onChange={(e) => setCardHolder(e.target.value)}
          placeholder="Name on card"
          autoComplete="cc-name"
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
        />
      </div>

      {/* Card Number — Cashfree Secure Element */}
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-600">
          Card Number
        </label>
        <div
          id="cf-card-number"
          className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
        />
      </div>

      {/* Expiry + CVV row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-600">
            Expiry
          </label>
          <div
            id="cf-card-expiry"
            className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-600">CVV</label>
          <div
            id="cf-card-cvv"
            className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
          />
        </div>
      </div>

      {/* Save card */}
      <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
        <input
          type="checkbox"
          checked={saveCard}
          onChange={(e) => setSaveCard(e.target.checked)}
          className="h-4 w-4 rounded accent-orange-500"
        />
        Save card for faster checkout
      </label>

      <button
        type="submit"
        disabled={isLoading || !canSubmit}
        className="w-full rounded-xl bg-orange-500 py-3.5 text-sm font-semibold text-white transition hover:bg-orange-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? "Processing…" : `Pay ₹${order?.order_amount ?? ""}`}
      </button>
    </motion.form>
  );
}

function CardSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-10 rounded-lg bg-gray-100" />
      ))}
    </div>
  );
}
