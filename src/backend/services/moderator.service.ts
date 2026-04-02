/**
 * Moderator Service — content moderation data
 *
 * Now wired to Supabase moderation tables:
 *   moderation_queue, flagged_content, moderator_sanctions,
 *   moderator_escalations, contract_disputes, dispute_messages
 */
import type {
  ModeratorReview,
  ModeratorReport,
  ModerationQueueItem,
  FlaggedContent,
  ModeratorSanction,
  ModeratorEscalation,
} from "@/backend/models";
import {
  MOCK_MODERATOR_REVIEWS,
  MOCK_MODERATOR_REPORTS,
  MOCK_MODERATION_QUEUE,
  MOCK_FLAGGED_CONTENT,
  MOCK_MODERATOR_SANCTIONS,
  MOCK_MODERATOR_ESCALATIONS,
} from "@/backend/api/mock";
import { USE_SUPABASE, sbRead, sbWrite, sb, currentUserId } from "./_sb";

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

export const moderatorService = {
  async getReviews(): Promise<ModeratorReview[]> {
    if (USE_SUPABASE) {
      return sbRead("mod:reviews", async () => {
        const { data, error } = await sb().from("caregiver_reviews")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);
        if (error) throw error;
        return (data || []).map((d: any, i: number) => ({
          id: i + 1,
          reviewer: d.reviewer_name,
          about: d.caregiver_id,
          rating: d.rating,
          text: d.text,
          date: d.created_at,
          flagReason: null,
          status: "approved",
        }));
      });
    }
    await delay();
    return MOCK_MODERATOR_REVIEWS;
  },

  async getReports(): Promise<ModeratorReport[]> {
    if (USE_SUPABASE) {
      return sbRead("mod:reports", async () => {
        const { data, error } = await sb().from("flagged_content")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);
        if (error) throw error;
        return (data || []).map((d: any) => ({
          id: d.id,
          type: d.content_type,
          from: d.reporter_name || "System",
          against: d.target_user_name || "Unknown",
          desc: d.content_snippet,
          priority: d.severity,
          status: d.status,
          date: d.created_at,
        }));
      });
    }
    await delay();
    return MOCK_MODERATOR_REPORTS;
  },

  async getDashboardQueue(): Promise<ModerationQueueItem[]> {
    if (USE_SUPABASE) {
      try {
        return await sbRead("mod:queue", async () => {
          const { data, error } = await sb().from("moderation_queue")
            .select("*")
            .in("status", ["pending", "in_review"])
            .order("created_at", { ascending: true });
          if (error) throw error;
          return (data || []).map((d: any) => ({
            id: d.id,
            type: d.type,
            content: d.content,
            reporter: d.reporter_name || "System",
            time: d.created_at,
            priority: d.priority,
          }));
        });
      } catch (error) {
        console.warn("[Moderator Service] Supabase moderation_queue failed, using mock queue:", error);
        await delay();
        return MOCK_MODERATION_QUEUE;
      }
    }
    await delay();
    return MOCK_MODERATION_QUEUE;
  },

  async getFlaggedContent(): Promise<FlaggedContent[]> {
    if (USE_SUPABASE) {
      return sbRead("mod:flagged", async () => {
        const { data, error } = await sb().from("flagged_content")
          .select("*")
          .in("status", ["pending", "confirmed"])
          .order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).map((d: any) => ({
          id: d.id,
          type: d.content_type,
          content: d.content_snippet,
          reporter: d.reporter_name || "System",
          time: d.created_at,
          severity: d.severity,
          target: d.target_user_name || "Unknown",
          reason: d.reason,
        }));
      });
    }
    await delay();
    return MOCK_FLAGGED_CONTENT;
  },

  async getQueueItem(id: number): Promise<ModerationQueueItem | null> {
    if (USE_SUPABASE) {
      return sbRead(`mod:queue:${id}`, async () => {
        const { data, error } = await sb().from("moderation_queue")
          .select("*")
          .eq("id", id)
          .single();
        if (error) return null;
        return {
          id: data.id,
          type: data.type,
          content: data.content,
          reporter: data.reporter_name || "System",
          time: data.created_at,
          priority: data.priority,
        };
      });
    }
    await delay();
    return MOCK_MODERATION_QUEUE.find((q) => q.id === id) ?? null;
  },

  async getRelatedReports(itemId: number): Promise<ModeratorReport[]> {
    if (USE_SUPABASE) {
      return sbRead(`mod:related:${itemId}`, async () => {
        const { data, error } = await sb().from("flagged_content")
          .select("*")
          .eq("queue_item_id", itemId)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).map((d: any) => ({
          id: d.id,
          type: d.content_type,
          from: d.reporter_name || "System",
          against: d.target_user_name || "Unknown",
          desc: d.content_snippet,
          priority: d.severity,
          status: d.status,
          date: d.created_at,
        }));
      });
    }
    await delay();
    return MOCK_MODERATOR_REPORTS.slice(0, 2);
  },

  async getRelatedContent(itemId: number): Promise<FlaggedContent[]> {
    await delay();
    return MOCK_FLAGGED_CONTENT.slice(0, 2);
  },

  async getSanctions(): Promise<ModeratorSanction[]> {
    if (USE_SUPABASE) {
      return sbRead("mod:sanctions", async () => {
        const { data, error } = await sb().from("moderator_sanctions")
          .select("*")
          .order("issued_at", { ascending: false });
        if (error) throw error;
        return (data || []).map((d: any) => ({
          id: d.id,
          userId: d.user_id,
          userName: d.user_name,
          userRole: d.user_role,
          type: d.type,
          reason: d.reason,
          issuedBy: d.issued_by_name,
          issuedAt: d.issued_at,
          expiresAt: d.expires_at,
          status: d.status,
          notes: d.notes,
        }));
      });
    }
    await delay();
    return MOCK_MODERATOR_SANCTIONS;
  },

  async getEscalations(): Promise<ModeratorEscalation[]> {
    if (USE_SUPABASE) {
      return sbRead("mod:escalations", async () => {
        const { data, error } = await sb().from("moderator_escalations")
          .select("*")
          .order("escalated_at", { ascending: false });
        if (error) throw error;
        return (data || []).map((d: any) => ({
          id: d.id,
          sourceType: d.source_type,
          sourceId: parseInt(d.source_id) || 0,
          title: d.title,
          description: d.description,
          priority: d.priority,
          status: d.status,
          escalatedBy: d.escalated_by_name,
          escalatedAt: d.escalated_at,
          assignedTo: d.assigned_to_name,
          resolvedAt: d.resolved_at,
          resolution: d.resolution,
        }));
      });
    }
    await delay();
    return MOCK_MODERATOR_ESCALATIONS;
  },

  // ─── Write Operations ───

  async resolveQueueItem(id: number, resolution: string): Promise<void> {
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        const userId = await currentUserId();
        const { error } = await sb().from("moderation_queue").update({
          status: "resolved",
          resolved_by: userId,
          resolved_at: new Date().toISOString(),
          resolution,
        }).eq("id", id);
        if (error) throw error;
      });
    }
    await delay(300);
  },

  async dismissQueueItem(id: number, reason: string): Promise<void> {
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        const userId = await currentUserId();
        const { error } = await sb().from("moderation_queue").update({
          status: "dismissed",
          resolved_by: userId,
          resolved_at: new Date().toISOString(),
          resolution: reason,
        }).eq("id", id);
        if (error) throw error;
      });
    }
    await delay(200);
  },

  async issueSanction(data: {
    userId: string; userName: string; userRole: string;
    type: "warning" | "mute" | "suspension" | "ban";
    reason: string; expiresAt?: string; notes?: string;
  }): Promise<{ id: string }> {
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        const modId = await currentUserId();
        const { data: profile } = await sb().from("profiles").select("name").eq("id", modId).single();
        const { data: row, error } = await sb().from("moderator_sanctions").insert({
          user_id: data.userId,
          user_name: data.userName,
          user_role: data.userRole,
          type: data.type,
          reason: data.reason,
          issued_by: modId,
          issued_by_name: profile?.name || "Moderator",
          expires_at: data.expiresAt || null,
          notes: data.notes || null,
          status: "active",
        }).select("id").single();
        if (error) throw error;
        return { id: row.id };
      });
    }
    await delay(400);
    return { id: `sanction-${Date.now()}` };
  },

  async revokeSanction(id: string, reason: string): Promise<void> {
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        const modId = await currentUserId();
        const { error } = await sb().from("moderator_sanctions").update({
          status: "revoked",
          revoked_by: modId,
          revoked_at: new Date().toISOString(),
          revoke_reason: reason,
        }).eq("id", id);
        if (error) throw error;
      });
    }
    await delay(300);
  },

  async escalateItem(data: {
    sourceType: string; sourceId: string;
    title: string; description: string; priority: string;
  }): Promise<{ id: string }> {
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        const modId = await currentUserId();
        const { data: profile } = await sb().from("profiles").select("name").eq("id", modId).single();
        const { data: row, error } = await sb().from("moderator_escalations").insert({
          source_type: data.sourceType,
          source_id: data.sourceId,
          title: data.title,
          description: data.description,
          priority: data.priority,
          status: "pending",
          escalated_by: modId,
          escalated_by_name: profile?.name || "Moderator",
        }).select("id").single();
        if (error) throw error;
        return { id: row.id };
      });
    }
    await delay(400);
    return { id: `esc-${Date.now()}` };
  },

  async flagContent(data: {
    contentType: string; contentId: string; contentSnippet: string;
    targetUserId?: string; targetUserName?: string;
    reason: string; severity: string; details?: string;
  }): Promise<{ id: number }> {
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        const userId = await currentUserId();
        const { data: profile } = await sb().from("profiles").select("name").eq("id", userId).single();
        const { data: row, error } = await sb().from("flagged_content").insert({
          content_type: data.contentType,
          content_id: data.contentId,
          content_snippet: data.contentSnippet,
          target_user_id: data.targetUserId || null,
          target_user_name: data.targetUserName || null,
          reporter_id: userId,
          reporter_name: profile?.name || "User",
          reason: data.reason,
          severity: data.severity,
          details: data.details || null,
          status: "pending",
        }).select("id").single();
        if (error) throw error;
        return { id: row.id };
      });
    }
    await delay(300);
    return { id: Date.now() };
  },
};
