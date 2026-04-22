/**
 * Live Supabase integration tests for caregiverContacts queries.
 *
 * Validates every query step from `caregiverContacts.service.ts`
 * against the real database, including RLS behaviour.
 *
 * Required env vars (auto-skip when absent):
 * - VITE_SUPABASE_URL
 * - VITE_SUPABASE_ANON_KEY
 * - TEST_CAREGIVER_EMAIL
 * - TEST_CAREGIVER_PASSWORD
 */
import { afterAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.VITE_SUPABASE_URL;
const ANON = process.env.VITE_SUPABASE_ANON_KEY;
const EMAIL = process.env.TEST_CAREGIVER_EMAIL;
const PASSWORD = process.env.TEST_CAREGIVER_PASSWORD;
const run = Boolean(URL && ANON && EMAIL && PASSWORD);

let sb: SupabaseClient | null = null;
let caregiverId: string | null = null;
let myCacIds: string[] = [];
let myActiveJobIds: string[] = [];

async function getClient(): Promise<SupabaseClient> {
  if (!URL || !ANON) throw new Error("Supabase env is missing");
  if (!sb) {
    sb = createClient(URL, ANON);
    const { data, error } = await sb.auth.signInWithPassword({
      email: EMAIL!,
      password: PASSWORD!,
    });
    if (error) {
      sb = null;
      throw error;
    }
    caregiverId = data.user.id;
  }
  return sb;
}

describe.skipIf(!run)("caregiverContacts (real Supabase)", () => {
  afterAll(async () => {
    if (sb) await sb.auth.signOut();
  });

  it("Step 1: gets CAC IDs for caregiver", async () => {
    const client = await getClient();
    const { data, error } = await client
      .from("care_contracts")
      .select("id")
      .eq("owner_id", caregiverId!)
      .eq("contract_party_scope", "caregiver_agency");
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
    myCacIds = (data || []).map((c: any) => c.id);
  });

  it("Step 2: gets active job assignments", async () => {
    const client = await getClient();
    if (myCacIds.length === 0) return;

    const { data, error } = await client
      .from("caregiving_job_caregiver_assignments")
      .select("caregiving_job_id,caregiving_jobs!inner(status)")
      .in("caregiver_agency_contract_id", myCacIds)
      .eq("status", "assigned")
      .eq("caregiving_jobs.status", "active");
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
    const uniqueIds = new Set((data || []).map((a: any) => a.caregiving_job_id));
    myActiveJobIds = Array.from(uniqueIds);
  });

  it("Step 3: gets guardian contacts via GAC", async () => {
    const client = await getClient();
    if (myActiveJobIds.length === 0) return;

    const { data, error } = await client
      .from("caregiving_jobs")
      .select(
        `id,
        guardian_agency_contract_id,
        care_contracts!inner(
          id,
          owner_id,
          profiles!inner(id,name,role,avatar)
        )`
      )
      .in("id", myActiveJobIds)
      .not("guardian_agency_contract_id", "is", null);
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
    (data || []).forEach((j: any) => {
      expect(j.care_contracts).toBeDefined();
      expect(j.care_contracts.profiles).toBeDefined();
    });
  });

  it("Step 3b (Query 1): gets patient_ids from placements", async () => {
    const client = await getClient();
    if (myActiveJobIds.length === 0) return;

    const { data, error } = await client
      .from("placements")
      .select("patient_id,caregiving_job_id")
      .in("caregiving_job_id", myActiveJobIds)
      .not("patient_id", "is", null)
      .eq("status", "active");
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it("Step 3b (Query 2): gets patient profiles by IDs", async () => {
    const client = await getClient();
    if (myActiveJobIds.length === 0) return;

    const { data: placementData } = await client
      .from("placements")
      .select("patient_id")
      .in("caregiving_job_id", myActiveJobIds)
      .not("patient_id", "is", null)
      .eq("status", "active");
    const patientIds = [...new Set((placementData || []).map((p: any) => p.patient_id))];
    if (patientIds.length === 0) return;

    const { data, error } = await client
      .from("profiles")
      .select("id,name,role,avatar")
      .in("id", patientIds)
      .eq("role", "patient");
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
    (data || []).forEach((p: any) => {
      expect(p.role).toBe("patient");
    });
  });

  it("Step 4: gets fellow caregivers on same jobs", async () => {
    const client = await getClient();
    if (myActiveJobIds.length === 0 || myCacIds.length === 0) return;

    const { data, error } = await client
      .from("caregiving_job_caregiver_assignments")
      .select(
        `caregiving_job_id,
        caregiver_agency_contract_id,
        care_contracts!inner(
          id,
          owner_id,
          profiles!inner(id,name,role,avatar)
        )`
      )
      .in("caregiving_job_id", myActiveJobIds)
      .eq("status", "assigned")
      .not("caregiver_agency_contract_id", "in", `(${myCacIds.join(",")})`);
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });
});
