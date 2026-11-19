// ─── Customer ────────────────────────────────────────────────────────────────

export interface CustomerDetails {
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
}

// ─── Order ────────────────────────────────────────────────────────────────────

export interface CreateOrderRequest {
  order_amount: number;
  order_currency?: string;
  customer_details: CustomerDetails;
  order_meta?: {
    return_url?: string;
    notify_url?: string;
  };
  order_tags?: Record<string, string>;
}

export interface CreateOrderResponse {
  order_id: string;
  cf_order_id: string;
  payment_session_id: string;
  order_status: OrderStatus;
  order_amount: number;
  order_currency: string;
  created_at: string;
  customer_details: CustomerDetails;
}

export type OrderStatus =
  | "ACTIVE"
  | "PAID"
  | "EXPIRED"
  | "CANCELLED"
  | "TERMINATED";

// ─── Payment ──────────────────────────────────────────────────────────────────

export type PaymentStatus = "SUCCESS" | "FAILED" | "PENDING" | "USER_DROPPED";

export type PaymentMethodType =
  | "upi"
  | "card"
  | "netbanking"
  | "wallet"
  | "emi"
  | "cardless_emi"
  | "paylater";

export interface PaymentEntity {
  cf_payment_id: string;
  order_id: string;
  entity: string;
  error_details: {
    error_code: string;
    error_description: string;
    error_reason: string;
    error_source: string;
    error_code_raw: string;
    error_description_raw: string;
  } | null;
  is_captured: boolean;
  order_amount: number;
  payment_amount: number;
  payment_completion_time: string;
  payment_currency: string;
  payment_group: string;
  payment_message: string;
  payment_method: PaymentMethodDetail;
  payment_status: PaymentStatus;
  payment_time: string;
  bank_reference: string;
  auth_id: string;
}

export interface PaymentMethodDetail {
  upi?: {
    channel: string;
    upi_id: string;
  };
  card?: {
    channel: string;
    card_number: string;
    card_network: string;
    card_type: string;
    card_country: string;
    card_bank_name: string;
  };
  netbanking?: {
    channel: string;
    netbanking_bank_code: number;
    netbanking_bank_name: string;
  };
  wallet?: {
    channel: string;
    wallet_name: string;
  };
}

// ─── Webhook ──────────────────────────────────────────────────────────────────

export interface WebhookPayload {
  data: {
    order: {
      order_id: string;
      order_amount: number;
      order_currency: string;
      order_tags: Record<string, string> | null;
    };
    payment: {
      cf_payment_id: number;
      payment_status: PaymentStatus;
      payment_amount: number;
      payment_currency: string;
      payment_message: string;
      payment_time: string;
      bank_reference: string;
      auth_id: string | null;
      payment_method: PaymentMethodDetail;
    };
    customer_details: CustomerDetails;
  };
  event_time: string;
  type:
    | "PAYMENT_SUCCESS_WEBHOOK"
    | "PAYMENT_FAILED_WEBHOOK"
    | "PAYMENT_USER_DROPPED_WEBHOOK";
}

// ─── UI State ─────────────────────────────────────────────────────────────────

export type ActivePaymentMethod =
  | "upi"
  | "card"
  | "netbanking"
  | "wallet"
  | "saved";

export interface UPIApp {
  id: string;
  name: string;
  provider: "gpay" | "phonepe" | "paytm" | "bhim" | "amazon";
  icon: string;
  color: string;
}

export interface NetBankingBank {
  code: string;
  name: string;
}

export interface WalletOption {
  id: string;
  name: string;
  provider: string;
  icon: string;
}

export interface SavedCard {
  instrument_id: string;
  card_number: string;
  card_network: string;
  card_type: string;
  card_bank_name: string;
  card_expiry_mm: string;
  card_expiry_yy: string;
}

// ─── API Response Wrapper ─────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
