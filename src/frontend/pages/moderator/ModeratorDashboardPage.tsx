import { Link } from "react-router";
import { Star, Flag, FileText, CheckCircle, TrendingUp, Shield, ArrowUpRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { moderatorService } from "@/backend/services/moderator.service";
import { PageSkeleton } from "@/frontend/components/PageSkeleton";
import { cn } from "@/frontend/theme/tokens";
import { formatDashboardDate } from "@/frontend/utils/dashboardFormat";
import i18n from "@/frontend/i18n";

const priorityColors: Record<string, { color: string; bg: string }> = {
  low: { color: "var(--cn-green)", bg: "var(--cn-green-bg)" },
  medium: { color: "var(--cn-amber)", bg: "var(--cn-amber-bg)" },
  high: { color: "var(--cn-red)", bg: "rgba(239, 68, 68, 0.125)" },
};

export default function ModeratorDashboardPage() {
  const { t } = useTranslation(["dashboard", "common"]);
  useDocumentTitle(t("common:pageTitles.moderatorDashboard", "Dashboard"));

  const locale = i18n.language || "en";
  const { data: queue, loading, error } = useAsyncData(() => moderatorService.getDashboardQueue());
  const { data: stats, loading: lSt } = useAsyncData(() => moderatorService.getDashboardStats());
  const queueItems = queue ?? [];

  if (lSt || !stats) {
    return <PageSkeleton cards={4} />;
  }

  const subtitle = t("dashboard:shared.subtitleWithDate", {
    context: t("dashboard:moderator.subtitle"),
    date: formatDashboardDate(new Date(), locale),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: cn.text }}>{t("dashboard:moderator.title")}</h1>
        <p className="text-sm" style={{ color: cn.textSecondary }}>{subtitle}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: t("dashboard:moderator.pendingReviews"), value: String(stats.pendingReviews), icon: Star, ...priorityColors.medium, path: "/moderator/reviews" },
          { label: t("dashboard:moderator.openReports"), value: String(stats.openReports), icon: Flag, ...priorityColors.high, path: "/moderator/reports" },
          { label: t("dashboard:moderator.contentFlags"), value: String(stats.contentFlags), icon: FileText, color: cn.purple, bg: cn.purpleBg, path: "/moderator/content" },
          { label: t("dashboard:moderator.resolvedToday"), value: String(stats.resolvedToday), icon: CheckCircle, ...priorityColors.low, path: "/moderator/reports" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.label}
              to={s.path}
              className="cn-stat-card block no-underline hover:shadow-md transition-shadow cn-touch-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cn-pink)] focus-visible:ring-offset-2"
              aria-label={`${s.label}: ${s.value}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
                  <Icon className="w-5 h-5" style={{ color: s.color }} aria-hidden />
                </div>
                <TrendingUp className="w-4 h-4" style={{ color: cn.green }} aria-hidden />
              </div>
              <p className="text-2xl font-bold" style={{ color: cn.text }}>{s.value}</p>
              <p className="text-xs" style={{ color: cn.textSecondary }}>{s.label}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link to="/moderator/sanctions" className="cn-stat-card flex items-center gap-3 hover:shadow-md transition-all no-underline cn-touch-target focus-visible:ring-2 focus-visible:ring-[var(--cn-pink)]">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: priorityColors.high.bg }}>
            <Shield className="w-5 h-5" style={{ color: priorityColors.high.color }} />
          </div>
          <div>
            <p className="text-sm" style={{ color: cn.text }}>{t("dashboard:moderator.userSanctions")}</p>
            <p className="text-xs" style={{ color: cn.textSecondary }}>{t("dashboard:moderator.sanctionsHint")}</p>
          </div>
        </Link>
        <Link to="/moderator/escalations" className="cn-stat-card flex items-center gap-3 hover:shadow-md transition-all no-underline cn-touch-target focus-visible:ring-2 focus-visible:ring-[var(--cn-pink)]">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: cn.amberBg }}>
            <ArrowUpRight className="w-5 h-5" style={{ color: cn.amber }} />
          </div>
          <div>
            <p className="text-sm" style={{ color: cn.text }}>{t("dashboard:moderator.escalationQueue")}</p>
            <p className="text-xs" style={{ color: cn.textSecondary }}>{t("dashboard:moderator.escalationsHint")}</p>
          </div>
        </Link>
      </div>

      <div className="cn-card-flat p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold" style={{ color: cn.text }}>{t("dashboard:moderator.moderationQueue")}</h2>
          <span className="cn-badge text-[0.7rem]" style={{ background: priorityColors.high.bg, color: priorityColors.high.color }}>
            {t("dashboard:moderator.queueCount", { count: queueItems.length })}
          </span>
        </div>
        <div className="space-y-3">
          {loading ? (
            <PageSkeleton cards={2} />
          ) : error ? (
            <p className="text-sm" style={{ color: cn.red }}>{t("dashboard:moderator.queueLoadError")}</p>
          ) : (
            queueItems.map((item) => {
              const pc = priorityColors[item.priority] ?? priorityColors.medium;
              const reviewPath = item.type === "Report" ? "/moderator/reports" : item.type === "Content" ? "/moderator/content" : "/moderator/reviews";
              return (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl"
                  style={{ background: cn.bgInput }}
                >
                  <Link
                    to={reviewPath}
                    className="flex items-start gap-3 min-w-0 flex-1 no-underline rounded-lg hover:opacity-90 cn-touch-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cn-pink)]"
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: pc.bg }}>
                      {item.type === "Review" ? <Star className="w-4 h-4" style={{ color: pc.color }} /> :
                       item.type === "Report" ? <Flag className="w-4 h-4" style={{ color: pc.color }} /> :
                       <FileText className="w-4 h-4" style={{ color: pc.color }} />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="cn-badge text-[0.7rem]" style={{ background: cn.bgCard, color: cn.textSecondary }}>{item.type}</span>
                        <span className="cn-badge text-[0.7rem]" style={{ background: pc.bg, color: pc.color }}>{item.priority}</span>
                      </div>
                      <p className="text-sm" style={{ color: cn.text }}>{item.content}</p>
                      <p className="text-xs mt-1" style={{ color: cn.textSecondary }}>By {item.reporter} · {item.time}</p>
                    </div>
                  </Link>
                  <div className="flex gap-2 shrink-0">
                    <button type="button" className="px-3 py-1.5 rounded-lg border text-xs cn-touch-target" style={{ borderColor: cn.border, color: cn.text }}>{t("dashboard:moderator.review")}</button>
                    <button type="button" className="px-3 py-1.5 rounded-lg text-white text-xs cn-touch-target" style={{ background: cn.green }}>{t("dashboard:moderator.approve")}</button>
                    <button type="button" className="px-3 py-1.5 rounded-lg text-white text-xs cn-touch-target" style={{ background: cn.red }}>{t("dashboard:moderator.remove")}</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
