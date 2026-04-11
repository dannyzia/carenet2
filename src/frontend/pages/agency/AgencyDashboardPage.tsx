import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import {
  Users,
  CreditCard,
  Star,
  ArrowRight,
  Coins,
  Handshake,
  FileText,
  Package,
  Plus,
  UserCircle,
  Heart,
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
} from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { useEffect } from "react";
import { useAriaToast } from "@/frontend/hooks/useAriaToast";
import { useAuth } from "@/frontend/auth/AuthContext";
import { cn as cnTokens } from "@/frontend/theme/tokens";
import { DashboardStatLink } from "@/frontend/components/shared/DashboardStatLink";
import { formatBdtCompactLakh, formatCarePoints, formatDashboardDate } from "@/frontend/utils/dashboardFormat";
import i18n from "@/frontend/i18n";

const TERMINAL_PACKAGE_ENGAGEMENT = new Set(["accepted", "declined", "withdrawn", "expired"]);

function isOpenPackageEngagementStatus(status: string): boolean {
  return !TERMINAL_PACKAGE_ENGAGEMENT.has(status);
}

export default function AgencyDashboardPage() {
  const { t } = useTranslation(["dashboard", "common"]);
  useDocumentTitle(t("common:pageTitles.agencyDashboard", "Dashboard"));

  const { user } = useAuth();
  const toast = useAriaToast();
  const locale = i18n.language || "en";
  const currencySym = t("dashboard:shared.currencySymbol");
  const cpSuffix = t("dashboard:shared.carePointsSuffix");

  const { data: caregivers, loading: lC } = useAsyncData(() => agencyService.getCaregivers());
  const { data: revenueData, loading: lR } = useAsyncData(() => agencyService.getRevenueChartData());
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
  const loadingLeads = lEc || lEg;
  const familyInterestCount = (clientEngagements ?? []).filter((e) => isOpenPackageEngagementStatus(e.status)).length;
  const caregiverApplicationsCount = (cgEngagements ?? []).filter((e) => isOpenPackageEngagementStatus(e.status)).length;

  const loading = lC || lR || lS || lW || lCt;
  const walletBal = wallet?.balance ?? 0;
  const walletDue = wallet?.pendingDue ?? 0;

  useEffect(() => {
    const unsubscribe = marketplaceService.onPackageSubscription((_agencyId, packageTitle) => {
      toast.success(t("dashboard:agency.subscriberToast", { title: packageTitle }), {
        duration: 6000,
        description: t("dashboard:agency.subscriberToastDesc"),
      });
    });
    return unsubscribe;
  }, [toast, t]);

  if (loading || !caregivers || !revenueData || !summary) {
    return <PageSkeleton cards={4} />;
  }

  const orgName = user?.name?.replace(/^Mock_/, "") || t("dashboard:agency.fallbackOrgName");
  const subtitle = t("dashboard:shared.subtitleWithDate", {
    context: orgName,
    date: formatDashboardDate(new Date(), locale),
  });

  const revenueDisplay = formatBdtCompactLakh(summary.revenueThisMonthBdt, locale, currencySym);
  const ratingDisplay = `${summary.avgRating.toFixed(1)} ${t("dashboard:agency.starSuffix")}`;
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
        className="cn-card-flat p-5 md:p-6 space-y-5"
        style={{ borderColor: "color-mix(in srgb, var(--cn-teal) 25%, var(--cn-border-light))" }}
        aria-labelledby="agency-packages-hub-heading"
      >
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <h2 id="agency-packages-hub-heading" className="text-lg font-semibold" style={{ color: cnTokens.text }}>
              {t("dashboard:agency.packagesHubTitle")}
            </h2>
            <p className="text-sm" style={{ color: cnTokens.textSecondary }}>
              {t("dashboard:agency.packagesHubSubtitle")}
            </p>
          </div>
          <Link
            to="/agency/package-create"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white text-sm font-semibold no-underline shrink-0 cn-touch-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cn-teal)] focus-visible:ring-offset-2"
            style={{ background: "var(--cn-gradient-agency)" }}
          >
            <Plus className="w-5 h-5" aria-hidden />
            {t("dashboard:agency.createPackage")}
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            to="/agency/care-packages"
            className="rounded-xl p-4 no-underline transition-colors hover:bg-[color-mix(in_srgb,var(--cn-text)_4%,transparent)] cn-touch-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cn-purple)]"
            style={{ background: cnTokens.purpleBg }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-4 h-4 shrink-0" style={{ color: cnTokens.purple }} aria-hidden />
              <span className="text-xs font-medium uppercase tracking-wide" style={{ color: cnTokens.textSecondary }}>
                {t("dashboard:agency.publishedPackagesShort")}
              </span>
            </div>
            <p className="text-2xl font-bold tabular-nums" style={{ color: cnTokens.text }}>
              {summary.marketplacePackagesPublished}
            </p>
            <p className="text-xs mt-1 flex items-center gap-1" style={{ color: cnTokens.purple }}>
              {t("dashboard:agency.viewMyPackages")}
              <ArrowRight className="w-3 h-3" aria-hidden />
            </p>
          </Link>

          <Link
            to="/agency/package-leads?tab=clients"
            className="rounded-xl p-4 no-underline transition-colors hover:bg-[color-mix(in_srgb,var(--cn-text)_4%,transparent)] cn-touch-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cn-pink)]"
            style={{ background: cnTokens.pinkBg }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Heart className="w-4 h-4 shrink-0" style={{ color: cnTokens.pink }} aria-hidden />
              <span className="text-xs font-medium uppercase tracking-wide" style={{ color: cnTokens.textSecondary }}>
                {t("dashboard:agency.familyInterestShort")}
              </span>
            </div>
            <p className="text-2xl font-bold tabular-nums" style={{ color: cnTokens.text }}>
              {loadingLeads ? "—" : familyInterestCount}
            </p>
            <p className="text-xs mt-1 flex items-center gap-1" style={{ color: cnTokens.pink }}>
              {t("dashboard:agency.viewPackageLeads")}
              <ArrowRight className="w-3 h-3" aria-hidden />
            </p>
          </Link>

          <Link
            to="/agency/package-leads?tab=caregivers"
            className="rounded-xl p-4 no-underline transition-colors hover:bg-[color-mix(in_srgb,var(--cn-text)_4%,transparent)] cn-touch-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cn-teal)]"
            style={{ background: cnTokens.tealBg }}
          >
            <div className="flex items-center gap-2 mb-1">
              <UserCircle className="w-4 h-4 shrink-0" style={{ color: cnTokens.teal }} aria-hidden />
              <span className="text-xs font-medium uppercase tracking-wide" style={{ color: cnTokens.textSecondary }}>
                {t("dashboard:agency.caregiverApplicationsShort")}
              </span>
            </div>
            <p className="text-2xl font-bold tabular-nums" style={{ color: cnTokens.text }}>
              {loadingLeads ? "—" : caregiverApplicationsCount}
            </p>
            <p className="text-xs mt-1 flex items-center gap-1" style={{ color: cnTokens.teal }}>
              {t("dashboard:agency.viewPackageLeads")}
              <ArrowRight className="w-3 h-3" aria-hidden />
            </p>
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardStatLink
          to="/agency/caregivers"
          label={t("dashboard:agency.activeCaregivers")}
          value={String(summary.activeCaregivers)}
          icon={Users}
          iconColor="var(--cn-teal)"
          iconBg="var(--cn-teal-bg)"
        />
        <DashboardStatLink
          to="/agency/clients"
          label={t("dashboard:agency.activeClients")}
          value={String(summary.activeClients)}
          icon={Users}
          iconColor="var(--cn-pink)"
          iconBg="var(--cn-pink-bg)"
        />
        <DashboardStatLink
          to="/agency/reports"
          label={t("dashboard:agency.revenueMonth", { month: summary.revenueMonthLabel })}
          value={revenueDisplay}
          icon={CreditCard}
          iconColor="var(--cn-green)"
          iconBg="var(--cn-green-bg)"
        />
        <DashboardStatLink
          to="/agency/caregivers"
          label={t("dashboard:agency.avgRating")}
          value={ratingDisplay}
          icon={Star}
          iconColor="var(--cn-amber)"
          iconBg="var(--cn-amber-bg)"
        />
      </div>

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
              {t("dashboard:shared.feeDue", {
                amount: formatCarePoints(walletDue, locale, cpSuffix),
              })}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="cn-card-flat p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold" style={{ color: cnTokens.text }}>
              {t("dashboard:shared.monthlyRevenue", { symbol: currencySym })}
            </h2>
            <Link
              to="/agency/reports"
              className="text-xs hover:underline cn-touch-target"
              style={{ color: cnTokens.teal }}
            >
              {t("dashboard:shared.viewReports")}
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueData}>
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--cn-text-secondary)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "var(--cn-text-secondary)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip formatter={(v: number) => [`${currencySym} ${v.toLocaleString(locale)}`, t("dashboard:shared.revenue")]} />
              <Bar dataKey="amount" fill="var(--cn-teal)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="cn-card-flat p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold" style={{ color: cnTokens.text }}>{t("dashboard:agency.topCaregivers")}</h2>
            <Link to="/agency/caregivers" className="text-xs hover:underline cn-touch-target" style={{ color: cnTokens.teal }}>
              {t("dashboard:shared.viewAll")}
            </Link>
          </div>
          <div className="space-y-3">
            {caregivers.slice(0, 3).map((c) => (
              <Link
                key={c.name}
                to="/agency/caregivers"
                className="flex items-center gap-3 rounded-lg p-1 -m-1 no-underline hover:bg-[color-mix(in_srgb,var(--cn-text)_4%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cn-pink)]"
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0"
                  style={{ background: "var(--cn-gradient-agency)" }}
                >
                  {c.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: cnTokens.text }}>{c.name}</p>
                  <p className="text-xs" style={{ color: cnTokens.textSecondary }}>
                    {t("dashboard:agency.starSuffix")} {c.rating} · {t("dashboard:agency.jobsCount", { count: c.jobs })}
                  </p>
                </div>
                <span
                  className="cn-badge shrink-0 text-[0.7rem]"
                  style={{
                    background: c.status === "active" ? cnTokens.greenBg : cnTokens.amberBg,
                    color: c.status === "active" ? cnTokens.green : cnTokens.amber,
                  }}
                >
                  {c.status}
                </span>
              </Link>
            ))}
          </div>
        </div>
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
