/**
 * marketplace-expire-bids — Supabase Edge Function (cron / manual invoke)
 * ────────────────────────────────────────────────────────────────────────
 * Marks pending/countered bids as `expired` when `expires_at` is in the past.
 * Uses the service role to bypass RLS. Schedule via Supabase Dashboard →
 * Edge Functions → Cron, or pg_cron calling this URL with service key.
 *
 * POST (recommended) with header: Authorization: Bearer <SERVICE_ROLE_KEY>
 * Optional body: { "dry_run": true } — only returns counts, no updates.
 *
 * Deployment: supabase functions deploy marketplace-expire-bids --no-verify-jwt
 * (JWT verification off so cron can use service role only.)
 */

// @ts-ignore Deno import
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
// @ts-ignore Deno import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const bearer = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!serviceKey || bearer !== serviceKey) {
    return json({ error: "Unauthorized — Bearer SERVICE_ROLE_KEY required" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const sb = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  let dryRun = false;
  try {
    const body = await req.json();
    dryRun = Boolean(body?.dry_run);
  } catch {
    /* no body */
  }

  const now = new Date().toISOString();

  const { data: stale, error: selErr } = await sb
    .from("care_contract_bids")
    .select("id")
    .in("status", ["pending", "countered"])
    .lt("expires_at", now);

  if (selErr) return json({ error: selErr.message }, 500);

  const ids = (stale ?? []).map((r: { id: string }) => r.id);
  if (dryRun || ids.length === 0) {
    return json({ ok: true, dry_run: dryRun, would_expire: ids.length, expired: 0 });
  }

  const { error: updErr } = await sb
    .from("care_contract_bids")
    .update({ status: "expired" })
    .in("id", ids);

  if (updErr) return json({ error: updErr.message }, 500);
  return json({ ok: true, expired: ids.length });
});
