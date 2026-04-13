/**
 * useNotificationPreferencesSync — bidirectional sync for ALL notification channel preferences
 * ─────────────────────────────────────────────────────────────────────────────────────────────
 * Replaces the billing-only mute sync with a comprehensive hook that:
 *   1. Loads all channel preferences from Supabase user_preferences on mount
 *   2. Persists them in localStorage for offline access
 *   3. Exposes getChannelEnabled / setChannelEnabled for any NotificationChannel
 *   4. Syncs changes back to Supabase with debounced writes to avoid hammering the DB
 *
 * Channels: care-safety, shift-reminders, messages, payments, care-updates,
 *           ratings, platform, system, booking, document, billing
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type { NotificationChannel } from "@/backend/models";
import { USE_SUPABASE, getSupabaseClient } from "@/backend/services/supabase";
import { agentDebugLog } from "@/debug/agentDebugLog";

// ─── Types ───

export interface ChannelPreference {
  enabled: boolean;
  push: boolean;
  sms: boolean;
  inApp: boolean;
}

export type ChannelPreferencesMap = Partial<Record<NotificationChannel, ChannelPreference>>;

// ─── Defaults ───

const ALL_CHANNELS: NotificationChannel[] = [
  "care-safety",
  "shift-reminders",
  "messages",
  "payments",
  "care-updates",
  "ratings",
  "platform",
  "system",
  "booking",
  "document",
  "billing",
];

const DEFAULT_PREF: ChannelPreference = {
  enabled: true,
  push: true,
  sms: false,
  inApp: true,
};

// ─── localStorage key ───

const PREFS_STORAGE_KEY = "carenet:notif:channel_prefs";

function loadLocalPrefs(): ChannelPreferencesMap {
  try {
    const raw = localStorage.getItem(PREFS_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ChannelPreferencesMap;
  } catch {}
  return {};
}

function saveLocalPrefs(prefs: ChannelPreferencesMap): void {
  try {
    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch {}
}

// ─── Legacy compat: keep the billing-specific key in sync ───

const BILLING_MUTE_KEY = "carenet:notif:billing:muted";

function syncLegacyBillingKey(prefs: ChannelPreferencesMap) {
  try {
    const billingEnabled = prefs.billing?.enabled ?? true;
    localStorage.setItem(BILLING_MUTE_KEY, billingEnabled ? "false" : "true");
  } catch {}
}

// ─── Hook ───

export function useNotificationPreferencesSync() {
  const [prefs, setPrefs] = useState<ChannelPreferencesMap>(() => loadLocalPrefs());
  const [loading, setLoading] = useState(true);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  // ── 1. Load from Supabase on mount ──
  useEffect(() => {
    mountedRef.current = true;

    async function loadFromSupabase() {
      if (!USE_SUPABASE) {
        setLoading(false);
        return;
      }

      try {
        const sb = getSupabaseClient();
        const {
          data: { user },
          error: authErr,
        } = await sb.auth.getUser();
        if (authErr || !user) {
          setLoading(false);
          return;
        }

        const { data, error: prefErr } = await sb
          .from("user_preferences")
          .select("notification_channels")
          .eq("user_id", user.id)
          .maybeSingle();

        if (prefErr) {
          // #region agent log
          agentDebugLog({
            hypothesisId: "H3",
            location: "useNotificationPreferencesSync.ts:loadFromSupabase",
            message: "user_preferences load error",
            data: { code: prefErr.code, message: prefErr.message },
          });
          // #endregion
        }

        if (data && mountedRef.current) {
          const remote = (data as { notification_channels?: ChannelPreferencesMap })
            .notification_channels || {};

          // Merge remote into local (remote wins)
          setPrefs((prev) => {
            const merged = { ...prev, ...remote };
            saveLocalPrefs(merged);
            syncLegacyBillingKey(merged);
            return merged;
          });
        }
      } catch (e) {
        console.warn("[NotifPrefsSync] Failed to load from Supabase:", e);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    }

    loadFromSupabase();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ── 2. Debounced sync to Supabase ──
  const syncToSupabase = useCallback(
    (updatedPrefs: ChannelPreferencesMap) => {
      if (!USE_SUPABASE) return;

      // Debounce: only sync 800ms after last change
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(async () => {
        try {
          const sb = getSupabaseClient();
          const {
            data: { user },
            error: authErr,
          } = await sb.auth.getUser();
          if (authErr || !user) return;

          const row = {
            user_id: user.id,
            notification_channels: updatedPrefs,
            updated_at: new Date().toISOString(),
          };

          const { error: upsertErr } = await sb
            .from("user_preferences")
            .upsert(row, { onConflict: "user_id" });

          if (upsertErr) {
            // #region agent log
            agentDebugLog({
              hypothesisId: "H3",
              location: "useNotificationPreferencesSync.ts:syncToSupabase",
              message: "user_preferences upsert error",
              data: { code: upsertErr.code, message: upsertErr.message },
            });
            // #endregion
          }
        } catch (e) {
          console.warn("[NotifPrefsSync] Failed to sync to Supabase:", e);
        }
      }, 800);
    },
    []
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  // ── 3. Public API ──

  /** Get the full preference for a channel (with defaults) */
  const getChannelPreference = useCallback(
    (channel: NotificationChannel): ChannelPreference => {
      return { ...DEFAULT_PREF, ...prefs[channel] };
    },
    [prefs]
  );

  /** Check if a specific channel is enabled */
  const isChannelEnabled = useCallback(
    (channel: NotificationChannel): boolean => {
      return prefs[channel]?.enabled ?? true;
    },
    [prefs]
  );

  /** Toggle or set a channel's enabled state */
  const setChannelEnabled = useCallback(
    (channel: NotificationChannel, enabled: boolean) => {
      setPrefs((prev) => {
        const updated = {
          ...prev,
          [channel]: { ...DEFAULT_PREF, ...prev[channel], enabled },
        };
        saveLocalPrefs(updated);
        syncLegacyBillingKey(updated);
        syncToSupabase(updated);
        return updated;
      });
    },
    [syncToSupabase]
  );

  /** Update a specific sub-preference (push, sms, inApp) */
  const setChannelSubPref = useCallback(
    (
      channel: NotificationChannel,
      key: "push" | "sms" | "inApp",
      value: boolean
    ) => {
      setPrefs((prev) => {
        const updated = {
          ...prev,
          [channel]: { ...DEFAULT_PREF, ...prev[channel], [key]: value },
        };
        saveLocalPrefs(updated);
        syncToSupabase(updated);
        return updated;
      });
    },
    [syncToSupabase]
  );

  /** Bulk update all channels at once */
  const setAllChannelsEnabled = useCallback(
    (enabled: boolean) => {
      setPrefs(() => {
        const updated: ChannelPreferencesMap = {};
        for (const ch of ALL_CHANNELS) {
          updated[ch] = { ...DEFAULT_PREF, enabled };
        }
        saveLocalPrefs(updated);
        syncLegacyBillingKey(updated);
        syncToSupabase(updated);
        return updated;
      });
    },
    [syncToSupabase]
  );

  return {
    /** All channels */
    channels: ALL_CHANNELS,
    /** Full prefs map */
    preferences: prefs,
    /** Whether initial load from Supabase is in progress */
    loading,
    /** Get full preference for a channel */
    getChannelPreference,
    /** Check if a channel is enabled */
    isChannelEnabled,
    /** Set a channel's enabled/disabled state */
    setChannelEnabled,
    /** Set a sub-preference (push/sms/inApp) for a channel */
    setChannelSubPref,
    /** Enable or disable all channels at once */
    setAllChannelsEnabled,
  };
}
