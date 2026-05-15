import axios, { type AxiosInstance } from "axios";
import { serverConfig } from "@/lib/config/server-config";
import type {
  CreateOrderRequest,
  CreateOrderResponse,
  PaymentEntity,
} from "@/types/payment";

// ─── Cashfree HTTP Client (Server-side only) ──────────────────────────────────

function createCashfreeClient(): AxiosInstance {
  const { clientId, clientSecret, baseUrl, apiVersion } = serverConfig.cashfree;

  return axios.create({
    baseURL: baseUrl,
    headers: {
      "x-client-id": clientId,
      "x-client-secret": clientSecret,
      "x-api-version": apiVersion,
      "Content-Type": "application/json",
    },
  });
}

// Lazy-initialised to avoid instantiating at module load (env may not be set yet in tests)
let _client: AxiosInstance | null = null;

function getCashfreeClient(): AxiosInstance {
  if (!_client) {
    _client = createCashfreeClient();
  }
  return _client;
}

// ─── Order API ────────────────────────────────────────────────────────────────

export async function createCashfreeOrder(
  payload: CreateOrderRequest & { order_id: string },
): Promise<CreateOrderResponse> {
  const client = getCashfreeClient();
  const { data } = await client.post<CreateOrderResponse>("/orders", payload);
  return data;
}

export async function getCashfreeOrder(
  orderId: string,
): Promise<CreateOrderResponse> {
  const client = getCashfreeClient();
  const { data } = await client.get<CreateOrderResponse>(`/orders/${orderId}`);
  return data;
}

// ─── Payments API ─────────────────────────────────────────────────────────────

export async function getCashfreePayments(
  orderId: string,
): Promise<PaymentEntity[]> {
  const client = getCashfreeClient();
  const { data } = await client.get<PaymentEntity[]>(
    `/orders/${orderId}/payments`,
  );
  return data;
}
