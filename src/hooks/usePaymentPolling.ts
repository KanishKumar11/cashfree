"use client";

import { useEffect, useRef, useCallback } from "react";
import { fetchPayments } from "@/lib/api/payment";
import { usePaymentStore } from "@/store/paymentStore";
import { debugJSON } from "@/lib/toErrMsg";

const POLL_INTERVAL_MS = 2_000;
const POLL_TIMEOUT_MS = 120_000; // 2 minutes

interface UsePaymentPollingOptions {
  onSuccess?: (orderId: string) => void;
  onFailed?: (orderId: string) => void;
  onTimeout?: () => void;
}

/**
 * Polls /api/payment/payments/[orderId] every 2 seconds until the payment
 * reaches a terminal state (SUCCESS | FAILED) or times out.
 */
export function usePaymentPolling(options?: UsePaymentPollingOptions) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    order,
    isPolling,
    setPolling,
    setPaymentStatus,
    setPaymentDetails,
    setError,
  } = usePaymentStore();

  const stopPolling = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    intervalRef.current = null;
    timeoutRef.current = null;
    setPolling(false);
  }, [setPolling]);

  const startPolling = useCallback(() => {
    if (!order?.order_id) return;
    if (isPolling) return;

    setPolling(true);

    // Hard timeout
    timeoutRef.current = setTimeout(() => {
      stopPolling();
      setError("Payment verification timed out. Please check your payment status.");
      options?.onTimeout?.();
    }, POLL_TIMEOUT_MS);

    intervalRef.current = setInterval(async () => {
      try {
        const payments = await fetchPayments(order.order_id);

        if (!payments.length) return;

        // Pick the most recent payment
        const latest = payments[0];

        const status = latest.payment_status;

        if (status === "SUCCESS") {
          stopPolling();
          setPaymentStatus("SUCCESS");
          setPaymentDetails(latest);
          options?.onSuccess?.(order.order_id);
        } else if (status === "FAILED" || status === "USER_DROPPED") {
          stopPolling();
          setPaymentStatus(status);
          setPaymentDetails(latest);
          setError(debugJSON(latest.error_details) ?? "Payment failed. Please try again.");
          options?.onFailed?.(order.order_id);
        }
        // PENDING: keep polling
      } catch (err) {
        console.error("[polling] fetch error:", err);
        // Don't stop polling on transient network errors
      }
    }, POLL_INTERVAL_MS);
  }, [order, isPolling, setPolling, setPaymentStatus, setPaymentDetails, setError, stopPolling, options]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  return { startPolling, stopPolling, isPolling };
}
