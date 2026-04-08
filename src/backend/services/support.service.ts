/**
 * Support Service — help center, contact, tickets, refunds
 */
import type {
  HelpCenterData, ContactInfo, RefundTransaction, RefundTimelineStep,
} from "@/backend/models";
import { USE_SUPABASE, sbRead, sbWrite, sb, currentUserId, useInAppMockDataset } from "./_sb";
import { demoOfflineDelayAndPick } from "./demoOfflineMock";

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

const EMPTY_HELP_CENTER: HelpCenterData = { categories: [], popularArticles: [] };
const EMPTY_CONTACT: ContactInfo = {
  phone: "",
  email: "",
  hours: "",
  address: "",
  social: { facebook: "", instagram: "" },
};

export const supportService = {
  async getHelpCenterData(): Promise<HelpCenterData> {
    // Help center content is CMS-managed, no dedicated table yet
    if (USE_SUPABASE) {
      return sbRead("support:help-center", async () => {
        return { faqs: [], categories: [] };
      });
    }
    return demoOfflineDelayAndPick(200, EMPTY_HELP_CENTER, (m) => m.MOCK_HELP_CENTER);
  },

  async getContactInfo(): Promise<ContactInfo> {
    if (USE_SUPABASE) {
      return sbRead("support:contact", async () => {
        return { email: "", phone: "", hours: "" };
      });
    }
    return demoOfflineDelayAndPick(200, EMPTY_CONTACT, (m) => m.MOCK_CONTACT_INFO);
  },

  async getRefundEligibleTransactions(): Promise<RefundTransaction[]> {
    if (USE_SUPABASE) {
      return sbRead("support:refund-eligible", async () => {
        const userId = await currentUserId();
        const { data, error } = await sb().from("refund_requests")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).map((d: any) => ({
          id: d.id,
          description: d.reason || d.description || "",
          amount: d.amount || 0,
          date: d.created_at,
          status: d.status || "pending",
        }));
      });
    }
    return demoOfflineDelayAndPick(200, [] as RefundTransaction[], (m) => m.MOCK_REFUND_TRANSACTIONS);
  },

  async getTicketCategories(): Promise<string[]> {
    if (USE_SUPABASE) {
      return sbRead("support:ticket-categories", async () => {
        return [];
      });
    }
    return demoOfflineDelayAndPick(200, [] as string[], (m) => m.MOCK_TICKET_CATEGORIES);
  },

  async getRefundTimeline(): Promise<RefundTimelineStep[]> {
    if (USE_SUPABASE) {
      return sbRead("support:refund-timeline", async () => {
        return [];
      });
    }
    return demoOfflineDelayAndPick(200, [] as RefundTimelineStep[], (m) => m.MOCK_REFUND_TIMELINE);
  },

  async submitTicket(data: { subject: string; category: string; priority: string; message: string }): Promise<{ id: string }> {
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        const userId = await currentUserId();
        const { data: row, error } = await sb().from("support_tickets").insert({
          user_id: userId,
          subject: data.subject,
          category: data.category,
          priority: data.priority,
          status: "open",
        }).select("id").single();
        if (error) throw error;
        return { id: row.id };
      });
    }
    if (!useInAppMockDataset()) {
      throw new Error("[CareNet] Connect Supabase or use Demo Access to submit support tickets.");
    }
    await delay(300);
    return { id: `ticket-${Date.now()}` };
  },

  async getMyTickets(): Promise<Array<{ id: string; subject: string; category: string; priority: string; status: string; createdAt: string }>> {
    if (USE_SUPABASE) {
      return sbRead("tickets:mine", async () => {
        const userId = await currentUserId();
        const { data, error } = await sb().from("support_tickets")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).map((d: any) => ({
          id: d.id,
          subject: d.subject,
          category: d.category,
          priority: d.priority,
          status: d.status,
          createdAt: d.created_at,
        }));
      });
    }
    await delay();
    return [];
  },
};
