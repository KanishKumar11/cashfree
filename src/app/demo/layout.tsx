"use client";

import { Suspense } from "react";
import { ReactQueryProvider } from "@/lib/providers/ReactQueryProvider";

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReactQueryProvider>
      <Suspense>{children}</Suspense>
    </ReactQueryProvider>
  );
}
