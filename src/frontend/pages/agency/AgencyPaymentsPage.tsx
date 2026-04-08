import { cn } from "@/frontend/theme/tokens";
import { Download, ArrowDownRight, ArrowUpRight, CreditCard } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { agencyService } from "@/backend/services/agency.service";
import { PageSkeleton } from "@/frontend/components/PageSkeleton";
import { useTranslation } from "react-i18next";
import { formatBDT } from "@/frontend/utils/currency";

export default function AgencyPaymentsPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.agencyPayments", "Agency Payments"));

  const navigate = useNavigate();
  const { data: transactions, loading } = useAsyncData(() => agencyService.getTransactions());
  const { data: summary, loading: loadingSummary } = useAsyncData(() => agencyService.getPaymentsSummary());

  if (loading || loadingSummary || !transactions || !summary) return <PageSkeleton cards={4} />;

  const exportTransactions = () => {
    const header = ["ID", "Description", "Amount", "Type", "Date", "Status"];
    const rows = transactions.map((t) => [String(t.id), t.desc, t.amount, t.type, t.date, t.status]);
    const csv = [header, ...rows]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "agency-transactions.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between"><div><h1 className="text-2xl font-semibold" style={{ color: "#535353" }}>Payments</h1><p className="text-sm" style={{ color: "#848484" }}>Agency financial overview</p></div><div className="flex gap-2"><Link to="/billing" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border no-underline" style={{ borderColor: "#E0E0E0", color: "#535353" }}><CreditCard className="w-4 h-4" /> Billing Hub</Link><button onClick={exportTransactions} className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm cn-touch-target" style={{ background: "radial-gradient(143.86% 887.35% at -10.97% -22.81%, #80CBC4 0%, #00897B 100%)" }}><Download className="w-4 h-4" /> Export</button></div></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{[
          { label: `Revenue (${summary.monthLabel})`, value: formatBDT(summary.revenueBdt), icon: ArrowDownRight, color: "#5FB865", bg: "#7CE57720" },
          { label: `Payroll (${summary.monthLabel})`, value: formatBDT(summary.payrollBdt), icon: ArrowUpRight, color: "#EF4444", bg: "#EF444420" },
          { label: "Net Profit", value: formatBDT(summary.netProfitBdt), icon: CreditCard, color: "#00897B", bg: "#26C6DA20" },
        ].map(s => { const Icon = s.icon; return (<div key={s.label} className="stat-card flex items-center gap-4"><div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: s.bg }}><Icon className="w-6 h-6" style={{ color: s.color }} /></div><div><p className="text-xs" style={{ color: "#848484" }}>{s.label}</p><p className="text-xl font-bold" style={{ color: "#535353" }}>{s.value}</p></div></div>); })}</div>
        <div className="finance-card p-5"><div className="flex items-center justify-between mb-4"><h2 className="font-semibold" style={{ color: "#535353" }}>Recent Transactions</h2><Link to="/billing" className="text-xs no-underline hover:underline" style={{ color: "#00897B" }}>View All Invoices →</Link></div><div className="space-y-3">{transactions.map(t => (<div key={t.id} className="flex items-center justify-between py-3 border-b last:border-0 cursor-pointer hover:bg-gray-50 rounded-lg px-2 transition-colors" onClick={() => navigate(`/billing/invoice/${t.id}`)} style={{ borderColor: "#F3F4F6" }}><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: t.type === "credit" ? "#7CE57720" : "#EF444415" }}>{t.type === "credit" ? <ArrowDownRight className="w-4 h-4" style={{ color: "#5FB865" }} /> : <ArrowUpRight className="w-4 h-4" style={{ color: "#EF4444" }} />}</div><div><p className="text-sm font-medium" style={{ color: "#535353" }}>{t.desc}</p><p className="text-xs" style={{ color: "#848484" }}>{t.date}</p></div></div><span className="font-semibold text-sm" style={{ color: t.type === "credit" ? "#5FB865" : "#EF4444" }}>{t.amount}</span></div>))}</div></div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: ".stat-card { background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); padding: 1.25rem; } .finance-card { background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }" }} />
    </>
  );
}