import { cn } from "@/frontend/theme/tokens";
import {
  Bell, Heart, Calendar, MessageSquare, CreditCard, ShieldAlert,
  Star, Megaphone, Clock, ChevronDown, ChevronUp, Receipt,
  FileText, Briefcase, Loader2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import type { NotificationChannel } from "@/backend/models";
import { useNotificationPreferencesSync } from "@/frontend/hooks/useNotificationPreferencesSync";
import { USE_SUPABASE, getSupabaseClient } from "@/backend/services/supabase";

/**
 * NotificationPreferences — per D021 §6
 *
 * Full per-channel toggle with push + SMS + in-app sub-toggles,
 * now powered by useNotificationPreferencesSync for bidirectional
 * Supabase sync across all 11 channels.
 */

interface ChannelConfig {
  id: NotificationChannel;
  nameEn: string;
  nameBn: string;
  desc: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  critical?: boolean;
}

const CHANNELS: ChannelConfig[] = [
  { id: "care-safety", nameEn: "Care & Safety Alerts", nameBn: "\u09AF\u09A4\u09CD\u09A8 \u0993 \u09A8\u09BF\u09B0\u09BE\u09AA\u09A4\u09CD\u09A4\u09BE \u09B8\u09A4\u09B0\u09CD\u0995\u09A4\u09BE", desc: "Emergency alerts, fall detection, vital sign anomalies", icon: ShieldAlert, color: "#EF4444", bg: "rgba(239,68,68,0.08)", critical: true },
  { id: "shift-reminders", nameEn: "Shift Reminders", nameBn: "\u09B6\u09BF\u09AB\u09CD\u099F \u0985\u09A8\u09C1\u09B8\u09CD\u09AE\u09BE\u09B0\u0995", desc: "Upcoming shift alerts, check-in/out reminders", icon: Calendar, color: "#0288D1", bg: "rgba(2,136,209,0.08)" },
  { id: "messages", nameEn: "Messages", nameBn: "\u09AC\u09BE\u09B0\u09CD\u09A4\u09BE", desc: "New messages from caregivers, guardians, or agencies", icon: MessageSquare, color: "#5FB865", bg: "rgba(95,184,101,0.08)" },
  { id: "payments", nameEn: "Payments & Billing", nameBn: "\u09AA\u09C7\u09AE\u09C7\u09A8\u09CD\u099F \u0993 \u09AC\u09BF\u09B2\u09BF\u0982", desc: "Invoice alerts, payment confirmations, payout updates", icon: CreditCard, color: "#E8A838", bg: "rgba(232,168,56,0.08)" },
  { id: "care-updates", nameEn: "Care Log Updates", nameBn: "\u0995\u09C7\u09AF\u09BC\u09BE\u09B0 \u09B2\u0997 \u0986\u09AA\u09A1\u09C7\u099F", desc: "New care logs, medication reminders, vital readings", icon: Heart, color: "#DB869A", bg: "rgba(219,134,154,0.08)" },
  { id: "ratings", nameEn: "Ratings & Reviews", nameBn: "\u09B0\u09C7\u099F\u09BF\u0982 \u0993 \u09B0\u09BF\u09AD\u09BF\u0989", desc: "New ratings, review requests, feedback reminders", icon: Star, color: "#7B5EA7", bg: "rgba(123,94,167,0.08)" },
  { id: "platform", nameEn: "Platform Updates", nameBn: "\u09AA\u09CD\u09B2\u09CD\u09AF\u09BE\u099F\u09AB\u09B0\u09CD\u09AE \u0986\u09AA\u09A1\u09C7\u099F", desc: "New features, maintenance notices, policy changes", icon: Megaphone, color: "#6B7280", bg: "rgba(107,114,128,0.08)" },
  { id: "system", nameEn: "System Notifications", nameBn: "\u09B8\u09BF\u09B8\u09CD\u099F\u09C7\u09AE \u09A8\u09CB\u099F\u09BF\u09AB\u09BF\u0995\u09C7\u09B6\u09A8", desc: "Account alerts, verification status, system messages", icon: Bell, color: "#475569", bg: "rgba(71,85,105,0.08)" },
  { id: "booking", nameEn: "Booking Updates", nameBn: "\u09AC\u09C1\u0995\u09BF\u0982 \u0986\u09AA\u09A1\u09C7\u099F", desc: "New bookings, schedule changes, cancellations", icon: Briefcase, color: "#0D9488", bg: "rgba(13,148,136,0.08)" },
  { id: "document", nameEn: "Document Alerts", nameBn: "\u09A1\u0995\u09C1\u09AE\u09C7\u09A8\u09CD\u099F \u09B8\u09A4\u09B0\u09CD\u0995\u09A4\u09BE", desc: "Document expiry, verification requests, uploads", icon: FileText, color: "#8B5CF6", bg: "rgba(139,92,246,0.08)" },
  { id: "billing", nameEn: "Billing & Payment Proofs", nameBn: "\u09AC\u09BF\u09B2\u09BF\u0982 \u0993 \u09AA\u09C7\u09AE\u09C7\u09A8\u09CD\u099F \u09AA\u09CD\u09B0\u09AE\u09BE\u09A3", desc: "Payment proof submissions, verification & rejection alerts", icon: Receipt, color: "#00897B", bg: "rgba(0,137,123,0.08)" },
];

type DeliveryMethod = "push" | "sms" | "inApp";

interface NotificationPreferencesProps {
  inline?: boolean;
}

export function NotificationPreferences({ inline = false }: NotificationPreferencesProps) {
  const { i18n } = useTranslation();
  const isBangla = i18n.language === "bn";

  const {
    loading,
    isChannelEnabled,
    setChannelEnabled,
    getChannelPreference,
    setChannelSubPref,
    setAllChannelsEnabled,
  } = useNotificationPreferencesSync();

  const [expandedChannel, setExpandedChannel] = useState<string | null>(null);

  // ─── Quiet Hours (synced to Supabase) ───
  const [quietHoursEnabled, setQuietHoursEnabledLocal] = useState(true);
  const [quietStart, setQuietStartLocal] = useState("22:00");
  const [quietEnd, setQuietEndLocal] = useState("07:00");
  const [quietHoursLoaded, setQuietHoursLoaded] = useState(false);

  // Load quiet hours from Supabase on mount
  useEffect(() => {
    async function loadQuietHours() {
      if (!USE_SUPABASE) {
        // Load from localStorage fallback
        try {
          const stored = localStorage.getItem("carenet:notif:quiet_hours");
          if (stored) {
            const parsed = JSON.parse(stored);
            setQuietHoursEnabledLocal(parsed.enabled ?? true);
            setQuietStartLocal(parsed.start ?? "22:00");
            setQuietEndLocal(parsed.end ?? "07:00");
          }
        } catch {}
        setQuietHoursLoaded(true);
        return;
      }
      try {
        const sb = getSupabaseClient();
        const { data: { user } } = await sb.auth.getUser();
        if (!user) { setQuietHoursLoaded(true); return; }

        const { data } = await sb
          .from("user_preferences")
          .select("quiet_hours_enabled, quiet_hours_start, quiet_hours_end")
          .eq("user_id", user.id)
          .maybeSingle();

        if (data) {
          const row = data as { quiet_hours_enabled?: boolean; quiet_hours_start?: string; quiet_hours_end?: string };
          setQuietHoursEnabledLocal(row.quiet_hours_enabled ?? true);
          setQuietStartLocal((row.quiet_hours_start ?? "22:00").substring(0, 5));
          setQuietEndLocal((row.quiet_hours_end ?? "07:00").substring(0, 5));
        }
      } catch (e) {
        console.warn("[NotifPrefs] Failed to load quiet hours:", e);
      }
      setQuietHoursLoaded(true);
    }
    loadQuietHours();
  }, []);

  // Persist quiet hours changes
  const syncQuietHours = (enabled: boolean, start: string, end: string) => {
    // localStorage fallback
    try {
      localStorage.setItem("carenet:notif:quiet_hours", JSON.stringify({ enabled, start, end }));
    } catch {}

    if (!USE_SUPABASE) return;

    // Debounced Supabase sync
    const timer = setTimeout(async () => {
      try {
        const sb = getSupabaseClient();
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return;

        const { data: existingPref } = await sb
          .from("user_preferences")
          .select("notification_channels")
          .eq("user_id", user.id)
          .maybeSingle();

        const updateData = {
          quiet_hours_enabled: enabled,
          quiet_hours_start: start,
          quiet_hours_end: end,
          updated_at: new Date().toISOString(),
        };

        const channels =
          (existingPref as { notification_channels?: Record<string, unknown> } | null)?.notification_channels ?? {};

        const { error: upsertErr } = await sb.from("user_preferences").upsert(
          {
            user_id: user.id,
            ...updateData,
            notification_channels: channels,
          },
          { onConflict: "user_id" },
        );

        if (upsertErr) {
          console.warn("[NotifPrefs] quiet hours upsert failed:", upsertErr.message);
        }
      } catch (e) {
        console.warn("[NotifPrefs] Failed to sync quiet hours:", e);
      }
    }, 800);
    return () => clearTimeout(timer);
  };

  const setQuietHoursEnabled = (enabled: boolean) => {
    setQuietHoursEnabledLocal(enabled);
    syncQuietHours(enabled, quietStart, quietEnd);
  };

  const setQuietStart = (start: string) => {
    setQuietStartLocal(start);
    syncQuietHours(quietHoursEnabled, start, quietEnd);
  };

  const setQuietEnd = (end: string) => {
    setQuietEndLocal(end);
    syncQuietHours(quietHoursEnabled, quietStart, end);
  };

  const toggleExpand = (id: string) => {
    setExpandedChannel((prev) => (prev === id ? null : id));
  };

  // Count enabled/total
  const enabledCount = CHANNELS.filter((ch) => isChannelEnabled(ch.id)).length;

  if (loading && !quietHoursLoaded) {
    return (
      <div className="flex items-center justify-center py-12 gap-3" style={{ color: cn.textSecondary }}>
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading notification preferences...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!inline && (
        <div>
          <h2 className="text-lg" style={{ color: cn.text }}>Notification Preferences</h2>
          <p className="text-sm" style={{ color: cn.textSecondary }}>
            Control which notifications you receive and how they are delivered.
          </p>
        </div>
      )}

      {/* Master toggle + channel count */}
      <div className="flex items-center justify-between rounded-xl border p-3.5" style={{ borderColor: cn.border }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(219,134,154,0.08)" }}>
            <Bell className="w-4.5 h-4.5" style={{ color: cn.pink }} />
          </div>
          <div>
            <p className="text-sm" style={{ color: cn.text }}>
              {isBangla ? "সমস্ত চ্যানেল" : "All Channels"}
            </p>
            <p className="text-xs" style={{ color: cn.textSecondary }}>
              {enabledCount}/{CHANNELS.length} enabled
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAllChannelsEnabled(true)}
            className="px-2.5 py-1.5 rounded-lg text-[10px] border cn-touch-target"
            style={{ borderColor: cn.green, color: cn.green }}
          >
            All On
          </button>
          <button
            onClick={() => setAllChannelsEnabled(false)}
            className="px-2.5 py-1.5 rounded-lg text-[10px] border cn-touch-target"
            style={{ borderColor: "#EF4444", color: "#EF4444" }}
          >
            All Off
          </button>
        </div>
      </div>

      {/* Channel toggles */}
      <div className="space-y-2">
        {CHANNELS.map((ch) => {
          const enabled = isChannelEnabled(ch.id);
          const pref = getChannelPreference(ch.id);
          const isExpanded = expandedChannel === ch.id;
          const Icon = ch.icon;

          return (
            <div
              key={ch.id}
              className="rounded-xl border overflow-hidden transition-all"
              style={{ borderColor: enabled ? `${ch.color}30` : cn.border }}
            >
              {/* Main toggle row */}
              <div className="flex items-center gap-3 p-3.5">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: ch.bg }}
                >
                  <Icon className="w-4.5 h-4.5" style={{ color: ch.color }} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm" style={{ color: cn.text }}>
                    {isBangla ? ch.nameBn : ch.nameEn}
                  </p>
                  <p className="text-xs truncate" style={{ color: cn.textSecondary }}>
                    {ch.desc}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => !ch.critical && setChannelEnabled(ch.id, !enabled)}
                    className="relative w-11 h-6 rounded-full transition-all"
                    style={{
                      background: enabled ? ch.color : cn.border,
                      opacity: ch.critical ? 0.6 : 1,
                      cursor: ch.critical ? "not-allowed" : "pointer",
                    }}
                    disabled={ch.critical}
                  >
                    <div
                      className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                      style={{ left: enabled ? "calc(100% - 22px)" : "2px" }}
                    />
                  </button>

                  <button
                    onClick={() => toggleExpand(ch.id)}
                    className="p-1 rounded cn-touch-target"
                    style={{ color: cn.textSecondary }}
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Expanded: delivery method toggles */}
              {isExpanded && enabled && (
                <div className="px-4 pb-4 pt-1 border-t" style={{ borderColor: cn.borderLight }}>
                  <p className="text-xs mb-3" style={{ color: cn.textSecondary }}>Delivery Methods</p>
                  <div className="flex gap-3">
                    {([
                      { key: "push" as DeliveryMethod, label: "Push", emoji: "\uD83D\uDCF1" },
                      { key: "sms" as DeliveryMethod, label: "SMS", emoji: "\uD83D\uDCAC" },
                      { key: "inApp" as DeliveryMethod, label: "In-App", emoji: "\uD83D\uDD14" },
                    ]).map((m) => (
                      <button
                        key={m.key}
                        onClick={() => setChannelSubPref(ch.id, m.key, !pref[m.key])}
                        className="flex-1 py-2.5 rounded-lg border text-xs transition-all cn-touch-target text-center"
                        style={{
                          borderColor: pref[m.key] ? ch.color : cn.border,
                          background: pref[m.key] ? ch.bg : "transparent",
                          color: pref[m.key] ? ch.color : cn.textSecondary,
                        }}
                      >
                        <span className="block mb-0.5">{m.emoji}</span>
                        {m.label}
                      </button>
                    ))}
                  </div>
                  {ch.critical && (
                    <p className="text-[10px] mt-2 flex items-center gap-1" style={{ color: "#EF4444" }}>
                      <ShieldAlert className="w-3 h-3" /> This channel cannot be fully disabled for safety.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quiet Hours */}
      <div className="rounded-xl border p-4" style={{ borderColor: cn.border }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(57,73,171,0.08)" }}>
              <Clock className="w-4.5 h-4.5" style={{ color: "#3949AB" }} />
            </div>
            <div>
              <p className="text-sm" style={{ color: cn.text }}>
                {isBangla ? "\u09A8\u09C0\u09B0\u09AC \u09B8\u09AE\u09AF\u09BC" : "Quiet Hours"}
              </p>
              <p className="text-xs" style={{ color: cn.textSecondary }}>
                Suppress non-critical push during sleep — notifications still appear in-app
              </p>
            </div>
          </div>
          <button
            onClick={() => setQuietHoursEnabled(!quietHoursEnabled)}
            className="relative w-11 h-6 rounded-full transition-all"
            style={{ background: quietHoursEnabled ? "#3949AB" : cn.border }}
          >
            <div
              className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
              style={{ left: quietHoursEnabled ? "calc(100% - 22px)" : "2px" }}
            />
          </button>
        </div>

        {quietHoursEnabled && (
          <div className="flex items-center gap-3 mt-3 pt-3 border-t" style={{ borderColor: cn.borderLight }}>
            <div className="flex-1">
              <label className="text-xs block mb-1" style={{ color: cn.textSecondary }}>From</label>
              <input
                type="time"
                value={quietStart}
                onChange={(e) => setQuietStart(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border text-sm"
                style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput }}
              />
            </div>
            <span className="mt-5" style={{ color: cn.textSecondary }}>&rarr;</span>
            <div className="flex-1">
              <label className="text-xs block mb-1" style={{ color: cn.textSecondary }}>To</label>
              <input
                type="time"
                value={quietEnd}
                onChange={(e) => setQuietEnd(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border text-sm"
                style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput }}
              />
            </div>
          </div>
        )}

        {quietHoursEnabled && (
          <p className="text-[10px] mt-2" style={{ color: cn.textSecondary }}>
            Care & Safety alerts will still come through during quiet hours. Deferred notifications are delivered when quiet hours end.
          </p>
        )}
      </div>
    </div>
  );
}
