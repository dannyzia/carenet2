/**
 * Caregiver Contacts Service — fetch eligible chat contacts for caregivers
 *
 * Provides:
 * - All agencies (any profile with role='agency')
 * - Active job contacts: guardian, patient, fellow caregivers from active CJ assignments
 */
import { USE_SUPABASE, sbRead, sbData, currentUserId, useInAppMockDataset } from "./_sb";
import { demoOfflineDelayAndPick } from "./demoOfflineMock";
import { MOCK_AGENCY_PROFILES, MOCK_ACTIVE_JOB_CONTACTS } from "@/backend/api/mock/caregiverMocks";

export interface CaregiverContact {
  id: string;
  name: string;
  role: "agency" | "guardian" | "patient" | "caregiver";
  group: "agencies" | "active_job_contacts";
  jobId?: string;
  jobTitle?: string;
  avatar?: string | null;
}

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

/** Map DB row to CaregiverContact */
function mapContact(row: any, group: CaregiverContact["group"]): CaregiverContact {
  return {
    id: String(row.id),
    name: String(row.name || "Unknown"),
    role: row.role as CaregiverContact["role"],
    group,
    avatar: row.avatar ?? null,
  };
}

export const caregiverContactsService = {
  /**
   * Get all agencies (global list of all profiles with role='agency')
   * Note: caregiverId parameter is not used in the Supabase query since agencies are global,
   * but is kept for interface consistency and potential future filtering.
   */
  async getAgenciesForCaregiver(caregiverId: string): Promise<CaregiverContact[]> {
    if (USE_SUPABASE) {
      return sbRead("cg:contacts:agencies", async () => {
        const { data, error } = await sbData()
          .from("profiles")
          .select("id,name,role,avatar")
          .eq("role", "agency")
          .order("name", { ascending: true });
        if (error) throw error;
        return (data || []).map((d) => mapContact(d, "agencies"));
      });
    }

    return demoOfflineDelayAndPick(200, MOCK_AGENCY_PROFILES, () => {
      return MOCK_AGENCY_PROFILES.map((a: any) => mapContact(a, "agencies"));
    });
  },

  /**
   * Get active job contacts:
   * - Guardian (owner of the GAC linked to active caregiving job)
   * - Fellow caregivers on same active job (other assignments)
   * - Patient (if patient has own profile, may need additional query)
   *
   * Correct chain: my CAC → my assignments → active jobs → GAC → guardian
   *                                        → other assignments on same job → other caregivers
   */
  async getActiveJobContacts(caregiverId?: string): Promise<CaregiverContact[]> {
    const cgId = caregiverId ?? (await currentUserId());

    if (USE_SUPABASE) {
      return sbRead(`cg:contacts:active:${cgId}`, async () => {
        // Step 1: Get caregiver's CAC IDs (caregiver_agency contracts)
        const { data: cacData, error: cacError } = await sbData()
          .from("care_contracts")
          .select("id")
          .eq("owner_id", cgId)
          .eq("contract_party_scope", "caregiver_agency");

        if (cacError) throw cacError;
        const myCacIds = (cacData || []).map((c: any) => c.id);

        if (myCacIds.length === 0) return [];

        // Step 2: Get my active job assignments
        const { data: assignmentData, error: assignmentError } = await sbData()
          .from("caregiving_job_caregiver_assignments")
          .select("caregiving_job_id,caregiving_jobs!inner(status)")
          .in("caregiver_agency_contract_id", myCacIds)
          .eq("status", "assigned")
          .eq("caregiving_jobs.status", "active");

        if (assignmentError) throw assignmentError;
        const myActiveJobIds = new Set((assignmentData || []).map((a: any) => a.caregiving_job_id));

        if (myActiveJobIds.size === 0) return [];

        const jobIdsArray = Array.from(myActiveJobIds);

        // Step 3: Get guardians via GAC on these jobs
        const { data: guardianData, error: guardianError } = await sbData()
          .from("caregiving_jobs")
          .select(`
            id,
            guardian_agency_contract_id,
            care_contracts!inner(
              id,
              owner_id,
              profiles!inner(id,name,role,avatar)
            )
          `)
          .in("id", jobIdsArray)
          .not("guardian_agency_contract_id", "is", null);

        if (guardianError) throw guardianError;

        const guardians = (guardianData || [])
          .map((j: any) => j.care_contracts)
          .filter((c: any) => c?.profiles?.id !== cgId)
          .map((c: any) => ({
            ...mapContact(c.profiles, "active_job_contacts"),
            jobId: c.id,
            jobTitle: `Job via ${c.profiles?.name || 'Guardian'}`,
          }));

        // Step 3b: Get patients via placements table on these jobs
        // 2-step query because patients→profiles has no FK for PostgREST joins
        // Query 1: Get patient_id values from placements (placements.patient_id FK to patients.id exists)
        const { data: placementData, error: placementError } = await sbData()
          .from("placements")
          .select("patient_id,caregiving_job_id")
          .in("caregiving_job_id", jobIdsArray)
          .not("patient_id", "is", null)
          .eq("status", "active");

        if (placementError) throw placementError;

        const patientIds = [...new Set((placementData || []).map((p: any) => p.patient_id))];

        if (patientIds.length === 0) {
          return guardians; // No patients on these jobs
        }

        // Query 2: Get profiles for those patient IDs with role='patient'
        const { data: profileData, error: profileError } = await sbData()
          .from("profiles")
          .select("id,name,role,avatar")
          .in("id", patientIds)
          .eq("role", "patient");

        if (profileError) throw profileError;

        const patients = (profileData || [])
          .filter((p: any) => p.id !== cgId)
          .map((p: any) => ({
            ...mapContact(p, "active_job_contacts"),
            jobId: p.id,
            jobTitle: `Patient on Job`,
          }));

        // Step 4: Get fellow caregivers on same jobs (excluding my CACs)
        const { data: fellowData, error: fellowError } = await sbData()
          .from("caregiving_job_caregiver_assignments")
          .select(`
            caregiving_job_id,
            caregiver_agency_contract_id,
            care_contracts!inner(
              id,
              owner_id,
              profiles!inner(id,name,role,avatar)
            )
          `)
          .in("caregiving_job_id", jobIdsArray)
          .eq("status", "assigned")
          .not("caregiver_agency_contract_id", "in", `(${myCacIds.join(',')})`);

        if (fellowError) throw fellowError;

        const fellows = (fellowData || [])
          .map((a: any) => a.care_contracts)
          .filter((c: any) => c?.profiles?.id !== cgId)
          .map((c: any) => ({
            ...mapContact(c.profiles, "active_job_contacts"),
            jobId: c.id,
            jobTitle: `Fellow Caregiver`,
          }));

        // Combine and dedupe by id
        const combined = [...guardians, ...patients, ...fellows];
        const seen = new Set<string>();
        return combined.filter((c) => {
          if (seen.has(c.id)) return false;
          seen.add(c.id);
          return true;
        });
      });
    }

    return demoOfflineDelayAndPick(200, MOCK_ACTIVE_JOB_CONTACTS, () => {
      // Mock: return all active job contacts from mock data
      return MOCK_ACTIVE_JOB_CONTACTS.map((c: any) => ({
        id: c.id,
        name: c.name,
        role: c.role,
        group: "active_job_contacts" as const,
        avatar: c.avatar,
      }));
    });
  },

  /**
   * Get IDs of active jobs the caregiver is assigned to
   * Note: This is now integrated into getActiveJobContacts for efficiency
   */
  async _getMyActiveJobIds(caregiverId: string): Promise<Set<string>> {
    if (USE_SUPABASE) {
      // Get caregiver's CAC IDs first
      const { data: cacData, error: cacError } = await sbData()
        .from("care_contracts")
        .select("id")
        .eq("owner_id", caregiverId)
        .eq("contract_party_scope", "caregiver_agency");

      if (cacError) throw cacError;
      const myCacIds = (cacData || []).map((c: any) => c.id);

      if (myCacIds.length === 0) return new Set();

      // Then get assignments by CAC IDs
      const { data, error } = await sbData()
        .from("caregiving_job_caregiver_assignments")
        .select("caregiving_job_id,caregiving_jobs!inner(status)")
        .in("caregiver_agency_contract_id", myCacIds)
        .eq("status", "assigned")
        .eq("caregiving_jobs.status", "active");

      if (error) throw error;
      return new Set((data || []).map((d: any) => d.caregiving_job_id));
    }

    return new Set();
  },

  /**
   * Get all eligible participant IDs (for filtering conversations)
   * Returns Set of user IDs the caregiver can chat with
   */
  async getActiveJobParticipantIds(caregiverId?: string): Promise<Set<string>> {
    const contacts = await this.getActiveJobContacts(caregiverId);
    return new Set(contacts.map((c) => c.id));
  },

  /**
   * Search contacts by name (agencies + active job contacts)
   */
  async searchContacts(caregiverId: string, query: string): Promise<CaregiverContact[]> {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Return all when no query
      const [agencies, jobContacts] = await Promise.all([
        this.getAgenciesForCaregiver(caregiverId),
        this.getActiveJobContacts(caregiverId),
      ]);
      return [...agencies, ...jobContacts];
    }

    const [agencies, jobContacts] = await Promise.all([
      this.getAgenciesForCaregiver(caregiverId),
      this.getActiveJobContacts(caregiverId),
    ]);

    const filterByName = (c: CaregiverContact) =>
      c.name.toLowerCase().includes(q);

    return [
      ...agencies.filter(filterByName),
      ...jobContacts.filter(filterByName),
    ];
  },
};
