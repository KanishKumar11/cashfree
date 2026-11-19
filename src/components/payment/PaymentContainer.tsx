"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePaymentStore } from "@/store/paymentStore";
import { PaymentMethodTabs } from "./PaymentMethodTabs";
import { UPISection } from "./UPISection";
import { CardSection } from "./CardSection";
import { NetBankingSection } from "./NetBankingSection";
import { WalletsSection } from "./WalletsSection";
import { SavedCardsSection } from "./SavedCardsSection";
import { OrderSummary } from "./OrderSummary";
import { useCashfreeInit } from "@/hooks/useCashfreeInit";
import type { SavedCard } from "@/types/payment";

interface PaymentContainerProps {
  savedCards?: SavedCard[];
}

export function PaymentContainer({ savedCards = [] }: PaymentContainerProps) {
  const { order, activeMethod, errorMessage, isLoading, isPolling } =
    usePaymentStore();

  // Initialise Cashfree SDK
  useCashfreeInit();

  if (!order) {
    return <PaymentContainerSkeleton />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <div className="flex items-center gap-3 bg-white px-4 py-3.5 shadow-sm">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white text-sm font-bold">
          P
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">Secure Payment</p>
          <p className="text-xs text-gray-400">256-bit SSL encrypted</p>
        </div>
        <span className="ml-auto text-xs text-green-600">🔒 Secure</span>
      </div>

      {/* Order Summary */}
      <OrderSummary order={order} />

      {/* Payment Methods */}
      <div className="flex-1 bg-white">
        <PaymentMethodTabs />

        {/* Error Banner */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mx-4 mt-3 flex items-start gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2.5 text-sm text-red-700"
            >
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Polling indicator */}
        {isPolling && (
          <div className="mx-4 mt-3 flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2.5 text-sm text-blue-700">
            <span className="animate-spin">⟳</span>
            Verifying your payment…
          </div>
        )}

        {/* Global loading overlay */}
        {isLoading && !isPolling && (
          <div className="mx-4 mt-3 flex items-center gap-2 rounded-lg bg-orange-50 border border-orange-100 px-3 py-2.5 text-sm text-orange-700">
            <span className="animate-pulse">●</span>
            Processing…
          </div>
        )}

        {/* Section content */}
        <AnimatePresence mode="wait">
          {activeMethod === "upi" && (
            <motion.div
              key="upi"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              <UPISection />
            </motion.div>
          )}

          {activeMethod === "card" && (
            <motion.div
              key="card"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              <CardSection />
            </motion.div>
          )}

          {activeMethod === "netbanking" && (
            <motion.div
              key="nb"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              <NetBankingSection />
            </motion.div>
          )}

          {activeMethod === "wallet" && (
            <motion.div
              key="wallet"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              <WalletsSection />
            </motion.div>
          )}

          {activeMethod === "saved" && (
            <motion.div
              key="saved"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              <SavedCardsSection cards={savedCards} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-100 px-4 py-3 text-center">
        <p className="text-xs text-gray-400">
          Powered by{" "}
          <span className="font-semibold text-gray-600">Cashfree Payments</span>
        </p>
      </div>
    </div>
  );
}

function PaymentContainerSkeleton() {
  return (
    <div className="flex min-h-screen flex-col animate-pulse bg-gray-50">
      <div className="h-14 bg-white shadow-sm" />
      <div className="h-20 bg-white border-b border-gray-100" />
      <div className="flex-1 bg-white">
        <div className="h-12 bg-gray-100" />
        <div className="space-y-3 p-4">
          <div className="h-12 rounded-xl bg-gray-100" />
          <div className="h-12 rounded-xl bg-gray-100" />
          <div className="h-12 rounded-xl bg-gray-100" />
        </div>
      </div>
    </div>
  );
}
