"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createOrder,
  fetchOrderStatus,
  fetchPayments,
  type CreateOrderPayload,
} from "@/lib/api/payment";

// ─── Create Order ─────────────────────────────────────────────────────────────

export function useCreateOrder() {
  return useMutation({
    mutationFn: (payload: CreateOrderPayload) => createOrder(payload),
  });
}

// ─── Order Status ─────────────────────────────────────────────────────────────

export function useOrderStatus(
  orderId: string | null,
  options?: { enabled?: boolean; refetchInterval?: number | false },
) {
  return useQuery({
    queryKey: ["order-status", orderId],
    queryFn: () => fetchOrderStatus(orderId!),
    enabled: !!orderId && (options?.enabled ?? true),
    refetchInterval: options?.refetchInterval,
  });
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export function usePayments(
  orderId: string | null,
  options?: { enabled?: boolean; refetchInterval?: number | false },
) {
  return useQuery({
    queryKey: ["payments", orderId],
    queryFn: () => fetchPayments(orderId!),
    enabled: !!orderId && (options?.enabled ?? true),
    refetchInterval: options?.refetchInterval,
  });
}
