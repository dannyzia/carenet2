/**
 * useBillingNotifications — Realtime subscription for billing events
 * ──────────────────────────────────────────────────────────────────
 * Subscribes to the `notifications` table filtered by `type LIKE 'billing_%'`
 * and surfaces new billing notifications as Sonner toasts.
 *
 * In mock mode (USE_SUPABASE = false): listens to a local event bus
 * that billing.service triggers emit on. Also runs a lightweight
 * demo simulation to show a billing toast after initial mount.
 *
 * When Supabase is connected: subscribes to postgres_changes INSERT
 * on the `notifications` table with a billing type filter.
 */

import { useEffect, useRef, useCallback } from "react";
import { useAriaToast } from "./useAriaToast";
import { useNavigate } from "react-router";
import { USE_SUPABASE, getSupabaseClient } from "@/backend/services/supabase";
import {
  recordMessageReceived,
  _registerChannel,
  _unregisterChannel,
  CHANNEL_STALE_PRESETS,
} from "@/backend/services/realtime";
import { hapticSuccess, hapticWarning, hapticError } from "@/frontend/native/haptics";

// ─── Billing notification event types ───

export type BillingNotificationType =
  | "billing_proof_submitted"
  | "billing_proof_verified"
  | "billing_proof_rejected";

export interface BillingNotificationEvent {
  id: string;
  type: BillingNotificationType;
  title: string;
  body: string;
  actionUrl?: string;
  createdAt: string;
}

// ─── Local event bus for mock mode ───

type BillingListener = (event: BillingNotificationEvent) => void;
const _billingListeners = new Set<BillingListener>();

/** Called by notificationService.triggerBilling* in mock mode to fire toasts */
export function emitBillingNotification(event: BillingNotificationEvent) {
  _billingListeners.forEach((fn) => {
    try {
      fn(event);
    } catch (e) {
      console.error("[BillingNotifications] listener error:", e);
    }
  });
}

// ─── Pending proof count (lightweight polling via mock data) ───

let _pendingProofCount = 2; // Initial from mock data (PP-001, PP-004)
const _countListeners = new Set<(count: number) => void>();

export function getPendingProofCount(): number {
  return _pendingProofCount;
}

export function onPendingProofCountChange(listener: (count: number) => void): () => void {
  _countListeners.add(listener);
  listener(_pendingProofCount);
  return () => { _countListeners.delete(listener); };
}

function _updatePendingCount(delta: number) {
  _pendingProofCount = Math.max(0, _pendingProofCount + delta);
  _countListeners.forEach((fn) => {
    try { fn(_pendingProofCount); } catch {}
  });
}

// ─── Billing notification mute preference ───
// Persisted in localStorage so it survives refreshes.
// The NotificationPreferences component toggles the "billing" channel;
// we read from the same key here.

const BILLING_MUTE_KEY = "carenet:notif:billing:muted";

export function isBillingMuted(): boolean {
  try {
    return localStorage.getItem(BILLING_MUTE_KEY) === "true";
  } catch {
    return false;
  }
}

export function setBillingMuted(muted: boolean): void {
  try {
    localStorage.setItem(BILLING_MUTE_KEY, muted ? "true" : "false");
  } catch {}

  // Sync to Supabase user_preferences when connected
  if (USE_SUPABASE) {
    syncBillingMuteToSupabase(muted).catch((e) =>
      console.warn("[BillingNotifications] Failed to sync mute pref:", e)
    );
  }
}

/**
 * Sync the billing mute preference to user_preferences.notification_channels
 * Uses UPSERT so it works for both first-time and subsequent saves.
 */
async function syncBillingMuteToSupabase(muted: boolean): Promise<void> {
  const sb = getSupabaseClient();
  const { data: { user }, error: authErr } = await sb.auth.getUser();
  if (authErr || !user) return;

  // Read existing prefs first to avoid clobbering other channels
  const existing = await sb
    .from("user_preferences")
    .select("notification_channels")
    .eq("user_id", user.id)
    .maybeSingle();

  const currentChannels = (existing.data as { notification_channels?: Record<string, unknown> } | null)
    ?.notification_channels || {};

  const updatedChannels = {
    ...currentChannels,
    billing: {
      ...((currentChannels as Record<string, Record<string, unknown>>).billing || {}),
      enabled: !muted,
    },
  };

  // Upsert into user_preferences
  const row = {
    user_id: user.id,
    notification_channels: updatedChannels,
    updated_at: new Date().toISOString(),
  };

  const { error: upsertErr } = await sb
    .from("user_preferences")
    .upsert(row, { onConflict: "user_id" });

  if (upsertErr) {
    console.warn("[BillingNotifications] user_preferences upsert failed:", upsertErr.message);
  }
}

/**
 * Load billing mute preference from Supabase on first mount.
 * Called once from useBillingNotifications hook.
 */
async function loadBillingMuteFromSupabase(): Promise<void> {
  if (!USE_SUPABASE) return;
  try {
    const sb = getSupabaseClient();
    const { data: { user }, error: authErr } = await sb.auth.getUser();
    if (authErr || !user) return;

    const { data } = await sb
      .from("user_preferences")
      .select("notification_channels")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      const channels = (data as { notification_channels?: Record<string, Record<string, unknown>> })
        .notification_channels;
      if (channels?.billing?.enabled === false) {
        localStorage.setItem(BILLING_MUTE_KEY, "true");
      } else {
        localStorage.setItem(BILLING_MUTE_KEY, "false");
      }
    }
  } catch (e) {
    console.warn("[BillingNotifications] Failed to load mute pref from Supabase:", e);
  }
}

// ─── Haptic feedback per billing type ───

async function triggerHaptic(type: BillingNotificationType): Promise<void> {
  try {
    switch (type) {
      case "billing_proof_submitted":
        await hapticSuccess();
        break;
      case "billing_proof_verified":
        await hapticSuccess();
        break;
      case "billing_proof_rejected":
        await hapticError();
        break;
    }
  } catch {
    // Haptics unavailable — silently ignore
  }
}

// ─── Toast configuration per billing type ───

function getToastConfig(type: BillingNotificationType) {
  switch (type) {
    case "billing_proof_submitted":
      return { variant: "info" as const, icon: "📩" };
    case "billing_proof_verified":
      return { variant: "success" as const, icon: "✅" };
    case "billing_proof_rejected":
      return { variant: "error" as const, icon: "❌" };
  }
}

// ─── Hook ───

export function useBillingNotifications() {
  const toast = useAriaToast();
  const navigate = useNavigate();
  const mountedRef = useRef(true);

  // Load billing mute preference from Supabase on first mount
  useEffect(() => {
    loadBillingMuteFromSupabase().catch((e) =>
      console.warn("[BillingNotifications] Failed to load mute pref:", e)
    );
  }, []);

  const handleEvent = useCallback(
    (event: BillingNotificationEvent) => {
      if (!mountedRef.current) return;

      const config = getToastConfig(event.type);

      // Update pending count (always, even when muted)
      if (event.type === "billing_proof_submitted") {
        _updatePendingCount(1);
      } else if (
        event.type === "billing_proof_verified" ||
        event.type === "billing_proof_rejected"
      ) {
        _updatePendingCount(-1);
      }

      // If billing toasts are muted, skip toast + haptics
      if (isBillingMuted()) return;

      // Surface as Sonner toast
      const toastFn =
        config.variant === "success"
          ? toast.success
          : config.variant === "error"
          ? toast.error
          : toast.info;

      toastFn(event.title, {
        description: event.body,
        duration: 6000,
        action: event.actionUrl
          ? {
              label: "View",
              onClick: () => navigate(event.actionUrl!),
            }
          : undefined,
      });

      // Trigger haptic feedback
      triggerHaptic(event.type);
    },
    [navigate, toast]
  );

  useEffect(() => {
    mountedRef.current = true;
    const channelName = "billing:notifications";

    if (!USE_SUPABASE) {
      // Mock mode: subscribe to local event bus
      _billingListeners.add(handleEvent);

      // Demo: emit a sample billing notification after 20s
      const demoTimer = setTimeout(() => {
        if (!mountedRef.current) return;
        emitBillingNotification({
          id: `bn-demo-${Date.now()}`,
          type: "billing_proof_submitted",
          title: "Payment Proof Received",
          body: "Fatima Rahman submitted payment proof of ৳8,500 via bank transfer for invoice INV-2026-0035.",
          actionUrl: "/billing/verify/PP-003",
          createdAt: new Date().toISOString(),
        });
      }, 20_000);

      return () => {
        mountedRef.current = false;
        _billingListeners.delete(handleEvent);
        clearTimeout(demoTimer);
      };
    }

    // ─── Supabase Realtime mode ───
    const sb = getSupabaseClient();
    const channel = sb
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: "type=ilike.billing_%",
        },
        (payload) => {
          recordMessageReceived(channelName);
          const row = payload.new as Record<string, unknown>;
          handleEvent({
            id: String(row.id ?? ""),
            type: String(row.type ?? "") as BillingNotificationType,
            title: String(row.title ?? ""),
            body: String(row.body ?? ""),
            actionUrl: row.action_url ? String(row.action_url) : undefined,
            createdAt: String(row.created_at ?? new Date().toISOString()),
          });
        }
      )
      .subscribe();

    _registerChannel(channelName, CHANNEL_STALE_PRESETS.default);

    return () => {
      mountedRef.current = false;
      sb.removeChannel(channel);
      _unregisterChannel(channelName);
    };
  }, [handleEvent]);
}