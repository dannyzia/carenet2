import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Briefcase, Star, DollarSign, Clock, Calendar, MessageSquare, ArrowRight, TrendingUp, Coins, Handshake } from "lucide-react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { cn, statusColors } from "@/frontend/theme/tokens";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { useAuth } from "@/frontend/auth/AuthContext";
import { caregiverService } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { DocumentExpiryWidget } from "@/frontend/components/shared/DocumentExpiryWidget";

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

export default function CaregiverDashboardPage() {
  const { t } = useTranslation("common");
  const { user } = useAuth();
  useDocumentTitle(t("pageTitles.caregiverDashboard", "Dashboard"));

  const { data: earningsData, loading: lE } = useAsyncData(() => caregiverService.getDashboardEarnings());
  const { data: recentJobs, loading: lJ } = useAsyncData(() => caregiverService.getRecentJobs());
  const { data: upcomingSchedule, loading: lS } = useAsyncData(() => caregiverService.getUpcomingSchedule());

  if (lE || lJ || lS || !earningsData || !recentJobs || !upcomingSchedule) return <PageSkeleton variant="dashboard" />;

  const today = formatDate(new Date());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl" style={{ color: cn.text }}>Good Morning, {user?.name || "User"}! 👋</h1>
          <p className="text-sm mt-0.5" style={{ color: cn.textSecondary }}>Here's your caregiving activity today — {today}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/caregiver/jobs" className="px-4 py-2 rounded-lg text-sm border hover:opacity-80 transition-all" style={{ borderColor: cn.border, color: cn.text }}>
            View Jobs
          </Link>
          <Link to="/caregiver/schedule" className="px-4 py-2 rounded-lg text-sm text-white transition-all"
            style={{ background: "var(--cn-gradient-caregiver)" }}>
            My Schedule
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Jobs", value: "3", icon: Briefcase, color: cn.pink, bg: cn.pinkBg, change: "+1 this week" },
          { label: "Avg. Rating", value: "4.8", icon: Star, color: cn.amber, bg: cn.amberBg, change: "128 reviews" },
          { label: "This Month", value: "৳ 13,400", icon: DollarSign, color: cn.green, bg: cn.greenBg, change: "+27% vs last" },
          { label: "Hours Worked", value: "94h", icon: Clock, color: cn.purple, bg: cn.purpleBg, change: "This month" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="cn-stat-card">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
                  <Icon className="w-5 h-5" style={{ color: s.color }} />
                </div>
                <TrendingUp className="w-4 h-4" style={{ color: cn.green }} />
              </div>
              <p className="text-2xl" style={{ color: cn.text }}>{s.value}</p>
              <p className="text-xs mt-0.5" style={{ color: cn.textSecondary }}>{s.label}</p>
              <p className="text-xs mt-1" style={{ color: s.color }}>{s.change}</p>
            </div>
          );
        })}
      </div>

      {/* CarePoints Wallet Quick Access */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/wallet?role=caregiver" className="cn-stat-card flex items-center gap-4 hover:shadow-md transition-shadow no-underline cn-touch-target">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: cn.pinkBg }}>
            <Coins className="w-6 h-6" style={{ color: cn.pink }} />
          </div>
          <div className="flex-1">
            <p className="text-xs" style={{ color: cn.textSecondary }}>CarePoints Balance</p>
            <p className="text-xl" style={{ color: cn.text }}>67,200 CP</p>
            <p className="text-xs" style={{ color: cn.amber }}>Fee due: 3,360 CP</p>
          </div>
          <ArrowRight className="w-4 h-4" style={{ color: cn.textSecondary }} />
        </Link>
        <Link to="/contracts?role=caregiver" className="cn-stat-card flex items-center gap-4 hover:shadow-md transition-shadow no-underline cn-touch-target">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: cn.greenBg }}>
            <Handshake className="w-6 h-6" style={{ color: cn.green }} />
          </div>
          <div className="flex-1">
            <p className="text-xs" style={{ color: cn.textSecondary }}>Active Contracts</p>
            <p className="text-xl" style={{ color: cn.text }}>1</p>
            <p className="text-xs" style={{ color: cn.amber }}>1 offer pending</p>
          </div>
          <ArrowRight className="w-4 h-4" style={{ color: cn.textSecondary }} />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Earnings Chart */}
        <div className="cn-card-flat p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ color: cn.text }}>Monthly Earnings</h2>
            <span className="cn-badge" style={{ background: cn.greenBg, color: cn.green }}>+27% this month</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={earningsData}>
              <defs>
                <linearGradient id="cg-earn-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--cn-pink-light)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--cn-pink-light)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis key="xaxis" dataKey="month" tick={{ fontSize: 12, fill: "var(--cn-text-secondary)" }} axisLine={false} tickLine={false} />
              <YAxis key="yaxis" tick={{ fontSize: 12, fill: "var(--cn-text-secondary)" }} axisLine={false} tickLine={false} tickFormatter={v => `৳${(v / 1000).toFixed(0)}k`} />
              <Tooltip key="tooltip" formatter={(v: number) => [`৳ ${v.toLocaleString()}`, "Earnings"]} />
              <Area key="area-amount" type="monotone" dataKey="amount" stroke="var(--cn-pink)" strokeWidth={2} fill="url(#cg-earn-gradient)" dot={{ fill: "var(--cn-pink)", r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Today's Schedule */}
        <div className="cn-card-flat p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ color: cn.text }}>Today's Schedule</h2>
            <Link to="/caregiver/schedule" style={{ color: cn.pink }} className="text-xs hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {upcomingSchedule.map((s, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-lg" style={{ background: cn.bgInput }}>
                <div className="text-right shrink-0">
                  <p className="text-xs" style={{ color: cn.text }}>{s.time}</p>
                  <p className="text-xs" style={{ color: cn.textSecondary }}>{s.duration}</p>
                </div>
                <div className="w-px" style={{ background: cn.border }} />
                <div>
                  <p className="text-sm" style={{ color: cn.text }}>{s.patient}</p>
                  <p className="text-xs" style={{ color: cn.textSecondary }}>{s.type}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Jobs */}
      <div className="cn-card-flat p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ color: cn.text }}>Recent Jobs</h2>
          <Link to="/caregiver/jobs" className="text-xs hover:underline flex items-center gap-1" style={{ color: cn.pink }}>
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${cn.borderLight}` }}>
                {["Patient", "Care Type", "Date", "Amount", "Status"].map(h => (
                  <th key={h} className="pb-3 text-left text-xs" style={{ color: cn.textSecondary }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentJobs.map(job => {
                const sc = statusColors[job.status];
                return (
                  <tr key={job.id} className="cn-table-row" style={{ borderBottom: `1px solid ${cn.borderLight}` }}>
                    <td className="py-3" style={{ color: cn.text }}>{job.patient}</td>
                    <td className="py-3" style={{ color: cn.textSecondary }}>{job.type}</td>
                    <td className="py-3" style={{ color: cn.textSecondary }}>{job.date}</td>
                    <td className="py-3" style={{ color: cn.text }}>{job.amount}</td>
                    <td className="py-3">
                      <span className="cn-badge" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile card list */}
        <div className="md:hidden space-y-3">
          {recentJobs.map(job => {
            const sc = statusColors[job.status];
            return (
              <div key={job.id} className="p-3 rounded-xl" style={{ background: cn.bgInput }}>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-sm" style={{ color: cn.text }}>{job.patient}</p>
                  <span className="cn-badge" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs" style={{ color: cn.textSecondary }}>{job.type} · {job.date}</p>
                  <p className="text-xs" style={{ color: cn.text }}>{job.amount}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: "Find New Jobs", path: "/caregiver/jobs", icon: Briefcase, color: cn.pink, bg: cn.pinkBg },
          { label: "Check Messages", path: "/caregiver/messages", icon: MessageSquare, color: cn.purple, bg: cn.purpleBg },
          { label: "Update Availability", path: "/caregiver/schedule", icon: Calendar, color: cn.green, bg: cn.greenBg },
          { label: "View Reviews", path: "/caregiver/reviews", icon: Star, color: cn.amber, bg: cn.amberBg },
        ].map(a => {
          const Icon = a.icon;
          return (
            <Link key={a.label} to={a.path} className="cn-card p-4 text-center cn-touch-target">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: a.bg }}>
                <Icon className="w-5 h-5" style={{ color: a.color }} />
              </div>
              <p className="text-xs" style={{ color: cn.text }}>{a.label}</p>
            </Link>
          );
        })}
      </div>

      {/* Document Expiry Alerts */}
      <DocumentExpiryWidget />
    </div>
  );
}
