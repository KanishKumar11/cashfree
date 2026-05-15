"use client";

import { Suspense } from "react";
import { ReactQueryProvider } from "@/lib/providers/ReactQueryProvider";

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReactQueryProvider>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          </div>
        }
      >
        {children}
      </Suspense>
    </ReactQueryProvider>
  );
}
