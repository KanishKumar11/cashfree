"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { usePaymentStore } from "@/store/paymentStore";
import { usePaymentPolling } from "@/hooks/usePaymentPolling";
import { debugJSON } from "@/lib/toErrMsg";

interface WalletOption {
  id: string;
  name: string;
  provider: string;
  color: string;
  logo: string;
}

const WALLETS: WalletOption[] = [
  {
    id: "paytm",
    name: "Paytm Wallet",
    provider: "paytm",
    color: "bg-sky-50 border-sky-200",
    logo: "PT",
  },
  {
    id: "mobikwik",
    name: "MobiKwik",
    provider: "mobikwik",
    color: "bg-indigo-50 border-indigo-200",
    logo: "MK",
  },
  {
    id: "freecharge",
    name: "Freecharge",
    provider: "freecharge",
    color: "bg-orange-50 border-orange-200",
    logo: "FC",
  },
  {
    id: "amazon",
    name: "Amazon Pay",
    provider: "amazon",
    color: "bg-yellow-50 border-yellow-200",
    logo: "AP",
  },
  {
    id: "jio",
    name: "JioMoney",
    provider: "jio",
    color: "bg-blue-50 border-blue-200",
    logo: "JM",
  },
  {
    id: "airtel",
    name: "Airtel Money",
    provider: "airtel",
    color: "bg-red-50 border-red-200",
    logo: "AM",
  },
];

export function WalletsSection() {
  const router = useRouter();
  const {
    cashfree,
    order,
    selectedWallet,
    setSelectedWallet,
    setLoading,
    setError,
    isLoading,
  } = usePaymentStore();

  const walletContainerRef = useRef<HTMLDivElement>(null);

  const { startPolling } = usePaymentPolling({
    onSuccess: (id) => router.push(`/payment/success?order_id=${id}`),
    onFailed: (id) => router.push(`/payment/failed?order_id=${id}`),
    onTimeout: () =>
      router.push(`/payment/pending?order_id=${order?.order_id}`),
  });

  async function handleWalletPay(provider: string) {
    if (!cashfree || !order) return;
    setSelectedWallet(provider);
    setLoading(true);
    setError(null);

    const el = cashfree.create("wallet", { values: { provider } });

    try {
      // Wait for the wallet element iframe to load (max 12 s)
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(
          () =>
            reject(new Error("Payment component timed out. Please try again.")),
          12000,
        );
        el.on("ready", () => {
          clearTimeout(timer);
          resolve();
        });
        if (walletContainerRef.current) {
          el.mount(walletContainerRef.current);
        } else {
          el.mount("#wallet-hidden-container");
        }
      });

      const result = await cashfree.pay({
        paymentSessionId: order.payment_session_id,
        paymentMethod: el,
      });

      if (result?.error) {
        setError(debugJSON(result.error));
        setLoading(false);
        el.unmount();
        return;
      }

      if (result?.redirect) return;

      startPolling();
    } catch (err) {
      const e = err as any;
      setError(debugJSON(e?.error ?? err) ?? "Wallet payment failed.");
      setLoading(false);
      el.unmount();
    }
  }

  return (
    <div className="p-4 space-y-4">
      {/* Hidden element mount container (off-screen) */}
      <div
        ref={walletContainerRef}
        id="wallet-hidden-container"
        aria-hidden="true"
        style={{
          position: "absolute",
          left: -9999,
          top: -9999,
          width: 1,
          height: 1,
          overflow: "hidden",
        }}
      />

      <div className="grid grid-cols-2 gap-3">
        {WALLETS.map((wallet, idx) => (
          <motion.button
            key={wallet.id}
            type="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => handleWalletPay(wallet.provider)}
            disabled={isLoading || !cashfree}
            className={`${wallet.color} flex items-center gap-3 rounded-xl border px-4 py-3.5 text-sm font-medium text-gray-800 transition hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-xs font-bold text-gray-600 shadow-sm">
              {wallet.logo}
            </span>
            {wallet.name}
            {selectedWallet === wallet.provider && isLoading && (
              <span className="ml-auto text-xs text-orange-500">…</span>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
