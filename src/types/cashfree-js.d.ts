// Ambient declaration for @cashfreepayments/cashfree-js
// This package ships no TypeScript types; we provide them here.

declare module "@cashfreepayments/cashfree-js" {
  import type { CashfreeLoadOptions, CashfreeInstance } from "@/types/cashfree";

  export function load(
    options: CashfreeLoadOptions,
  ): Promise<CashfreeInstance | null>;
}
