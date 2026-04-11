import {
  ArrowRight,
  Coins,
  Handshake,
  FileText,
  Package,
  Briefcase,
} from "lucide-react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import {
  agencyService,
  getMyWallet,
  getContractDashboardSummary,
  marketplaceService,
  packageEngagementService,
  caregivingJobService,
} from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { useEffect } from "react";
import { useAriaToast } from "@/frontend/hooks/useAriaToast";
import { useAuth } from "@/frontend/auth/AuthContext";
import { cn as cnTokens } from "@/frontend/theme/tokens";
import { formatBdtCompactLakh, formatCarePoints, formatDashboardDate } from "@/frontend/utils/dashboardFormat";
import i18n from "@/frontend/i18n";
import { USE_SUPABASE } from "@/backend/services/supabase";

const TERMINAL_PACKAGE_ENGAGEMENT = new Set(["accepted", "declined", "withdrawn", "expired"]);

function isOpenPackageEngagementStatus(status: string): boolean {
  return !TERMINAL_PACKAGE_ENGAGEMENT.has(status);
}

type MetricRowProps = {
  href: string;
  label: string;
  value: string;
  hint?: string;
};

function AgencyOverviewMetricRow({ href, label, value, hint }: MetricRowProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 py-3.5">
      <Link
        to={href}
        className="text-sm font-semibold no-underline cn-touch-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cn-teal)] focus-visible:ring-offset-2 rounded-sm hover:underline underline-offset-2"
        style={{ color: cnTokens.teal }}
      >
        {label}
      </Link>
      <div className="text-right sm:text-right">
        <p className="text-lg font-bold tabular-nums" style={{ color: cnTokens.text }}>{value}</p>
        {hint ? (
          <p className="text-xs mt-0.5" style={{ color: cnTokens.textSecondary }}>{hint}</p>
        ) : null}
      </div>
    </div>
  );
}

export default function AgencyDashboardPage() {
  const { t } = useTranslation(["dashboard", "common"]);
  useDocumentTitle(t("common:pageTitles.agencyDashboard", "Dashboard"));

  const { user } = useAuth();
  const toast = useAriaToast();
  const locale = i18n.language || "en";
  const currencySym = t("dashboard:shared.currencySymbol");
  const cpSuffix = t("dashboard:shared.carePointsSuffix");

  const { data: summary, loading: lS } = useAsyncData(() => agencyService.getDashboardSummary());
  const { data: wallet, loading: lW } = useAsyncData(() => getMyWallet("agency"));
  const { data: contractSum, loading: lCt } = useAsyncData(() => getContractDashboardSummary("agency"));
  const contractSafe = contractSum ?? { activeCount: 0, pendingOffersCount: 0 };

  const { data: clientEngagements, loading: lEc } = useAsyncData(
    () => packageEngagementService.listAgencyClientEngagements(),
    [],
  );
  const { data: cgEngagements, loading: lEg } = useAsyncData(
    () => packageEngagementService.listAgencyCaregiverEngagements(),
    [],
  );
  const { data: openReqCount, loading: lOpenReq } = useAsyncData(() => marketplaceService.countOpenBoardRequirements(), []);
  const loadingLeads = lEc || lEg;
  const familyInterestCount = (clientEngagements ?? []).filter((e) => isOpenPackageEngagementStatus(e.status)).length;
  const caregiverApplicationsCount = (cgEngagements ?? []).filter((e) => isOpenPackageEngagementStatus(e.status)).length;

  const { data: cjJobs, loading: lCj } = useAsyncData(() => caregivingJobService.listJobsWithAssignments(), []);
  const { data: agencyJobs, loading: lAj } = useAsyncData(() => agencyService.getJobs(), []);

  const loading = lS || lW || lCt || lCj || lAj;

  const walletBal = wallet?.balance ?? 0;
  const walletDue = wallet?.pendingDue ?? 0;

  const activeCjCount = (cjJobs ?? []).filter((j) => j.status === "active").length;
  const activeRecruitmentJobs = (agencyJobs ?? []).filter((j) => j.status !== "closed" && j.status !== "filled").length;
  const activeJobsCount = USE_SUPABASE ? activeCjCount : activeRecruitmentJobs;
  const activeJobsHref = USE_SUPABASE ? "/agency/caregiving-jobs" : "/agency/job-management";

  useEffect(() => {
    const unsubscribe = marketplaceService.onPackageSubscription((_agencyId, packageTitle) => {
      toast.success(t("dashboard:agency.subscriberToast", { title: packageTitle }), {
        duration: 6000,
        description: t("dashboard:agency.subscriberToastDesc"),
      });
    });
    return unsubscribe;
  }, [toast, t]);

  if (loading || !summary) {
    return <PageSkeleton cards={4} />;
  }

  const orgName = user?.name?.replace(/^Mock_/, "") || t("dashboard:agency.fallbackOrgName");
  const subtitle = t("dashboard:shared.subtitleWithDate", {
    context: orgName,
    date: formatDashboardDate(new Date(), locale),
  });

  const revenueDisplay = formatBdtCompactLakh(summary.revenueThisMonthBdt, locale, currencySym);
  const ratingDisplay = `${summary.avgRating.toFixed(1)} ${t("dashboard:agency.starSuffix")}`;
  const revenueHint = t("dashboard:agency.revenueMonth", { month: summary.revenueMonthLabel });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: cnTokens.text }}>
          {t("dashboard:agency.title")}
        </h1>
        <p className="text-sm" style={{ color: cnTokens.textSecondary }}>
          {subtitle}
        </p>
      </div>

      <section
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        aria-labelledby="agency-marketplace-cards"
      >
        <span id="agency-marketplace-cards" className="sr-only">
          {t("dashboard:agency.packagesHubTitle")}
        </span>
        <div
          className="cn-card-flat p-5 md:p-6 space-y-3"
          style={{ borderColor: "color-mix(in srgb, var(--cn-teal) 25%, var(--cn-border-light))" }}
        >
          <Link
            to="/agency/care-packages"
            className="block no-underline cn-touch-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cn-purple)] rounded-lg -m-1 p-1"
          >
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-5 h-5 shrink-0" style={{ color: cnTokens.purple }} aria-hidden />
              <h2 className="text-base font-semibold" style={{ color: cnTokens.text }}>
                {t("dashboard:agency.convergencePackagesCardTitle")}
              </h2>
            </div>
            <p className="text-sm mb-3" style={{ color: cnTokens.textSecondary }}>
              {t("dashboard:agency.convergencePackagesCardSubtitle")}
            </p>
            <p className="text-3xl font-bold tabular-nums mb-3" style={{ color: cnTokens.text }}>
              {summary.marketplacePackagesPublished}
            </p>
            <p className="text-sm flex items-center gap-1" style={{ color: cnTokens.purple }}>
              {t("dashboard:agency.convergencePackagesCrossLink")}
              <ArrowRight className="w-4 h-4" aria-hidden />
            </p>
          </Link>
          <p className="text-xs pt-3 border-t border-[color-mix(in_srgb,var(--cn-text)_12%,transparent)] flex flex-wrap gap-x-3 gap-y-1" style={{ color: cnTokens.textSecondary }}>
            <span>
              {t("dashboard:agency.familyInterestShort")}:{" "}
              <strong style={{ color: cnTokens.text }}>{loadingLeads ? "—" : familyInterestCount}</strong>{" "}
              <Link to="/agency/package-leads?tab=clients" className="underline underline-offset-2" style={{ color: cnTokens.pink }}>
                {t("dashboard:agency.viewPackageLeads")}
              </Link>
            </span>
            <span>
              {t("dashboard:agency.caregiverApplicationsShort")}:{" "}
              <strong style={{ color: cnTokens.text }}>{loadingLeads ? "—" : caregiverApplicationsCount}</strong>{" "}
              <Link to="/agency/package-leads?tab=caregivers" className="underline underline-offset-2" style={{ color: cnTokens.teal }}>
                {t("dashboard:agency.viewPackageLeads")}
              </Link>
            </span>
          </p>
          <p className="text-xs" style={{ color: cnTokens.textSecondary }}>
            <Link to="/agency/care-requirement-board" className="underline underline-offset-2" style={{ color: cnTokens.teal }}>
              {t("dashboard:agency.convergencePackagesHint")}
            </Link>
          </p>
        </div>

        <div
          className="cn-card-flat p-5 md:p-6 space-y-3"
          style={{ borderColor: "color-mix(in srgb, var(--cn-pink) 25%, var(--cn-border-light))" }}
        >
          <Link
            to="/agency/care-requirement-board"
            className="block no-underline cn-touch-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cn-pink)] rounded-lg -m-1 p-1"
          >
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 shrink-0" style={{ color: cnTokens.pink }} aria-hidden />
              <h2 className="text-base font-semibold" style={{ color: cnTokens.text }}>
                {t("dashboard:agency.convergenceRequirementsCardTitle")}
              </h2>
            </div>
            <p className="text-sm mb-3" style={{ color: cnTokens.textSecondary }}>
              {t("dashboard:agency.convergenceRequirementsCardSubtitle")}
            </p>
            <p className="text-3xl font-bold tabular-nums mb-3" style={{ color: cnTokens.text }}>
              {lOpenReq ? "—" : String(openReqCount ?? 0)}
            </p>
            <p className="text-sm flex items-center gap-1" style={{ color: cnTokens.pink }}>
              {t("dashboard:agency.convergenceRequirementsCrossLink")}
              <ArrowRight className="w-4 h-4" aria-hidden />
            </p>
          </Link>
          <p className="text-xs pt-3 border-t border-[color-mix(in_srgb,var(--cn-text)_12%,transparent)]" style={{ color: cnTokens.textSecondary }}>
            <Link to="/agency/package-create" className="underline underline-offset-2" style={{ color: cnTokens.teal }}>
              {t("dashboard:agency.convergenceRequirementsHint")}
            </Link>
          </p>
        </div>
      </section>

      <section
        className="cn-card-flat p-5 md:p-6"
        style={{ borderColor: "color-mix(in srgb, var(--cn-teal) 20%, var(--cn-border-light))" }}
        aria-labelledby="agency-overview-heading"
      >
        <h2 id="agency-overview-heading" className="sr-only">
          {t("dashboard:agency.overviewCardTitle")}
        </h2>

        <div className="pb-1">
          <Link
            to={activeJobsHref}
            className="flex items-start gap-3 rounded-xl p-3 -m-1 no-underline cn-touch-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cn-teal)] focus-visible:ring-offset-2 hover:bg-[color-mix(in_srgb,var(--cn-teal)_8%,transparent)]"
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: cnTokens.tealBg }}
            >
              <Briefcase className="w-5 h-5" style={{ color: cnTokens.teal }} aria-hidden />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold hover:underline underline-offset-2" style={{ color: cnTokens.teal }}>
                {t("dashboard:agency.activeJobs")}
              </p>
              <p className="text-3xl font-bold tabular-nums mt-1" style={{ color: cnTokens.text }}>
                {lCj || lAj ? "—" : String(activeJobsCount)}
              </p>
              <p className="text-xs mt-1" style={{ color: cnTokens.textSecondary }}>
                {USE_SUPABASE ? t("dashboard:agency.activeJobsHintCj") : t("dashboard:agency.activeJobsHintRecruitment")}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 shrink-0 mt-1" style={{ color: cnTokens.textSecondary }} aria-hidden />
          </Link>
        </div>

        <div
          className="mt-4 pt-2 border-t border-[color-mix(in_srgb,var(--cn-text)_12%,transparent)] divide-y divide-[color-mix(in_srgb,var(--cn-text)_10%,transparent)]"
        >
          <AgencyOverviewMetricRow
            href="/agency/caregivers"
            label={t("dashboard:agency.activeCaregivers")}
            value={String(summary.activeCaregivers)}
          />
          <AgencyOverviewMetricRow
            href="/agency/clients"
            label={t("dashboard:agency.activeClients")}
            value={String(summary.activeClients)}
          />
          <AgencyOverviewMetricRow
            href="/agency/reports"
            label={t("dashboard:agency.revenueLinkLabel")}
            value={revenueDisplay}
            hint={revenueHint}
          />
          <AgencyOverviewMetricRow
            href="/wallet?role=agency"
            label={t("dashboard:shared.carePointsBalance")}
            value={formatCarePoints(walletBal, locale, cpSuffix)}
            hint={
              walletDue > 0
                ? t("dashboard:shared.feeDue", {
                    amount: formatCarePoints(walletDue, locale, cpSuffix),
                  })
                : undefined
            }
          />
          <AgencyOverviewMetricRow
            href="/agency/caregivers"
            label={t("dashboard:agency.avgRating")}
            value={ratingDisplay}
          />
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          to="/billing"
          className="cn-card-flat p-4 flex items-center gap-4 no-underline hover:shadow-md transition-shadow cn-touch-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cn-pink)] focus-visible:ring-offset-2"
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: cnTokens.purpleBg }}>
            <FileText className="w-6 h-6" style={{ color: cnTokens.purple }} />
          </div>
          <div className="flex-1">
            <p className="text-xs" style={{ color: cnTokens.textSecondary }}>{t("dashboard:shared.billingPayments")}</p>
            <p className="text-xl font-bold" style={{ color: cnTokens.text }}>{t("dashboard:shared.invoices")}</p>
            <p className="text-xs" style={{ color: cnTokens.textSecondary }}>{t("dashboard:shared.invoicesProofs")}</p>
          </div>
          <ArrowRight className="w-4 h-4 shrink-0" style={{ color: cnTokens.textSecondary }} aria-hidden />
        </Link>
        <Link
          to="/wallet?role=agency"
          className="cn-card-flat p-4 flex items-center gap-4 no-underline hover:shadow-md transition-shadow cn-touch-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cn-pink)] focus-visible:ring-offset-2"
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: cnTokens.tealBg }}>
            <Coins className="w-6 h-6" style={{ color: cnTokens.teal }} />
          </div>
          <div className="flex-1">
            <p className="text-xs" style={{ color: cnTokens.textSecondary }}>{t("dashboard:shared.carePointsBalance")}</p>
            <p className="text-xl font-bold" style={{ color: cnTokens.text }}>
              {formatCarePoints(walletBal, locale, cpSuffix)}
            </p>
            <p className="text-xs" style={{ color: cnTokens.amber }}>
              {walletDue > 0
                ? t("dashboard:shared.feeDue", {
                    amount: formatCarePoints(walletDue, locale, cpSuffix),
                  })
                : t("dashboard:shared.invoicesProofsShort")}
            </p>
          </div>
          <ArrowRight className="w-4 h-4 shrink-0" style={{ color: cnTokens.textSecondary }} aria-hidden />
        </Link>
        <Link
          to="/contracts?role=agency"
          className="cn-card-flat p-4 flex items-center gap-4 no-underline hover:shadow-md transition-shadow cn-touch-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cn-pink)] focus-visible:ring-offset-2"
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: cnTokens.pinkBg }}>
            <Handshake className="w-6 h-6" style={{ color: cnTokens.pink }} />
          </div>
          <div className="flex-1">
            <p className="text-xs" style={{ color: cnTokens.textSecondary }}>{t("dashboard:shared.activeContracts")}</p>
            <p className="text-xl font-bold" style={{ color: cnTokens.text }}>{contractSafe.activeCount}</p>
            <p className="text-xs" style={{ color: cnTokens.amber }}>
              {t("dashboard:shared.pendingOffers", { count: contractSafe.pendingOffersCount })}
            </p>
          </div>
          <ArrowRight className="w-4 h-4 shrink-0" style={{ color: cnTokens.textSecondary }} aria-hidden />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { labelKey: "dashboard:agency.manageCaregivers", path: "/agency/caregivers", color: cnTokens.teal },
          { labelKey: "dashboard:agency.viewClients", path: "/agency/clients", color: cnTokens.pink },
          { labelKey: "dashboard:agency.payments", path: "/agency/payments", color: cnTokens.green },
          { labelKey: "dashboard:agency.reports", path: "/agency/reports", color: cnTokens.purple },
        ].map((a) => (
          <Link
            key={a.path}
            to={a.path}
            className="cn-card-flat p-4 text-center hover:scale-[1.02] transition-transform no-underline cn-touch-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cn-pink)]"
          >
            <p className="text-sm font-medium" style={{ color: a.color }}>{t(a.labelKey)}</p>
            <ArrowRight className="w-4 h-4 mx-auto mt-2" style={{ color: a.color }} aria-hidden />
          </Link>
        ))}
      </div>
    </div>
  );
}
