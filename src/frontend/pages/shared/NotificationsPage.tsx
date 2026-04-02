import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Bell, ShieldAlert, Calendar, MessageSquare, CreditCard, Heart, Star, Megaphone, CheckCheck, Settings, Check, Trash2, Receipt } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/frontend/theme/tokens";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { notificationService } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { useUnreadCountsCtx } from "@/frontend/hooks/UnreadCountsContext";

interface Notification { id: string; channel: string; titleEn: string; titleBn: string; messageEn: string; messageBn: string; time: string; read: boolean; }

const channelConfig: Record<string, { nameEn: string; nameBn: string; icon: React.ElementType; color: string; bg: string }> = {
  "care-safety": { nameEn: "Care & Safety", nameBn: "\u09AF\u09A4\u09CD\u09A8 \u0993 \u09A8\u09BF\u09B0\u09BE\u09AA\u09A4\u09CD\u09A4\u09BE", icon: ShieldAlert, color: "#EF4444", bg: "rgba(239,68,68,0.08)" },
  "shift-reminders": { nameEn: "Shift Reminders", nameBn: "\u09B6\u09BF\u09AB\u09CD\u099F \u0985\u09A8\u09C1\u09B8\u09CD\u09AE\u09BE\u09B0\u0995", icon: Calendar, color: "#0288D1", bg: "rgba(2,136,209,0.08)" },
  "messages": { nameEn: "Messages", nameBn: "\u09AC\u09BE\u09B0\u09CD\u09A4\u09BE", icon: MessageSquare, color: "#5FB865", bg: "rgba(95,184,101,0.08)" },
  "payments": { nameEn: "Payments", nameBn: "\u09AA\u09C7\u09AE\u09C7\u09A8\u09CD\u099F", icon: CreditCard, color: "#E8A838", bg: "rgba(232,168,56,0.08)" },
  "care-updates": { nameEn: "Care Updates", nameBn: "\u0995\u09C7\u09AF\u09BC\u09BE\u09B0 \u0986\u09AA\u09A1\u09C7\u099F", icon: Heart, color: "#DB869A", bg: "rgba(219,134,154,0.08)" },
  "ratings": { nameEn: "Ratings", nameBn: "\u09B0\u09C7\u099F\u09BF\u0982", icon: Star, color: "#7B5EA7", bg: "rgba(123,94,167,0.08)" },
  "platform": { nameEn: "Platform", nameBn: "\u09AA\u09CD\u09B2\u09CD\u09AF\u09BE\u099F\u09AB\u09B0\u09CD\u09AE", icon: Megaphone, color: "#6B7280", bg: "rgba(107,114,128,0.08)" },
  "billing": { nameEn: "Billing", nameBn: "\u09AC\u09BF\u09B2\u09BF\u0982", icon: Receipt, color: "#00897B", bg: "rgba(0,137,123,0.08)" },
};

type FilterMode = "all" | "unread" | string;

export default function NotificationsPage() {
  const { t, i18n } = useTranslation("common");
  useDocumentTitle(t("pageTitles.notifications", "Notifications"));
  const isBangla = i18n.language === "bn";
  const { data: initialNotifications, loading } = useAsyncData(() => notificationService.getNotifications());
  const { decrementNotifications } = useUnreadCountsCtx();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [filter, setFilter] = useState<FilterMode>("all");

  // Sync async data into local state for optimistic updates without mutating during render.
  useEffect(() => {
    if (!initialized && initialNotifications) {
      setNotifications(initialNotifications);
      setInitialized(true);
    }
  }, [initialNotifications, initialized]);

  if (loading && !initialized) return <PageSkeleton cards={4} />;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    const count = notifications.filter((n) => !n.read).length;
    notificationService.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (count > 0) decrementNotifications(count);
  };
  const markRead = (id: string) => {
    const notif = notifications.find((n) => n.id === id);
    if (notif && !notif.read) decrementNotifications(1);
    notificationService.markRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };
  const deleteNotification = (id: string) => {
    const notif = notifications.find((n) => n.id === id);
    if (notif && !notif.read) decrementNotifications(1);
    notificationService.deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  let filtered = notifications;
  if (filter === "unread") filtered = notifications.filter((n) => !n.read);
  else if (filter !== "all" && channelConfig[filter]) filtered = notifications.filter((n) => n.channel === filter);

  const grouped = filtered.reduce<Record<string, Notification[]>>((acc, n) => { if (!acc[n.channel]) acc[n.channel] = []; acc[n.channel].push(n); return acc; }, {});
  const channelOrder = Object.keys(grouped).sort((a, b) => grouped[b].filter(n => !n.read).length - grouped[a].filter(n => !n.read).length);

  return (
    <>
      <div className="max-w-3xl mx-auto space-y-5 pb-20">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl" style={{ color: cn.text }}>{isBangla ? "\u09AC\u09BF\u099C\u09CD\u099E\u09AA\u09CD\u09A4\u09BF" : "Notifications"}</h1><p className="text-sm" style={{ color: cn.textSecondary }}>{unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}</p></div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && <button onClick={markAllRead} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs cn-touch-target" style={{ background: cn.greenBg, color: cn.green }}><CheckCheck className="w-3.5 h-3.5" /> Mark All Read</button>}
            <Link to="/settings" className="p-2 rounded-lg cn-touch-target no-underline" style={{ color: cn.textSecondary }}><Settings className="w-5 h-5" /></Link>
          </div>
        </div>

        {unreadCount > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {Object.entries(channelConfig).map(([id, cfg]) => {
              const count = notifications.filter((n) => n.channel === id && !n.read).length;
              if (count === 0) return null;
              const Icon = cfg.icon;
              return (<button key={id} onClick={() => setFilter(filter === id ? "all" : id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap shrink-0 cn-touch-target" style={{ background: filter === id ? cfg.color : cfg.bg, color: filter === id ? "white" : cfg.color }}><Icon className="w-3.5 h-3.5" /><span>{isBangla ? cfg.nameBn : cfg.nameEn}</span><span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]" style={{ background: filter === id ? "rgba(255,255,255,0.3)" : `${cfg.color}20`, color: filter === id ? "white" : cfg.color }}>{count}</span></button>);
            })}
          </div>
        )}

        {channelOrder.length === 0 ? (
          <div className="finance-card p-12 text-center"><Bell className="w-10 h-10 mx-auto mb-3" style={{ color: cn.border }} /><p style={{ color: cn.textSecondary }}>No notifications</p></div>
        ) : channelOrder.map((channelId) => {
          const cfg = channelConfig[channelId]; if (!cfg) return null;
          const items = grouped[channelId]; const Icon = cfg.icon;
          return (
            <div key={channelId} className="space-y-1">
              <div className="flex items-center gap-2 px-1 py-2"><div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: cfg.bg }}><Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} /></div><span className="text-xs uppercase tracking-wider" style={{ color: cfg.color }}>{isBangla ? cfg.nameBn : cfg.nameEn}</span></div>
              <div className="finance-card overflow-hidden divide-y" style={{ borderColor: cn.borderLight }}>
                {items.map((notif) => (
                  <div key={notif.id} className="p-4 flex gap-3 transition-all cursor-pointer group" style={{ background: notif.read ? "transparent" : `${cfg.color}04` }} onClick={() => markRead(notif.id)}>
                    <div className="pt-1.5 shrink-0"><div className="w-2 h-2 rounded-full" style={{ background: notif.read ? "transparent" : cfg.color }} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-0.5"><h3 className="text-sm" style={{ color: cn.text }}>{isBangla ? notif.titleBn : notif.titleEn}</h3><span className="text-[10px] whitespace-nowrap shrink-0" style={{ color: cn.textSecondary }}>{notif.time}</span></div>
                      <p className="text-xs" style={{ color: cn.textSecondary }}>{isBangla ? notif.messageBn : notif.messageEn}</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      {!notif.read && <button onClick={(e) => { e.stopPropagation(); markRead(notif.id); }} className="p-1.5 rounded-lg cn-touch-target" style={{ color: cn.green }}><Check className="w-3.5 h-3.5" /></button>}
                      <button onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }} className="p-1.5 rounded-lg cn-touch-target" style={{ color: cn.textSecondary }}><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
