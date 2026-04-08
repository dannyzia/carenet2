import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { CreditCard, ArrowUpRight, ArrowDownRight, Clock, Download, CheckCircle, TrendingUp } from "lucide-react";
import { cn } from "@/frontend/theme/tokens";
import { ResponsiveTable, type Column } from "@/frontend/components/ResponsiveTable";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { adminService } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import type { AdminTransaction } from "@/backend/models";
import { useTranslation } from "react-i18next";

const columns: Column<AdminTransaction>[] = [
  { key: "type", label: "Type", primary: true, render: (row) => <span style={{ color: cn.text }}>{row.type}</span> },
  { key: "from", label: "From", render: (row) => <span style={{ color: cn.textSecondary }}>{row.from}</span> },
  { key: "to", label: "To", render: (row) => <span style={{ color: cn.textSecondary }}>{row.to}</span>, hideOnMobile: true },
  { key: "amount", label: "Amount", render: (row) => <span style={{ color: cn.text }}>{row.amount}</span> },
  { key: "fee", label: "Fee", render: (row) => <span className="text-xs" style={{ color: cn.green }}>{row.fee}</span>, hideOnMobile: true },
  { key: "date", label: "Date", render: (row) => <span style={{ color: cn.textSecondary }}>{row.date}</span> },
  { key: "status", label: "Status", render: (row) => (<span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs" style={{ background: row.status === "completed" ? "#7CE57720" : "#FFB54D20", color: row.status === "completed" ? "#5FB865" : "#E8A838" }}>{row.status === "completed" ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}{row.status}</span>) },
];
const mobileCard = (row: AdminTransaction) => (<div className="space-y-2"><div className="flex items-center justify-between"><p className="text-sm" style={{ color: cn.text }}>{row.type}</p><span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px]" style={{ background: row.status === "completed" ? "#7CE57720" : "#FFB54D20", color: row.status === "completed" ? "#5FB865" : "#E8A838" }}>{row.status === "completed" ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}{row.status}</span></div><div className="flex items-center justify-between text-xs" style={{ color: cn.textSecondary }}><span>{row.from} \u2192 {row.to}</span></div><div className="flex items-center justify-between"><span className="text-sm" style={{ color: cn.text }}>{row.amount}</span><span className="text-xs" style={{ color: cn.textSecondary }}>Fee: {row.fee} \u00b7 {row.date}</span></div></div>);

export default function AdminPaymentsPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.adminPayments", "Admin Payments"));

  const { data: paymentsData, loading } = useAsyncData(() => adminService.getPaymentsData());

  if (loading || !paymentsData) return <PageSkeleton cards={4} />;

  const { chartData, transactions } = paymentsData;

  const parseAmt = (s: string) => { const n = Number(String(s).replace(/[^\d.-]/g, "")); return Number.isFinite(n) ? n : 0; };
  const lastMonth = chartData.length > 0 ? chartData[chartData.length - 1] : null;
  const revenueBdt = lastMonth ? lastMonth.income : 0;
  const payoutsBdt = lastMonth ? lastMonth.payouts : 0;
  const platformFees = Math.round(revenueBdt * 0.05);
  const pendingPayouts = transactions.filter(tx => tx.status === "pending").reduce((s, tx) => s + parseAmt(tx.amount), 0);
  const monthLabel = lastMonth ? (chartData.length > 0 ? lastMonth.month || "—" : "—") : "—";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><h1 className="text-2xl" style={{ color: cn.text }}>Payments & Finance</h1><p className="text-sm" style={{ color: cn.textSecondary }}>Platform-wide payment management</p></div><button className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm cn-touch-target" style={{ background: "radial-gradient(143.86% 887.35% at -10.97% -22.81%, #A8AAFF 0%, #6062CC 100%)" }}><Download className="w-4 h-4" /> Export Report</button></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{[{ label: `Revenue (${monthLabel})`, value: `\u09F3 ${revenueBdt.toLocaleString()}`, icon: ArrowDownRight, color: "#5FB865", bg: "#7CE57720" }, { label: `Payouts (${monthLabel})`, value: `\u09F3 ${payoutsBdt.toLocaleString()}`, icon: ArrowUpRight, color: "#EF4444", bg: "#EF444420" }, { label: "Platform Fees", value: `\u09F3 ${platformFees.toLocaleString()}`, icon: CreditCard, color: "#7B5EA7", bg: "#8082ED20" }, { label: "Pending Payouts", value: `\u09F3 ${pendingPayouts.toLocaleString()}`, icon: Clock, color: "#E8A838", bg: "#FFB54D20" }].map(s => { const Icon = s.icon; return (<div key={s.label} className="cn-stat-card"><div className="flex items-center justify-between mb-3"><div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.bg }}><Icon className="w-5 h-5" style={{ color: s.color }} /></div><TrendingUp className="w-4 h-4" style={{ color: cn.green }} /></div><p className="text-xl" style={{ color: cn.text }}>{s.value}</p><p className="text-xs mt-0.5" style={{ color: cn.textSecondary }}>{s.label}</p></div>); })}</div>
      <div className="finance-card p-5"><h2 className="mb-4" style={{ color: cn.text }}>Revenue vs Payouts (\u09F3)</h2><div className="overflow-x-auto -mx-2"><div className="min-w-[400px] px-2"><ResponsiveContainer width="100%" height={200}><BarChart data={chartData} barGap={4}><XAxis dataKey="month" tick={{ fontSize: 12, fill: cn.textSecondary }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 12, fill: cn.textSecondary }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} /><Tooltip formatter={(v: number, name: string) => [`\u09F3 ${v.toLocaleString()}`, name === "income" ? "Revenue" : "Payouts"]} /><Bar dataKey="income" fill="#7B5EA7" radius={[4, 4, 0, 0]} name="income" /><Bar dataKey="payouts" fill="#DB869A" radius={[4, 4, 0, 0]} name="payouts" /></BarChart></ResponsiveContainer></div></div></div>
      <div><div className="flex items-center justify-between mb-3"><h2 style={{ color: cn.text }}>Recent Transactions</h2><button className="text-xs hover:underline" style={{ color: cn.pink }}>View all</button></div><ResponsiveTable columns={columns} data={transactions} keyExtractor={(row) => row.id} mobileCard={mobileCard} emptyMessage="No transactions found" /></div>
    </div>
  );
}