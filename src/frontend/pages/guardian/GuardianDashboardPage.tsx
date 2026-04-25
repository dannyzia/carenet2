import React from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { cn } from "@/frontend/theme/tokens";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { useAuth } from "@/frontend/auth/AuthContext";
import { guardianService } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { ActionBar } from "@/frontend/components/dashboard/ActionBar";
import { WorkQueue } from "@/frontend/components/dashboard/WorkQueue";
import { formatDashboardDate } from "@/frontend/utils/dashboardFormat";
import { Plus, Heart } from "lucide-react";
import i18n from "@/frontend/i18n";

export default function GuardianDashboardPage() {
  const { t } = useTranslation(["dashboard", "common"]);
  const { user } = useAuth();
  useDocumentTitle(t("common:pageTitles.guardianDashboard", "Dashboard"));

  const locale = i18n.language || "en";
  const { data: dash, loading, error } = useAsyncData(() => guardianService.getOperationalDashboard());
  const { data: patients } = useAsyncData(() => guardianService.getDashboardPatients());

  if (loading) {
    return <PageSkeleton variant="dashboard" />;
  }

  if (error || !dash) {
    return (
      <div className="p-6 space-y-2">
        <h1 className="text-xl font-semibold" style={{ color: cn.text }}>
          {t("dashboard:guardian.welcome", { name: user?.name?.replace(/^Mock_/, "") || "User" })}
        </h1>
        <p className="text-sm" style={{ color: cn.red }}>{t("common:error.generic")}</p>
      </div>
    );
  }

  const today = formatDashboardDate(new Date(), locale);
  const displayName = user?.name?.replace(/^Mock_/, "") || "User";
  const queueCount = dash.queue.filter((r) => r.priority === "high").length;

  const queueColumns = {
    type: t("dashboard:admin.queueColType"),
    priority: t("dashboard:admin.queueColPriority"),
    entity: t("dashboard:admin.queueColEntity"),
    reason: t("dashboard:admin.queueColReason"),
    time: t("dashboard:admin.queueColTime"),
    actions: t("dashboard:admin.queueColActions"),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl" style={{ color: cn.text }}>
            {t("dashboard:guardian.welcome", { name: displayName })}
          </h1>
          <p className="text-sm" style={{ color: cn.textSecondary }}>
            {t("dashboard:guardian.subtitle")} — {today}
          </p>
        </div>
        {queueCount > 0 && (
          <span
            className="px-3 py-1 rounded-full text-sm self-start"
            style={{ background: cn.amberBg ?? "rgba(232, 168, 56, 0.2)", color: cn.amber }}
          >
            {t("dashboard:shared.needsAttention", { count: queueCount })}
          </span>
        )}
      </div>

      <ActionBar actions={dash.actions} role="guardian" ariaLabelKey="dashboard:guardian.opsAriaLabel" />

      <section aria-label={t("dashboard:guardian.myPatients")}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold" style={{ color: cn.text }}>
            {t("dashboard:guardian.myPatients")}
          </h2>
          <Link
            to="/guardian/patient-intake"
            className="flex items-center gap-1.5 text-sm cn-touch-target"
            style={{ color: cn.green }}
          >
            <Plus className="w-4 h-4" />
            {t("dashboard:guardian.addPatient")}
          </Link>
        </div>
        {!patients || patients.length === 0 ? (
          <div className="finance-card p-6 text-center">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: cn.pinkBg }}>
              <Heart className="w-6 h-6" style={{ color: cn.pink }} />
            </div>
            <p className="text-sm" style={{ color: cn.textSecondary }}>
              {t("dashboard:guardian.noPatients")}
            </p>
            <Link
              to="/guardian/patient-intake"
              className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 rounded-xl text-sm text-white no-underline cn-touch-target"
              style={{ background: "var(--cn-gradient-guardian)" }}
            >
              <Plus className="w-4 h-4" />
              {t("dashboard:guardian.addPatientLink")}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {patients.map((p) => (
              <Link
                key={p.id}
                to={`/guardian/patients`}
                className="finance-card p-4 no-underline hover:shadow-md transition-all block"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                    style={{ background: p.statusColor || cn.green }}
                  >
                    {p.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate" style={{ color: cn.text }}>{p.name}</p>
                    <p className="text-xs truncate" style={{ color: cn.textSecondary }}>
                      {t("dashboard:guardian.ageLabel", { age: p.age })}{p.condition && p.condition !== "No conditions listed" ? ` · ${p.condition}` : ""}
                    </p>
                  </div>
                  <span className="badge-pill text-[10px]" style={{ background: `${cn.green}20`, color: cn.green }}>
                    {p.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <WorkQueue
        title={t("dashboard:guardian.workQueueTitle")}
        rows={dash.queue}
        columnLabels={queueColumns}
        emptyLabel={t("dashboard:guardian.workQueueEmpty")}
      />
      <style dangerouslySetInnerHTML={{ __html: ".finance-card { background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); } .badge-pill { display: inline-flex; align-items: center; padding: 0.2rem 0.5rem; border-radius: 999px; font-size: 0.7rem; font-weight: 500; }" }} />
    </div>
  );
}
