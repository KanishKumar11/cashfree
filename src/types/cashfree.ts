// Type declarations for @cashfreepayments/cashfree-js
// Cashfree SDK is loaded via script tag — these types describe the runtime object.

export type CashfreeMode = "sandbox" | "production";

export interface CashfreeLoadOptions {
  mode: CashfreeMode;
}

// ─── UPI Intent ───────────────────────────────────────────────────────────────

export type UPIProvider = "gpay" | "phonepe" | "paytm" | "bhim" | "amazon";

export interface UPIIntentPaymentMethod {
  upi: {
    channel: "intent";
    provider: UPIProvider;
  };
}

export interface UPICollectPaymentMethod {
  upi: {
    channel: "collect";
    upi_id: string;
  };
}

export interface UPIQRPaymentMethod {
  upi: {
    channel: "qrcode";
  };
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export interface CardPaymentMethod {
  card: {
    channel: "post";
    card_number: string;
    card_holder_name: string;
    card_expiry_mm: string;
    card_expiry_yy: string;
    card_cvv: string;
  };
}

export interface SavedCardPaymentMethod {
  card: {
    channel: "post";
    instrument_id: string;
    card_cvv: string;
    save_instrument?: boolean;
  };
}

// ─── Net Banking ──────────────────────────────────────────────────────────────

export interface NetBankingPaymentMethod {
  netbanking: {
    channel: "link";
    netbanking_bank_code: string;
  };
}

// ─── Wallet ───────────────────────────────────────────────────────────────────

export interface WalletPaymentMethod {
  wallet: {
    channel: "link";
    wallet_name: string;
  };
}

// ─── Union ────────────────────────────────────────────────────────────────────

export type PaymentMethod =
  | UPIIntentPaymentMethod
  | UPICollectPaymentMethod
  | UPIQRPaymentMethod
  | CardPaymentMethod
  | SavedCardPaymentMethod
  | NetBankingPaymentMethod
  | WalletPaymentMethod;

// ─── Cashfree Instance ────────────────────────────────────────────────────────

// All element types supported by cashfree.create()
export type CashfreeElementType =
  | "cardNumber"
  | "cardExpiry"
  | "cardCvv"
  | "cardHolder"
  | "upiApp"
  | "upiCollect"
  | "upiQr"
  | "netbanking"
  | "flowWiseNetbanking"
  | "wallet"
  | "flowWiseWallet"
  | "savePaymentInstrument";

export interface CashfreeElement {
  mount(selector: string | HTMLElement): void;
  unmount(): void;
  on(event: string, handler: (e: CashfreeElementEvent) => void): void;
}

export interface CashfreeElementEvent {
  element?: CashfreeElementType;
  error?: { message: string };
  complete?: boolean;
  empty?: boolean;
  value?: string;
}

export interface CreateElementOptions {
  style?: Record<string, unknown>;
  placeholder?: string;
  classes?: Record<string, string>;
  values?: Record<string, string | number | boolean>;
}

export interface CheckoutOptions {
  paymentSessionId: string;
  returnUrl?: string;
}

// paymentMethod must be a Cashfree Element — NOT a plain object
export interface PayOptions {
  paymentSessionId: string;
  paymentMethod: CashfreeElement;
}

export interface CashfreePaymentResult {
  paymentDetails?: {
    paymentMessage: string;
    paymentStatus: "SUCCESS" | "FAILED" | "PENDING" | "USER_DROPPED";
  };
  error?: {
    message: string;
    type?: string;
  };
  redirect?: boolean;
}

export interface CashfreeInstance {
  checkout(options: CheckoutOptions): Promise<CashfreePaymentResult>;
  pay(options: PayOptions): Promise<CashfreePaymentResult>;
  create(elementType: CashfreeElementType, options?: CreateElementOptions): CashfreeElement;
}

// Module augmentation is in src/types/cashfree-js.d.ts
