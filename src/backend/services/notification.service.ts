/**
 * Notification Service — business logic layer
 */
import type { AppNotification } from "@/backend/models";
import { emitBillingNotification } from "@/frontend/hooks/useBillingNotifications";
import { USE_SUPABASE, getSupabaseClient } from "./supabase";
import { sbRead, sbWrite, sb, currentUserId, useInAppMockDataset } from "./_sb";
import { demoOfflineDelayAndPick } from "./demoOfflineMock";

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

/**
 * Trigger a generic notification via Supabase Edge Function (when connected)
 * or log it in mock mode. The Edge Function inserts a row into the
 * `notifications` table, which the Realtime subscription picks up.
 */
async function triggerNotification(payload: {
  type: string;
  title: string;
  body: string;
  receiverId: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  if (USE_SUPABASE) {
    try {
      const sb = getSupabaseClient();
      const { error } = await sb.functions.invoke("push-notification", {
        body: {
          type: payload.type,
          title: payload.title,
          body: payload.body,
          receiver_id: payload.receiverId,
          action_url: payload.actionUrl,
          metadata: payload.metadata,
        },
      });
      if (error) {
        console.error("[notification.service] Edge Function error:", error);
      }
      return;
    } catch (e) {
      console.error("[notification.service] Failed to invoke push-notification:", e);
      return;
    }
  }

  if (!useInAppMockDataset()) return;

  await delay(50);
  console.log(`[notification.service] Notification (mock) → ${payload.receiverId}:`, {
    type: payload.type,
    title: payload.title,
    body: payload.body,
    actionUrl: payload.actionUrl,
    metadata: payload.metadata,
  });
}

async function pushBillingNotification(payload: {
  type: string;
  title: string;
  body: string;
  receiverId: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await triggerNotification(payload);
}

export const notificationService = {
  /** Get all notifications for the current user */
  async getNotifications(): Promise<AppNotification[]> {
    if (USE_SUPABASE) {
      return sbRead("notifications:mine", async () => {
        const userId = await currentUserId();
        const { data, error } = await sb().from("notifications")
          .select("*")
          .eq("receiver_id", userId)
          .order("created_at", { ascending: false })
          .limit(100);
        if (error) throw error;
        return (data || []).map((d: any) => ({
          id: d.id,
          channel: d.channel,
          titleEn: d.title_en,
          titleBn: d.title_bn,
          messageEn: d.message_en,
          messageBn: d.message_bn,
          time: d.created_at,
          read: d.read,
          actionUrl: d.action_url,
        }));
      });
    }
    return demoOfflineDelayAndPick(200, [] as AppNotification[], (m) => m.MOCK_NOTIFICATIONS);
  },

  /** Mark a notification as read */
  async markRead(id: string): Promise<void> {
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        const { error } = await sb().from("notifications").update({ read: true }).eq("id", id);
        if (error) throw error;
      });
    }
    await delay(100);
    console.log(`[notification.service] Notification ${id} marked as read`);
  },

  /** Mark all notifications as read */
  async markAllRead(): Promise<void> {
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        const userId = await currentUserId();
        const { error } = await sb().from("notifications").update({ read: true }).eq("receiver_id", userId).eq("read", false);
        if (error) throw error;
      });
    }
    await delay(100);
    console.log(`[notification.service] All notifications marked as read`);
  },

  /** Delete a notification */
  async deleteNotification(id: string): Promise<void> {
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        const { error } = await sb().from("notifications").delete().eq("id", id);
        if (error) throw error;
      });
    }
    await delay(100);
    console.log(`[notification.service] Notification ${id} deleted`);
  },

  // ─── Billing Notification Triggers ───

  /** Trigger notification when payment proof is submitted */
  async triggerBillingProofSubmitted(data: {
    proofId: string;
    invoiceId: string;
    submitterName: string;
    receiverId: string;
    amount: number;
    method: string;
  }): Promise<void> {
    await delay(50);
    const body = `${data.submitterName} submitted payment proof of ৳${data.amount.toLocaleString()} via ${data.method} for invoice ${data.invoiceId}`;
    console.log(`[notification.service] Billing proof submitted notification → ${data.receiverId}:`, {
      title: "Payment Proof Received",
      body,
      type: "billing_proof_submitted",
      proofId: data.proofId,
    });
    await pushBillingNotification({
      type: "billing_proof_submitted",
      title: "Payment Proof Received",
      body,
      receiverId: data.receiverId,
      actionUrl: `/billing/verify/${data.proofId}`,
      metadata: {
        proofId: data.proofId,
        invoiceId: data.invoiceId,
        submitterName: data.submitterName,
        amount: data.amount,
        method: data.method,
      },
    });
  },

  /** Trigger notification when payment proof is verified */
  async triggerBillingProofVerified(data: {
    proofId: string;
    invoiceId: string;
    verifierName: string;
    submitterId: string;
    amount: number;
  }): Promise<void> {
    await delay(50);
    const body = `Your payment of ৳${data.amount.toLocaleString()} for invoice ${data.invoiceId} has been verified by ${data.verifierName}`;
    console.log(`[notification.service] Billing proof verified notification → ${data.submitterId}:`, {
      title: "Payment Verified",
      body,
      type: "billing_proof_verified",
      proofId: data.proofId,
    });
    await pushBillingNotification({
      type: "billing_proof_verified",
      title: "Payment Verified",
      body,
      receiverId: data.submitterId,
      actionUrl: `/billing/invoice/${data.invoiceId}`,
      metadata: {
        proofId: data.proofId,
        invoiceId: data.invoiceId,
        verifierName: data.verifierName,
        amount: data.amount,
      },
    });
  },

  /** Trigger notification when payment proof is rejected */
  async triggerBillingProofRejected(data: {
    proofId: string;
    invoiceId: string;
    verifierName: string;
    submitterId: string;
    amount: number;
    reason: string;
  }): Promise<void> {
    await delay(50);
    const body = `Your payment proof for invoice ${data.invoiceId} was rejected by ${data.verifierName}. Reason: ${data.reason}`;
    console.log(`[notification.service] Billing proof rejected notification → ${data.submitterId}:`, {
      title: "Payment Proof Rejected",
      body,
      type: "billing_proof_rejected",
      proofId: data.proofId,
    });
    await pushBillingNotification({
      type: "billing_proof_rejected",
      title: "Payment Proof Rejected",
      body,
      receiverId: data.submitterId,
      actionUrl: `/billing/invoice/${data.invoiceId}`,
      metadata: {
        proofId: data.proofId,
        invoiceId: data.invoiceId,
        verifierName: data.verifierName,
        amount: data.amount,
        reason: data.reason,
      },
    });
  },

  async triggerNotification(payload: {
    type: string;
    title: string;
    body: string;
    receiverId: string;
    actionUrl?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    return triggerNotification(payload);
  },
};