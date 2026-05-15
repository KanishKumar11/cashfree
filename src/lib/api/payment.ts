import axios from "axios";
import type {
  ApiResponse,
  CreateOrderRequest,
  CreateOrderResponse,
  PaymentEntity,
} from "@/types/payment";

// ─── Axios instance ───────────────────────────────────────────────────────────

const apiClient = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Normalise axios errors to a consistent shape
    const message =
      error.response?.data?.message ??
      error.response?.data?.error ??
      error.message ??
      "An unexpected error occurred";
    return Promise.reject(new Error(message));
  },
);

// ─── Payment API helpers ──────────────────────────────────────────────────────

export interface CreateOrderPayload
  extends Omit<CreateOrderRequest, "customer_details"> {
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  return_url?: string;
}

export async function createOrder(
  payload: CreateOrderPayload,
): Promise<CreateOrderResponse> {
  const { data } = await apiClient.post<ApiResponse<CreateOrderResponse>>(
    "/payment/create-order",
    payload,
  );
  if (!data.success || !data.data) {
    throw new Error(data.error ?? "Failed to create order");
  }
  return data.data;
}

export async function fetchOrderStatus(
  orderId: string,
): Promise<CreateOrderResponse> {
  const { data } = await apiClient.get<ApiResponse<CreateOrderResponse>>(
    `/payment/status/${orderId}`,
  );
  if (!data.success || !data.data) {
    throw new Error(data.error ?? "Failed to fetch order status");
  }
  return data.data;
}

export async function fetchPayments(
  orderId: string,
): Promise<PaymentEntity[]> {
  const { data } = await apiClient.get<ApiResponse<PaymentEntity[]>>(
    `/payment/payments/${orderId}`,
  );
  if (!data.success || !data.data) {
    throw new Error(data.error ?? "Failed to fetch payments");
  }
  return data.data;
}
