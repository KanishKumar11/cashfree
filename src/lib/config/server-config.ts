// SERVER-ONLY config — never import this in client components or 'use client' files.
// Only import in: API routes, Server Components, server.ts utilities.

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const serverConfig = {
  cashfree: {
    clientId: requireEnv("CASHFREE_CLIENT_ID"),
    clientSecret: requireEnv("CASHFREE_CLIENT_SECRET"),
    webhookSecret: process.env.CASHFREE_WEBHOOK_SECRET ?? "",
    mode: (process.env.NEXT_PUBLIC_CASHFREE_MODE ?? "sandbox") as
      | "sandbox"
      | "production",
    baseUrl:
      process.env.NEXT_PUBLIC_CASHFREE_MODE === "production"
        ? "https://api.cashfree.com/pg"
        : "https://sandbox.cashfree.com/pg",
    apiVersion: "2023-08-01",
  },
} as const;
