import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Users, Shield, CreditCard, TrendingUp, AlertCircle, CheckCircle, Flag, Coins, Handshake } from "lucide-react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { cn } from "@/frontend/theme/tokens";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { adminService } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { DashboardStatLink } from "@/frontend/components/shared/DashboardStatLink";
import { formatBdtCompactLakh, formatDashboardDate, formatCarePoints } from "@/frontend/utils/dashboardFormat";
import i18n from "@/frontend/i18n";

export default function AdminDashboardPage() {
  const { t } = useTranslation(["dashboard", "common"]);
  useDocumentTitle(t("common:pageTitles.adminDashboard", "Dashboard"));

  const locale = i18n.language || "en";
  const currencySym = t("dashboard:shared.currencySymbol");
  const cpSuffix = t("dashboard:shared.carePointsSuffix");

  const { data: dashboard, loading } = useAsyncData(() => adminService.getDashboardData());

  if (loading || !dashboard) return <PageSkeleton cards={4} />;

  const { userGrowth, revenueData, pieData, pendingItems, recentActivity, summary } = dashboard;
  const subtitle = t("dashboard:shared.subtitleWithDate", {
    context: t("dashboard:admin.subtitle"),
    date: formatDashboardDate(new Date(), locale),
  });
  const revDisplay = formatBdtCompactLakh(summary.revenueThisMonthBdt, locale, currencySym);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl" style={{ color: cn.text }}>{t("dashboard:admin.title")}</h1>
        <p className="text-sm" style={{ color: cn.textSecondary }}>{subtitle}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <DashboardStatLink
          to="/admin/users"
          label={t("dashboard:admin.totalUsers")}
          value={summary.totalUsers.toLocaleString(locale)}
          icon={Users}
          iconColor={cn.purple}
          iconBg={cn.purpleBg}
          showTrend
          trendIcon={TrendingUp}
          trendColor={cn.green}
          hint={summary.totalUsersChangeLabel}
        />
        <DashboardStatLink
          to="/admin/verifications"
          label={t("dashboard:admin.activeCaregivers")}
          value={String(summary.activeCaregivers)}
          icon={Shield}
          iconColor={cn.pink}
          iconBg={cn.pinkBg}
          showTrend
          trendIcon={TrendingUp}
          trendColor={cn.green}
          hint={summary.activeCaregiversChangeLabel}
        />
        <DashboardStatLink
          to="/admin/payments"
          label={t("dashboard:admin.revenueMonth", { month: summary.revenueMonthLabel })}
          value={revDisplay}
          icon={CreditCard}
          iconColor={cn.green}
          iconBg={cn.greenBg}
          showTrend
          trendIcon={TrendingUp}
          trendColor={cn.green}
          hint={summary.revenueChangeLabel}
        />
        <DashboardStatLink
          to="/admin/reports"
          label={t("dashboard:admin.platformGrowth")}
          value={`+${summary.platformGrowthPercent}%`}
          icon={TrendingUp}
          iconColor={cn.amber}
          iconBg={cn.amberBg}
          showTrend
          trendIcon={TrendingUp}
          trendColor={cn.green}
          hint={summary.platformGrowthChangeLabel}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {pendingItems.map((p) => (
          <Link key={p.type} to={p.path} className="cn-card p-4 text-center no-underline hover:shadow-md cn-touch-target focus-visible:ring-2 focus-visible:ring-[var(--cn-pink)]">
            <div className="text-3xl mb-1" style={{ color: p.color }}>{p.count}</div>
            <p className="text-sm" style={{ color: cn.textSecondary }}>{t("dashboard:admin.pendingPrefix", { type: p.type })}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/admin/wallet-management" className="cn-card-flat p-4 flex items-center gap-4 hover:shadow-md transition-shadow no-underline cn-touch-target focus-visible:ring-2 focus-visible:ring-[var(--cn-pink)]">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: cn.purpleBg }}>
            <Coins className="w-6 h-6" style={{ color: cn.purple }} />
          </div>
          <div className="flex-1">
            <p className="text-xs" style={{ color: cn.textSecondary }}>{t("dashboard:admin.pointsInCirculation")}</p>
            <p className="text-xl" style={{ color: cn.text }}>{formatCarePoints(summary.pointsInCirculation, locale, cpSuffix)}</p>
            <p className="text-xs" style={{ color: cn.amber }}>
              {t("dashboard:admin.pendingDues", { amount: formatCarePoints(summary.pendingDuesCp, locale, cpSuffix) })}
            </p>
          </div>
        </Link>
        <Link to="/admin/contracts" className="cn-card-flat p-4 flex items-center gap-4 hover:shadow-md transition-shadow no-underline cn-touch-target focus-visible:ring-2 focus-visible:ring-[var(--cn-pink)]">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: cn.pinkBg }}>
            <Handshake className="w-6 h-6" style={{ color: cn.pink }} />
          </div>
          <div className="flex-1">
            <p className="text-xs" style={{ color: cn.textSecondary }}>{t("dashboard:admin.contractsTitle")}</p>
            <p className="text-xl" style={{ color: cn.text }}>{t("dashboard:admin.contractsTotal", { count: summary.contractsTotal })}</p>
            <p className="text-xs" style={{ color: cn.green }}>
              {t("dashboard:admin.platformRevenueCp", { amount: formatCarePoints(summary.platformRevenueCp, locale, cpSuffix) })}
            </p>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Link to="/admin/reports" className="cn-card-flat p-5 block no-underline hover:shadow-md cn-touch-target focus-visible:ring-2 focus-visible:ring-[var(--cn-pink)]" aria-label={t("dashboard:admin.userGrowth")}>
          <h2 className="mb-4" style={{ color: cn.text }}>{t("dashboard:admin.userGrowth")}</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={userGrowth} barSize={8}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--cn-text-secondary)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--cn-text-secondary)" }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="caregivers" fill="var(--cn-pink)" radius={[3, 3, 0, 0]} name={t("dashboard:admin.seriesCaregivers")} />
              <Bar dataKey="guardians" fill="var(--cn-green)" radius={[3, 3, 0, 0]} name={t("dashboard:admin.seriesGuardians")} />
              <Bar dataKey="patients" fill="var(--cn-purple)" radius={[3, 3, 0, 0]} name={t("dashboard:admin.seriesPatients")} />
            </BarChart>
          </ResponsiveContainer>
        </Link>
        <Link to="/admin/payments" className="cn-card-flat p-5 block no-underline hover:shadow-md cn-touch-target focus-visible:ring-2 focus-visible:ring-[var(--cn-pink)]" aria-label={t("dashboard:shared.monthlyRevenue", { symbol: currencySym })}>
          <h2 className="mb-4" style={{ color: cn.text }}>{t("dashboard:shared.monthlyRevenue", { symbol: currencySym })}</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={revenueData}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--cn-text-secondary)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--cn-text-secondary)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip formatter={(v: number) => [`${currencySym} ${v.toLocaleString(locale)}`, t("dashboard:shared.revenue")]} />
              <Line type="monotone" dataKey="revenue" stroke="var(--cn-purple)" strokeWidth={2.5} dot={{ fill: "var(--cn-purple)", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Link to="/admin/users" className="cn-card-flat p-5 block no-underline hover:shadow-md cn-touch-target focus-visible:ring-2 focus-visible:ring-[var(--cn-pink)]" aria-label={t("dashboard:admin.userDistribution")}>
          <h2 className="mb-4" style={{ color: cn.text }}>{t("dashboard:admin.userDistribution")}</h2>
          <div className="flex justify-center mb-4">
            <PieChart width={160} height={160}>
              <Pie data={pieData} cx={80} cy={80} innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
            </PieChart>
          </div>
          <div className="space-y-2">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2" style={{ color: cn.text }}>
                  <span className="w-3 h-3 rounded-full inline-block" style={{ background: d.color }} />{d.name}
                </span>
                <span style={{ color: d.color }}>{d.value.toLocaleString(locale)}</span>
              </div>
            ))}
          </div>
        </Link>
        <div className="cn-card-flat p-5 lg:col-span-2">
          <h2 className="mb-4" style={{ color: cn.text }}>{t("dashboard:admin.recentActivity")}</h2>
          <div className="space-y-3">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b last:border-0" style={{ borderColor: cn.borderLight }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: a.type === "flag" ? cn.pinkBg : a.type === "resolve" ? cn.greenBg : cn.purpleBg }}>
                  {a.type === "flag" ? <Flag className="w-4 h-4" style={{ color: cn.red }} /> : a.type === "resolve" ? <CheckCircle className="w-4 h-4" style={{ color: cn.green }} /> : a.type === "payment" ? <CreditCard className="w-4 h-4" style={{ color: cn.green }} /> : <AlertCircle className="w-4 h-4" style={{ color: cn.purple }} />}
                </div>
                <div>
                  <p className="text-sm" style={{ color: cn.text }}>{a.text}</p>
                  <p className="text-xs mt-0.5" style={{ color: cn.textSecondary }}>{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
