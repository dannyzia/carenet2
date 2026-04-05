import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Heart, Calendar, CreditCard, MessageSquare, Star, AlertCircle, ArrowRight, Activity, User, Coins, Handshake } from "lucide-react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { cn } from "@/frontend/theme/tokens";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { useAuth } from "@/frontend/auth/AuthContext";
import { guardianService } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import type { LucideIcon } from "lucide-react";

const activityIconMap: Record<string, LucideIcon> = {
  heart: Heart, calendar: Calendar, creditCard: CreditCard, message: MessageSquare, star: Star,
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

export default function GuardianDashboardPage() {
  const { t } = useTranslation("common");
  const { user } = useAuth();
  useDocumentTitle(t("pageTitles.guardianDashboard", "Dashboard"));

  const { data: spendingData, loading: lS } = useAsyncData(guardianService.getSpendingData);
  const { data: patients, loading: lP } = useAsyncData(() => guardianService.getDashboardPatients());
  const { data: recentActivity, loading: lA } = useAsyncData(() => guardianService.getRecentActivity());

  if (lS || lP || lA || !spendingData || !patients || !recentActivity) {
    return <PageSkeleton />;
  }

  const patientCount = patients?.length ?? 0;
  const today = formatDate(new Date());

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl" style={{ color: cn.text }}>Welcome, {user?.name || "User"}! 👋</h1>
            <p className="text-sm" style={{ color: cn.textSecondary }}>Monitoring care for {patientCount} patient{patientCount !== 1 ? "s" : ""} — {today}</p>
          </div>
          <div className="flex gap-2">
            <Link to="/guardian/care-requirement-wizard" className="px-4 py-2 rounded-lg text-sm text-white" style={{ background: "var(--cn-gradient-guardian)" }}>Submit Care Requirement</Link>
          </div>
        </div>

        <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: cn.amberBg, border: `1px solid ${cn.amber}40` }}>
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: cn.amber }} />
          <div><p className="text-sm" style={{ color: cn.text }}>Reminder: Mr. Rahman's 10 AM medication is due</p><p className="text-xs mt-0.5" style={{ color: cn.textSecondary }}>The assigned caregiver has been notified. Tap to view care log.</p></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: "Patients", value: patientCount.toString(), icon: Heart, color: cn.pink, bg: cn.pinkBg },
            { label: "Active Placements", value: patientCount.toString(), icon: User, color: cn.green, bg: cn.greenBg },
            { label: "This Month", value: "৳ 16,200", icon: CreditCard, color: cn.purple, bg: cn.purpleBg },
            { label: "Total Sessions", value: "47", icon: Activity, color: cn.amber, bg: cn.amberBg },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="cn-stat-card">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: s.bg }}><Icon className="w-5 h-5" style={{ color: s.color }} /></div>
                <p className="text-xl" style={{ color: cn.text }}>{s.value}</p>
                <p className="text-xs mt-0.5" style={{ color: cn.textSecondary }}>{s.label}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link to="/wallet?role=guardian" className="cn-card-flat p-4 flex items-center gap-4 hover:shadow-md transition-shadow no-underline cn-touch-target">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: cn.greenBg }}><Coins className="w-6 h-6" style={{ color: cn.green }} /></div>
            <div className="flex-1"><p className="text-xs" style={{ color: cn.textSecondary }}>CarePoints Balance</p><p className="text-xl" style={{ color: cn.text }}>84,000 CP</p><p className="text-xs" style={{ color: cn.amber }}>Fee due: 5,950 CP</p></div>
            <ArrowRight className="w-4 h-4" style={{ color: cn.textSecondary }} />
          </Link>
          <Link to="/contracts?role=guardian" className="cn-card-flat p-4 flex items-center gap-4 hover:shadow-md transition-shadow no-underline cn-touch-target">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: cn.pinkBg }}><Handshake className="w-6 h-6" style={{ color: cn.pink }} /></div>
            <div className="flex-1"><p className="text-xs" style={{ color: cn.textSecondary }}>Active Contracts</p><p className="text-xl" style={{ color: cn.text }}>2</p><p className="text-xs" style={{ color: cn.amber }}>1 negotiating</p></div>
            <ArrowRight className="w-4 h-4" style={{ color: cn.textSecondary }} />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="cn-card-flat p-5 lg:col-span-2">
            <h2 className="mb-4" style={{ color: cn.text }}>Monthly Care Spending</h2>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={spendingData}>
                <defs><linearGradient id="gu-spend" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--cn-green-light)" stopOpacity={0.3} /><stop offset="95%" stopColor="var(--cn-green-light)" stopOpacity={0} /></linearGradient></defs>
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--cn-text-secondary)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "var(--cn-text-secondary)" }} axisLine={false} tickLine={false} tickFormatter={v => `৳${v / 1000}k`} />
                <Tooltip formatter={(v: number) => [`৳ ${v.toLocaleString()}`, "Spending"]} />
                <Area type="monotone" dataKey="amount" stroke="var(--cn-green)" strokeWidth={2} fill="url(#gu-spend)" dot={{ fill: "var(--cn-green)", r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="cn-card-flat p-5">
            <h2 className="mb-4" style={{ color: cn.text }}>Recent Activity</h2>
            <div className="space-y-3">
              {recentActivity.map((a, i) => {
                const Icon = activityIconMap[a.iconType] ?? Heart;
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `color-mix(in srgb, ${a.color} 15%, transparent)` }}><Icon className="w-4 h-4" style={{ color: a.color }} /></div>
                    <div><p className="text-xs leading-snug" style={{ color: cn.text }}>{a.text}</p><p className="text-xs mt-0.5" style={{ color: cn.textSecondary }}>{a.time}</p></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="cn-card-flat p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ color: cn.text }}>My Patients</h2>
            <Link to="/guardian/patients" className="text-xs flex items-center gap-1 hover:underline" style={{ color: cn.green }}>Manage <ArrowRight className="w-3 h-3" /></Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {patients.length === 0 && (
              <div className="col-span-full text-center py-8">
                <p className="text-sm" style={{ color: cn.textSecondary }}>
                  No patients yet.{" "}
                  <Link to="/guardian/patient-intake" className="underline underline-offset-2" style={{ color: cn.pink }}>
                    Add a patient
                  </Link>{" "}
                  to get started.
                </p>
              </div>
            )}
            {patients.map(p => (
              <div key={p.id} className="p-4 rounded-xl" style={{ background: cn.bgInput }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ background: "var(--cn-gradient-guardian)" }}>{p.name.charAt(3)}</div>
                    <div><p className="text-sm" style={{ color: cn.text }}>{p.name}</p><p className="text-xs" style={{ color: cn.textSecondary }}>Age {p.age}</p></div>
                  </div>
                  <span className="cn-badge" style={{ background: `color-mix(in srgb, ${p.statusColor} 15%, transparent)`, color: p.statusColor }}>{p.status}</span>
                </div>
                <p className="text-xs mb-2" style={{ color: cn.textSecondary }}>Condition: {p.condition}</p>
                <p className="text-xs" style={{ color: cn.text }}>Caregiver: <span style={{ color: cn.green }}>{p.caregiver}</span></p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
