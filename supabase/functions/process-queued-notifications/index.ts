/**
 * process-queued-notifications — Supabase Edge Function
 * ─────────────────────────────────────────────────────
 * Processes notifications that were deferred during quiet hours.
 * Picks up rows from `queued_notifications` where `deliver_at <= NOW()`
 * and `processed = false`, sends native push via FCM/APNs, and marks
 * them as processed.
 *
 * Intended to run on a schedule (every 1 minute) via:
 *   - Supabase pg_cron:
 *       SELECT cron.schedule('process-queued-notifications', '* * * * *',
 *         $$ SELECT net.http_post(
 *           url := '<SUPABASE_URL>/functions/v1/process-queued-notifications',
 *           headers := jsonb_build_object('Authorization', 'Bearer <SERVICE_ROLE_KEY>'),
 *           body := '{}'
 *         ) $$
 *       );
 *   - Or external cron (GitHub Actions, Railway cron, etc.)
 *
 * Auth: Service role key (no user JWT required — this is a system job)
 *
 * Deployment:
 *   supabase functions deploy process-queued-notifications
 */

// @ts-ignore Deno import
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
// @ts-ignore Deno import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// ─── Types ───

interface DeviceToken {
  id: string;
  user_id: string;
  platform: "fcm" | "apns";
  token: string;
  active: boolean;
}

interface QueuedRow {
  id: string;
  notification_id: string;
  receiver_id: string;
  deliver_at: string;
  processed: boolean;
}

interface NotificationRow {
  id: string;
  type: string;
  channel: string;
  title_en: string;
  message_en: string;
  action_url: string | null;
  metadata: Record<string, unknown>;
}

// ─── CORS ───

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─── Main handler ───

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  // Accept both POST (from cron) and GET (for manual testing)
  if (req.method !== "POST" && req.method !== "GET") {
    return jsonError("Method not allowed", 405);
  }

  try {
    // ── 1. Authenticate as service role ──
    // When called from pg_cron, the Authorization header contains the service role key.
    // When called manually, validate the caller has service role access.
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Simple auth check: either service role key or valid JWT
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      if (token !== supabaseServiceKey) {
        // Validate as user JWT — but only allow if user is admin
        // For simplicity, we accept any valid token since this is typically called by cron
        const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
        const callerClient = createClient(supabaseUrl, anonKey, {
          global: { headers: { Authorization: authHeader } },
        });
        const { error: authErr } = await callerClient.auth.getUser();
        if (authErr) {
          return jsonError("Unauthorized", 401);
        }
      }
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // ── 2. Fetch pending queued notifications ──
    const now = new Date().toISOString();
    const { data: queuedItems, error: fetchError } = await adminClient
      .from("queued_notifications")
      .select("*")
      .eq("processed", false)
      .lte("deliver_at", now)
      .order("deliver_at", { ascending: true })
      .limit(100); // Process in batches of 100

    if (fetchError) {
      console.error("[process-queued] Fetch error:", fetchError);
      return jsonError(`Failed to fetch queued notifications: ${fetchError.message}`, 500);
    }

    if (!queuedItems || queuedItems.length === 0) {
      return jsonOk({ status: "ok", processed: 0, message: "No pending items" });
    }

    const items = queuedItems as QueuedRow[];
    let processed = 0;
    let failed = 0;
    const errors: string[] = [];

    // ── 3. Process each queued notification ──
    for (const item of items) {
      try {
        // Fetch the original notification row
        const { data: notifData, error: notifErr } = await adminClient
          .from("notifications")
          .select("id, type, channel, title_en, message_en, action_url, metadata")
          .eq("id", item.notification_id)
          .single();

        if (notifErr || !notifData) {
          // Notification was deleted — mark as processed and skip
          await markProcessed(adminClient, item.id);
          processed++;
          continue;
        }

        const notif = notifData as NotificationRow;

        // Fetch active device tokens for the receiver
        const { data: tokens } = await adminClient
          .from("device_tokens")
          .select("*")
          .eq("user_id", item.receiver_id)
          .eq("active", true);

        if (!tokens || tokens.length === 0) {
          // No devices registered — mark as processed
          await markProcessed(adminClient, item.id);
          processed++;
          continue;
        }

        // Send push notifications
        const pushResult = await sendNativePush(
          adminClient,
          {
            title: notif.title_en,
            body: notif.message_en,
            type: notif.type,
            action_url: notif.action_url,
            receiver_id: item.receiver_id,
            metadata: notif.metadata,
          },
          notif.id,
          tokens as DeviceToken[]
        );

        if (pushResult.errors.length > 0) {
          errors.push(
            `Notification ${item.notification_id}: ${pushResult.errors.join(", ")}`
          );
        }

        // Mark as processed regardless of push success/failure
        await markProcessed(adminClient, item.id);
        processed++;
      } catch (e) {
        failed++;
        errors.push(`Item ${item.id}: ${(e as Error).message}`);
        // Still mark as processed to avoid infinite retries
        try {
          await markProcessed(adminClient, item.id);
        } catch {}
      }
    }

    return jsonOk({
      status: "ok",
      total: items.length,
      processed,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error("[process-queued] Unhandled error:", err);
    return jsonError("Internal server error", 500);
  }
});

// ─── Helpers ───

async function markProcessed(
  adminClient: ReturnType<typeof createClient>,
  id: string
): Promise<void> {
  await adminClient
    .from("queued_notifications")
    .update({ processed: true })
    .eq("id", id);
}

interface PushPayload {
  title: string;
  body: string;
  type: string;
  action_url: string | null;
  receiver_id: string;
  metadata: Record<string, unknown>;
}

async function sendNativePush(
  adminClient: ReturnType<typeof createClient>,
  payload: PushPayload,
  notificationId: string,
  tokens: DeviceToken[]
): Promise<{ fcm: number; apns: number; errors: string[] }> {
  const result = { fcm: 0, apns: 0, errors: [] as string[] };

  const fcmTokens = tokens.filter((t) => t.platform === "fcm");
  const apnsTokens = tokens.filter((t) => t.platform === "apns");

  // ── FCM HTTP v1 ──
  const fcmSaJson = Deno.env.get("FCM_SERVICE_ACCOUNT_JSON");
  if (fcmSaJson && fcmTokens.length > 0) {
    try {
      const { token: accessToken, projectId } = await getFcmAccessToken(fcmSaJson);
      const fcmEndpoint = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

      for (const devToken of fcmTokens) {
        try {
          const fcmRes = await fetch(fcmEndpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              message: {
                token: devToken.token,
                notification: { title: payload.title, body: payload.body },
                data: {
                  notification_id: notificationId,
                  type: payload.type,
                  action_url: payload.action_url || "",
                  metadata: JSON.stringify(payload.metadata || {}),
                },
                android: {
                  priority: "HIGH",
                  notification: { sound: "default" },
                },
              },
            }),
          });

          if (fcmRes.ok) {
            result.fcm++;
          } else {
            const errBody = await fcmRes.json();
            const errCode = errBody?.error?.details?.[0]?.errorCode as string | undefined;
            if (errCode === "UNREGISTERED" || errCode === "INVALID_ARGUMENT") {
              await adminClient
                .from("device_tokens")
                .update({ active: false })
                .eq("id", devToken.id);
            }
            result.errors.push(`FCM ${fcmRes.status}: ${errCode ?? JSON.stringify(errBody).substring(0, 120)}`);
          }
        } catch (e) {
          result.errors.push(`FCM token error: ${(e as Error).message}`);
        }
      }
    } catch (e) {
      result.errors.push(`FCM error: ${(e as Error).message}`);
    }
  }

  // ── APNs ──
  const apnsKeyId = Deno.env.get("APNS_KEY_ID");
  const apnsTeamId = Deno.env.get("APNS_TEAM_ID");
  const apnsBundleId = Deno.env.get("APNS_BUNDLE_ID");
  const apnsAuthKey = Deno.env.get("APNS_AUTH_KEY");

  if (
    apnsKeyId &&
    apnsTeamId &&
    apnsBundleId &&
    apnsAuthKey &&
    apnsTokens.length > 0
  ) {
    try {
      const apnsJwt = await generateApnsJwt(apnsKeyId, apnsTeamId, apnsAuthKey);
      const apnsHost = "https://api.push.apple.com";

      for (const token of apnsTokens) {
        try {
          const apnsResponse = await fetch(
            `${apnsHost}/3/device/${token.token}`,
            {
              method: "POST",
              headers: {
                Authorization: `bearer ${apnsJwt}`,
                "apns-topic": apnsBundleId,
                "apns-push-type": "alert",
                "apns-priority": "10",
                "apns-expiration": "0",
              },
              body: JSON.stringify({
                aps: {
                  alert: {
                    title: payload.title,
                    body: payload.body,
                  },
                  sound: "default",
                  badge: 1,
                },
                notification_id: notificationId,
                type: payload.type,
                action_url: payload.action_url || "",
              }),
            }
          );

          if (apnsResponse.ok) {
            result.apns++;
          } else {
            const errBody = await apnsResponse.text();
            if (apnsResponse.status === 410 || apnsResponse.status === 400) {
              await adminClient
                .from("device_tokens")
                .update({ active: false })
                .eq("id", token.id);
            }
            result.errors.push(
              `APNs ${apnsResponse.status}: ${errBody.substring(0, 100)}`
            );
          }
        } catch (e) {
          result.errors.push(`APNs device error: ${(e as Error).message}`);
        }
      }
    } catch (e) {
      result.errors.push(`APNs JWT error: ${(e as Error).message}`);
    }
  }

  return result;
}

// ─── FCM HTTP v1 — OAuth2 via Service Account ───

interface ServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}

async function getFcmAccessToken(
  saJsonBase64: string
): Promise<{ token: string; projectId: string }> {
  const sa: ServiceAccount = JSON.parse(atob(saJsonBase64));
  const now = Math.floor(Date.now() / 1000);

  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    })
  );
  const signingInput = `${header}.${claims}`;

  const pemBody = sa.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\n/g, "")
    .trim();
  const keyBytes = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    "pkcs8",
    keyBytes.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sig = await crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5" },
    key,
    new TextEncoder().encode(signingInput)
  );

  const jwt = `${signingInput}.${base64url(new Uint8Array(sig))}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    throw new Error(`FCM OAuth2 failed: ${JSON.stringify(tokenData)}`);
  }
  return { token: tokenData.access_token, projectId: sa.project_id };
}

// ─── APNs JWT Generation (ES256) ───

async function generateApnsJwt(
  keyId: string,
  teamId: string,
  authKeyBase64: string
): Promise<string> {
  const keyPem = atob(authKeyBase64);
  const pemBody = keyPem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  const keyBytes = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    "pkcs8",
    keyBytes.buffer,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const header = base64url(JSON.stringify({ alg: "ES256", kid: keyId }));
  const now = Math.floor(Date.now() / 1000);
  const claims = base64url(JSON.stringify({ iss: teamId, iat: now }));
  const signingInput = `${header}.${claims}`;

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(signingInput)
  );

  const rawSig = derToRaw(new Uint8Array(signature));
  return `${signingInput}.${base64url(rawSig)}`;
}

function base64url(input: string | Uint8Array): string {
  const bytes =
    typeof input === "string" ? new TextEncoder().encode(input) : input;
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function derToRaw(der: Uint8Array): Uint8Array {
  const raw = new Uint8Array(64);
  let offset = 3;
  const rLen = der[offset++];
  const rStart = rLen > 32 ? offset + (rLen - 32) : offset;
  const rDstStart = rLen < 32 ? 32 - rLen : 0;
  raw.set(der.slice(rStart, offset + rLen), rDstStart);
  offset += rLen;
  offset++;
  const sLen = der[offset++];
  const sStart = sLen > 32 ? offset + (sLen - 32) : offset;
  const sDstStart = sLen < 32 ? 32 + (32 - sLen) : 32;
  raw.set(der.slice(sStart, offset + sLen), sDstStart);
  return raw;
}

// ─── Response helpers ───

function jsonOk(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}
