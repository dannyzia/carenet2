/**
 * push-notification — Supabase Edge Function
 * ────────────────────────────────────────────
 * Validates the caller's JWT, inserts a notification row into the
 * `notifications` table (which triggers Realtime for connected clients),
 * and optionally dispatches FCM/APNs push to the receiver's stored
 * device tokens.
 *
 * POST body:
 *   { type, title, body, receiver_id, action_url?, metadata? }
 *
 * Auth: Bearer token (Supabase anon/service key JWT)
 *
 * The INSERT into `notifications` is what drives the client-side
 * Realtime subscription in useBillingNotifications — the Edge Function
 * doesn't need to "push" to connected WebSocket clients directly.
 *
 * Deployment:
 *   supabase functions deploy push-notification
 *
 * Required env vars (set via Supabase dashboard > Edge Functions > Secrets):
 *   - FCM_SERVICE_ACCOUNT_JSON  (optional — base64-encoded Firebase service account JSON)
 *   - APNS_KEY_ID      (optional — for Apple Push Notification Service)
 *   - APNS_TEAM_ID     (optional)
 *   - APNS_BUNDLE_ID   (optional)
 *   - APNS_AUTH_KEY     (optional — base64-encoded .p8 key)
 */

// @ts-ignore Deno import
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
// @ts-ignore Deno import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// ─── Types ───

interface PushPayload {
  type: string;
  title: string;
  body: string;
  receiver_id: string;
  action_url?: string;
  metadata?: Record<string, unknown>;
}

interface DeviceToken {
  id: string;
  user_id: string;
  platform: "fcm" | "apns";
  token: string;
  active: boolean;
}

interface QuietHoursConfig {
  quiet_hours_enabled: boolean;
  quiet_hours_start: string; // "HH:MM" or "HH:MM:SS"
  quiet_hours_end: string;
}

interface QueuedNotification {
  id: string;
  deliver_at: string;
  notification_id: string;
}

// ─── CORS headers ───

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─── Main handler ───

serve(async (req: Request) => {
  // Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return jsonError("Method not allowed", 405);
  }

  try {
    // ── 1. Validate JWT ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonError("Missing or invalid Authorization header", 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Create a client using the caller's JWT to verify identity
    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await callerClient.auth.getUser();

    if (authError || !user) {
      return jsonError("Invalid or expired token", 401);
    }

    const senderId = user.id;

    // ── 2. Parse & validate body ──
    const payload: PushPayload = await req.json();

    if (!payload.type || !payload.title || !payload.body || !payload.receiver_id) {
      return jsonError(
        "Missing required fields: type, title, body, receiver_id",
        400
      );
    }

    // Validate type prefix (billing, CP, and other app notification prefixes)
    const ALLOWED_PREFIXES = ["billing_", "system_", "shift_", "message_", "cp_"];
    const hasValidPrefix = ALLOWED_PREFIXES.some((p) =>
      payload.type.startsWith(p)
    );
    if (!hasValidPrefix) {
      return jsonError(
        `Invalid notification type prefix. Allowed: ${ALLOWED_PREFIXES.join(", ")}`,
        400
      );
    }

    // ── 3. Check receiver's notification preferences ──
    // Use service-role client for DB operations (bypasses RLS)
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Derive the notification channel from the type prefix
    const channelFromType = payload.type.startsWith("billing_")
      ? "billing"
      : payload.type.startsWith("shift_")
      ? "shift-reminders"
      : payload.type.startsWith("message_")
      ? "messages"
      : "system";

    const { data: prefRow } = await adminClient
      .from("user_preferences")
      .select("notification_channels, quiet_hours_enabled, quiet_hours_start, quiet_hours_end")
      .eq("user_id", payload.receiver_id)
      .single();

    // If user has explicitly muted this channel, skip insert + push entirely
    if (prefRow?.notification_channels) {
      const channels = prefRow.notification_channels as Record<
        string,
        { enabled: boolean }
      >;
      if (channels[channelFromType]?.enabled === false) {
        return jsonOk({
          status: "skipped",
          reason: `Receiver has muted "${channelFromType}" channel`,
        });
      }
    }

    // ── 3b. Check quiet hours ──
    // If quiet hours are enabled and we're currently inside them,
    // insert the notification (so it appears when user opens app)
    // but skip native push. Queue it for delivery when quiet hours end.
    const quietHours = prefRow as QuietHoursConfig | null;
    const isInQuietHours = quietHours?.quiet_hours_enabled !== false &&
      checkQuietHours(
        quietHours?.quiet_hours_start || "22:00",
        quietHours?.quiet_hours_end || "07:00"
      );

    // ── 4. Insert into notifications table ──
    // This INSERT triggers the postgres_changes Realtime event that
    // the receiver's useBillingNotifications hook is subscribed to.
    const notificationRow = {
      id: crypto.randomUUID(),
      type: payload.type,
      channel: channelFromType,
      title_en: payload.title,
      title_bn: payload.title, // TODO: auto-translate via Edge Function or store both
      message_en: payload.body,
      message_bn: payload.body,
      sender_id: senderId,
      receiver_id: payload.receiver_id,
      action_url: payload.action_url || null,
      metadata: payload.metadata || {},
      read: false,
      created_at: new Date().toISOString(),
    };

    const { error: insertError } = await adminClient
      .from("notifications")
      .insert(notificationRow);

    if (insertError) {
      console.error("[push-notification] Insert error:", insertError);
      return jsonError(`Failed to insert notification: ${insertError.message}`, 500);
    }

    // ── 5. Optional: Send native push via FCM / APNs ──
    let pushResults = { fcm: 0, apns: 0, errors: [] as string[] };

    if (isInQuietHours) {
      // During quiet hours: notification is inserted (for in-app/Realtime)
      // but native push is deferred. We store a queued entry that a
      // scheduled cron or pg_cron job can pick up at quiet_hours_end.
      try {
        const deliverAt = getQuietHoursEndTimestamp(
          quietHours?.quiet_hours_end || "07:00"
        );
        await adminClient.from("queued_notifications").insert({
          id: crypto.randomUUID(),
          notification_id: notificationRow.id,
          receiver_id: payload.receiver_id,
          deliver_at: deliverAt,
          processed: false,
          created_at: new Date().toISOString(),
        });
      } catch (e) {
        // If queued_notifications table doesn't exist yet, log and continue
        console.warn("[push-notification] Could not queue for quiet hours:", (e as Error).message);
      }

      return jsonOk({
        status: "sent",
        notification_id: notificationRow.id,
        push: { fcm: 0, apns: 0, errors: [], quiet_hours: true },
        quiet_hours: {
          deferred: true,
          deliver_at: getQuietHoursEndTimestamp(quietHours?.quiet_hours_end || "07:00"),
        },
      });
    }

    pushResults = await sendNativePush(adminClient, payload, notificationRow.id);

    return jsonOk({
      status: "sent",
      notification_id: notificationRow.id,
      push: pushResults,
    });
  } catch (err) {
    console.error("[push-notification] Unhandled error:", err);
    return jsonError("Internal server error", 500);
  }
});

// ─── Native Push (FCM + APNs) ───

async function sendNativePush(
  adminClient: ReturnType<typeof createClient>,
  payload: PushPayload,
  notificationId: string
): Promise<{ fcm: number; apns: number; errors: string[] }> {
  const result = { fcm: 0, apns: 0, errors: [] as string[] };

  // Fetch active device tokens for the receiver
  const { data: tokens, error } = await adminClient
    .from("device_tokens")
    .select("*")
    .eq("user_id", payload.receiver_id)
    .eq("active", true);

  if (error || !tokens || tokens.length === 0) {
    return result; // No registered devices — Realtime handles in-app delivery
  }

  const fcmTokens = (tokens as DeviceToken[]).filter((t) => t.platform === "fcm");
  const apnsTokens = (tokens as DeviceToken[]).filter((t) => t.platform === "apns");

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
  // APNs requires a signed JWT using the .p8 auth key.
  // This is a placeholder — full APNs JWT signing requires the
  // APNS_AUTH_KEY, APNS_KEY_ID, and APNS_TEAM_ID secrets.
  const apnsKeyId = Deno.env.get("APNS_KEY_ID");
  const apnsTeamId = Deno.env.get("APNS_TEAM_ID");
  const apnsBundleId = Deno.env.get("APNS_BUNDLE_ID");
  const apnsAuthKey = Deno.env.get("APNS_AUTH_KEY"); // base64 .p8

  if (apnsKeyId && apnsTeamId && apnsBundleId && apnsAuthKey && apnsTokens.length > 0) {
    try {
      // Generate APNs JWT (ES256)
      const apnsJwt = await generateApnsJwt(apnsKeyId, apnsTeamId, apnsAuthKey);
      const apnsHost = "https://api.push.apple.com"; // Production; use api.sandbox.push.apple.com for dev

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
            // Token is invalid — deactivate
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
  // Decode the base64 .p8 key
  const keyPem = atob(authKeyBase64);
  // Extract the raw key bytes (strip PEM header/footer)
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

  // Convert DER signature to raw r||s format for JWT
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
  // DER-encoded ECDSA signature → raw 64-byte r||s
  // This handles the common case; a full ASN.1 parser isn't needed for P-256
  const raw = new Uint8Array(64);
  let offset = 3; // skip 0x30, total length, 0x02
  const rLen = der[offset++];
  const rStart = rLen > 32 ? offset + (rLen - 32) : offset;
  const rDstStart = rLen < 32 ? 32 - rLen : 0;
  raw.set(der.slice(rStart, offset + rLen), rDstStart);
  offset += rLen;
  offset++; // skip 0x02
  const sLen = der[offset++];
  const sStart = sLen > 32 ? offset + (sLen - 32) : offset;
  const sDstStart = sLen < 32 ? 32 + (32 - sLen) : 32;
  raw.set(der.slice(sStart, offset + sLen), sDstStart);
  return raw;
}

// ─── Quiet Hours Helper ───

function checkQuietHours(start: string, end: string): boolean {
  const now = new Date();
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);

  const startTime = new Date(now);
  startTime.setHours(startHour, startMinute, 0, 0);

  const endTime = new Date(now);
  endTime.setHours(endHour, endMinute, 0, 0);

  // If end time is before start time, it means the quiet hours span midnight
  if (endTime < startTime) {
    return now >= startTime || now < endTime;
  }

  return now >= startTime && now < endTime;
}

function getQuietHoursEndTimestamp(end: string): string {
  const now = new Date();
  const [endHour, endMinute] = end.split(":").map(Number);

  const endTime = new Date(now);
  endTime.setHours(endHour, endMinute, 0, 0);

  // If end time is before current time, it means the quiet hours span midnight
  if (endTime < now) {
    endTime.setDate(endTime.getDate() + 1);
  }

  return endTime.toISOString();
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