// @ts-ignore Deno import
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
// @ts-ignore Deno import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const denoEnv = (globalThis as any).Deno?.env;

interface CreateCpLeadPayload {
  cpId: string;
  leadRole: string;
  name: string;
  phone: string;
  district: string;
  email: string | null;
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
    console.warn("[create-cp-lead] SENDGRID_API_KEY is not configured; skipping email send.");
    return;
  }

  const subject = "Activate your CareNet account";
  const text = `Hello ${leadName},\n\nYour CareNet lead account is ready. Click the link below to activate your account and complete setup:\n\n${activationLink}\n\nIf you did not request this, please ignore this email.`;
  const html = `
    <p>Hello ${leadName},</p>
    <p>Your CareNet lead account is ready. Click the link below to activate your account and complete setup:</p>
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

    const payload = await req.json() as CreateCpLeadPayload;
    if (!payload?.cpId || !payload?.leadRole || !payload?.name || !payload?.phone) {
      return jsonError("Missing required fields: cpId, leadRole, name, phone", 400);
    }

    const leadRole = payload.leadRole;
    const allowedRoles = ["guardian", "agency", "caregiver", "shop"];
    if (!allowedRoles.includes(leadRole)) {
      return jsonError("Invalid leadRole", 400);
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: cpRow, error: cpError } = await adminClient
      .from("channel_partners")
      .select("id,user_id")
      .eq("id", payload.cpId)
      .single();

    if (cpError || !cpRow) {
      return jsonError("Channel Partner profile not found", 404);
    }

    if (cpRow.user_id !== user.id) {
      return jsonError("Unauthorized: Lead creation is allowed only for your own Channel Partner account", 403);
    }

    const uniquenessQuery = adminClient.from("profiles").select("id");
    const orConditions = [];
    orConditions.push(`phone.eq.${payload.phone}`);
    if (payload.email) {
      orConditions.push(`email.eq.${payload.email}`);
    }

    const { data: existingProfile, error: existingError } = await uniquenessQuery.or(orConditions.join(","))?.single();
    if (existingError && existingError.code !== "PGRST116") {
      return jsonError(`Failed to validate lead uniqueness: ${existingError.message}`, 500);
    }
    if (existingProfile) {
      return jsonError("Already registered - ask them to use your referral code instead", 409);
    }

    const createPayload: Record<string, unknown> = {
      phone: payload.phone,
      user_metadata: {
        leadRole,
        district: payload.district,
      },
    };
    if (payload.email) {
      createPayload.email = payload.email;
    }

    const { data: createdUser, error: createError } = await adminClient.auth.admin.createUser(createPayload);
    if (createError || !createdUser?.user) {
      return jsonError(`Failed to create lead user: ${createError?.message || 'Unknown error'}`, 500);
    }

    const leadUserId = createdUser.user.id;

    const profileRowInsert = {
      id: leadUserId,
      name: payload.name,
      phone: payload.phone,
      district: payload.district,
      email: payload.email,
      role: leadRole,
      created_at: new Date().toISOString(),
    };

    const { error: profileInsertError } = await adminClient
      .from("profiles")
      .insert(profileRowInsert);
    if (profileInsertError) {
      return jsonError(`Failed to create profile for lead: ${profileInsertError.message}`, 500);
    }

    const { error: leadInsertError } = await adminClient
      .from("channel_partner_leads")
      .insert({
        channel_partner_id: payload.cpId,
        lead_user_id: leadUserId,
        lead_role: leadRole,
        attribution_method: "cp_created",
        referral_code_used: null,
        is_active: true,
        joined_at: new Date().toISOString(),
      });
    if (leadInsertError) {
      return jsonError(`Failed to attribute lead: ${leadInsertError.message}`, 500);
    }

    let activationLink: string | null = null;
    let emailSent = false;
    const sendGridEnabled = Boolean(SENDGRID_API_KEY);
    if (payload.email) {
      const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
        email: payload.email,
        options: {
          redirectTo: `${siteUrl}/auth/login`,
        },
      });
      if (linkError) {
        console.warn("[create-cp-lead] Activation link generation failed:", linkError.message);
      } else {
        activationLink = (linkData as any)?.properties?.link || null;
      }

      if (activationLink) {
        try {
          await sendActivationEmail(payload.email, payload.name, activationLink, siteUrl);
          emailSent = true;
        } catch (sendError) {
          console.warn("[create-cp-lead] Activation email send failed:", sendError);
          if (sendGridEnabled) {
            return jsonError("Activation email could not be sent", 500);
          }
        }
      }
    }

    return jsonOk({
      success: true,
      leadUserId,
      activationLink,
      emailSent,
    });
  } catch (err) {
    console.error("[create-cp-lead] Unhandled error:", err);
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
