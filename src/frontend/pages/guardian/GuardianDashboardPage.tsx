import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Heart, Calendar, CreditCard, MessageSquare, Star, AlertCircle, Activity, User, Coins, Handshake, Plus, FileText, ArrowRight, Package, ClipboardList } from "lucide-react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { cn } from "@/frontend/theme/tokens";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { useAuth } from "@/frontend/auth/AuthContext";
import { guardianService, getMyWallet, getContractDashboardSummary, marketplaceService } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import type { LucideIcon } from "lucide-react";
import { DashboardStatLink } from "@/frontend/components/shared/DashboardStatLink";
import { formatBdtAmount, formatDashboardDate, formatCarePoints } from "@/frontend/utils/dashboardFormat";
import i18n from "@/frontend/i18n";

const activityIconMap: Record<string, LucideIcon> = {
  heart: Heart, calendar: Calendar, creditCard: CreditCard, message: MessageSquare, star: Star,
};

export default function GuardianDashboardPage() {
  const { t } = useTranslation(["dashboard", "common"]);
  const { user } = useAuth();
  useDocumentTitle(t("common:pageTitles.guardianDashboard", "Dashboard"));

  const locale = i18n.language || "en";
  const currencySym = t("dashboard:shared.currencySymbol");
  const cpSuffix = t("dashboard:shared.carePointsSuffix");

  const { data: spendingData, loading: lS } = useAsyncData(guardianService.getSpendingData);
  const { data: patients, loading: lP } = useAsyncData(() => guardianService.getDashboardPatients());
  const { data: recentActivity, loading: lA } = useAsyncData(() => guardianService.getRecentActivity());
  const { data: alerts, loading: lAl } = useAsyncData(() => guardianService.getDashboardAlerts());
  const { data: gSummary, loading: lG } = useAsyncData(() => guardianService.getDashboardSummary());
  const { data: wallet, loading: lW } = useAsyncData(() => getMyWallet("guardian"));
  const { data: contractSum, loading: lCt } = useAsyncData(() => getContractDashboardSummary("guardian"));
  const contractSafe = contractSum ?? { activeCount: 0, pendingOffersCount: 0 };
  const { data: mpDash, loading: lMp } = useAsyncData(
    async () => ({
      packages: await marketplaceService.countPublishedOffers(),
      requirements: await marketplaceService.countMyActiveRequirements(),
    }),
    [],
  );

  if (lS || lP || lA || lAl || lG || lW || lCt || !spendingData || !patients || !recentActivity || !alerts || !gSummary) {
    return <PageSkeleton />;
  }

  const walletBal = wallet?.balance ?? 0;
  const walletDue = wallet?.pendingDue ?? 0;

  const patientCount = patients.length;
  const today = formatDashboardDate(new Date(), locale);
  const displayName = user?.name?.replace(/^Mock_/, "") || "User";
  const monthSpend = formatBdtAmount(gSummary.monthlySpendBdt, locale, currencySym);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl" style={{ color: cn.text }}>{t("dashboard:guardian.welcome", { name: displayName })}</h1>
          <p className="text-sm" style={{ color: cn.textSecondary }}>
            {t("dashboard:guardian.monitoringPatients", { count: patientCount })}
          </p>
          <p className="text-xs mt-0.5" style={{ color: cn.textSecondary }}>{today}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="cn-card-flat p-5 space-y-3 hover:shadow-md transition-shadow">
          <Link
            to="/guardian/marketplace-hub?tab=packages"
            className="block no-underline cn-touch-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cn-pink)] rounded-lg -m-1 p-1"
          >
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-5 h-5 shrink-0" style={{ color: cn.purple }} aria-hidden />
              <h2 className="text-base font-semibold" style={{ color: cn.text }}>
                {t("dashboard:guardian.marketplacePackagesCardTitle")}
              </h2>
            </div>
            <p className="text-sm mb-3" style={{ color: cn.textSecondary }}>
              {t("dashboard:guardian.marketplacePackagesCardSubtitle")}
            </p>
            <p className="text-3xl font-bold tabular-nums mb-3" style={{ color: cn.text }}>
              {lMp ? "—" : String(mpDash?.packages ?? 0)}
            </p>
            <p className="text-sm flex items-center gap-1" style={{ color: cn.purple }}>
              {t("dashboard:guardian.marketplacePackagesCrossLink")}
              <ArrowRight className="w-4 h-4" aria-hidden />
            </p>
          </Link>
          <p className="text-xs pt-3 border-t border-[color-mix(in_srgb,var(--cn-text)_12%,transparent)]" style={{ color: cn.textSecondary }}>
            <Link
              to="/guardian/care-requirement-wizard?direct=true"
              className="underline underline-offset-2"
              style={{ color: cn.pink }}
            >
              {t("dashboard:guardian.marketplaceRequirementsHint")}
            </Link>
          </p>
        </div>

        <div className="cn-card-flat p-5 space-y-3 hover:shadow-md transition-shadow">
          <Link
            to="/guardian/care-requirements"
            className="block no-underline cn-touch-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cn-pink)] rounded-lg -m-1 p-1"
          >
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList className="w-5 h-5 shrink-0" style={{ color: cn.teal }} aria-hidden />
              <h2 className="text-base font-semibold" style={{ color: cn.text }}>
                {t("dashboard:guardian.marketplaceRequirementsCardTitle")}
              </h2>
            </div>
            <p className="text-sm mb-3" style={{ color: cn.textSecondary }}>
              {t("dashboard:guardian.marketplaceRequirementsCardSubtitle")}
            </p>
            <p className="text-3xl font-bold tabular-nums mb-3" style={{ color: cn.text }}>
              {lMp ? "—" : String(mpDash?.requirements ?? 0)}
            </p>
            <p className="text-sm flex items-center gap-1" style={{ color: cn.teal }}>
              {t("dashboard:guardian.marketplaceRequirementsCrossLink")}
              <ArrowRight className="w-4 h-4" aria-hidden />
            </p>
          </Link>
          <p className="text-xs pt-3 border-t border-[color-mix(in_srgb,var(--cn-text)_12%,transparent)]" style={{ color: cn.textSecondary }}>
            <Link
              to="/guardian/marketplace-hub?tab=packages"
              className="underline underline-offset-2"
              style={{ color: cn.pink }}
            >
              {t("dashboard:guardian.marketplacePackagesCrossLink")}
            </Link>
          </p>
        </div>
      </div>

      {alerts.length > 0 ? (
        <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: cn.amberBg, border: `1px solid ${cn.amber}40` }}>
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: cn.amber }} aria-hidden />
          <div className="flex-1 space-y-2">
            {alerts.map((alert) => (
              <Link
                key={alert.id}
                to={alert.actionPath}
                className="block no-underline rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cn-pink)]"
              >
                <p className="text-sm" style={{ color: cn.text }}>{alert.title}</p>
                {alert.subtitle ? (
                  <p className="text-xs mt-0.5" style={{ color: cn.textSecondary }}>{alert.subtitle}</p>
                ) : null}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <DashboardStatLink
          to="/guardian/patients"
          label={t("dashboard:guardian.patients")}
          value={String(patientCount)}
          icon={Heart}
          iconColor={cn.pink}
          iconBg={cn.pinkBg}
        />
        <DashboardStatLink
          to="/guardian/placements"
          label={t("dashboard:guardian.activePlacements")}
          value={String(gSummary.activePlacements)}
          icon={User}
          iconColor={cn.green}
          iconBg={cn.greenBg}
        />
        <DashboardStatLink
          to="/guardian/payments"
          label={t("dashboard:guardian.thisMonthSpend")}
          value={monthSpend}
          icon={CreditCard}
          iconColor={cn.purple}
          iconBg={cn.purpleBg}
        />
        <DashboardStatLink
          to="/guardian/schedule"
          label={t("dashboard:guardian.totalSessions")}
          value={String(gSummary.totalSessions)}
          icon={Activity}
          iconColor={cn.amber}
          iconBg={cn.amberBg}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link to="/billing" className="cn-card-flat p-4 flex items-center gap-4 hover:shadow-md transition-shadow no-underline cn-touch-target focus-visible:ring-2 focus-visible:ring-[var(--cn-pink)]">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: cn.purpleBg }}>
            <FileText className="w-6 h-6" style={{ color: cn.purple }} />
          </div>
          <div className="flex-1">
            <p className="text-xs" style={{ color: cn.textSecondary }}>{t("dashboard:shared.billingPayments")}</p>
            <p className="text-xl" style={{ color: cn.text }}>{t("dashboard:shared.invoices")}</p>
            <p className="text-xs" style={{ color: cn.textSecondary }}>{t("dashboard:shared.invoicesProofs")}</p>
          </div>
          <ArrowRight className="w-4 h-4 shrink-0" style={{ color: cn.textSecondary }} aria-hidden />
        </Link>
        <Link to="/wallet?role=guardian" className="cn-card-flat p-4 flex items-center gap-4 hover:shadow-md transition-shadow no-underline cn-touch-target focus-visible:ring-2 focus-visible:ring-[var(--cn-pink)]">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: cn.greenBg }}>
            <Coins className="w-6 h-6" style={{ color: cn.green }} />
          </div>
          <div className="flex-1">
            <p className="text-xs" style={{ color: cn.textSecondary }}>{t("dashboard:shared.carePointsBalance")}</p>
            <p className="text-xl" style={{ color: cn.text }}>{formatCarePoints(walletBal, locale, cpSuffix)}</p>
            <p className="text-xs" style={{ color: cn.amber }}>
              {t("dashboard:shared.feeDue", { amount: formatCarePoints(walletDue, locale, cpSuffix) })}
            </p>
          </div>
          <ArrowRight className="w-4 h-4 shrink-0" style={{ color: cn.textSecondary }} aria-hidden />
        </Link>
        <Link to="/contracts?role=guardian" className="cn-card-flat p-4 flex items-center gap-4 hover:shadow-md transition-shadow no-underline cn-touch-target focus-visible:ring-2 focus-visible:ring-[var(--cn-pink)]">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: cn.pinkBg }}>
            <Handshake className="w-6 h-6" style={{ color: cn.pink }} />
          </div>
          <div className="flex-1">
            <p className="text-xs" style={{ color: cn.textSecondary }}>{t("dashboard:shared.activeContracts")}</p>
            <p className="text-xl" style={{ color: cn.text }}>{contractSafe.activeCount}</p>
            <p className="text-xs" style={{ color: cn.amber }}>
              {t("dashboard:shared.negotiating", { count: contractSafe.pendingOffersCount })}
            </p>
          </div>
          <ArrowRight className="w-4 h-4 shrink-0" style={{ color: cn.textSecondary }} aria-hidden />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Link
          to="/guardian/payments"
          className="cn-card-flat p-5 lg:col-span-2 block no-underline hover:shadow-md transition-shadow cn-touch-target focus-visible:ring-2 focus-visible:ring-[var(--cn-pink)]"
          aria-label={t("dashboard:guardian.monthlyCareSpending")}
        >
          <h2 className="mb-4" style={{ color: cn.text }}>{t("dashboard:guardian.monthlyCareSpending")}</h2>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={spendingData}>
              <defs>
                <linearGradient id="gu-spend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--cn-green-light)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--cn-green-light)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--cn-text-secondary)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "var(--cn-text-secondary)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${currencySym}${v / 1000}k`} />
              <Tooltip formatter={(v: number) => [`${currencySym} ${v.toLocaleString(locale)}`, t("dashboard:shared.spending")]} />
              <Area type="monotone" dataKey="amount" stroke="var(--cn-green)" strokeWidth={2} fill="url(#gu-spend)" dot={{ fill: "var(--cn-green)", r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </Link>
        <div className="cn-card-flat p-5">
          <h2 className="mb-4" style={{ color: cn.text }}>{t("dashboard:guardian.recentActivity")}</h2>
          <div className="space-y-3">
            {recentActivity.map((a, i) => {
              const Icon = activityIconMap[a.iconType || "heart"] ?? Heart;
              const inner = (
                <>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `color-mix(in srgb, ${a.color} 15%, transparent)` }}>
                    <Icon className="w-4 h-4" style={{ color: a.color }} aria-hidden />
                  </div>
                  <div>
                    <p className="text-xs leading-snug" style={{ color: cn.text }}>{a.text}</p>
                    <p className="text-xs mt-0.5" style={{ color: cn.textSecondary }}>{a.time}</p>
                  </div>
                </>
              );
              return a.link ? (
                <Link key={i} to={a.link} className="flex items-start gap-3 no-underline rounded-lg p-1 -m-1 hover:bg-[color-mix(in_srgb,var(--cn-text)_4%,transparent)] cn-touch-target focus-visible:ring-2 focus-visible:ring-[var(--cn-pink)]">
                  {inner}
                </Link>
              ) : (
                <div key={i} className="flex items-start gap-3">{inner}</div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="cn-card-flat p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ color: cn.text }}>{t("dashboard:guardian.myPatients")}</h2>
          <Link
            to="/guardian/patient-intake"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-white cn-touch-target no-underline"
            style={{ background: "var(--cn-gradient-guardian)" }}
          >
            <Plus className="w-4 h-4" aria-hidden /> {t("dashboard:guardian.addPatient")}
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {patients.length === 0 && (
            <div className="col-span-full text-center py-8">
              <p className="text-sm" style={{ color: cn.textSecondary }}>
                {t("dashboard:guardian.noPatients")}{" "}
                <Link to="/guardian/patient-intake" className="underline underline-offset-2" style={{ color: cn.pink }}>
                  {t("dashboard:guardian.addPatientLink")}
                </Link>{" "}
                {t("dashboard:guardian.noPatientsTail")}
              </p>
            </div>
          )}
          {patients.map((p) => (
            <Link
              key={p.id}
              to={`/guardian/patient/${p.id}`}
              className="p-4 rounded-xl block hover:shadow-md transition-shadow no-underline cn-touch-target focus-visible:ring-2 focus-visible:ring-[var(--cn-pink)]"
              style={{ background: cn.bgInput }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ background: "var(--cn-gradient-guardian)" }}>
                    {p.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: cn.text }}>{p.name}</p>
                    <p className="text-xs" style={{ color: cn.textSecondary }}>{t("dashboard:guardian.ageLabel", { age: p.age })}</p>
                  </div>
                </div>
                <span className="cn-badge" style={{ background: `color-mix(in srgb, ${p.statusColor} 15%, transparent)`, color: p.statusColor }}>{p.status}</span>
              </div>
              <p className="text-xs mb-2" style={{ color: cn.textSecondary }}>{t("dashboard:guardian.condition", { detail: p.condition })}</p>
              <p className="text-xs" style={{ color: cn.text }}>
                {t("dashboard:guardian.caregiverLabel", { name: p.caregiver })}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
