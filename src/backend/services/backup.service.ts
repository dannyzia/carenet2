/**
 * Backup / Standby Caregiver Service (Phase 6)
 * No dedicated backup tables in DB yet — uses mock data with Supabase-ready structure.
 */
import type { BackupAssignment, ShiftReassignment, StandbySlot } from "@/backend/models";
import { USE_SUPABASE, sbRead, sbWrite, sb, sbData, useInAppMockDataset } from "./_sb";
import { demoOfflineDelayAndPick } from "./demoOfflineMock";

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

export const backupService = {
  async getBackupAssignments(): Promise<BackupAssignment[]> {
    if (USE_SUPABASE) {
      return sbRead("backup:assignments", async () => {
        const { data, error } = await sb().from("backup_assignments")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).map((d: any) => ({
          id: d.id,
          placementId: d.placement_id,
          caregiverId: d.caregiver_id,
          caregiverName: d.caregiver_name || "Unknown",
          priority: d.priority || 1,
          createdAt: d.created_at,
        }));
      });
    }
    return demoOfflineDelayAndPick(200, [] as BackupAssignment[], (m) => m.MOCK_BACKUP_ASSIGNMENTS);
  },

  async getReassignmentHistory(): Promise<ShiftReassignment[]> {
    if (USE_SUPABASE) {
      return sbRead("backup:reassignments", async () => {
        const { data, error } = await sb().from("shift_reassignments")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).map((d: any) => ({
          id: d.id,
          shiftId: d.shift_id,
          fromCaregiverId: d.from_caregiver_id,
          fromCaregiverName: d.from_caregiver_name || "Unknown",
          toCaregiverId: d.to_caregiver_id,
          toCaregiverName: d.to_caregiver_name || "Unknown",
          reason: d.reason || "",
          reassignedBy: d.reassigned_by_name || "System",
          reassignedAt: d.created_at,
          status: d.status || "completed",
        }));
      });
    }
    return demoOfflineDelayAndPick(200, [] as ShiftReassignment[], (m) => m.MOCK_SHIFT_REASSIGNMENTS);
  },

  async getStandbyPool(): Promise<StandbySlot[]> {
    // TODO: standby_pool table
    if (USE_SUPABASE) {
      return sbRead("backup:standby-pool", async () => {
        return [];
      });
    }
    return demoOfflineDelayAndPick(200, [] as StandbySlot[], (m) => m.MOCK_STANDBY_POOL);
  },

  async reassignShift(shiftId: string, toCaregiverId: string, reason: string): Promise<ShiftReassignment> {
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        // Update shift caregiver
        const { data: shift } = await sbData().from("shifts").select("caregiver_id").eq("id", shiftId).single();
        await sbData().from("shifts").update({ caregiver_id: toCaregiverId }).eq("id", shiftId);
        return {
          id: `sr-${crypto.randomUUID().slice(0, 8)}`,
          shiftId,
          fromCaregiverId: shift?.caregiver_id || "unknown",
          fromCaregiverName: "Previous Caregiver",
          toCaregiverId,
          toCaregiverName: "Selected Backup",
          reason,
          reassignedBy: "Agency Admin",
          reassignedAt: new Date().toISOString(),
          status: "pending" as const,
        };
      });
    }
    if (!useInAppMockDataset()) {
      throw new Error("[CareNet] Connect Supabase or use Demo Access for shift reassignment.");
    }
    await delay(400);
    return {
      id: `sr-${crypto.randomUUID().slice(0, 8)}`,
      shiftId,
      fromCaregiverId: "cg-current",
      fromCaregiverName: "Current Caregiver",
      toCaregiverId,
      toCaregiverName: "Selected Backup",
      reason,
      reassignedBy: "Agency Admin",
      reassignedAt: new Date().toISOString(),
      status: "pending",
    };
  },

  async assignBackup(placementId: string, caregiverId: string, priority: number): Promise<void> {
    if (!useInAppMockDataset()) {
      throw new Error("[CareNet] Connect Supabase or use Demo Access for backup assignment.");
    }
    await delay(300);
  },

  async removeBackup(placementId: string, caregiverId: string): Promise<void> {
    if (!useInAppMockDataset()) {
      throw new Error("[CareNet] Connect Supabase or use Demo Access for backup removal.");
    }
    await delay(200);
  },
};
