import { cn } from "@/frontend/theme/tokens";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { caregiverService, getMyWallet } from "@/backend/services";
import { adminService } from "@/backend/services/admin.service";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { DollarSign, TrendingUp, CreditCard, Clock, ArrowUpRight, ArrowDownRight, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useTranslation } from "react-i18next";
import { useNavigate, Link } from "react-router";
import { formatBDT } from "@/frontend/utils/currency";
import { pointsToBDT } from "@/frontend/utils/points";

export default function CaregiverEarningsPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.caregiverEarnings", "Caregiver Earnings"));

  const { data: monthlyData, loading: lM } = useAsyncData(() => caregiverService.getMonthlyEarnings());
  const { data: transactions, loading: lT } = useAsyncData(() => caregiverService.getTransactions());
  const { data: paymentMethods, loading: lP } = useAsyncData(() => caregiverService.getPaymentMethods());
  const { data: dashSummary, loading: lS } = useAsyncData(() => caregiverService.getDashboardSummary());
  const { data: wallet, loading: lW } = useAsyncData(() => getMyWallet("caregiver"));
  const { data: platformSettings, loading: lSet } = useAsyncData(() => adminService.getSettingsData());
  const navigate = useNavigate();

  if (lM || lT || lP || lS || lW || lSet || !monthlyData || !transactions || !paymentMethods || !dashSummary || !wallet) {
    return <PageSkeleton cards={3} />;
  }

  const availableBdt = pointsToBDT(wallet.balance);
  const totalEarnedBdt = monthlyData.reduce((sum, m) => sum + (m.earned || 0), 0);
  const currentMonthEarned = monthlyData[monthlyData.length - 1]?.earned ?? 0;
  const previousMonthEarned = monthlyData[monthlyData.length - 2]?.earned ?? 0;
  const monthTrendPct =
    previousMonthEarned > 0
      ? Math.round(((currentMonthEarned - previousMonthEarned) / previousMonthEarned) * 100)
      : 0;
  const sessionCount = transactions.filter((tx) => tx.type === "credit").length;

  const exportEarnings = () => {
    const header = ["ID", "Description", "Amount", "Type", "Date"];
    const rows = transactions.map((t) => [String(t.id), t.desc, t.amount, t.type, t.date]);
    const csv = [header, ...rows]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "caregiver-earnings.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: "#535353" }}>Earnings</h1>
            <p className="text-sm" style={{ color: "#848484" }}>Track your income and withdrawals</p>
          </div>
          <button onClick={exportEarnings} className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm cn-touch-target"
            style={{ background: "radial-gradient(143.86% 887.35% at -10.97% -22.81%, #FEB4C5 0%, #DB869A 100%)" }}>
            <Download className="w-4 h-4" /> Export
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Available Balance", value: formatBDT(availableBdt), icon: DollarSign, color: "#5FB865", bg: "#7CE57720", sub: "Ready to withdraw" },
            {
              label: "This Month",
              value: formatBDT(dashSummary.thisMonthBdt),
              icon: TrendingUp,
              color: "#DB869A",
              bg: "#FEB4C520",
              sub: `${monthTrendPct >= 0 ? "+" : ""}${monthTrendPct}% vs last month`,
            },
            { label: "Total Earned", value: formatBDT(totalEarnedBdt), icon: CreditCard, color: "#7B5EA7", bg: "#8082ED20", sub: "All time" },
            { label: "Hours This Month", value: `${dashSummary.hoursThisMonth}h`, icon: Clock, color: "#E8A838", bg: "#FFB54D20", sub: `${sessionCount} sessions` },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="stat-card">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: s.bg }}>
                  <Icon className="w-5 h-5" style={{ color: s.color }} />
                </div>
                <p className="text-xl font-bold" style={{ color: "#535353" }}>{s.value}</p>
                <p className="text-xs mt-0.5" style={{ color: "#848484" }}>{s.label}</p>
                <p className="text-xs mt-1 font-medium" style={{ color: s.color }}>{s.sub}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Earnings Chart */}
          <div className="finance-card p-5">
            <h2 className="font-semibold mb-4" style={{ color: "#535353" }}>Earnings vs Withdrawals</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} barGap={4}>
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#848484" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#848484" }} axisLine={false} tickLine={false} tickFormatter={v => `৳${v / 1000}k`} />
                <Tooltip formatter={(v: number, name: string) => [`৳ ${v.toLocaleString()}`, name === "earned" ? "Earned" : "Withdrawn"]} />
                <Bar dataKey="earned" fill="#FEB4C5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="withdrawn" fill="#DB869A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Withdraw */}
          <div className="finance-card p-5">
            <h2 className="font-semibold mb-4" style={{ color: "#535353" }}>Withdraw Earnings</h2>
            <div className="p-4 rounded-xl mb-4" style={{ background: "radial-gradient(143.86% 887.35% at -10.97% -22.81%, #FEB4C5 0%, #DB869A 100%)" }}>
              <p className="text-white text-sm opacity-80">Available Balance</p>
              <p className="text-white text-3xl font-bold mt-1">{formatBDT(availableBdt)}</p>
            </div>
            <div className="space-y-3 mb-4">
              {paymentMethods.map(m => (
                <div key={m.name} className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:border-pink-300 transition-all"
                  style={{ borderColor: m.primary ? "#DB869A" : "#E5E7EB", background: m.primary ? "#FEB4C508" : "white" }}>
                  <span className="text-lg">{m.logo}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: "#535353" }}>{m.name}</p>
                    <p className="text-xs" style={{ color: "#848484" }}>{m.number}</p>
                  </div>
                  {m.primary && <span className="badge-pill" style={{ background: "#7CE57720", color: "#5FB865" }}>Primary</span>}
                </div>
              ))}
            </div>
            <input className="input-field mb-3" placeholder={`Amount to withdraw (min ৳ ${platformSettings?.withdrawalMin ?? "500"})`} type="number" />
            <button onClick={() => navigate("/wallet?role=caregiver")} className="w-full py-2.5 rounded-xl text-white text-sm font-medium cn-touch-target"
              style={{ background: "radial-gradient(143.86% 887.35% at -10.97% -22.81%, #FEB4C5 0%, #DB869A 100%)" }}>
              Withdraw Now
            </button>
          </div>
        </div>

        {/* Transactions */}
        <div className="finance-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold" style={{ color: "#535353" }}>Transaction History</h2>
            <Link to="/wallet?role=caregiver" className="text-xs hover:underline no-underline" style={{ color: "#DB869A" }}>View all</Link>
          </div>
          <div className="space-y-2">
            {transactions.map(t => (
              <div key={t.id} className="flex items-center justify-between py-3 border-b last:border-0" style={{ borderColor: "#F3F4F6" }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: t.type === "credit" ? "#7CE57720" : "#EF444420" }}>
                    {t.type === "credit" ? <ArrowDownRight className="w-4 h-4" style={{ color: "#5FB865" }} /> : <ArrowUpRight className="w-4 h-4" style={{ color: "#EF4444" }} />}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "#535353" }}>{t.desc}</p>
                    <p className="text-xs" style={{ color: "#848484" }}>{t.date}</p>
                  </div>
                </div>
                <span className="font-semibold text-sm" style={{ color: t.type === "credit" ? "#5FB865" : "#EF4444" }}>{t.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: "\n        .stat-card { background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); padding: 1.25rem; }\n        .finance-card { background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }\n        .badge-pill { display: inline-flex; align-items: center; padding: 0.2rem 0.5rem; border-radius: 999px; font-size: 0.7rem; font-weight: 500; }\n        .input-field { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #E5E7EB; border-radius: 8px; outline: none; font-size: 0.875rem; color: #535353; }\n      " }} />
    </>
  );
}