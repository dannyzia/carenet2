/**
 * Live DB integration tests for care_contract lifecycle trigger behavior.
 *
 * Required env vars:
 * - VITE_SUPABASE_URL
 * - VITE_SUPABASE_ANON_KEY
 * - TEST_GUARDIAN_EMAIL (use process.env — put in `.env`; Vite does not expose non-VITE_ keys to import.meta.env)
 * - TEST_GUARDIAN_PASSWORD
 */
import { afterAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const env = typeof import.meta.env !== "undefined" ? import.meta.env : ({} as Record<string, string>);
const URL = (process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL) as string | undefined;
const ANON = (process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY) as string | undefined;
const EMAIL = process.env.TEST_GUARDIAN_EMAIL;
const PASSWORD = process.env.TEST_GUARDIAN_PASSWORD;

const run = Boolean(URL && ANON && EMAIL && PASSWORD);

let client: SupabaseClient | null = null;
const createdIds: string[] = [];

function newId(): string {
  return crypto.randomUUID();
}

async function authClient(): Promise<SupabaseClient> {
  if (!URL || !ANON) throw new Error("Supabase env is missing");
  if (!client) {
    client = createClient(URL, ANON);
    const { error } = await client.auth.signInWithPassword({ email: EMAIL!, password: PASSWORD! });
    if (error) {
      client = null;
      throw error;
    }
  }
  return client;
}

async function getTemplateRequestRow(sb: SupabaseClient, ownerId: string): Promise<Record<string, unknown>> {
  const { data, error } = await sb
    .from("care_contracts")
    .select("*")
    .eq("owner_id", ownerId)
    .eq("type", "request")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("No visible request template row for test guardian");
  return data as Record<string, unknown>;
}

function makeInsertRow(template: Record<string, unknown>, ownerId: string, status: string): Record<string, unknown> {
  const now = new Date().toISOString();
  const row: Record<string, unknown> = { ...template };
  row.id = newId();
  row.owner_id = ownerId;
  row.type = "request";
  row.status = status;
  row.agency_id = null;
  row.bid_count = 0;
  row.title = `[test-lifecycle] ${String(template.title ?? "request")} ${now}`;
  row.created_at = now;
  row.updated_at = now;
  row.published_at = status === "published" ? now : null;
  return row;
}

describe.skipIf(!run)("care_contracts lifecycle (DB integration)", () => {
  afterAll(async () => {
    if (!client || createdIds.length === 0) return;
    await client.from("care_contracts").delete().in("id", createdIds);
    await client.auth.signOut();
  });

  it("rejects invalid draft -> active transition; allows draft -> published -> bidding -> locked", async () => {
    const sb = await authClient();
    const { data: userData, error: userErr } = await sb.auth.getUser();
    if (userErr || !userData.user) throw userErr ?? new Error("No signed-in user");
    const ownerId = userData.user.id;

    const template = await getTemplateRequestRow(sb, ownerId);
    const draft = makeInsertRow(template, ownerId, "draft");

    const { error: insErr } = await sb.from("care_contracts").insert(draft);
    expect(insErr).toBeNull();
    createdIds.push(String(draft.id));

    const { error: invalidUpdateErr } = await sb
      .from("care_contracts")
      .update({ status: "active" })
      .eq("id", draft.id);
    expect(invalidUpdateErr).toBeTruthy();
    expect((invalidUpdateErr as { code?: string }).code).toBe("23514");

    const { error: toPublishedErr } = await sb
      .from("care_contracts")
      .update({ status: "published", published_at: new Date().toISOString() })
      .eq("id", draft.id);
    expect(toPublishedErr).toBeNull();

    const { error: toBiddingErr } = await sb
      .from("care_contracts")
      .update({ status: "bidding" })
      .eq("id", draft.id);
    expect(toBiddingErr).toBeNull();

    const { error: toLockedErr } = await sb
      .from("care_contracts")
      .update({ status: "locked" })
      .eq("id", draft.id);
    expect(toLockedErr).toBeNull();
  });

  it("rejects INSERT when initial status is active", async () => {
    const sb = await authClient();
    const { data: userData, error: userErr } = await sb.auth.getUser();
    if (userErr || !userData.user) throw userErr ?? new Error("No signed-in user");
    const ownerId = userData.user.id;

    const template = await getTemplateRequestRow(sb, ownerId);
    const invalidInsert = makeInsertRow(template, ownerId, "active");

    const { error } = await sb.from("care_contracts").insert(invalidInsert);
    expect(error).toBeTruthy();
    expect((error as { code?: string }).code).toBe("23514");
  });
});
