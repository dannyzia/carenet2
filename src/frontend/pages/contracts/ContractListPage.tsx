import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  Clock, FileText, MessageSquare, Handshake, CheckCircle, Stethoscope,
  XCircle, AlertCircle, Filter, Users, Building2, ArrowRight, Loader2,
} from "lucide-react";
import { cn } from "@/frontend/theme/tokens";
import { useContracts } from "@/frontend/hooks/useContracts";
import { RealtimeStatusIndicator } from "@/frontend/components/shared/RealtimeStatusIndicator";
import { SubscriptionHealthBadge } from "@/frontend/components/shared/SubscriptionHealthBadge";
import { useChannelHealthToast } from "@/frontend/hooks/useChannelHealthToast";
import type { CareContract, ContractStatus } from "@/backend/utils/contracts";
import { formatPoints, formatBDT, pointsToBDT } from "@/backend/utils/points";
import { formatBDT as formatBDTCurrency } from "@/backend/utils/currency";
import { useTranslation } from "react-i18next";
import { useDocumentTitle } from "@/frontend/hooks";
import { monetizationChannelName } from "@/backend/services/realtime";
import { useAuth } from "@/frontend/auth/AuthContext";

const STATUS_CONFIG: Record<ContractStatus, { color: string; bg: string; icon: typeof Clock; label: string }> = {
  draft: { color: "#848484", bg: "#84848420", icon: FileText, label: "Draft" },
  offered: { color: "#3B82F6", bg: "#3B82F620", icon: MessageSquare, label: "Offered" },
  negotiating: { color: "#E8A838", bg: "#FFB54D20", icon: Handshake, label: "Negotiating" },
  accepted: { color: "#5FB865", bg: "#7CE57720", icon: CheckCircle, label: "Accepted" },
  active: { color: "#00897B", bg: "#26C6DA20", icon: Stethoscope, label: "Active" },
  completed: { color: "#7B5EA7", bg: "#8082ED20", icon: CheckCircle, label: "Completed" },
  cancelled: { color: "#EF4444", bg: "#EF444420", icon: XCircle, label: "Cancelled" },
  disputed: { color: "#EF4444", bg: "#EF444420", icon: AlertCircle, label: "Disputed" },
};

export default function ContractListPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.contractList", "Contract List"));

  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") || "all";
  const [filter, setFilter] = useState<"all" | ContractStatus>("all");
  const { user } = useAuth();

  // Derive the channel name to match what useContracts subscribes to
  const fallbackUserId = role === "guardian" ? "guardian-1" : role === "agency" ? "agency-1" : "caregiver-1";
  const userId = user?.id || fallbackUserId;
  const channelId = monetizationChannelName(userId);

  // Fire toasts on channel health degradation
  useChannelHealthToast(channelId, { channelLabel: "Contract feed" });

  // Service-layer backed data with real-time updates
  const { contracts: allContracts, loading, error, refetch } = useContracts(role);

  // Loading state
  if (loading && allContracts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin mb-3" style={{ color: cn.pink }} />
        <p className="text-sm" style={{ color: cn.textSecondary }}>Loading contracts...</p>
      </div>
    );
  }

  // Error state
  if (error && allContracts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="w-12 h-12 mb-3" style={{ color: cn.amber }} />
        <p className="text-sm" style={{ color: cn.text }}>Failed to load contracts</p>
        <p className="text-xs mt-1" style={{ color: cn.textSecondary }}>{error}</p>
        <button onClick={refetch} className="mt-4 px-4 py-2 rounded-xl text-sm text-white"
          style={{ background: "var(--cn-gradient-guardian)" }}>
          Retry
        </button>
      </div>
    );
  }

  const contracts = allContracts;
  const filtered = filter === "all" ? contracts : contracts.filter((c) => c.status === filter);

  const statusCounts = contracts.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl" style={{ color: cn.text }}>
            <Handshake className="w-6 h-6 inline-block mr-2 -mt-1" />
            Contracts
            <RealtimeStatusIndicator variant="dot" className="inline-block ml-2 align-middle" />
          </h1>
          <p className="text-sm" style={{ color: cn.textSecondary }}>
            {contracts.length} total contracts · Offer, negotiate, and manage service agreements
          </p>
        </div>
        {role === "guardian" && (
          <Link to="/guardian/care-requirement-wizard"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm cn-touch-target no-underline"
            style={{ background: "var(--cn-gradient-guardian)" }}>
            <FileText className="w-4 h-4" /> New Requirement
          </Link>
        )}
      </div>

      {/* Status Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        <button
          onClick={() => setFilter("all")}
          className="px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all cn-touch-target"
          style={{
            background: filter === "all" ? cn.text : cn.bgInput,
            color: filter === "all" ? "white" : cn.textSecondary,
          }}
        >
          <Filter className="w-3 h-3 inline-block mr-1" /> All ({contracts.length})
        </button>
        {(["negotiating", "offered", "active", "completed", "cancelled"] as ContractStatus[]).map((s) => {
          const cfg = STATUS_CONFIG[s];
          const count = statusCounts[s] || 0;
          if (count === 0 && s !== "active") return null;
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className="px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all cn-touch-target"
              style={{
                background: filter === s ? cfg.color : cfg.bg,
                color: filter === s ? "white" : cfg.color,
              }}
            >
              {cfg.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Contract Cards */}
      <div className="space-y-4">
        {filtered.length === 0 && (
          <div className="finance-card p-8 text-center">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: cn.textSecondary }} />
            <p style={{ color: cn.textSecondary }}>No contracts found</p>
          </div>
        )}
        {filtered.map((contract) => (
          <ContractCard key={contract.id} contract={contract} currentUserId={userId} />
        ))}
      </div>
    </div>
  );
}

function ContractCard({ contract, currentUserId }: { contract: CareContract; currentUserId: string }) {
  const status = STATUS_CONFIG[contract.status];
  const StatusIcon = status.icon;
  const isNegotiating = contract.status === "negotiating" || contract.status === "offered";
  const lastOffer = contract.offers[contract.offers.length - 1];

  return (
    <Link to={`/contracts/${contract.id}`} className="block no-underline">
      <div className="finance-card p-5 hover:shadow-md transition-shadow">
        {/* Top row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: status.bg }}>
              <StatusIcon className="w-5 h-5" style={{ color: status.color }} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm" style={{ color: cn.text }}>{contract.id}</p>
                <SubscriptionHealthBadge
                  channelId={monetizationChannelName(currentUserId)}
                  compact
                  className="ml-0.5"
                />
              </div>
              <p className="text-xs" style={{ color: cn.textSecondary }}>{contract.serviceType}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs"
            style={{ background: status.bg, color: status.color }}>
            <StatusIcon className="w-3 h-3" /> {status.label}
          </span>
        </div>

        {/* Parties */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs"
            style={{ background: cn.bgInput, color: cn.text }}>
            {contract.partyA.role === "guardian" ? <Users className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
            {contract.partyA.name}
          </div>
          <ArrowRight className="w-3 h-3" style={{ color: cn.textSecondary }} />
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs"
            style={{ background: cn.bgInput, color: cn.text }}>
            {contract.partyB.role === "agency" ? <Building2 className="w-3 h-3" /> : <Stethoscope className="w-3 h-3" />}
            {contract.partyB.name}
          </div>
        </div>

        {contract.patientName && (
          <p className="text-xs mb-2" style={{ color: cn.textSecondary }}>
            Patient: <span style={{ color: cn.text }}>{contract.patientName}</span>
          </p>
        )}

        {/* Pricing */}
        <div className="flex items-center justify-between p-3 rounded-xl mb-3" style={{ background: cn.bgInput }}>
          <div>
            <p className="text-xs" style={{ color: cn.textSecondary }}>
              {contract.agreedPrice > 0 ? "Agreed Rate" : "Listed Rate"}
            </p>
            <p className="text-sm" style={{ color: cn.text }}>
              {formatPoints(contract.agreedPrice > 0 ? contract.agreedPrice : contract.listedPrice)}/day
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs" style={{ color: cn.textSecondary }}>{contract.durationDays} days</p>
            <p className="text-sm" style={{ color: cn.text }}>
              {contract.totalValue > 0
                ? formatPoints(contract.totalValue)
                : formatPoints(contract.listedPrice * contract.durationDays)
              } total
            </p>
          </div>
          {contract.agreedPrice > 0 && contract.agreedPrice < contract.listedPrice && (
            <span className="px-2 py-0.5 rounded-full text-[10px]" style={{ background: cn.greenBg, color: cn.green }}>
              {Math.round((1 - contract.agreedPrice / contract.listedPrice) * 100)}% saved
            </span>
          )}
        </div>

        {/* Negotiation indicator */}
        {isNegotiating && lastOffer && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg" style={{ background: "#FFB54D10" }}>
            <MessageSquare className="w-4 h-4" style={{ color: cn.amber }} />
            <div className="flex-1 min-w-0">
              <p className="text-xs" style={{ color: cn.amber }}>
                {lastOffer.status === "pending" ? "Awaiting response" : "Counter-offer received"}
              </p>
              <p className="text-xs truncate" style={{ color: cn.textSecondary }}>
                {lastOffer.offeredByName}: {formatPoints(lastOffer.pointsPerDay)}/day
              </p>
            </div>
          </div>
        )}

        {/* Dates */}
        <div className="flex items-center justify-between mt-3 text-xs" style={{ color: cn.textSecondary }}>
          <span>{contract.startDate} → {contract.endDate}</span>
          {contract.platformRevenue > 0 && (
            <span>Platform fee: {formatPoints(contract.platformRevenue)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
