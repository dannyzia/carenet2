import { Link } from "react-router";
import { Star, Flag, FileText, CheckCircle, TrendingUp, Shield, ArrowUpRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { moderatorService } from "@/backend/services/moderator.service";
import { PageSkeleton } from "@/frontend/components/PageSkeleton";

const priorityColors: Record<string, { color: string; bg: string }> = {
  low: { color: "#5FB865", bg: "#7CE57720" },
  medium: { color: "#E8A838", bg: "#FFB54D20" },
  high: { color: "#EF4444", bg: "#EF444420" },
};

export default function ModeratorDashboardPage() {
  const { t } = useTranslation("common");
  useDocumentTitle(t("pageTitles.moderatorDashboard", "Dashboard"));

  const { data: queue, loading, error } = useAsyncData(() => moderatorService.getDashboardQueue());
  const queueItems = queue ?? [];

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "#535353" }}>Moderator Dashboard</h1>
          <p className="text-sm" style={{ color: "#848484" }}>Reviews, reports, and flags — March 15, 2026</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: "Pending Reviews", value: "18", icon: Star, color: "#E8A838", bg: "#FFB54D20", path: "/moderator/reviews" },
            { label: "Open Reports", value: "8", icon: Flag, color: "#EF4444", bg: "#EF444420", path: "/moderator/reports" },
            { label: "Content Flags", value: "5", icon: FileText, color: "#7B5EA7", bg: "#8082ED20", path: "/moderator/content" },
            { label: "Resolved Today", value: "12", icon: CheckCircle, color: "#5FB865", bg: "#7CE57720", path: "/moderator/reports" },
          ].map(s => {
            const Icon = s.icon;
            return (
              <Link key={s.label} to={s.path} className="stat-card block hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
                    <Icon className="w-5 h-5" style={{ color: s.color }} />
                  </div>
                  <TrendingUp className="w-4 h-4" style={{ color: "#7CE577" }} />
                </div>
                <p className="text-2xl font-bold" style={{ color: "#535353" }}>{s.value}</p>
                <p className="text-xs" style={{ color: "#848484" }}>{s.label}</p>
              </Link>
            );
          })}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link to="/moderator/sanctions" className="stat-card flex items-center gap-3 hover:shadow-md transition-all no-underline">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#EF444420" }}>
              <Shield className="w-5 h-5" style={{ color: "#EF4444" }} />
            </div>
            <div>
              <p className="text-sm" style={{ color: "#535353" }}>User Sanctions</p>
              <p className="text-xs" style={{ color: "#848484" }}>Manage warnings, mutes & bans</p>
            </div>
          </Link>
          <Link to="/moderator/escalations" className="stat-card flex items-center gap-3 hover:shadow-md transition-all no-underline">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#FFB54D20" }}>
              <ArrowUpRight className="w-5 h-5" style={{ color: "#E8A838" }} />
            </div>
            <div>
              <p className="text-sm" style={{ color: "#535353" }}>Escalation Queue</p>
              <p className="text-xs" style={{ color: "#848484" }}>Cases requiring admin review</p>
            </div>
          </Link>
        </div>

        <div className="finance-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold" style={{ color: "#535353" }}>Moderation Queue</h2>
            <span className="badge-pill" style={{ background: "#EF444420", color: "#EF4444" }}>31 items</span>
          </div>
          <div className="space-y-3">
            {loading ? (
              <PageSkeleton cards={2} />
            ) : error ? (
              <p className="text-sm" style={{ color: "#EF4444" }}>Could not load moderation queue.</p>
            ) : (
              queueItems.map(item => {
              const pc = priorityColors[item.priority] ?? priorityColors.medium;
              return (
                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl" style={{ background: "#F9FAFB" }}>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: pc.bg }}>
                      {item.type === "Review" ? <Star className="w-4 h-4" style={{ color: pc.color }} /> :
                       item.type === "Report" ? <Flag className="w-4 h-4" style={{ color: pc.color }} /> :
                       <FileText className="w-4 h-4" style={{ color: pc.color }} />}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="badge-pill" style={{ background: "#F3F4F6", color: "#848484" }}>{item.type}</span>
                        <span className="badge-pill" style={{ background: pc.bg, color: pc.color }}>{item.priority}</span>
                      </div>
                      <p className="text-sm" style={{ color: "#535353" }}>{item.content}</p>
                      <p className="text-xs mt-1" style={{ color: "#848484" }}>By {item.reporter} • {item.time}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button className="px-3 py-1.5 rounded-lg border text-xs hover:bg-white" style={{ borderColor: "#E5E7EB", color: "#535353" }}>Review</button>
                    <button className="px-3 py-1.5 rounded-lg text-white text-xs" style={{ background: "#5FB865" }}>Approve</button>
                    <button className="px-3 py-1.5 rounded-lg text-white text-xs" style={{ background: "#EF4444" }}>Remove</button>
                  </div>
                </div>
              );
            })
            )}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: "\r\n        .stat-card { background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); padding: 1.25rem; }\r\n        .finance-card { background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }\r\n        .badge-pill { display: inline-flex; align-items: center; padding: 0.2rem 0.5rem; border-radius: 999px; font-size: 0.7rem; font-weight: 500; }\r\n      " }} />
    </>
  );
}
