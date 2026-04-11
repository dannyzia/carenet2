import { useState, useMemo } from "react";
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
import { useAsyncData } from "@/frontend/hooks";
import { marketplaceService, type UccfContractListRow } from "@/backend/services/marketplace.service";
import { USE_SUPABASE } from "@/backend/services/supabase";

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
  const { t: tDocTitle, t } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.contractList", "Contract List"));

  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") || "all";
  const [filter, setFilter] = useState<"all" | ContractStatus>("all");
  const [sourceTab, setSourceTab] = useState<"uccf" | "legacy">("uccf");
  const [uccfPartyTab, setUccfPartyTab] = useState<"all" | "guardian_agency" | "caregiver_agency">("all");
  const { user } = useAuth();

  const { data: uccfRows, loading: uccfLoading, error: uccfError, refetch: refetchUccf } = useAsyncData(
    () => marketplaceService.listMyUccfContractsBookedPlus(),
    [],
  );

  const uccfFiltered = useMemo(() => {
    const rows = uccfRows ?? [];
    if (uccfPartyTab === "all") return rows;
    return rows.filter((r) => r.contract_party_scope === uccfPartyTab);
  }, [uccfRows, uccfPartyTab]);

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
            {sourceTab === "legacy"
              ? `${contracts.length} legacy agreements`
              : `${uccfFiltered.length} care marketplace contracts (booked+)`}
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

      {USE_SUPABASE ? (
        <div className="flex gap-2 border-b border-[color-mix(in_srgb,var(--cn-text)_12%,transparent)] pb-2">
          <button
            type="button"
            onClick={() => setSourceTab("uccf")}
            className="px-4 py-2 rounded-t-lg text-sm font-medium cn-touch-target"
            style={{
              background: sourceTab === "uccf" ? cn.bgInput : "transparent",
              color: sourceTab === "uccf" ? cn.text : cn.textSecondary,
            }}
          >
            {t("contracts.uccfMarketContracts")}
          </button>
          <button
            type="button"
            onClick={() => setSourceTab("legacy")}
            className="px-4 py-2 rounded-t-lg text-sm font-medium cn-touch-target"
            style={{
              background: sourceTab === "legacy" ? cn.bgInput : "transparent",
              color: sourceTab === "legacy" ? cn.text : cn.textSecondary,
            }}
          >
            {t("contracts.legacyAgreements")}
          </button>
        </div>
      ) : null}

      {USE_SUPABASE && sourceTab === "uccf" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(["all", "guardian_agency", "caregiver_agency"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setUccfPartyTab(tab)}
                className="px-3 py-1.5 rounded-full text-xs cn-touch-target"
                style={{
                  background: uccfPartyTab === tab ? cn.text : cn.bgInput,
                  color: uccfPartyTab === tab ? "white" : cn.textSecondary,
                }}
              >
                {tab === "all"
                  ? t("contracts.uccfTabAll")
                  : tab === "guardian_agency"
                    ? t("contracts.uccfTabGuardianAgency")
                    : t("contracts.uccfTabCaregiverAgency")}
              </button>
            ))}
          </div>
          {uccfLoading && (uccfRows?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mb-3" style={{ color: cn.pink }} />
            </div>
          ) : null}
          {uccfError ? (
            <div className="finance-card p-6 text-center">
              <p className="text-sm" style={{ color: cn.text }}>{String(uccfError)}</p>
              <button
                type="button"
                onClick={() => void refetchUccf()}
                className="mt-3 px-4 py-2 rounded-xl text-sm text-white cn-touch-target"
                style={{ background: "var(--cn-gradient-guardian)" }}
              >
                Retry
              </button>
            </div>
          ) : null}
          {!uccfLoading && !uccfError && uccfFiltered.length === 0 ? (
            <div className="finance-card p-8 text-center">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: cn.textSecondary }} />
              <p style={{ color: cn.textSecondary }}>{t("contracts.noUccfContracts")}</p>
            </div>
          ) : null}
          <div className="space-y-3">
            {uccfFiltered.map((row) => (
              <UccfContractRow key={row.id} row={row} role={role} />
            ))}
          </div>
        </div>
      ) : null}

      {(!USE_SUPABASE || sourceTab === "legacy") ? (
        <>
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
        </>
      ) : null}
    </div>
  );
}

function UccfContractRow({ row, role }: { row: UccfContractListRow; role: string }) {
  const { t } = useTranslation("common");
  const origin =
    row.source_type === "package_client_engagement"
      ? t("contracts.originPackage")
      : row.source_type === "package_caregiver_engagement"
        ? t("contracts.originCaregiverPackage")
        : row.source_type === "care_contract_bid"
          ? t("contracts.originRequirement")
          : t("contracts.originOther");
  const party =
    row.contract_party_scope === "guardian_agency"
      ? t("contracts.uccfTabGuardianAgency")
      : row.contract_party_scope === "caregiver_agency"
        ? t("contracts.uccfTabCaregiverAgency")
        : "—";
  const hub =
    role === "agency"
      ? "/agency/care-packages"
      : role === "caregiver"
        ? "/caregiver/marketplace-hub"
        : "/guardian/marketplace-hub";

  return (
    <Link to={hub} className="block no-underline">
      <div className="finance-card p-4 hover:shadow-md transition-shadow">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium" style={{ color: cn.text }}>{row.title}</p>
            <p className="text-xs mt-0.5" style={{ color: cn.textSecondary }}>{row.id}</p>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full border" style={{ color: cn.textSecondary, borderColor: cn.borderLight }}>
            {row.status}
          </span>
        </div>
        <div className="flex flex-wrap gap-2 mt-3 text-xs">
          <span className="px-2 py-0.5 rounded-md" style={{ background: cn.bgInput, color: cn.text }}>{origin}</span>
          <span className="px-2 py-0.5 rounded-md" style={{ background: cn.bgInput, color: cn.text }}>{party}</span>
          {row.financial_status ? (
            <span className="px-2 py-0.5 rounded-md" style={{ background: cn.amberBg, color: cn.amber }}>
              {t("contracts.uccfFinancial", { status: row.financial_status })}
            </span>
          ) : null}
        </div>
        <p className="text-xs mt-2" style={{ color: cn.textSecondary }}>Updated {row.updated_at}</p>
      </div>
    </Link>
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
