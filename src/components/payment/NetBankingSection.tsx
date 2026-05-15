"use client";

import { useRef, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { usePaymentStore } from "@/store/paymentStore";
import { usePaymentPolling } from "@/hooks/usePaymentPolling";
import { debugJSON } from "@/lib/toErrMsg";

interface Bank {
  code: string;
  name: string;
}

const BANKS: Bank[] = [
  { code: "3003", name: "Axis Bank" },
  { code: "3005", name: "Bank of Baroda" },
  { code: "3006", name: "Bank of India" },
  { code: "3007", name: "Canara Bank" },
  { code: "3009", name: "Central Bank of India" },
  { code: "3010", name: "City Union Bank" },
  { code: "3011", name: "DBS Bank" },
  { code: "3012", name: "Deutsche Bank" },
  { code: "3016", name: "Federal Bank" },
  { code: "3021", name: "HDFC Bank" },
  { code: "3022", name: "ICICI Bank" },
  { code: "3023", name: "IDBI Bank" },
  { code: "3028", name: "IndusInd Bank" },
  { code: "3030", name: "Kotak Mahindra Bank" },
  { code: "3031", name: "Lakshmi Vilas Bank" },
  { code: "3035", name: "Punjab National Bank" },
  { code: "3038", name: "South Indian Bank" },
  { code: "3040", name: "Standard Chartered Bank" },
  { code: "3042", name: "State Bank of India" },
  { code: "3054", name: "UCO Bank" },
  { code: "3060", name: "Union Bank of India" },
  { code: "3064", name: "Yes Bank" },
];

export function NetBankingSection() {
  const router = useRouter();
  const {
    cashfree,
    order,
    selectedBankCode,
    setSelectedBank,
    setLoading,
    setError,
    isLoading,
  } = usePaymentStore();

  const [search, setSearch] = useState("");
  const nbContainerRef = useRef<HTMLDivElement>(null);

  const { startPolling } = usePaymentPolling({
    onSuccess: (id) => router.push(`/payment/success?order_id=${id}`),
    onFailed: (id) => router.push(`/payment/failed?order_id=${id}`),
    onTimeout: () =>
      router.push(`/payment/pending?order_id=${order?.order_id}`),
  });

  const filteredBanks = useMemo(
    () =>
      BANKS.filter((b) => b.name.toLowerCase().includes(search.toLowerCase())),
    [search],
  );

  async function handleNetBanking(e: React.FormEvent) {
    e.preventDefault();
    if (!cashfree || !order || !selectedBankCode) return;
    setLoading(true);
    setError(null);

    // Create the netbanking Cashfree element with the selected bank.
    // Mount it in a hidden container, wait for "ready", then pay.
    const bank = BANKS.find((b) => b.code === selectedBankCode);
    if (!bank) return;

    const el = cashfree.create("flowWiseNetbanking", {
      values: {
        netbankingBankName: bank.name,
        netbankingCode: bank.code,
      },
    });

    try {
      // Wait for the element iframe to load (max 12 s)
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
        if (nbContainerRef.current) {
          el.mount(nbContainerRef.current);
        } else {
          el.mount("#nb-hidden-container");
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

      // Redirect flow — Net banking opens bank portal
      if (result?.redirect) return;

      startPolling();
    } catch (err) {
      const e = err as any;
      setError(debugJSON(e?.error ?? err) ?? "Net banking failed.");
      setLoading(false);
      el.unmount();
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4 p-4"
      onSubmit={handleNetBanking}
    >
      {/* Hidden element mount container (off-screen) */}
      <div
        ref={nbContainerRef}
        id="nb-hidden-container"
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
      {/* Search */}
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
          🔍
        </span>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search bank…"
          className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
        />
      </div>

      {/* Bank list */}
      <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-100">
        {filteredBanks.length === 0 && (
          <p className="p-4 text-center text-sm text-gray-400">
            No banks found
          </p>
        )}
        {filteredBanks.map((bank) => (
          <button
            key={bank.code}
            type="button"
            onClick={() => setSelectedBank(bank.code)}
            className={`flex w-full items-center gap-3 border-b border-gray-50 px-4 py-3 text-sm transition last:border-b-0 hover:bg-orange-50 ${
              selectedBankCode === bank.code
                ? "bg-orange-50 font-semibold text-orange-600"
                : "text-gray-700"
            }`}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs font-bold text-gray-500">
              {bank.name.slice(0, 2).toUpperCase()}
            </span>
            {bank.name}
            {selectedBankCode === bank.code && (
              <span className="ml-auto text-orange-500">✓</span>
            )}
          </button>
        ))}
      </div>

      <button
        type="submit"
        disabled={isLoading || !cashfree || !selectedBankCode}
        className="w-full rounded-xl bg-orange-500 py-3.5 text-sm font-semibold text-white transition hover:bg-orange-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading
          ? "Redirecting…"
          : selectedBankCode
            ? `Pay with ${BANKS.find((b) => b.code === selectedBankCode)?.name}`
            : "Select a bank"}
      </button>
    </motion.form>
  );
}
