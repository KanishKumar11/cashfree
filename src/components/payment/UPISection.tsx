"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { usePaymentStore } from "@/store/paymentStore";
import { usePaymentPolling } from "@/hooks/usePaymentPolling";
import type { CashfreeElement } from "@/types/cashfree";
import { debugJSON } from "@/lib/toErrMsg";

interface UPIApp {
  id: string;
  name: string;
  bgColor: string;
  textColor: string;
  logo: string;
}

const UPI_APPS: UPIApp[] = [
  {
    id: "gpay",
    name: "Google Pay",
    bgColor: "bg-white",
    textColor: "text-gray-800",
    logo: "G",
  },
  {
    id: "phonepe",
    name: "PhonePe",
    bgColor: "bg-[#5F259F]",
    textColor: "text-white",
    logo: "Ph",
  },
  {
    id: "paytm",
    name: "Paytm",
    bgColor: "bg-[#00BAF2]",
    textColor: "text-white",
    logo: "PT",
  },
  {
    id: "bhim",
    name: "BHIM",
    bgColor: "bg-[#00529C]",
    textColor: "text-white",
    logo: "B",
  },
];

export function UPISection() {
  const router = useRouter();
  const { cashfree, order, setLoading, setError, isLoading } =
    usePaymentStore();

  const [showQR, setShowQR] = useState(false);
  const [collectReady, setCollectReady] = useState(false);

  const upiQrEl = useRef<CashfreeElement | null>(null);
  const upiCollectEl = useRef<CashfreeElement | null>(null);
  const activeUpiAppEl = useRef<CashfreeElement | null>(null);
  const collectInitialized = useRef(false);

  const { startPolling } = usePaymentPolling({
    onSuccess: (orderId) => router.push(`/payment/success?order_id=${orderId}`),
    onFailed: (orderId) => router.push(`/payment/failed?order_id=${orderId}`),
    onTimeout: () =>
      router.push(`/payment/pending?order_id=${order?.order_id}`),
  });

  // Pre-mount only upiCollect — it needs to be visible for the user to type.
  // upiQr and upiApp are created on-demand.
  useEffect(() => {
    if (!cashfree || !order || collectInitialized.current) return;
    collectInitialized.current = true;

    const collectEl = cashfree.create("upiCollect", {
      values: { placeholder: "yourname@upi" },
    });
    collectEl.on("change", (e) => setCollectReady(!!e.complete && !e.error));
    collectEl.mount("#upi-collect-frame");
    upiCollectEl.current = collectEl;

    return () => {
      upiCollectEl.current?.unmount();
      upiQrEl.current?.unmount();
      activeUpiAppEl.current?.unmount();
      upiCollectEl.current = null;
      upiQrEl.current = null;
      activeUpiAppEl.current = null;
      collectInitialized.current = false;
    };
  }, [cashfree, order]);

  // Wait for the SDK iframe to become ready (fires after inject handshake) or
  // fail. Must be called BEFORE mount() so no events are missed.
  //
  // SDK internals (from reading cashfree.js + Atom.lib.js source):
  //  - complete=false, ready=false at creation; pay() rejects if either is false
  //  - upiQr: inject fires complete → then ready fires (both happen before pay())
  //  - upiApp on mobile: inject succeeds → complete → ready
  //  - upiApp on desktop: inject rejects with "only mobile" → loaderror fires ~1 s later
  function waitForElement(el: CashfreeElement, ms = 15000): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error("Payment element took too long to load.")),
        ms,
      );
      el.on("ready", () => {
        clearTimeout(timer);
        resolve();
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      el.on("loaderror", (e: any) => {
        clearTimeout(timer);

        const rawString =
          typeof e?.message?.message === "string"
            ? e.message.message
            : typeof e?.message === "string"
              ? e.message
              : typeof e?.error?.message === "string"
                ? e.error.message
                : undefined;

        const isMobileOnly =
          typeof rawString === "string" &&
          rawString.toLowerCase().includes("mobile");

        const fallback = "Payment element failed to load.";
        const resolvedMessage = rawString || debugJSON(e);
        reject(
          new Error(
            isMobileOnly
              ? "UPI App payments only work on mobile devices."
              : resolvedMessage || fallback,
          ),
        );
      });
    });
  }

  async function handleUPIIntent(appId: string) {
    if (!cashfree || !order) return;
    setLoading(true);
    setError(null);

    activeUpiAppEl.current?.unmount();
    activeUpiAppEl.current = null;

    const el = cashfree.create("upiApp", { values: { upiApp: appId } });
    activeUpiAppEl.current = el;

    const mountNode = document.getElementById("upi-app-hidden");
    if (!mountNode) {
      setError(
        "Unable to initialize UPI app payment. Please refresh and try again.",
      );
      setLoading(false);
      return;
    }

    // Register ready/loaderror listeners BEFORE mount so we don't miss events.
    const elementReady = waitForElement(el);
    el.mount(mountNode);

    try {
      await elementReady;
      const result = await cashfree.pay({
        paymentSessionId: order.payment_session_id,
        paymentMethod: el,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resultErr = (result as any)?.error;
      if (resultErr) {
        setError(debugJSON(resultErr));
        setLoading(false);
        return;
      }
      startPolling();
    } catch (err: unknown) {
      const e = err as any;
      setError(debugJSON(e?.error ?? err) ?? "Failed to initiate UPI payment.");
      setLoading(false);
    }
  }

  async function handleQRPay() {
    if (!cashfree || !order) return;
    setLoading(true);
    setError(null);

    upiQrEl.current?.unmount();
    upiQrEl.current = null;

    // flushSync: React must commit #upi-qr-frame to the DOM synchronously
    // before mount() is called, otherwise document.querySelector("#upi-qr-frame")
    // returns null inside the SDK and mount() fires loaderror immediately.
    flushSync(() => setShowQR(true));

    // size MUST include CSS units — the atom sets `element.style.height = size`
    // which is ignored without units, leaving clientHeight at ~19 px, which the
    // SDK then uses as the iframe height in the ready event.
    const qrEl = cashfree.create("upiQr", { values: { size: "220px" } });
    upiQrEl.current = qrEl;

    // Register listeners BEFORE mount.
    const elementReady = waitForElement(qrEl);
    qrEl.mount("#upi-qr-frame");

    try {
      await elementReady;
      const result = await cashfree.pay({
        paymentSessionId: order.payment_session_id,
        paymentMethod: qrEl,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resultErr = (result as any)?.error;
      if (resultErr) {
        setError(debugJSON(resultErr));
        setLoading(false);
        return;
      }
      startPolling();
    } catch (err: unknown) {
      const e = err as any;
      setError(debugJSON(e?.error ?? err) ?? "Failed to generate QR code.");
      setLoading(false);
    }
  }

  async function handleCollect() {
    if (!cashfree || !order || !upiCollectEl.current) return;
    setLoading(true);
    setError(null);

    try {
      const result = await cashfree.pay({
        paymentSessionId: order.payment_session_id,
        paymentMethod: upiCollectEl.current,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resultErr = (result as any)?.error;
      if (resultErr) {
        setError(debugJSON(resultErr));
        setLoading(false);
        return;
      }
      startPolling();
    } catch (err: unknown) {
      const e = err as any;
      setError(
        debugJSON(e?.error ?? err) ?? "Failed to initiate UPI collect request.",
      );
      setLoading(false);
    }
  }

  return (
    <div className="p-4 space-y-4">
      {/* Off-screen container for on-demand upiApp elements */}
      <div
        id="upi-app-hidden"
        aria-hidden="true"
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          width: 220,
          height: 80,
          opacity: 0,
          pointerEvents: "none",
          overflow: "hidden",
          zIndex: -1,
        }}
      />

      <h3 className="text-sm font-semibold text-gray-700">Pay with UPI App</h3>

      <div className="grid grid-cols-2 gap-3">
        {UPI_APPS.map((app, idx) => (
          <motion.button
            key={app.id}
            type="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06 }}
            onClick={() => handleUPIIntent(app.id)}
            disabled={isLoading || !cashfree}
            className={`${app.bgColor} ${app.textColor} flex items-center gap-3 rounded-xl border border-gray-100 px-4 py-3.5 text-sm font-semibold shadow-sm transition hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
              {app.logo}
            </span>
            {app.name}
          </motion.button>
        ))}
      </div>

      {/* QR Code section.
          #upi-qr-frame only enters the DOM when showQR=true (via flushSync),
          so the element always mounts into a correctly-sized 220×220 container. */}
      <div className="border-t border-gray-100 pt-4">
        {showQR ? (
          <div
            id="upi-qr-frame"
            className="mx-auto"
            style={{ width: 220, height: 220, minHeight: 220 }}
          />
        ) : (
          <button
            type="button"
            onClick={handleQRPay}
            disabled={isLoading || !cashfree}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 py-3 text-sm text-gray-500 transition hover:border-orange-400 hover:text-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="text-lg">📷</span>
            Show QR Code
          </button>
        )}
      </div>

      {/* UPI Collect — cashfree.create("upiCollect") renders an iframe input */}
      <div className="border-t border-gray-100 pt-4">
        <p className="mb-2 text-xs text-gray-500">Or enter UPI ID manually</p>
        <div className="flex items-center gap-2">
          <div
            id="upi-collect-frame"
            className="flex-1 rounded-lg border border-gray-200 overflow-hidden"
            style={{ minHeight: 44 }}
          />
          <button
            type="button"
            onClick={handleCollect}
            disabled={isLoading || !cashfree || !collectReady}
            className="rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Pay
          </button>
        </div>
      </div>
    </div>
  );
}
