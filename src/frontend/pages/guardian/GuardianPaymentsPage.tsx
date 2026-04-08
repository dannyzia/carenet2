import { Link, useNavigate } from "react-router";
import { cn } from "@/frontend/theme/tokens";
import { formatBDT } from "@/frontend/utils/currency";
import { useTranslation } from "react-i18next";
import { Plus, Wallet, ArrowUpRight, ArrowDownRight, Clock, Download, CreditCard, Building2 } from "lucide-react";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { guardianService } from "@/backend/services/guardian.service";
import { getMyWallet } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/PageSkeleton";

export default function GuardianPaymentsPage() {
  const { t, i18n } = useTranslation();
  useDocumentTitle(t("common:pageTitles.payments", "Payments"));
  const navigate = useNavigate();
  const isBangla = i18n.language === "bn";
  const bdtOpts = { bangla: isBangla };

  const { data: transactions, loading: l1 } = useAsyncData(() => guardianService.getPaymentTransactions());
  const { data: invoices, loading: l2 } = useAsyncData(() => guardianService.getInvoices());
  const { data: wallet, loading: l3 } = useAsyncData(() => getMyWallet("guardian"));
  const { data: profile, loading: l4 } = useAsyncData(() => guardianService.getGuardianProfile());

  if (l1 || l2 || l3 || l4 || !transactions || !invoices || !wallet || !profile) return <PageSkeleton cards={4} />;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const thisMonthSpent = transactions
    .filter((tx) => tx.type === "debit")
    .filter((tx) => {
      const ts = Date.parse(tx.date);
      return Number.isFinite(ts) ? ts >= monthStart : false;
    })
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const pendingPayments = invoices.reduce((sum, inv) => {
    if (inv.status === "paid") return sum;
    const value = Number((inv as any).total ?? inv.amount ?? 0);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);
  const agencyCount = new Set(
    invoices
      .map((inv) => (inv as any).agency || (inv as any).from?.name || "")
      .filter(Boolean)
  ).size;
  const pendingCount = invoices.filter((inv) => inv.status !== "paid").length;
  const thisMonthLabel = now.toLocaleString(isBangla ? "bn-BD" : "en-US", { month: "short", year: "numeric" });
  const paymentMethods = profile.phone
    ? [{ name: "Primary", number: profile.phone, color: "#00897B", primary: true }]
    : [];

  const exportTransactions = () => {
    const header = ["ID", "Description", "Patient", "Amount", "Type", "Status", "Date"];
    const rows = transactions.map((t) => [t.id, t.desc, t.patient, String(t.amount), t.type, t.status, t.date]);
    const csv = [header, ...rows]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "guardian-payments.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl" style={{ color: cn.text }}>Payments</h1><p className="text-sm" style={{ color: cn.textSecondary }}>Active Placement Billing \u2014 payments to agencies</p></div>
        <Link to="/wallet?role=guardian" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm cn-touch-target no-underline" style={{ background: "var(--cn-gradient-guardian)" }}><Plus className="w-4 h-4" /> Add Funds</Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Wallet Balance", value: formatBDT(wallet.balance, bdtOpts), icon: Wallet, color: cn.green, bg: cn.greenBg, sub: "Available" },
          { label: "This Month Spent", value: formatBDT(thisMonthSpent, bdtOpts), icon: ArrowUpRight, color: "#EF4444", bg: "rgba(239,68,68,0.08)", sub: `${thisMonthLabel} \u00b7 ${agencyCount} agencies` },
          { label: "Pending Payments", value: formatBDT(pendingPayments, bdtOpts), icon: Clock, color: cn.amber, bg: cn.amberBg, sub: `${pendingCount} agency pending` },
        ].map(s => {
          const Icon = s.icon;
          return (<div key={s.label} className="finance-card p-5 flex items-center gap-4"><div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.bg }}><Icon className="w-6 h-6" style={{ color: s.color }} /></div><div><p className="text-xs" style={{ color: cn.textSecondary }}>{s.label}</p><p className="text-xl" style={{ color: cn.text }}>{s.value}</p><p className="text-xs" style={{ color: s.color }}>{s.sub}</p></div></div>);
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="finance-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4"><h2 style={{ color: cn.text }}>Transaction History</h2><button onClick={exportTransactions} className="flex items-center gap-1 text-xs hover:underline cn-touch-target" style={{ color: cn.green }}><Download className="w-3.5 h-3.5" /> Export</button></div>
          <div className="space-y-2">
            {transactions.map(t => (
              <div key={t.id} className="flex items-center justify-between py-3 border-b last:border-0" style={{ borderColor: cn.borderLight }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: t.type === "credit" ? cn.greenBg : t.status === "pending" ? cn.amberBg : "rgba(239,68,68,0.08)" }}>
                    {t.type === "credit" ? <ArrowDownRight className="w-4 h-4" style={{ color: cn.green }} /> : t.status === "pending" ? <Clock className="w-4 h-4" style={{ color: cn.amber }} /> : <ArrowUpRight className="w-4 h-4" style={{ color: "#EF4444" }} />}
                  </div>
                  <div className="min-w-0"><p className="text-sm truncate" style={{ color: cn.text }}>{t.desc}</p><p className="text-xs" style={{ color: cn.textSecondary }}>{t.patient} \u00b7 {t.date}</p></div>
                </div>
                <div className="text-right shrink-0 ml-3"><p className="text-sm" style={{ color: t.type === "credit" ? cn.green : cn.text }}>{t.type === "debit" ? "-" : "+"}{formatBDT(t.amount, bdtOpts)}</p><span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px]" style={{ background: t.status === "completed" ? cn.greenBg : cn.amberBg, color: t.status === "completed" ? cn.green : cn.amber }}>{t.status}</span></div>
              </div>
            ))}
          </div>
        </div>

        <div className="finance-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ color: cn.text }}>Placement Billing</h2>
            <Link to="/billing" className="text-xs hover:underline no-underline" style={{ color: cn.green }}>View All</Link>
          </div>
          <div className="space-y-3">
            {invoices.map(inv => (
              <div key={inv.id} className="p-3 rounded-xl" style={{ background: cn.bgInput }}>
                <div className="flex items-center justify-between mb-1"><p className="text-sm" style={{ color: cn.text }}>{inv.month}</p><span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px]" style={{ background: inv.status === "paid" ? cn.greenBg : cn.amberBg, color: inv.status === "paid" ? cn.green : cn.amber }}>{inv.status}</span></div>
                <p className="text-lg" style={{ color: cn.text }}>{formatBDT(inv.amount, bdtOpts)}</p>
                <p className="text-xs mt-1 flex items-center gap-1" style={{ color: cn.teal }}><Building2 className="w-3 h-3" /> {inv.agency}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs" style={{ color: cn.textSecondary }}>Due: {inv.due}</p>
                  <div className="flex items-center gap-2">
                    <Link to={`/billing/invoice/${inv.id}`} className="text-xs hover:underline no-underline" style={{ color: cn.textSecondary }}>View</Link>
                    {inv.status !== "paid" && (<button onClick={() => navigate(`/billing/submit-proof/${inv.id}`)} className="px-3 py-1.5 rounded-lg text-xs text-white cn-touch-target" style={{ background: cn.green }}>Pay Now</button>)}
                    {inv.status === "paid" && (<button className="flex items-center gap-1 text-xs hover:underline" style={{ color: cn.green }}><Download className="w-3 h-3" /> PDF</button>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5">
            <h3 className="text-sm mb-3" style={{ color: cn.text }}>Payment Methods</h3>
            {paymentMethods.map(m => (
              <div key={m.name} className="flex items-center gap-2 p-2.5 rounded-lg border mb-2 cn-touch-target" style={{ borderColor: m.primary ? m.color : cn.border }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs text-white" style={{ background: m.color }}>{m.name.charAt(0)}</div>
                <div className="flex-1"><p className="text-xs" style={{ color: cn.text }}>{m.name}</p><p className="text-xs" style={{ color: cn.textSecondary }}>{m.number}</p></div>
                {m.primary && (<span className="px-2 py-0.5 rounded-full text-[10px]" style={{ background: cn.greenBg, color: cn.green }}>Primary</span>)}
              </div>
            ))}
            {paymentMethods.length === 0 && (
              <p className="text-xs mb-2" style={{ color: cn.textSecondary }}>No payment methods on file</p>
            )}
            <button className="w-full mt-2 py-2.5 rounded-lg border text-xs flex items-center justify-center gap-1.5 cn-touch-target" style={{ borderColor: cn.border, color: cn.textSecondary, borderStyle: "dashed" }}><CreditCard className="w-3.5 h-3.5" /> Add Payment Method</button>
          </div>
        </div>
      </div>
    </div>
  );
}
