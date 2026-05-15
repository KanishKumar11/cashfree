"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import axios from "axios";
import { usePaymentStore } from "@/store/paymentStore";
import { usePaymentPolling } from "@/hooks/usePaymentPolling";
import type { SavedCard } from "@/types/payment";

interface SavedCardsProps {
  cards: SavedCard[];
}

export function SavedCardsSection({ cards }: SavedCardsProps) {
  const router = useRouter();
  const { order, setLoading, setError, isLoading } = usePaymentStore();

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [cvv, setCvv] = useState("");

  const { startPolling } = usePaymentPolling({
    onSuccess: (id) => router.push(`/payment/success?order_id=${id}`),
    onFailed: (id) => router.push(`/payment/failed?order_id=${id}`),
    onTimeout: () =>
      router.push(`/payment/pending?order_id=${order?.order_id}`),
  });

  async function handleSavedCardPay(e: React.FormEvent) {
    e.preventDefault();
    if (!order || !selectedCardId || !cvv) return;
    setLoading(true);
    setError(null);

    try {
      // Saved cards have no Cashfree JS element. Submit server-side via our
      // proxy route which calls POST /pg/orders/sessions with instrument_id.
      const { data } = await axios.post<{
        success: boolean;
        error?: string;
        data?: { payment?: { payment_status?: string } };
      }>("/api/payment/submit", {
        payment_session_id: order.payment_session_id,
        instrument_id: selectedCardId,
        card_cvv: cvv,
      });

      if (!data.success) {
        setError(data.error ?? "Payment failed.");
        setLoading(false);
        return;
      }

      startPolling();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.error ?? "Payment failed. Please try again.",
        );
      } else {
        setError("Payment failed. Please try again.");
      }
      setLoading(false);
    }
  }

  if (!cards.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
        <span className="text-4xl">💳</span>
        <p className="text-sm text-gray-500">No saved cards found.</p>
      </div>
    );
  }

  return (
    <form className="space-y-4 p-4" onSubmit={handleSavedCardPay}>
      {cards.map((card, idx) => (
        <motion.button
          key={card.instrument_id}
          type="button"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.07 }}
          onClick={() => {
            setSelectedCardId(card.instrument_id);
            setCvv("");
          }}
          className={`w-full rounded-xl border p-4 text-left transition ${
            selectedCardId === card.instrument_id
              ? "border-orange-400 bg-orange-50"
              : "border-gray-100 bg-white hover:border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {card.card_bank_name} •••• {card.card_number.slice(-4)}
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                {card.card_type} • Expires {card.card_expiry_mm}/
                {card.card_expiry_yy}
              </p>
            </div>
            <span className="text-xs font-medium text-gray-400">
              {card.card_network}
            </span>
          </div>
        </motion.button>
      ))}

      {selectedCardId && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="space-y-3"
        >
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">
              Enter CVV for selected card
            </label>
            <input
              type="password"
              maxLength={4}
              value={cvv}
              onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))}
              placeholder="CVV"
              autoComplete="cc-csc"
              className="w-32 rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !cvv || cvv.length < 3}
            className="w-full rounded-xl bg-orange-500 py-3.5 text-sm font-semibold text-white transition hover:bg-orange-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Processing…" : `Pay ₹${order?.order_amount ?? ""}`}
          </button>
        </motion.div>
      )}
    </form>
  );
}
