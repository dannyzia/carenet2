import { useState, useEffect, useCallback } from "react";
import { cn } from "@/frontend/theme/tokens";
import { Bell, X, Shield, Calendar, MessageSquare, Heart } from "lucide-react";

/**
 * NotificationPermissionPrompt — per D021 §9.2
 *
 * First-login prompt asking the user to enable push notifications.
 * Shows on first login when running in Capacitor context (or if
 * browser Notification API permission is "default").
 */

const STORAGE_KEY = "carenet-notif-prompt-dismissed";

interface NotificationPermissionPromptProps {
  /** Force show for demo purposes */
  forceShow?: boolean;
}

export function NotificationPermissionPrompt({ forceShow = false }: NotificationPermissionPromptProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (forceShow) {
      setVisible(true);
      return;
    }

    // Check if already dismissed
    if (localStorage.getItem(STORAGE_KEY)) return;

    // Check Notification API permission
    if (typeof Notification !== "undefined") {
      if (Notification.permission === "default") {
        const timer = setTimeout(() => setVisible(true), 2000);
        return () => clearTimeout(timer);
      }
      return;
    }

    // In Capacitor context without Notification API, check if we have the plugin
    const cap = (window as any).Capacitor;
    if (cap?.Plugins?.PushNotifications) {
      const timer = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [forceShow]);

  const handleEnable = async () => {
    if (typeof Notification !== "undefined") {
      const result = await Notification.requestPermission();
      if (result === "granted") {
        console.log("[NotificationPrompt] Permission granted via browser API");
      }
    }

    const cap = (window as any).Capacitor;
    if (cap?.Plugins?.PushNotifications) {
      try {
        await cap.Plugins.PushNotifications.requestPermissions();
        await cap.Plugins.PushNotifications.register();
        console.log("[NotificationPrompt] Registered via Capacitor PushNotifications");
      } catch (err) {
        console.warn("[NotificationPrompt] Capacitor push registration failed:", err);
      }
    }

    localStorage.setItem(STORAGE_KEY, "enabled");
    setVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "dismissed");
    setVisible(false);
  };

  if (!visible) return null;

  const benefits = [
    { icon: Shield, label: "Care & safety alerts", color: "#EF4444" },
    { icon: Calendar, label: "Shift reminders", color: "#0288D1" },
    { icon: Heart, label: "Care log updates", color: "#DB869A" },
    { icon: MessageSquare, label: "New messages", color: "#5FB865" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleDismiss} />

      {/* Prompt card */}
      <div
        className="relative z-10 w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-6 pb-8"
        style={{ background: cn.bgCard, boxShadow: "0 -10px 40px rgba(0,0,0,0.15)" }}
      >
        {/* Close */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1 rounded-lg cn-touch-target"
          style={{ color: cn.textSecondary }}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero icon */}
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: cn.pinkBg }}>
            <Bell className="w-8 h-8" style={{ color: cn.pink }} />
          </div>
        </div>

        <h2 className="text-center text-lg mb-1" style={{ color: cn.text }}>
          Stay Connected
        </h2>
        <p className="text-center text-sm mb-5" style={{ color: cn.textSecondary }}>
          Enable notifications to receive shift reminders, care alerts, and messages in real-time.
        </p>

        {/* Benefits grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-6">
          {benefits.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.label}
                className="flex items-center gap-2.5 p-3 rounded-xl"
                style={{ background: `${b.color}08` }}
              >
                <Icon className="w-4 h-4 shrink-0" style={{ color: b.color }} />
                <span className="text-xs" style={{ color: cn.text }}>{b.label}</span>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <button
          onClick={handleEnable}
          className="w-full py-3.5 rounded-xl text-white text-sm mb-2.5 cn-touch-target"
          style={{ background: "var(--cn-gradient-caregiver)" }}
        >
          Enable Notifications
        </button>
        <button
          onClick={handleDismiss}
          className="w-full py-3 rounded-xl text-sm cn-touch-target"
          style={{ color: cn.textSecondary }}
        >
          Not Now
        </button>

        <p className="text-center text-[10px] mt-3" style={{ color: cn.textSecondary }}>
          You can change this anytime in Settings &rarr; Notifications
        </p>
      </div>
    </div>
  );
}