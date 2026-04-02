/**
 * Message Service — unified conversations and chat messages across all roles
 */
import type { ConversationItem, ChatMessage } from "@/backend/models";
import type { Role } from "@/frontend/auth/types";
import {
  MOCK_AGENCY_CONVERSATIONS,
  MOCK_AGENCY_MESSAGES,
  MOCK_CAREGIVER_CONVERSATIONS_UNIFIED,
  MOCK_GUARDIAN_CONVERSATIONS_UNIFIED,
  MOCK_PATIENT_CONVERSATIONS,
  MOCK_MODERATOR_CONVERSATIONS,
  MOCK_ADMIN_CONVERSATIONS,
  MOCK_MESSAGES_BY_CONVO,
} from "@/backend/api/mock";
import { USE_SUPABASE, sbRead, sbWrite, sb, currentUserId } from "./_sb";

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

function isDemoAuthMode(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const mode = window.localStorage.getItem("carenet-auth-mode");
    if (mode === "demo") return true;

    const rawUser = window.localStorage.getItem("carenet-auth");
    if (!rawUser) return false;
    const parsed = JSON.parse(rawUser) as { id?: string; email?: string };
    return (
      typeof parsed.id === "string" && parsed.id.startsWith("demo-")
    ) || (
      typeof parsed.email === "string" && parsed.email.endsWith("@carenet.demo")
    );
  } catch {
    return false;
  }
}

function shouldUseSupabase(): boolean {
  return USE_SUPABASE && !isDemoAuthMode();
}

// ─── Mock data lookup by role ───────────────────────────────
const CONVERSATIONS_BY_ROLE: Record<string, ConversationItem[]> = {
  agency: MOCK_AGENCY_CONVERSATIONS,
  caregiver: MOCK_CAREGIVER_CONVERSATIONS_UNIFIED,
  guardian: MOCK_GUARDIAN_CONVERSATIONS_UNIFIED,
  patient: MOCK_PATIENT_CONVERSATIONS,
  moderator: MOCK_MODERATOR_CONVERSATIONS,
  admin: MOCK_ADMIN_CONVERSATIONS,
  shop: [], // shop role doesn't have messaging yet
};

// ─── Supabase helpers ───────────────────────────────────────

/** Map a DB conversation row to ConversationItem, given the current user ID */
function mapConversation(d: any, myId: string, profiles: Map<string, any>): ConversationItem {
  const otherId = d.participant_a === myId ? d.participant_b : d.participant_a;
  const otherProfile = profiles.get(otherId);
  const isPinned = d.participant_a === myId ? d.pinned_by_a : d.pinned_by_b;
  return {
    id: d.id,
    name: otherProfile?.name || "Unknown",
    role: otherProfile?.role || "user",
    avatar: otherProfile?.avatar_url || "",
    lastMessage: d.last_message || "",
    lastTime: d.last_time || d.updated_at,
    unread: 0, // TODO: compute from unread messages count
    online: false,
    pinned: isPinned,
  };
}

async function fetchConversations(myId: string): Promise<ConversationItem[]> {
  const { data, error } = await sb().from("conversations")
    .select("*")
    .or(`participant_a.eq.${myId},participant_b.eq.${myId}`)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  if (!data || data.length === 0) return [];

  // Collect other participant IDs and batch-fetch profiles
  const otherIds = new Set<string>();
  for (const c of data) {
    otherIds.add(c.participant_a === myId ? c.participant_b : c.participant_a);
  }
  const profileMap = new Map<string, any>();
  if (otherIds.size > 0) {
    const { data: profs } = await sb().from("profiles")
      .select("id, name, role, avatar_url")
      .in("id", [...otherIds]);
    for (const p of profs || []) profileMap.set(p.id, p);
  }

  return data.map((d: any) => mapConversation(d, myId, profileMap));
}

async function fetchMessages(conversationId: string, myId: string): Promise<ChatMessage[]> {
  const { data, error } = await sb().from("chat_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).map((d: any) => ({
    id: d.id,
    sender: d.sender_id === myId ? "self" as const : "other" as const,
    senderName: d.sender_name || "",
    text: d.text,
    time: d.created_at,
    read: d.read,
  }));
}

// ═══════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════

export const messageService = {

  // ─── Generic: get conversations for any role ───────────────
  async getConversations(role?: Role): Promise<ConversationItem[]> {
    if (shouldUseSupabase()) {
      return sbRead(`convos:${role || "all"}`, async () => {
        const myId = await currentUserId();
        return fetchConversations(myId);
      });
    }
    await delay();
    return CONVERSATIONS_BY_ROLE[role || "guardian"] || [];
  },

  // ─── Generic: get messages for a conversation ─────────────
  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    if (shouldUseSupabase()) {
      return sbRead(`msgs:${conversationId}`, async () => {
        const myId = await currentUserId();
        return fetchMessages(conversationId, myId);
      });
    }
    await delay();
    return MOCK_MESSAGES_BY_CONVO[conversationId] || [];
  },

  // ─── Get or create a conversation with a specific user ────
  async getOrCreateConversation(otherUserId: string): Promise<string> {
    if (shouldUseSupabase()) {
      const myId = await currentUserId();
      // Check if conversation already exists
      const { data: existing } = await sb().from("conversations")
        .select("id")
        .or(
          `and(participant_a.eq.${myId},participant_b.eq.${otherUserId}),` +
          `and(participant_a.eq.${otherUserId},participant_b.eq.${myId})`
        )
        .limit(1)
        .single();
      if (existing) return existing.id;

      // Create new conversation
      const { data: created, error } = await sb().from("conversations").insert({
        participant_a: myId,
        participant_b: otherUserId,
        last_message: "",
        last_time: new Date().toISOString(),
      }).select("id").single();
      if (error) throw error;
      return created!.id;
    }
    // Mock: return a fake conversation ID
    await delay(100);
    return `mock-convo-${otherUserId}`;
  },

  // ─── Send a message ────────────────────────────────────────
  async sendMessage(conversationId: string, text: string): Promise<ChatMessage> {
    if (shouldUseSupabase()) {
      return sbWrite(async () => {
        const myId = await currentUserId();
        const { data: profile } = await sb().from("profiles").select("name").eq("id", myId).single();
        const { data: inserted, error } = await sb().from("chat_messages").insert({
          conversation_id: conversationId,
          sender_id: myId,
          sender_name: profile?.name || "Me",
          text,
          read: false,
        }).select("*").single();
        if (error) throw error;
        // Update conversation last_message
        await sb().from("conversations").update({
          last_message: text,
          last_time: new Date().toISOString(),
        }).eq("id", conversationId);
        return {
          id: inserted!.id,
          sender: "self" as const,
          senderName: profile?.name || "Me",
          text,
          time: inserted!.created_at,
          read: false,
        };
      });
    }
    await delay(100);
    // Mock: return an optimistic message
    const mockMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "self",
      senderName: "Me",
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      read: false,
    };
    console.log(`[message.service] Sent to ${conversationId}: ${text}`);
    return mockMsg;
  },

  // ─── Legacy role-specific wrappers (for backward compat) ──
  async getAgencyConversations(): Promise<ConversationItem[]> {
    return this.getConversations("agency");
  },
  async getAgencyMessages(conversationId: string) {
    if (shouldUseSupabase()) {
      const msgs = await this.getMessages(conversationId);
      return msgs.map((m) => ({
        ...m,
        sender: m.sender === "self" ? ("me" as const) : ("other" as const),
      }));
    }
    await delay();
    return MOCK_AGENCY_MESSAGES;
  },
  async getPatientConversations(): Promise<ConversationItem[]> {
    return this.getConversations("patient");
  },

  // ─── Mark all messages in a conversation as read ───────────
  async markConversationRead(conversationId: string): Promise<void> {
    if (shouldUseSupabase()) {
      const myId = await currentUserId();
      // Set read=true on all messages in this conversation that were NOT sent by me
      const { error } = await sb()
        .from("chat_messages")
        .update({ read: true })
        .eq("conversation_id", conversationId)
        .neq("sender_id", myId)
        .eq("read", false);
      if (error) console.warn("[messageService] markConversationRead error:", error);
      return;
    }
    // Mock mode: no-op (unread counts come from static mock data)
    await delay(50);
  },
};

