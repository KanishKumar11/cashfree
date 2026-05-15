"use client";

import { motion } from "framer-motion";
import { usePaymentStore } from "@/store/paymentStore";
import type { ActivePaymentMethod } from "@/types/payment";

const tabs: { id: ActivePaymentMethod; label: string; icon: string }[] = [
  { id: "upi", label: "UPI", icon: "📱" },
  { id: "card", label: "Cards", icon: "💳" },
  { id: "netbanking", label: "Net Banking", icon: "🏦" },
  { id: "wallet", label: "Wallets", icon: "👛" },
  { id: "saved", label: "Saved", icon: "⭐" },
];

export function PaymentMethodTabs() {
  const { activeMethod, setActiveMethod } = usePaymentStore();

  return (
    <div className="flex overflow-x-auto border-b border-gray-100 bg-white scrollbar-hide">
      {tabs.map((tab) => {
        const isActive = activeMethod === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveMethod(tab.id)}
            className="relative flex flex-col items-center gap-0.5 px-4 py-3 text-xs font-medium whitespace-nowrap transition-colors"
          >
            <span className="text-base">{tab.icon}</span>
            <span className={isActive ? "text-orange-500" : "text-gray-500"}>
              {tab.label}
            </span>
            {isActive && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
