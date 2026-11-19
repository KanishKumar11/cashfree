import { create } from "zustand";
import type {
  ActivePaymentMethod,
  CreateOrderResponse,
  PaymentEntity,
  PaymentStatus,
} from "@/types/payment";
import type { CashfreeInstance } from "@/types/cashfree";

// ─── State ────────────────────────────────────────────────────────────────────

interface PaymentState {
  // Order
  order: CreateOrderResponse | null;

  // Cashfree SDK instance
  cashfree: CashfreeInstance | null;

  // UI state
  activeMethod: ActivePaymentMethod;
  isLoading: boolean;
  isPolling: boolean;

  // Payment result
  paymentStatus: PaymentStatus | null;
  paymentDetails: PaymentEntity | null;
  errorMessage: string | null;

  // Selected options
  selectedBankCode: string;
  selectedWallet: string;
  upiId: string;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

interface PaymentActions {
  setOrder: (order: CreateOrderResponse) => void;
  setCashfree: (cashfree: CashfreeInstance) => void;
  setActiveMethod: (method: ActivePaymentMethod) => void;
  setLoading: (isLoading: boolean) => void;
  setPolling: (isPolling: boolean) => void;
  setPaymentStatus: (status: PaymentStatus) => void;
  setPaymentDetails: (details: PaymentEntity) => void;
  setError: (message: string | null) => void;
  setSelectedBank: (bankCode: string) => void;
  setSelectedWallet: (wallet: string) => void;
  setUpiId: (upiId: string) => void;
  reset: () => void;
}

// ─── Initial state ────────────────────────────────────────────────────────────

const initialState: PaymentState = {
  order: null,
  cashfree: null,
  activeMethod: "upi",
  isLoading: false,
  isPolling: false,
  paymentStatus: null,
  paymentDetails: null,
  errorMessage: null,
  selectedBankCode: "",
  selectedWallet: "",
  upiId: "",
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const usePaymentStore = create<PaymentState & PaymentActions>((set) => ({
  ...initialState,

  setOrder: (order) => set({ order }),
  setCashfree: (cashfree) => set({ cashfree }),
  setActiveMethod: (activeMethod) => set({ activeMethod, errorMessage: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setPolling: (isPolling) => set({ isPolling }),
  setPaymentStatus: (paymentStatus) => set({ paymentStatus }),
  setPaymentDetails: (paymentDetails) => set({ paymentDetails }),
  setError: (errorMessage) => set({ errorMessage }),
  setSelectedBank: (selectedBankCode) => set({ selectedBankCode }),
  setSelectedWallet: (selectedWallet) => set({ selectedWallet }),
  setUpiId: (upiId) => set({ upiId }),
  reset: () => set({ ...initialState }),
}));
