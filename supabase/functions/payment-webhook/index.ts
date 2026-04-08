/**
 * payment-webhook — Supabase Edge Function (bKash / Nagad / SSLCommerz style callbacks)
 * ────────────────────────────────────────────────────────────────────────────
 * **Stub:** verifies a shared secret header, then records intent to confirm payment.
 * Wire your gateway’s signature verification + idempotency before production.
 *
 * POST body (example): { "booking_id": "uuid", "provider": "bkash", "trx_id": "..." }
 * Headers: x-webhook-secret (must match PAYMENT_WEBHOOK_SECRET) or Authorization: Bearer <secret>
 *
 * Next steps (product): lookup invoice, verify gateway signature, update booking/payment rows,
 * emit notification. Do not trust client-supplied amounts.
 *
 * Deployment: supabase functions deploy payment-webhook --no-verify-jwt
 */

// @ts-ignore Deno import
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const secret = Deno.env.get("PAYMENT_WEBHOOK_SECRET") ?? "";
  const headerSecret = req.headers.get("x-webhook-secret") ?? "";
  const auth = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!secret || (headerSecret !== secret && auth !== secret)) {
    return json({ error: "Invalid webhook secret" }, 401);
  }

  let body: { booking_id?: string; provider?: string; trx_id?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!body.booking_id) return json({ error: "booking_id required" }, 400);

  // Stub: no DB writes until payment_webhook_events (or invoices) schema is defined.
  return json({
    ok: true,
    stub: true,
    booking_id: body.booking_id,
    provider: body.provider ?? null,
    trx_id: body.trx_id ?? null,
    message:
      "Acknowledged. Add gateway signature verification + idempotent payment rows before production.",
  });
});
