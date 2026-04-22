/**
 * marketplace-expire-cp-rates — Supabase Edge Function (cron / manual invoke)
 * ────────────────────────────────────────────────────────────────────────
 * Marks active Channel Partner commission rates as expired when `expires_at`
 * is in the past. Also sends expiring-soon notifications to the Channel Partner
 * and a separate alert to admin staff.
 *
 * POST with header: Authorization: Bearer <SERVICE_ROLE_KEY>
 * Optional body: { "dry_run": true }
 *
 * Deployment: supabase functions deploy marketplace-expire-cp-rates --no-verify-jwt
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

  const denoEnv = (globalThis as any).Deno?.env;

  // Check for cron secret header (for cron jobs) OR service role key (for manual invocation)
  const cronSecret = denoEnv?.get("CRON_SECRET") ?? "";
  const providedSecret = req.headers.get("x-cron-secret");
  const serviceKey = denoEnv?.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const bearer = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");

  const hasValidCronSecret = cronSecret && providedSecret === cronSecret;
  const hasValidServiceKey = serviceKey && bearer === serviceKey;

  if (!hasValidCronSecret && !hasValidServiceKey) {
    return json({ error: "Unauthorized — X-Cron-Secret header OR Bearer SERVICE_ROLE_KEY required" }, 401);
  }

  const supabaseUrl = denoEnv?.get("SUPABASE_URL")!;
  const sb = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  let dryRun = false;
  try {
    const body = await req.json();
    dryRun = Boolean(body?.dry_run);
  } catch {
    /* ignore missing body */
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const expiringThreshold = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const [{ data: expiringRates, error: expiringError }, { data: expiredRates, error: expiredError }] =
      await Promise.all([
        sb
          .from("channel_partner_commission_rates")
          .select("id,channel_partner_id,expires_at,expiry_notified")
          .is("effective_to", null)
          .gt("expires_at", nowIso)
          .lte("expires_at", expiringThreshold)
          .eq("expiry_notified", false),
        sb
          .from("channel_partner_commission_rates")
          .select("id,channel_partner_id,expires_at,expiry_notified")
          .is("effective_to", null)
          .lte("expires_at", nowIso),
      ]);

    if (expiringError) return json({ error: expiringError.message }, 500);
    if (expiredError) return json({ error: expiredError.message }, 500);

    const expiringRows = expiringRates ?? [];
    const expiredRows = expiredRates ?? [];

    const cpIds = Array.from(
      new Set([
        ...expiringRows.map((row: any) => row.channel_partner_id),
        ...expiredRows.map((row: any) => row.channel_partner_id),
      ])
    ).filter(Boolean);

    const adminIds: string[] = [];
    const cpMap = new Map<string, { userId: string | null; businessName: string | null }>();

    if (cpIds.length > 0) {
      const { data: cps, error: cpError } = await sb
        .from("channel_partners")
        .select("id,user_id,business_name")
        .in("id", cpIds);
      if (cpError) return json({ error: cpError.message }, 500);
      for (const cp of cps ?? []) {
        cpMap.set(cp.id, { userId: cp.user_id ?? null, businessName: cp.business_name ?? null });
      }
    }

    const { data: adminRows, error: adminError } = await sb
      .from("profiles")
      .select("id")
      .in("role", ["admin", "moderator"]);

    if (adminError) return json({ error: adminError.message }, 500);
    for (const row of adminRows ?? []) {
      if (row?.id) adminIds.push(row.id);
    }

    const notifications: Array<Record<string, unknown>> = [];
    const auditLogs: Array<Record<string, unknown>> = [];
    const rateUpdates: Array<Record<string, unknown>> = [];

    for (const rate of expiringRows) {
      const cp = cpMap.get(rate.channel_partner_id);
      if (!cp?.userId) continue;

      notifications.push({
        id: crypto.randomUUID(),
        type: "cp_rate_expiring",
        channel: "system",
        title_en: "Commission Rate Expiring Soon",
        title_bn: "",
        message_en: `A commission rate will expire on ${rate.expires_at}. Please review it soon.`,
        message_bn: "",
        sender_id: null,
        receiver_id: cp.userId,
        action_url: "/cp/rates",
        metadata: { category: "cp", expires_at: rate.expires_at },
        read: false,
        created_at: new Date().toISOString(),
      });

      for (const adminId of adminIds) {
        notifications.push({
          id: crypto.randomUUID(),
          type: "cp_rate_expiring_admin",
          channel: "system",
          title_en: "Channel Partner Rate Expiring",
          title_bn: "",
          message_en: `A Channel Partner rate for ${cp.businessName ?? "a partner"} is expiring soon.`,
          message_bn: "",
          sender_id: null,
          receiver_id: adminId,
          action_url: "/admin/channel-partners",
          metadata: { category: "admin", cpName: cp.businessName ?? null, expires_at: rate.expires_at },
          read: false,
          created_at: new Date().toISOString(),
        });
      }

      rateUpdates.push({ id: rate.id, expiry_notified: true });
    }

    for (const rate of expiredRows) {
      const cp = cpMap.get(rate.channel_partner_id);
      if (cp?.userId) {
        notifications.push({
          id: crypto.randomUUID(),
          type: "cp_rate_expired",
          channel: "system",
          title_en: "Commission Rate Expired",
          title_bn: "",
          message_en: `A commission rate expired on ${rate.expires_at}. Please update your rate information.`,
          message_bn: "",
          sender_id: null,
          receiver_id: cp.userId,
          action_url: "/cp/rates",
          metadata: { category: "cp", expires_at: rate.expires_at },
          read: false,
          created_at: new Date().toISOString(),
        });
      }

      if (cp?.userId) {
        auditLogs.push({
          id: crypto.randomUUID(),
          action: "CP_RATE_EXPIRED",
          user_id: cp.userId,
          ip_address: null,
          severity: "info",
          source: "cron",
          metadata: {
            rate_id: rate.id,
            channel_partner_id: rate.channel_partner_id,
            expires_at: rate.expires_at,
          },
          created_at: new Date().toISOString(),
        });
      }

      rateUpdates.push({ id: rate.id, effective_to: nowIso, expiry_notified: true });
    }

    if (dryRun) {
      return json({
        ok: true,
        dry_run: true,
        expiring_rows: expiringRows.length,
        expired_rows: expiredRows.length,
        notifications_to_create: notifications.length,
        audit_logs_to_create: auditLogs.length,
      });
    }

    if (rateUpdates.length > 0) {
      const updates = rateUpdates.map((update) => ({
        id: update.id,
        ...(update.effective_to ? { effective_to: update.effective_to } : {}),
        expiry_notified: update.expiry_notified,
      }));
      const { error: updateError } = await sb
        .from("channel_partner_commission_rates")
        .upsert(updates, { onConflict: "id" });
      if (updateError) return json({ error: updateError.message }, 500);
    }

    if (notifications.length > 0) {
      const { error: notifError } = await sb.from("notifications").insert(notifications);
      if (notifError) return json({ error: notifError.message }, 500);
    }

    if (auditLogs.length > 0) {
      const { error: auditError } = await sb.from("audit_logs").insert(auditLogs);
      if (auditError) return json({ error: auditError.message }, 500);
    }

    return json({
      ok: true,
      expiring_rows: expiringRows.length,
      expired_rows: expiredRows.length,
      notifications_created: notifications.length,
      audit_logs_created: auditLogs.length,
    });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
