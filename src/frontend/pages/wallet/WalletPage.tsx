import { useWallet } from "@/frontend/hooks/useWallet";
import { useDocumentTitle } from "@/frontend/hooks";
import { useTranslation } from "react-i18next";
import { RealtimeStatusIndicator } from "@/frontend/components/RealtimeStatusIndicator";
import { SubscriptionHealthBadge } from "@/frontend/components/SubscriptionHealthBadge";
import { useChannelHealthToast } from "@/frontend/hooks/useChannelHealthToast";
import { Link, useSearchParams } from "react-router";
import { cn } from "@/frontend/theme/tokens";
import { formatPoints, pointsToBDT, POINT_PACKAGES, DEFAULT_PLATFORM_FEE_PERCENT } from "@/frontend/utils/points";
import { formatBDT } from "@/frontend/utils/currency";
import { useState } from "react";
import {
  Wallet, Coins, ArrowUpRight, ArrowDownRight, Clock, TrendingUp,
  ShoppingCart, Gift, AlertTriangle, Shield, ChevronRight, Sparkles,
  CreditCard, ArrowRightLeft, Ban, Download, Loader2,
} from "lucide-react";

const TX_ICON_MAP: Record<string, { icon: typeof Wallet; color: string; bg: string }> = {
  purchase: { icon: ShoppingCart, color: "#5FB865", bg: "#7CE57720" },
  withdrawal: { icon: ArrowUpRight, color: "#EF4444", bg: "#EF444420" },
  contract_payment: { icon: ArrowUpRight, color: "#EF4444", bg: "#EF444420" },
  earning: { icon: ArrowDownRight, color: "#5FB865", bg: "#7CE57720" },
  platform_fee: { icon: Shield, color: "#7B5EA7", bg: "#8082ED20" },
  commission: { icon: TrendingUp, color: "#E8A838", bg: "#FFB54D20" },
  admin_credit: { icon: Gift, color: "#00897B", bg: "#26C6DA20" },
  admin_debit: { icon: Ban, color: "#EF4444", bg: "#EF444420" },
  bonus: { icon: Sparkles, color: "#DB869A", bg: "#FEB4C520" },
  refund: { icon: ArrowRightLeft, color: "#5FB865", bg: "#7CE57720" },
  transfer: { icon: ArrowRightLeft, color: "#3B82F6", bg: "#3B82F620" },
};

export default function WalletPage() {
  const { t } = useTranslation("common");
  useDocumentTitle(t("pageTitles.wallet", "Wallet"));
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") || "guardian";
  const [buyOpen, setBuyOpen] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<string | null>(null);
  const [tab, setTab] = useState<"all" | "credits" | "debits" | "fees">("all");
  const [buying, setBuying] = useState(false);

  // Service-layer backed data with real-time updates
  const { wallet, transactions, loading, error, refetch, buyPoints, withdrawPoints } = useWallet(role);

  // Derive the channel ID that useWallet subscribes to
  const userId = role === "guardian" ? "guardian-1" : role === "agency" ? "agency-1" : "caregiver-1";
  const realtimeChannelId = `monetization:${userId}`;

  // Fire toasts on channel health degradation
  useChannelHealthToast(realtimeChannelId, { channelLabel: "Wallet feed" });

  // Loading state
  if (loading && !wallet) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin mb-3" style={{ color: cn.pink }} />
        <p className="text-sm" style={{ color: cn.textSecondary }}>Loading wallet...</p>
      </div>
    );
  }

  // Error state
  if (error || !wallet) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle className="w-12 h-12 mb-3" style={{ color: cn.amber }} />
        <p className="text-sm" style={{ color: cn.text }}>Failed to load wallet</p>
        <p className="text-xs mt-1" style={{ color: cn.textSecondary }}>{error}</p>
        <button onClick={refetch} className="mt-4 px-4 py-2 rounded-xl text-sm text-white"
          style={{ background: "var(--cn-gradient-guardian)" }}>
          Retry
        </button>
      </div>
    );
  }

  const filteredTx = transactions.filter((t) => {
    if (tab === "credits") return t.amount > 0;
    if (tab === "debits") return t.amount < 0 && t.type !== "platform_fee";
    if (tab === "fees") return t.type === "platform_fee" || t.type === "commission";
    return true;
  });

  const roleGradient = role === "guardian"
    ? "var(--cn-gradient-guardian)"
    : role === "agency"
    ? "var(--cn-gradient-agency)"
    : "var(--cn-gradient-caregiver)";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl" style={{ color: cn.text }}>
            <Wallet className="w-6 h-6 inline-block mr-2 -mt-1" />
            CarePoints Wallet
            <RealtimeStatusIndicator variant="dot" className="inline-block ml-2 align-middle" />
          </h1>
          <div className="text-sm flex flex-wrap items-center gap-1.5" style={{ color: cn.textSecondary }}>
            <span>{wallet.userName} · Platform fee: {wallet.feePercent}%</span>
            <SubscriptionHealthBadge
              channelId={realtimeChannelId}
              compact={false}
              showThreshold
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            to="/wallet/top-up"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm cn-touch-target border"
            style={{ borderColor: cn.border, color: cn.text }}
          >
            <CreditCard className="w-4 h-4" /> Top Up
          </Link>
          <button
            onClick={() => setBuyOpen(!buyOpen)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm cn-touch-target"
            style={{ background: roleGradient }}
          >
            <Coins className="w-4 h-4" /> Buy Points
          </button>
          {(role === "caregiver" || role === "agency") && (
            <button
              onClick={async () => {
                await withdrawPoints(5000, "bkash", "01700000000");
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm cn-touch-target border"
              style={{ borderColor: cn.border, color: cn.text }}>
              <Download className="w-4 h-4" /> Withdraw
            </button>
          )}
        </div>
      </div>

      {/* Balance Card */}
      <div className="rounded-2xl p-6 text-white relative overflow-hidden" style={{ background: roleGradient }}>
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 -mr-8 -mt-8"
          style={{ background: "white" }} />
        <div className="relative z-10">
          <p className="text-sm opacity-80">Available Balance</p>
          <p className="text-4xl mt-1">{formatPoints(wallet.balance)}</p>
          <p className="text-sm opacity-70 mt-1">≈ {formatBDT(pointsToBDT(wallet.balance))}</p>

          {wallet.pendingDue > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-white/15 backdrop-blur-sm flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-200 shrink-0" />
              <div>
                <p className="text-sm">Platform Fee Due</p>
                <p className="text-xs opacity-80">
                  {formatPoints(wallet.pendingDue)} ({DEFAULT_PLATFORM_FEE_PERCENT}% of transactions)
                </p>
              </div>
            </div>
          )}

          {wallet.frozenAmount > 0 && (
            <div className="mt-2 p-3 rounded-xl bg-red-500/20 backdrop-blur-sm flex items-center gap-3">
              <Ban className="w-5 h-5 text-red-200 shrink-0" />
              <div>
                <p className="text-sm">Withheld by Admin</p>
                <p className="text-xs opacity-80">{formatPoints(wallet.frozenAmount)} frozen</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Earned", value: formatPoints(wallet.totalEarned, { compact: true }), icon: ArrowDownRight, color: "#5FB865", bg: "#7CE57720" },
          { label: "Total Spent", value: formatPoints(wallet.totalSpent, { compact: true }), icon: ArrowUpRight, color: "#EF4444", bg: "#EF444420" },
          { label: "Withdrawn", value: formatPoints(wallet.totalWithdrawn, { compact: true }), icon: CreditCard, color: "#7B5EA7", bg: "#8082ED20" },
          { label: "Reg. Bonus", value: formatPoints(wallet.registrationBonus), icon: Gift, color: "#DB869A", bg: "#FEB4C520" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="cn-stat-card">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2" style={{ background: s.bg }}>
                <Icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <p className="text-lg" style={{ color: cn.text }}>{s.value}</p>
              <p className="text-xs" style={{ color: cn.textSecondary }}>{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Buy Points Panel */}
      {buyOpen && (
        <div className="finance-card p-5">
          <h2 className="mb-4 flex items-center gap-2" style={{ color: cn.text }}>
            <Coins className="w-5 h-5" style={{ color: cn.amber }} />
            Buy CarePoints
          </h2>
          <p className="text-xs mb-4" style={{ color: cn.textSecondary }}>
            1 BDT = 10 CarePoints · Bonus points on larger packages
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {POINT_PACKAGES.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => setSelectedPkg(pkg.id)}
                className="p-4 rounded-xl border-2 text-left transition-all cn-touch-target"
                style={{
                  borderColor: selectedPkg === pkg.id ? "var(--cn-pink)" : cn.border,
                  background: selectedPkg === pkg.id ? cn.pinkBg : cn.bgCard,
                }}
              >
                <p className="text-xs" style={{ color: cn.textSecondary }}>{pkg.label}</p>
                <p className="text-lg mt-1" style={{ color: cn.text }}>
                  {formatPoints(pkg.points)}
                </p>
                <p className="text-sm" style={{ color: cn.textSecondary }}>
                  {formatBDT(pkg.bdt)}
                </p>
                {pkg.bonus > 0 && (
                  <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[10px]"
                    style={{ background: cn.greenBg, color: cn.green }}>
                    <Sparkles className="w-3 h-3" /> +{formatPoints(pkg.bonus)} bonus
                  </span>
                )}
              </button>
            ))}
          </div>
          {selectedPkg && (
            <div className="mt-4 flex items-center justify-between p-4 rounded-xl" style={{ background: cn.bgInput }}>
              <div>
                <p className="text-sm" style={{ color: cn.text }}>
                  Total: {formatPoints(POINT_PACKAGES.find((p) => p.id === selectedPkg)!.points)}
                </p>
                <p className="text-xs" style={{ color: cn.textSecondary }}>
                  Pay: {formatBDT(POINT_PACKAGES.find((p) => p.id === selectedPkg)!.bdt)} via bKash/Nagad
                </p>
              </div>
              <button className="px-6 py-2.5 rounded-xl text-white text-sm cn-touch-target"
                style={{ background: roleGradient }}
                disabled={buying}
                onClick={async () => {
                  setBuying(true);
                  const success = await buyPoints(selectedPkg!, "bkash");
                  setBuying(false);
                  if (success) {
                    setSelectedPkg(null);
                    setBuyOpen(false);
                  }
                }}>
                {buying ? <Loader2 className="w-4 h-4 animate-spin inline-block mr-1" /> : null}
                Buy Now
              </button>
            </div>
          )}
        </div>
      )}

      {/* Point-to-BDT Conversion Reference */}
      <div className="finance-card p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: cn.amberBg }}>
            <ArrowRightLeft className="w-5 h-5" style={{ color: cn.amber }} />
          </div>
          <div className="flex-1">
            <p className="text-sm" style={{ color: cn.text }}>Conversion Rate</p>
            <p className="text-xs" style={{ color: cn.textSecondary }}>
              10 CarePoints = ৳ 1 · Your balance = {formatBDT(pointsToBDT(wallet.balance))}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm" style={{ color: cn.text }}>Fee Rate</p>
            <p className="text-xs" style={{ color: cn.pink }}>{wallet.feePercent}% per transaction</p>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="finance-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
          <h2 style={{ color: cn.text }}>Transaction History</h2>
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: cn.bgInput }}>
            {(["all", "credits", "debits", "fees"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="px-3 py-1.5 rounded-lg text-xs transition-all cn-touch-target"
                style={{
                  background: tab === t ? cn.bgCard : "transparent",
                  color: tab === t ? cn.text : cn.textSecondary,
                  boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                }}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          {filteredTx.length === 0 && (
            <p className="text-center py-8 text-sm" style={{ color: cn.textSecondary }}>
              No transactions in this category
            </p>
          )}
          {filteredTx.map((t) => {
            const iconInfo = TX_ICON_MAP[t.type] || TX_ICON_MAP.transfer;
            const Icon = iconInfo.icon;
            const isCredit = t.amount > 0;
            return (
              <div key={t.id}
                className="flex items-center justify-between py-3 border-b last:border-0"
                style={{ borderColor: cn.borderLight }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: iconInfo.bg }}>
                    <Icon className="w-4 h-4" style={{ color: iconInfo.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm truncate" style={{ color: cn.text }}>{t.description}</p>
                    <div className="flex items-center gap-2 text-xs" style={{ color: cn.textSecondary }}>
                      <span>{new Date(t.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                      {t.counterparty && <span>· {t.counterparty}</span>}
                      {t.contractId && (
                        <Link to={`/contracts/${t.contractId}`} className="hover:underline" style={{ color: cn.pink }}>
                          {t.contractId}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-sm" style={{ color: isCredit ? "#5FB865" : cn.text }}>
                    {isCredit ? "+" : ""}{formatPoints(t.amount)}
                  </p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px]"
                    style={{
                      background: t.status === "completed" ? "#7CE57720" : t.status === "pending" ? "#FFB54D20" : "#EF444420",
                      color: t.status === "completed" ? "#5FB865" : t.status === "pending" ? "#E8A838" : "#EF4444",
                    }}>
                    {t.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link to={`/contracts?role=${role}`}
          className="finance-card p-4 flex items-center gap-3 hover:shadow-md transition-shadow no-underline cn-touch-target">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: cn.pinkBg }}>
            <CreditCard className="w-5 h-5" style={{ color: cn.pink }} />
          </div>
          <div className="flex-1">
            <p className="text-sm" style={{ color: cn.text }}>Contracts</p>
            <p className="text-xs" style={{ color: cn.textSecondary }}>View & negotiate</p>
          </div>
          <ChevronRight className="w-4 h-4" style={{ color: cn.textSecondary }} />
        </Link>
        <div className="finance-card p-4 flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow cn-touch-target">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: cn.greenBg }}>
            <Download className="w-5 h-5" style={{ color: cn.green }} />
          </div>
          <div className="flex-1">
            <p className="text-sm" style={{ color: cn.text }}>Export Statement</p>
            <p className="text-xs" style={{ color: cn.textSecondary }}>PDF / CSV</p>
          </div>
          <ChevronRight className="w-4 h-4" style={{ color: cn.textSecondary }} />
        </div>
        <div className="finance-card p-4 flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow cn-touch-target">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: cn.purpleBg }}>
            <Shield className="w-5 h-5" style={{ color: cn.purple }} />
          </div>
          <div className="flex-1">
            <p className="text-sm" style={{ color: cn.text }}>Fee Details</p>
            <p className="text-xs" style={{ color: cn.textSecondary }}>{wallet.feePercent}% platform fee</p>
          </div>
          <ChevronRight className="w-4 h-4" style={{ color: cn.textSecondary }} />
        </div>
      </div>
    </div>
  );
}
