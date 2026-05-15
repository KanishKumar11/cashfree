"use client";

import { useEffect, useRef } from "react";
import { usePaymentStore } from "@/store/paymentStore";
import { publicConfig } from "@/lib/config/env";
import type { CashfreeInstance } from "@/types/cashfree";

/**
 * Initialises the Cashfree SDK once and stores the instance in Zustand.
 * Must be called inside a client component that is mounted after the
 * Cashfree order is created.
 */
export function useCashfreeInit() {
  const setCashfree = usePaymentStore((s) => s.setCashfree);
  const cashfree = usePaymentStore((s) => s.cashfree);
  const initialised = useRef(false);

  useEffect(() => {
    if (initialised.current || cashfree) return;
    initialised.current = true;

    // Dynamic import avoids issues with the module's untyped exports
    import("@cashfreepayments/cashfree-js")
      .then(({ load }) => load({ mode: publicConfig.cashfree.mode }))
      .then((instance: CashfreeInstance | null) => {
        if (instance) {
          setCashfree(instance);
        }
      })
      .catch((err: unknown) => {
        console.error("[Cashfree] Failed to load SDK:", err);
      });
  }, [cashfree, setCashfree]);

  return cashfree;
}
