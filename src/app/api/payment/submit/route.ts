import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import axios from "axios";
import { serverConfig } from "@/lib/config/server-config";

// ─── Schema ───────────────────────────────────────────────────────────────────

const submitSchema = z.object({
  payment_session_id: z.string().min(1),
  instrument_id: z.string().min(1),
  card_cvv: z.string().regex(/^\d{3,4}$/, "CVV must be 3 or 4 digits"),
});

// ─── POST /api/payment/submit ─────────────────────────────────────────────────
// Server-side payment submission for saved cards.
// The Cashfree JS SDK has no "savedCard" element type, so we call the
// Cashfree Orders Pay API directly from the server.

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body." },
      { status: 400 },
    );
  }

  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input.",
      },
      { status: 422 },
    );
  }

  const { payment_session_id, instrument_id, card_cvv } = parsed.data;
  const { clientId, clientSecret, baseUrl, apiVersion } = serverConfig.cashfree;

  try {
    const { data } = await axios.post(
      `${baseUrl}/orders/sessions`,
      {
        payment_session_id,
        payment_method: {
          card: {
            channel: "post",
            instrument_id,
            card_cvv,
          },
        },
      },
      {
        headers: {
          "x-client-id": clientId,
          "x-client-secret": clientSecret,
          "x-api-version": apiVersion,
          "Content-Type": "application/json",
        },
      },
    );

    return NextResponse.json({ success: true, data });
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const msg =
        err.response?.data?.message ??
        err.response?.data?.error_description ??
        "Payment failed.";
      return NextResponse.json(
        { success: false, error: msg },
        { status: err.response?.status ?? 502 },
      );
    }
    return NextResponse.json(
      { success: false, error: "Unexpected server error." },
      { status: 500 },
    );
  }
}
