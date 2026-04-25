import React, { useEffect } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { agencyService, marketplaceService } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { ActionBar } from "@/frontend/components/dashboard/ActionBar";
import { WorkQueue } from "@/frontend/components/dashboard/WorkQueue";
import { useAriaToast } from "@/frontend/hooks/useAriaToast";
import { useAuth } from "@/frontend/auth/AuthContext";
import { cn as cnTokens } from "@/frontend/theme/tokens";
import { formatDashboardDate } from "@/frontend/utils/dashboardFormat";
import i18n from "@/frontend/i18n";
import {
  AGENCY_DASHBOARD_CONTENT_MAX_WIDTH_CLASS,
  DEMO_USER_DISPLAY_NAME_PREFIX,
  PACKAGE_SUBSCRIBER_TOAST_DURATION_MS,
} from "@/frontend/constants/agencyDashboardUi";
import { Briefcase, Package, Inbox, FileText } from "lucide-react";

export default function AgencyDashboardPage() {
  const { t } = useTranslation(["dashboard", "common"]);
  useDocumentTitle(t("common:pageTitles.agencyDashboard"));

  const { user } = useAuth();
  const toast = useAriaToast();
  const locale = i18n.language || "en";

  const { data: dash, loading, error } = useAsyncData(() => agencyService.getOperationalDashboard());
  const { data: summary } = useAsyncData(() => agencyService.getDashboardSummary());

  useEffect(() => {
    const unsubscribe = marketplaceService.onPackageSubscription((_agencyId, packageTitle) => {
      toast.success(t("dashboard:agency.subscriberToast", { title: packageTitle }), {
        duration: PACKAGE_SUBSCRIBER_TOAST_DURATION_MS,
        description: t("dashboard:agency.subscriberToastDesc"),
      });
    });
    return unsubscribe;
  }, [toast, t]);

  if (loading) {
    return <PageSkeleton variant="dashboard" />;
  }

  if (error || !dash) {
    return (
      <div className={`p-4 ${AGENCY_DASHBOARD_CONTENT_MAX_WIDTH_CLASS} mx-auto w-full`}>
        <h1 className="text-xl font-semibold" style={{ color: cnTokens.text }}>{t("dashboard:agency.title")}</h1>
        <p className="text-sm mt-2" style={{ color: cnTokens.red }}>{t("common:error.generic")}</p>
      </div>
    );
  }

  const orgName = user?.name?.replace(DEMO_USER_DISPLAY_NAME_PREFIX, "") || t("dashboard:agency.fallbackOrgName");
  const subtitle = t("dashboard:shared.subtitleWithDate", {
    context: orgName,
    date: formatDashboardDate(new Date(), locale),
  });
  const urgent = dash.queue.filter((r) => r.priority === "high").length;

  const queueColumns = {
    type: t("dashboard:admin.queueColType"),
    priority: t("dashboard:admin.queueColPriority"),
    entity: t("dashboard:admin.queueColEntity"),
    reason: t("dashboard:admin.queueColReason"),
    time: t("dashboard:admin.queueColTime"),
    actions: t("dashboard:admin.queueColActions"),
  };

  const summaryCards = [
    {
      label: t("dashboard:agency.summaryCards.activeJobs"),
      value: summary?.activeCaregivers ?? 0,
      hint: t("dashboard:agency.summaryCards.activeJobsHint"),
      to: "/agency/job-management",
      icon: Briefcase,
      color: cnTokens.teal,
      bg: cnTokens.tealBg,
    },
    {
      label: t("dashboard:agency.summaryCards.myPackages"),
      value: summary?.marketplacePackagesTotal ?? 0,
      hint: t("dashboard:agency.packagesHint", {
        total: summary?.marketplacePackagesTotal ?? 0,
        drafts: summary?.marketplacePackagesDraft ?? 0,
      }),
      to: "/agency/care-packages",
      icon: Package,
      color: cnTokens.pink,
      bg: cnTokens.pinkBg,
    },
    {
      label: t("dashboard:agency.summaryCards.guardianRequirements"),
      value: summary?.openCareRequirementsCount ?? 0,
      hint: t("dashboard:agency.requirementsInboxHint"),
      to: "/agency/requirements-inbox",
      icon: Inbox,
      color: cnTokens.amber,
      bg: cnTokens.amberBg,
    },
    {
      label: t("dashboard:agency.summaryCards.jobsPostedByMe"),
      value: dash.kpis?.find((k) => k.id === "jobs")?.value ?? 0,
      hint: t("dashboard:agency.summaryCards.jobsPostedHint"),
      to: "/agency/caregiving-jobs",
      icon: FileText,
      color: cnTokens.green,
      bg: cnTokens.greenBg,
    },
  ];

  return (
    <div className={`flex flex-col gap-6 p-4 ${AGENCY_DASHBOARD_CONTENT_MAX_WIDTH_CLASS} mx-auto w-full`}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: cnTokens.text }}>
            {t("dashboard:agency.title")}
          </h1>
          <p className="text-sm" style={{ color: cnTokens.textSecondary }}>
            {subtitle}
          </p>
        </div>
        {urgent > 0 && (
          <span
            className="px-3 py-1 rounded-full text-sm self-start"
            style={{
              background: cnTokens.amberBg ?? "rgba(232, 168, 56, 0.2)",
              color: cnTokens.amber,
            }}
          >
            {t("dashboard:shared.needsAttention", { count: urgent })}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              to={card.to}
              className="cn-card-flat rounded-xl border border-[color-mix(in_srgb,var(--cn-text)_10%,transparent)] p-4 flex flex-col gap-2 no-underline hover:opacity-90 transition-opacity"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: card.bg }}>
                  <Icon className="w-4 h-4" style={{ color: card.color }} />
                </div>
                <span className="text-xs font-medium" style={{ color: cnTokens.textSecondary }}>{card.label}</span>
              </div>
              <span className="text-2xl font-semibold" style={{ color: cnTokens.text }}>{card.value}</span>
              <span className="text-[11px]" style={{ color: cnTokens.textSecondary }}>{card.hint}</span>
            </Link>
          );
        })}
      </div>

      <ActionBar actions={dash.actions} role="agency" ariaLabelKey="dashboard:agency.opsAriaLabel" />

      <WorkQueue
        title={t("dashboard:agency.executive.actionQueueTitle")}
        rows={dash.queue}
        columnLabels={queueColumns}
        emptyLabel={t("dashboard:agency.executive.actionQueueEmpty")}
      />
    </div>
  );
}
