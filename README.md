# Cashfree Payment Integration

Production-grade Cashfree Payments integration for Next.js 16 with a fully custom Swiggy/Zomato-style checkout UI. No hosted checkout pages — everything uses the Cashfree Element SDK and UPI Intent directly.

## Features

- **UPI Intent** — Google Pay, PhonePe, Paytm, BHIM with one-tap payment
- **UPI Collect** — Enter UPI ID manually
- **QR Code** — Fallback QR for desktop
- **Credit / Debit Cards** — Cashfree secure elements (PCI-compliant, no raw card data on your server)
- **Net Banking** — 20+ banks with live search
- **Wallets** — Paytm, MobiKwik, Freecharge, Amazon Pay, JioMoney, Airtel
- **Saved Cards** — CVV-only re-payment flow
- **Payment Polling** — Auto-verify payment every 2 seconds after UPI app returns
- **Webhook** — HMAC-SHA256 signature verification + replay-attack protection
- **Zustand** payment state management
- **React Query** for cached API calls
- **Framer Motion** animations
- **Mobile-first** responsive UI

## Stack

| Layer         | Tech                         |
| ------------- | ---------------------------- |
| Framework     | Next.js 16 App Router        |
| Language      | TypeScript 5                 |
| Styling       | Tailwind CSS v4              |
| State         | Zustand                      |
| Data fetching | TanStack React Query         |
| HTTP          | Axios                        |
| Animations    | Framer Motion                |
| Validation    | Zod v4                       |
| Payment SDK   | Cashfree JS v3 + Element SDK |

---

## Setup

### 1. Clone & install

```bash
git clone <repo>
cd cashfree
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
NEXT_PUBLIC_CASHFREE_MODE=sandbox     # or production
CASHFREE_CLIENT_ID=your_client_id
CASHFREE_CLIENT_SECRET=your_client_secret
CASHFREE_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Get credentials from [Cashfree Merchant Dashboard](https://merchant.cashfree.com/merchants/apps/pg).

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000/demo](http://localhost:3000/demo) to try a test payment.

---

## Project Structure

```
src/
├── app/
│   ├── api/payment/
│   │   ├── create-order/route.ts      POST — creates Cashfree order
│   │   ├── status/[orderId]/route.ts  GET  — order status
│   │   ├── payments/[orderId]/route.ts GET  — payment list
│   │   └── webhook/route.ts           POST — signed webhook handler
│   ├── checkout/page.tsx              Payment UI entry point
│   ├── payment/
│   │   ├── success/page.tsx
│   │   ├── failed/page.tsx
│   │   ├── pending/page.tsx           Auto-polls until terminal state
│   │   └── status/page.tsx            Return URL handler (redirects to pending)
│   └── demo/page.tsx                  Test harness
│
├── components/payment/
│   ├── PaymentContainer.tsx           Top-level shell
│   ├── PaymentMethodTabs.tsx          Tab navigation
│   ├── UPISection.tsx                 UPI apps + QR + collect form
│   ├── CardSection.tsx                Cashfree secure elements
│   ├── NetBankingSection.tsx          Searchable bank selector
│   ├── WalletsSection.tsx             Wallet grid
│   ├── SavedCardsSection.tsx          Saved card CVV flow
│   └── OrderSummary.tsx               Amount / order ID header
│
├── hooks/
│   ├── useCashfreeInit.ts             Loads & stores SDK instance
│   ├── usePaymentPolling.ts           2-second poll loop
│   └── usePaymentQueries.ts           React Query hooks
│
├── lib/
│   ├── api/payment.ts                 Axios client for internal API
│   ├── cashfree/server.ts             Server-side Cashfree HTTP client
│   ├── config/env.ts                  Typed env variable access
│   ├── providers/ReactQueryProvider.tsx
│   └── utils/
│       ├── webhook.ts                 HMAC-SHA256 verification
│       ├── idempotency.ts             Order ID generation
│       └── logger.ts                  Structured logging
│
├── store/
│   └── paymentStore.ts                Zustand store
│
└── types/
    ├── payment.ts                     Domain types (orders, payments, webhooks)
    ├── cashfree.ts                    Cashfree SDK types
    └── cashfree-js.d.ts               Module declaration for cashfree-js
```

---

## Payment Flow

```
User clicks "Pay"
  → POST /api/payment/create-order
  → Receive { order_id, payment_session_id }
  → Navigate to /checkout?order_id=...
  → PaymentContainer renders with Cashfree SDK loaded
  → User selects method and pays
  → UPI Intent: cashfree.checkout({ paymentMethod: { upi: { channel: "intent" } } })
  → Returns from UPI app → polling starts
  → GET /api/payment/payments/[orderId] every 2s
  → SUCCESS → /payment/success
  → FAILED  → /payment/failed
  → Timeout → /payment/pending (continues polling)
```

## Webhook Setup

1. In the Cashfree Dashboard → Developers → Webhooks, add:
   - URL: `https://yourdomain.com/api/payment/webhook`
   - Events: `PAYMENT_SUCCESS`, `PAYMENT_FAILED`, `PAYMENT_USER_DROPPED`

2. Copy the webhook secret to `CASHFREE_WEBHOOK_SECRET`.

The handler verifies `x-webhook-signature` (HMAC-SHA256) and `x-webhook-timestamp` (5-minute window to prevent replay attacks). Duplicate webhooks are deduplicated in-memory — replace with Redis/DB in production.

## Security Notes

- All Cashfree credentials are server-only (`CASHFREE_CLIENT_*` without `NEXT_PUBLIC_`)
- Card data never touches your server — Cashfree Element SDK handles it in a secure iframe
- Webhook signatures are verified with constant-time comparison (`crypto.timingSafeEqual`)
- `payment_session_id` is used client-side; it is a short-lived, single-use token

## Testing (Sandbox)

Use Cashfree [test cards and UPI IDs](https://docs.cashfree.com/docs/test-data):

| Method         | Test value                                    |
| -------------- | --------------------------------------------- |
| Card (success) | 4111 1111 1111 1111, CVV 123, any future date |
| Card (failed)  | 4111 1111 1111 1112                           |
| UPI (success)  | success@upi                                   |
| UPI (failed)   | failure@upi                                   |

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
