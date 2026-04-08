import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Briefcase, Star, DollarSign, Clock, Calendar, MessageSquare, ArrowRight, TrendingUp, Coins, Handshake, FileText } from "lucide-react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { cn, statusColors } from "@/frontend/theme/tokens";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { useAuth } from "@/frontend/auth/AuthContext";
import { caregiverService, getMyWallet, getContractDashboardSummary } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { DocumentExpiryWidget } from "@/frontend/components/shared/DocumentExpiryWidget";
import { DashboardStatLink } from "@/frontend/components/shared/DashboardStatLink";
import { formatBdtAmount, formatDashboardDate, formatCarePoints } from "@/frontend/utils/dashboardFormat";
import i18n from "@/frontend/i18n";

function jobStatusStyle(status: string) {
  const s = status as keyof typeof statusColors;
  return statusColors[s] ?? statusColors.pending;
}

export default function CaregiverDashboardPage() {
  const { t } = useTranslation(["dashboard", "common"]);
  const { user } = useAuth();
  useDocumentTitle(t("common:pageTitles.caregiverDashboard", "Dashboard"));

  const locale = i18n.language || "en";
  const currencySym = t("dashboard:shared.currencySymbol");
  const cpSuffix = t("dashboard:shared.carePointsSuffix");

  const { data: dashSummary, loading: lSum } = useAsyncData(() => caregiverService.getDashboardSummary());
  const { data: earningsData, loading: lE } = useAsyncData(() => caregiverService.getDashboardEarnings());
  const { data: recentJobs, loading: lJ } = useAsyncData(() => caregiverService.getRecentJobs());
  const { data: upcomingSchedule, loading: lS } = useAsyncData(() => caregiverService.getUpcomingSchedule());
  const { data: wallet, loading: lW } = useAsyncData(() => getMyWallet("caregiver"));
  const { data: contractSum, loading: lCt } = useAsyncData(() => getContractDashboardSummary("caregiver"));
  const contractSafe = contractSum ?? { activeCount: 0, pendingOffersCount: 0 };

  if (lSum || lE || lJ || lS || lW || lCt || !dashSummary || !earningsData || !recentJobs || !upcomingSchedule) {
    return <PageSkeleton variant="dashboard" />;
  }

  const walletBal = wallet?.balance ?? 0;
  const walletDue = wallet?.pendingDue ?? 0;

  const today = formatDashboardDate(new Date(), locale);
  const displayName = user?.name?.replace(/^Mock_/, "") || "User";
  const monthBdt = formatBdtAmount(dashSummary.thisMonthBdt, locale, currencySym);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl" style={{ color: cn.text }}>{t("dashboard:caregiver.greeting", { name: displayName })}</h1>
          <p className="text-sm mt-0.5" style={{ color: cn.textSecondary }}>
            {t("dashboard:caregiver.activityToday", { date: today })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/caregiver/jobs"
            className="px-4 py-2 rounded-lg text-sm border hover:opacity-80 transition-all cn-touch-target"
            style={{ borderColor: cn.border, color: cn.text }}
          >
            {t("dashboard:caregiver.viewJobs")}
          </Link>
          <Link
            to="/caregiver/schedule"
            className="px-4 py-2 rounded-lg text-sm text-white transition-all cn-touch-target"
            style={{ background: "var(--cn-gradient-caregiver)" }}
          >
            {t("dashboard:caregiver.mySchedule")}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardStatLink
          to="/caregiver/jobs"
          label={t("dashboard:caregiver.activeJobs")}
          value={String(dashSummary.activeJobs)}
          icon={Briefcase}
          iconColor={cn.pink}
          iconBg={cn.pinkBg}
          showTrend
          trendIcon={TrendingUp}
          trendColor={cn.green}
          hint={t("dashboard:caregiver.weekChange", { n: dashSummary.weekJobsDelta })}
        />
        <DashboardStatLink
          to="/caregiver/reviews"
          label={t("dashboard:caregiver.avgRating")}
          value={String(dashSummary.avgRating)}
          icon={Star}
          iconColor={cn.amber}
          iconBg={cn.amberBg}
          showTrend
          trendIcon={TrendingUp}
          trendColor={cn.green}
          hint={t("dashboard:caregiver.reviewsCount", { count: dashSummary.reviewCount })}
        />
        <DashboardStatLink
          to="/caregiver/earnings"
          label={t("dashboard:caregiver.thisMonth")}
          value={monthBdt}
          icon={DollarSign}
          iconColor={cn.green}
          iconBg={cn.greenBg}
          showTrend
          trendIcon={TrendingUp}
          trendColor={cn.green}
          hint={t("dashboard:caregiver.vsLastMonth", { pct: dashSummary.vsLastMonthPercent })}
        />
        <DashboardStatLink
          to="/caregiver/schedule"
          label={t("dashboard:caregiver.hoursWorked")}
          value={`${dashSummary.hoursThisMonth}h`}
          icon={Clock}
          iconColor={cn.purple}
          iconBg={cn.purpleBg}
          showTrend
          trendIcon={TrendingUp}
          trendColor={cn.green}
          hint={t("dashboard:caregiver.thisMonthHint")}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link to="/billing" className="cn-stat-card flex items-center gap-4 hover:shadow-md transition-shadow no-underline cn-touch-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cn-pink)] focus-visible:ring-offset-2">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: cn.purpleBg }}>
            <FileText className="w-6 h-6" style={{ color: cn.purple }} />
          </div>
          <div className="flex-1">
            <p className="text-xs" style={{ color: cn.textSecondary }}>{t("dashboard:shared.billingPayments")}</p>
            <p className="text-lg font-semibold" style={{ color: cn.text }}>{t("dashboard:shared.invoicesProofsShort")}</p>
          </div>
          <ArrowRight className="w-4 h-4 shrink-0" style={{ color: cn.textSecondary }} aria-hidden />
        </Link>
        <Link to="/wallet?role=caregiver" className="cn-stat-card flex items-center gap-4 hover:shadow-md transition-shadow no-underline cn-touch-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cn-pink)] focus-visible:ring-offset-2">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: cn.pinkBg }}>
            <Coins className="w-6 h-6" style={{ color: cn.pink }} />
          </div>
          <div className="flex-1">
            <p className="text-xs" style={{ color: cn.textSecondary }}>{t("dashboard:shared.carePointsBalance")}</p>
            <p className="text-xl" style={{ color: cn.text }}>{formatCarePoints(walletBal, locale, cpSuffix)}</p>
            <p className="text-xs" style={{ color: cn.amber }}>
              {t("dashboard:shared.feeDue", { amount: formatCarePoints(walletDue, locale, cpSuffix) })}
            </p>
          </div>
          <ArrowRight className="w-4 h-4" style={{ color: cn.textSecondary }} aria-hidden />
        </Link>
        <Link to="/contracts?role=caregiver" className="cn-stat-card flex items-center gap-4 hover:shadow-md transition-shadow no-underline cn-touch-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cn-pink)] focus-visible:ring-offset-2">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: cn.greenBg }}>
            <Handshake className="w-6 h-6" style={{ color: cn.green }} />
          </div>
          <div className="flex-1">
            <p className="text-xs" style={{ color: cn.textSecondary }}>{t("dashboard:shared.activeContracts")}</p>
            <p className="text-xl" style={{ color: cn.text }}>{contractSafe.activeCount}</p>
            <p className="text-xs" style={{ color: cn.amber }}>
              {t("dashboard:shared.pendingOffer", { count: contractSafe.pendingOffersCount })}
            </p>
          </div>
          <ArrowRight className="w-4 h-4" style={{ color: cn.textSecondary }} aria-hidden />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Link
          to="/caregiver/earnings"
          className="cn-card-flat p-5 lg:col-span-2 block no-underline hover:shadow-md transition-shadow cn-touch-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cn-pink)] focus-visible:ring-offset-2"
          aria-label={t("dashboard:caregiver.monthlyEarnings")}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ color: cn.text }}>{t("dashboard:caregiver.monthlyEarnings")}</h2>
            <span className="cn-badge" style={{ background: cn.greenBg, color: cn.green }}>
              {t("dashboard:caregiver.earningsUpBadge", { pct: dashSummary.earningsTrendPercent })}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={earningsData}>
              <defs>
                <linearGradient id="cg-earn-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--cn-pink-light)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--cn-pink-light)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--cn-text-secondary)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "var(--cn-text-secondary)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${currencySym}${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => [`${currencySym} ${v.toLocaleString(locale)}`, t("dashboard:shared.earnings")]} />
              <Area type="monotone" dataKey="amount" stroke="var(--cn-pink)" strokeWidth={2} fill="url(#cg-earn-gradient)" dot={{ fill: "var(--cn-pink)", r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </Link>

        <div className="cn-card-flat p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ color: cn.text }}>{t("dashboard:caregiver.todaySchedule")}</h2>
            <Link to="/caregiver/schedule" style={{ color: cn.pink }} className="text-xs hover:underline cn-touch-target">
              {t("dashboard:shared.viewAll")}
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingSchedule.map((s, i) => {
              const to = s.shiftId ? `/caregiver/shift/${encodeURIComponent(s.shiftId)}` : "/caregiver/schedule";
              return (
                <Link
                  key={i}
                  to={to}
                  className="flex gap-3 p-3 rounded-lg no-underline hover:opacity-90 cn-touch-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cn-pink)]"
                  style={{ background: cn.bgInput }}
                >
                  <div className="text-right shrink-0">
                    <p className="text-xs" style={{ color: cn.text }}>{s.time}</p>
                    <p className="text-xs" style={{ color: cn.textSecondary }}>{s.duration || "—"}</p>
                  </div>
                  <div className="w-px shrink-0" style={{ background: cn.border }} />
                  <div className="min-w-0">
                    <p className="text-sm" style={{ color: cn.text }}>{s.patient}</p>
                    <p className="text-xs" style={{ color: cn.textSecondary }}>{s.type}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className="cn-card-flat p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ color: cn.text }}>{t("dashboard:caregiver.recentJobs")}</h2>
          <Link to="/caregiver/jobs" className="text-xs hover:underline flex items-center gap-1 cn-touch-target" style={{ color: cn.pink }}>
            {t("dashboard:shared.viewAll")} <ArrowRight className="w-3 h-3" aria-hidden />
          </Link>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${cn.borderLight}` }}>
                {[t("dashboard:shared.patient"), t("dashboard:shared.careType"), t("dashboard:shared.date"), t("dashboard:shared.amount"), t("dashboard:shared.status")].map((h) => (
                  <th key={h} className="pb-3 text-left text-xs" style={{ color: cn.textSecondary }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentJobs.map((job) => {
                const sc = jobStatusStyle(job.status);
                return (
                  <tr key={String(job.id)} className="cn-table-row" style={{ borderBottom: `1px solid ${cn.borderLight}` }}>
                    <td className="py-0 pr-2">
                      <Link to={`/caregiver/jobs/${job.id}`} className="block py-3 no-underline hover:underline" style={{ color: cn.text }}>
                        {job.patient}
                      </Link>
                    </td>
                    <td className="py-0 pr-2">
                      <Link to={`/caregiver/jobs/${job.id}`} className="block py-3 no-underline hover:underline" style={{ color: cn.textSecondary }}>
                        {job.type}
                      </Link>
                    </td>
                    <td className="py-0 pr-2">
                      <Link to={`/caregiver/jobs/${job.id}`} className="block py-3 no-underline hover:underline" style={{ color: cn.textSecondary }}>
                        {job.date}
                      </Link>
                    </td>
                    <td className="py-0 pr-2">
                      <Link to={`/caregiver/jobs/${job.id}`} className="block py-3 no-underline hover:underline" style={{ color: cn.text }}>
                        {job.amount || "—"}
                      </Link>
                    </td>
                    <td className="py-3">
                      <span className="cn-badge" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="md:hidden space-y-3">
          {recentJobs.map((job) => {
            const sc = jobStatusStyle(job.status);
            return (
              <Link
                key={String(job.id)}
                to={`/caregiver/jobs/${job.id}`}
                className="block p-3 rounded-xl no-underline hover:shadow-md cn-touch-target"
                style={{ background: cn.bgInput }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-sm" style={{ color: cn.text }}>{job.patient}</p>
                  <span className="cn-badge" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs" style={{ color: cn.textSecondary }}>{job.type} · {job.date}</p>
                  <p className="text-xs" style={{ color: cn.text }}>{job.amount || "—"}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[
          { labelKey: "dashboard:caregiver.findJobs", path: "/caregiver/jobs", icon: Briefcase, color: cn.pink, bg: cn.pinkBg },
          { labelKey: "dashboard:caregiver.checkMessages", path: "/caregiver/messages", icon: MessageSquare, color: cn.purple, bg: cn.purpleBg },
          { labelKey: "dashboard:caregiver.updateAvailability", path: "/caregiver/schedule", icon: Calendar, color: cn.green, bg: cn.greenBg },
          { labelKey: "dashboard:caregiver.viewReviews", path: "/caregiver/reviews", icon: Star, color: cn.amber, bg: cn.amberBg },
        ].map((a) => {
          const Icon = a.icon;
          return (
            <Link key={a.path} to={a.path} className="cn-card p-4 text-center cn-touch-target no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cn-pink)]">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: a.bg }}>
                <Icon className="w-5 h-5" style={{ color: a.color }} aria-hidden />
              </div>
              <p className="text-xs" style={{ color: cn.text }}>{t(a.labelKey)}</p>
            </Link>
          );
        })}
      </div>

      <DocumentExpiryWidget />
    </div>
  );
}
