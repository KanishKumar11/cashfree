// Public config — safe to import in client components.
// Contains NEXT_PUBLIC_* variables only.
// For server-only credentials, see server-config.ts.

export const publicConfig = {
  cashfree: {
    mode: (process.env.NEXT_PUBLIC_CASHFREE_MODE ?? "sandbox") as
      | "sandbox"
      | "production",
  },
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const;
