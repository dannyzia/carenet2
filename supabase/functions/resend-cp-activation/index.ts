/**
 * resend-cp-activation — Supabase Edge Function
 * ────────────────────────────────────────────────────────────────────────
 * Resends activation link to a Channel Partner lead. Can only be called by
 * the Channel Partner who created the lead.
 *
 * POST with header: Authorization: Bearer <USER_JWT>
 * Body: { "leadUserId": "uuid" }
 *
 * SECURITY: This function requires JWT verification. Deploy with:
 * supabase functions deploy resend-cp-activation --verify-jwt
 *
 * The function validates:
 * 1. JWT token is valid and not expired
 * 2. User is authenticated
 * 3. User is the Channel Partner who created the lead
 * 4. Activation resend window (default 72h) has not expired
 */

// @ts-ignore Deno import
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
// @ts-ignore Deno import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const denoEnv = (globalThis as any).Deno?.env;

interface ResendCpActivationPayload {
  leadUserId: string;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SENDGRID_API_KEY = denoEnv?.get("SENDGRID_API_KEY");
const SENDGRID_FROM_EMAIL = denoEnv?.get("SENDGRID_FROM_EMAIL") || "no-reply@carenet.app";

async function sendActivationEmail(
  recipientEmail: string,
  leadName: string,
  activationLink: string,
  siteUrl: string
): Promise<void> {
  if (!SENDGRID_API_KEY) {
    console.warn("[resend-cp-activation] SENDGRID_API_KEY is not configured; skipping email send.");
    return;
  }

  const subject = "Activate your CareNet account";
  const text = `Hello ${leadName},\n\nYour CareNet lead account activation link has been resent. Click below to activate your account:\n\n${activationLink}\n\nIf you did not request this, please ignore this email.`;
  const html = `
    <p>Hello ${leadName},</p>
    <p>Your CareNet lead account activation link has been resent. Click below to activate your account:</p>
    <p><a href="${activationLink}">${activationLink}</a></p>
    <p>If you did not request this, please ignore this email.</p>
    <p>Thanks,<br/>CareNet</p>
  `;

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: recipientEmail }],
          subject,
        },
      ],
      from: { email: SENDGRID_FROM_EMAIL, name: "CareNet" },
      content: [
        { type: "text/plain", value: text },
        { type: "text/html", value: html },
      ],
    }),
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`SendGrid email failed: ${response.status} ${payload}`);
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return jsonError("Method not allowed", 405);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonError("Missing or invalid Authorization header", 401);
    }

    const supabaseUrl = denoEnv?.get("SUPABASE_URL")!;
    const supabaseAnonKey = denoEnv?.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = denoEnv?.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const siteUrl = denoEnv?.get("SITE_URL") || "https://localhost";

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

    const payload = await req.json() as ResendCpActivationPayload;
    if (!payload?.leadUserId) {
      return jsonError("Missing required field: leadUserId", 400);
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: leadRow, error: leadError } = await adminClient
      .from("channel_partner_leads")
      .select("channel_partner_id,joined_at")
      .eq("lead_user_id", payload.leadUserId)
      .single();
    if (leadError || !leadRow) {
      return jsonError("Lead not found", 404);
    }

    const joinedAt = leadRow.joined_at ? new Date(leadRow.joined_at) : null;
    if (!joinedAt) {
      return jsonError("Activation window cannot be validated for this lead", 400);
    }

    const resendWindowHours = Number(denoEnv?.get("CP_ACTIVATION_LINK_RESEND_WINDOW_HOURS") ?? "72") || 72;
    const hoursSince = (Date.now() - joinedAt.getTime()) / (1000 * 60 * 60);
    if (hoursSince > resendWindowHours) {
      return jsonError("Activation link resend window expired (72h). Contact admin.", 400);
    }

    const { data: cpRow, error: cpError } = await adminClient
      .from("channel_partners")
      .select("user_id")
      .eq("id", leadRow.channel_partner_id)
      .single();
    if (cpError || !cpRow) {
      return jsonError("Channel Partner profile not found", 404);
    }

    if (cpRow.user_id !== user.id) {
      return jsonError("Unauthorized: You may only resend activation links for your own leads", 403);
    }

    const { data: profileRow, error: profileError } = await adminClient
      .from("profiles")
      .select("email,name")
      .eq("id", payload.leadUserId)
      .single();
    if (profileError || !profileRow) {
      return jsonError("Lead profile not found", 404);
    }

    if (!profileRow.email) {
      return jsonError("Lead does not have an email to resend activation link", 400);
    }

    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      email: profileRow.email,
      options: {
        redirectTo: `${siteUrl}/auth/login`,
      },
    });
    if (linkError) {
      console.warn("[resend-cp-activation] Activation link generation failed:", linkError.message);
      return jsonError(`Failed to generate activation link: ${linkError.message}`, 500);
    }

    const activationLink = (linkData as any)?.properties?.link || null;
    let emailSent = false;
    const sendGridEnabled = Boolean(SENDGRID_API_KEY);

    if (activationLink) {
      try {
        await sendActivationEmail(profileRow.email, profileRow.name || "Lead", activationLink, siteUrl);
        emailSent = true;
      } catch (sendError) {
        console.warn("[resend-cp-activation] Activation email send failed:", sendError);
        if (sendGridEnabled) {
          return jsonError("Activation email could not be resent", 500);
        }
      }
    }

    return jsonOk({
      status: "ok",
      activationLink,
      emailSent,
    });
  } catch (err) {
    console.error("[resend-cp-activation] Unhandled error:", err);
    return jsonError("Internal server error", 500);
  }
});

function jsonOk(body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function jsonError(message: string, status = 400) {
  return new Response(JSON.stringify({ status: "error", message }), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}
