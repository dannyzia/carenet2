/**
 * Caregiving jobs (GAC + CAC) — RPC wrappers aligned with Supabase convergence migration.
 */
import { assertCompatiblePair, type ConvergenceScopeRow } from "@/backend/domain/caregivingJob/assertCompatible";
import { USE_SUPABASE, sbData, sbWrite, sbRead, currentUserId, useInAppMockDataset } from "./_sb";
import { agentDebugLog } from "@/debug/agentDebugLog";
import { isMissingRestRelation } from "@/backend/utils/supabasePostgrestErrors";

export type AgencyConvergenceContractRow = {
  id: string;
  title: string;
  status: string;
  gac_kind: string | null;
  staffing_channel: string | null;
  contract_party_scope: string | null;
};

export type CaregivingAssignmentRow = {
  id: string;
  caregiver_agency_contract_id: string;
  assignment_label: string;
  role: string | null;
  status: string;
};

export type CaregivingJobListRow = {
  id: string;
  guardian_agency_contract_id: string;
  agency_id: string;
  start_date: string | null;
  status: string;
  created_at: string;
  caregiving_job_caregiver_assignments: CaregivingAssignmentRow[];
};

async function fetchScopeRow(contractId: string): Promise<ConvergenceScopeRow> {
  const { data, error } = await sbData()
    .from("care_contracts")
    .select("contract_party_scope, gac_kind, staffing_channel")
    .eq("id", contractId)
    .single();
  if (error) throw error;
  if (!data) throw new Error("Contract not found");
  return data as ConvergenceScopeRow;
}

export const caregivingJobService = {
  async listAgencyGacContracts(): Promise<AgencyConvergenceContractRow[]> {
    if (!USE_SUPABASE || useInAppMockDataset()) return [];
    const userId = await currentUserId();
    return sbRead(`cj:gac:${userId}`, async () => {
      const { data, error } = await sbData()
        .from("care_contracts")
        .select("id,title,status,gac_kind,staffing_channel,contract_party_scope")
        .eq("agency_id", userId)
        .eq("contract_party_scope", "guardian_agency")
        .not("gac_kind", "is", null)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((r: Record<string, unknown>) => ({
        id: String(r.id),
        title: String(r.title ?? ""),
        status: String(r.status ?? ""),
        gac_kind: r.gac_kind != null ? String(r.gac_kind) : null,
        staffing_channel: r.staffing_channel != null ? String(r.staffing_channel) : null,
        contract_party_scope: r.contract_party_scope != null ? String(r.contract_party_scope) : null,
      }));
    });
  },

  async listAgencyCacContracts(): Promise<AgencyConvergenceContractRow[]> {
    if (!USE_SUPABASE || useInAppMockDataset()) return [];
    const userId = await currentUserId();
    return sbRead(`cj:cac:${userId}`, async () => {
      const { data, error } = await sbData()
        .from("care_contracts")
        .select("id,title,status,gac_kind,staffing_channel,contract_party_scope")
        .eq("agency_id", userId)
        .eq("contract_party_scope", "caregiver_agency")
        .not("staffing_channel", "is", null)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((r: Record<string, unknown>) => ({
        id: String(r.id),
        title: String(r.title ?? ""),
        status: String(r.status ?? ""),
        gac_kind: r.gac_kind != null ? String(r.gac_kind) : null,
        staffing_channel: r.staffing_channel != null ? String(r.staffing_channel) : null,
        contract_party_scope: r.contract_party_scope != null ? String(r.contract_party_scope) : null,
      }));
    });
  },

  async listJobsWithAssignments(): Promise<CaregivingJobListRow[]> {
    if (!USE_SUPABASE || useInAppMockDataset()) return [];
    const userId = await currentUserId();
    return sbRead(`cj:jobs:${userId}`, async () => {
      const { data, error } = await sbData()
        .from("caregiving_jobs")
        .select(
          `
          id,
          guardian_agency_contract_id,
          agency_id,
          start_date,
          status,
          created_at,
          caregiving_job_caregiver_assignments (
            id,
            caregiver_agency_contract_id,
            assignment_label,
            role,
            status
          )
        `,
        )
        .eq("agency_id", userId)
        .order("created_at", { ascending: false });
      if (error) {
        // #region agent log
        agentDebugLog({
          hypothesisId: "H1",
          location: "caregivingJob.service.ts:listJobsWithAssignments",
          message: "caregiving_jobs query error",
          data: { code: error.code, message: error.message },
        });
        // #endregion
        if (isMissingRestRelation(error)) return [];
        throw error;
      }
      return (data || []).map((row: Record<string, unknown>) => {
        const raw = row.caregiving_job_caregiver_assignments;
        const arr = Array.isArray(raw) ? raw : raw ? [raw] : [];
        return {
          id: String(row.id),
          guardian_agency_contract_id: String(row.guardian_agency_contract_id),
          agency_id: String(row.agency_id),
          start_date: row.start_date != null ? String(row.start_date) : null,
          status: String(row.status ?? ""),
          created_at: String(row.created_at ?? ""),
          caregiving_job_caregiver_assignments: arr.map((a: Record<string, unknown>) => ({
            id: String(a.id),
            caregiver_agency_contract_id: String(a.caregiver_agency_contract_id),
            assignment_label: String(a.assignment_label ?? ""),
            role: a.role != null ? String(a.role) : null,
            status: String(a.status ?? ""),
          })),
        };
      });
    });
  },

  async createCaregivingJob(input: {
    gacId: string;
    cacId: string;
    agencyId: string;
    assignmentLabel: string;
    startDate?: string | null;
    schedulePattern?: Record<string, unknown> | null;
  }): Promise<{ job_id: string; assignment_id: string }> {
    if (!USE_SUPABASE) {
      throw new Error("[CareNet] Caregiving jobs require Supabase.");
    }
    const label = (input.assignmentLabel ?? "").trim();
    if (!label) {
      throw new Error("assignment_label required");
    }
    const [gac, cac] = await Promise.all([fetchScopeRow(input.gacId), fetchScopeRow(input.cacId)]);
    assertCompatiblePair(gac, cac);

    return sbWrite(async () => {
      const { data, error } = await sbData().rpc("create_caregiving_job", {
        p_gac_id: input.gacId,
        p_cac_id: input.cacId,
        p_agency_id: input.agencyId,
        p_assignment_label: label,
        p_start_date: input.startDate ?? null,
        p_schedule_pattern: input.schedulePattern ?? null,
      });
      if (error) throw error;
      const row = data as { job_id?: string; assignment_id?: string };
      if (!row?.job_id || !row?.assignment_id) throw new Error("create_caregiving_job: invalid response");
      return { job_id: row.job_id, assignment_id: row.assignment_id };
    });
  },

  async addCaregiverToJob(input: {
    jobId: string;
    cacId: string;
    assignmentLabel: string;
    role?: string | null;
  }): Promise<{ assignment_id: string }> {
    if (!USE_SUPABASE) {
      throw new Error("[CareNet] Caregiving jobs require Supabase.");
    }
    const label = (input.assignmentLabel ?? "").trim();
    if (!label) {
      throw new Error("assignment_label required");
    }

    const { data: job, error: jobErr } = await sbData()
      .from("caregiving_jobs")
      .select("guardian_agency_contract_id, agency_id")
      .eq("id", input.jobId)
      .single();
    if (jobErr) throw jobErr;
    if (!job) throw new Error("Job not found");

    const uid = await currentUserId();
    if (String((job as { agency_id: string }).agency_id) !== uid) {
      throw new Error("Not authorized for this job");
    }

    const gacId = String((job as { guardian_agency_contract_id: string }).guardian_agency_contract_id);
    const [gac, cac] = await Promise.all([fetchScopeRow(gacId), fetchScopeRow(input.cacId)]);
    assertCompatiblePair(gac, cac);

    return sbWrite(async () => {
      const { data, error } = await sbData().rpc("add_caregiver_to_caregiving_job", {
        p_job_id: input.jobId,
        p_cac_id: input.cacId,
        p_assignment_label: label,
        p_role: input.role ?? null,
      });
      if (error) throw error;
      const row = data as { assignment_id?: string };
      if (!row?.assignment_id) throw new Error("add_caregiver_to_caregiving_job: invalid response");
      return { assignment_id: row.assignment_id };
    });
  },
};
