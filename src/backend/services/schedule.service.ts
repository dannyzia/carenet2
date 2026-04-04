/**
 * Schedule Service — daily task management across all roles (Phase 4)
 */
import type { DailyTask } from "@/backend/models";
import { MOCK_DAILY_TASKS } from "@/backend/api/mock";
import { USE_SUPABASE, sbRead, sbWrite, sb, currentUserId } from "./_sb";

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

let tasks = [...MOCK_DAILY_TASKS];

function mapTask(d: any): DailyTask {
  return {
    id: d.id,
    type: d.type,
    title: d.title,
    details: d.details,
    time: d.time,
    date: d.date,
    patientId: d.patient_id,
    patientName: d.patient_name,
    caregiverId: d.caregiver_id,
    caregiverName: d.caregiver_name,
    guardianId: d.guardian_id,
    agencyId: d.agency_id,
    status: d.status,
    completedAt: d.completed_at,
    completionNote: d.completion_note,
    completionPhotoUrl: d.completion_photo_url,
    createdBy: d.created_by,
    createdByRole: d.created_by_role,
    createdAt: d.created_at,
  };
}

export const scheduleService = {
  async getDailyTasks(date?: string): Promise<DailyTask[]> {
    if (USE_SUPABASE) {
      const key = `tasks:${date || "all"}`;
      return sbRead(key, async () => {
        const userId = await currentUserId();
        let q = sb().from("daily_tasks").select("*")
          .or(`caregiver_id.eq.${userId},guardian_id.eq.${userId},agency_id.eq.${userId},created_by.eq.${userId}`)
          .order("time", { ascending: true });
        if (date) q = q.eq("date", date);
        const { data, error } = await q;
        if (error) throw error;
        return (data || []).map(mapTask);
      });
    }
    await delay();
    if (date) return tasks.filter((t) => t.date === date);
    return tasks;
  },

  async completeTask(taskId: string, note?: string, photoUrl?: string): Promise<void> {
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        const { error } = await sb().from("daily_tasks").update({
          status: "completed",
          completed_at: new Date().toISOString(),
          completion_note: note || null,
          completion_photo_url: photoUrl || null,
        }).eq("id", taskId);
        if (error) throw error;
      });
    }
    await delay(300);
    tasks = tasks.map((t) =>
      t.id === taskId
        ? { ...t, status: "completed" as const, completedAt: new Date().toISOString(), completionNote: note, completionPhotoUrl: photoUrl }
        : t
    );
  },

  async addTask(task: Omit<DailyTask, "id" | "createdAt">): Promise<DailyTask> {
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        const { data, error } = await sb().from("daily_tasks").insert({
          type: task.type,
          title: task.title,
          details: task.details,
          time: task.time,
          date: task.date,
          patient_id: task.patientId,
          patient_name: task.patientName,
          caregiver_id: task.caregiverId,
          caregiver_name: task.caregiverName,
          guardian_id: task.guardianId,
          agency_id: task.agencyId,
          status: task.status,
          created_by: task.createdBy,
          created_by_role: task.createdByRole,
        }).select().single();
        if (error) throw error;
        return mapTask(data);
      });
    }
    await delay(300);
    const created: DailyTask = {
      ...task,
      id: `task-${crypto.randomUUID().slice(0, 8)}`,
      createdAt: new Date().toISOString(),
    };
    tasks.push(created);
    return created;
  },

  async cancelTask(taskId: string): Promise<void> {
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        const { error } = await sb().from("daily_tasks").update({ status: "cancelled" }).eq("id", taskId);
        if (error) throw error;
      });
    }
    await delay(200);
    tasks = tasks.map((t) =>
      t.id === taskId ? { ...t, status: "cancelled" as const } : t
    );
  },
};
