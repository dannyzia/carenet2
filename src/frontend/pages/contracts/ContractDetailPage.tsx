import { useState } from "react";
import { Link, useParams } from "react-router";
import {
  FileText, MessageSquare, Handshake, CheckCircle, Stethoscope,
  XCircle, AlertCircle, AlertTriangle, Users, Building2, ArrowRight,
  ArrowLeft, Loader2, Coins, Shield, Send, ChevronUp, ChevronDown,
} from "lucide-react";
import { cn } from "@/frontend/theme/tokens";
import { useContractDetail } from "@/frontend/hooks/useContracts";
import { RealtimeStatusIndicator } from "@/frontend/components/shared/RealtimeStatusIndicator";
import { SubscriptionHealthBadge } from "@/frontend/components/shared/SubscriptionHealthBadge";
import { useChannelHealthToast } from "@/frontend/hooks/useChannelHealthToast";
import type { NegotiationOffer } from "@/backend/utils/contracts";
import { formatPoints, pointsToBDT, DEFAULT_PLATFORM_FEE_PERCENT } from "@/backend/utils/points";
import { formatBDT } from "@/backend/utils/currency";
import { useTranslation } from "react-i18next";
import { useDocumentTitle } from "@/frontend/hooks";
import { monetizationChannelName } from "@/backend/services/realtime";
import { useAuth } from "@/frontend/auth/AuthContext";

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  draft: { color: "#848484", bg: "#84848420" },
  offered: { color: "#3B82F6", bg: "#3B82F620" },
  negotiating: { color: "#E8A838", bg: "#FFB54D20" },
  accepted: { color: "#5FB865", bg: "#7CE57720" },
  active: { color: "#00897B", bg: "#26C6DA20" },
  completed: { color: "#7B5EA7", bg: "#8082ED20" },
  cancelled: { color: "#EF4444", bg: "#EF444420" },
  disputed: { color: "#EF4444", bg: "#EF444420" },
};

const OFFER_STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  pending: { color: "#E8A838", bg: "#FFB54D20" },
  accepted: { color: "#5FB865", bg: "#7CE57720" },
  rejected: { color: "#EF4444", bg: "#EF444420" },
  countered: { color: "#3B82F6", bg: "#3B82F620" },
  expired: { color: "#848484", bg: "#84848420" },
  withdrawn: { color: "#848484", bg: "#84848420" },
};

export default function ContractDetailPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.contractDetail", "Contract Detail"));

  const { id } = useParams();
  const { user } = useAuth();
  const { contract, loading, error, refetch, submitOffer: submitOfferAction, acceptOffer: acceptOfferAction, rejectOffer: rejectOfferAction } = useContractDetail(id);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerRate, setOfferRate] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [showNegotiationHistory, setShowNegotiationHistory] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const contractRole = contract?.partyA?.role ?? "guardian";
  const fallbackUserId = contractRole === "agency" ? "agency-1" : contractRole === "caregiver" ? "caregiver-1" : "guardian-1";
  const contractChannelId = monetizationChannelName(user?.id || fallbackUserId);

  // Fire toasts on channel health degradation for this contract's feed
  useChannelHealthToast(contractChannelId, { channelLabel: `Contract ${id}` });

  // Loading state
  if (loading && !contract) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin mb-3" style={{ color: cn.pink }} />
        <p className="text-sm" style={{ color: cn.textSecondary }}>Loading contract...</p>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <FileText className="w-16 h-16 mb-4 opacity-30" style={{ color: cn.textSecondary }} />
        <h2 style={{ color: cn.text }}>Contract Not Found</h2>
        <p className="text-sm mt-1" style={{ color: cn.textSecondary }}>ID: {id}</p>
        {error && <p className="text-xs mt-1" style={{ color: cn.amber }}>{error}</p>}
        <Link to="/contracts" className="mt-4 text-sm hover:underline" style={{ color: cn.pink }}>
          ← Back to Contracts
        </Link>
      </div>
    );
  }

  const statusCfg = STATUS_COLORS[contract.status];
  const canNegotiate = ["offered", "negotiating"].includes(contract.status);
  const lastOffer = contract.offers[contract.offers.length - 1];

  const handleSubmitOffer = async () => {
    if (!offerRate || parseInt(offerRate) <= 0) return;
    setSubmitting(true);
    const success = await submitOfferAction(
      parseInt(offerRate),
      contract.durationDays,
      offerMessage
    );
    setSubmitting(false);
    if (success) {
      setShowOfferForm(false);
      setOfferRate("");
      setOfferMessage("");
    }
  };

  const handleAcceptOffer = async (offerId: string) => {
    setSubmitting(true);
    await acceptOfferAction(offerId);
    setSubmitting(false);
  };

  const handleRejectOffer = async (offerId: string) => {
    setSubmitting(true);
    await rejectOfferAction(offerId);
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Link to="/contracts" className="inline-flex items-center gap-1 text-sm hover:underline no-underline"
        style={{ color: cn.textSecondary }}>
        <ArrowLeft className="w-4 h-4" /> Back to Contracts
      </Link>

      {/* Contract Header */}
      <div className="finance-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl" style={{ color: cn.text }}>
                {contract.id}
                <RealtimeStatusIndicator variant="dot" className="inline-block ml-2 align-middle" />
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs"
                style={{ background: statusCfg.bg, color: statusCfg.color }}>
                {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm" style={{ color: cn.textSecondary }}>
              <span>{contract.type === "guardian_agency" ? "Guardian ↔ Agency" : "Agency ↔ Caregiver"} · {contract.serviceType}</span>
              <SubscriptionHealthBadge
                channelId={contractChannelId}
                compact={false}
                showThreshold
              />
            </div>
          </div>
          {canNegotiate && (
            <div className="flex gap-2">
              <button onClick={() => setShowOfferForm(!showOfferForm)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm cn-touch-target"
                style={{ background: "var(--cn-gradient-guardian)" }}>
                <MessageSquare className="w-4 h-4" />
                {showOfferForm ? "Cancel" : "Make Offer"}
              </button>
              {lastOffer?.status === "pending" && (
                <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm cn-touch-target"
                  style={{ background: "#5FB865" }}>
                  <CheckCircle className="w-4 h-4" /> Accept
                </button>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-sm mb-4" style={{ color: cn.textSecondary }}>{contract.description}</p>

        {/* Parties */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="p-4 rounded-xl" style={{ background: cn.bgInput }}>
            <p className="text-xs mb-2" style={{ color: cn.textSecondary }}>
              {contract.partyA.role === "guardian" ? "Guardian" : "Agency"}
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm"
                style={{ background: contract.partyA.role === "guardian" ? cn.green : cn.teal }}>
                {contract.partyA.role === "guardian" ? <Users className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-sm" style={{ color: cn.text }}>{contract.partyA.name}</p>
                <p className="text-xs" style={{ color: cn.textSecondary }}>
                  Fee: {contract.partyAFeePercent}%
                  {contract.partyAFee > 0 && ` (${formatPoints(contract.partyAFee)})`}
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl" style={{ background: cn.bgInput }}>
            <p className="text-xs mb-2" style={{ color: cn.textSecondary }}>
              {contract.partyB.role === "agency" ? "Agency" : "Caregiver"}
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm"
                style={{ background: contract.partyB.role === "agency" ? cn.teal : cn.pink }}>
                {contract.partyB.role === "agency" ? <Building2 className="w-5 h-5" /> : <Stethoscope className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-sm" style={{ color: cn.text }}>{contract.partyB.name}</p>
                <p className="text-xs" style={{ color: cn.textSecondary }}>
                  Fee: {contract.partyBFeePercent}%
                  {contract.partyBFee > 0 && ` (${formatPoints(contract.partyBFee)})`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {contract.patientName && (
          <div className="flex items-center gap-2 p-3 rounded-xl mb-4" style={{ background: cn.blueBg }}>
            <Users className="w-4 h-4" style={{ color: cn.blue }} />
            <p className="text-sm" style={{ color: cn.text }}>
              Patient: <span>{contract.patientName}</span>
            </p>
          </div>
        )}
      </div>

      {/* Financial Summary */}
      <div className="finance-card p-5">
        <h2 className="mb-4 flex items-center gap-2" style={{ color: cn.text }}>
          <Coins className="w-5 h-5" style={{ color: cn.amber }} />
          Financial Terms
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-xs" style={{ color: cn.textSecondary }}>Listed Rate</p>
            <p className="text-sm" style={{ color: cn.text }}>{formatPoints(contract.listedPrice)}/day</p>
            <p className="text-xs" style={{ color: cn.textSecondary }}>≈ {formatBDT(pointsToBDT(contract.listedPrice))}</p>
          </div>
          <div>
            <p className="text-xs" style={{ color: cn.textSecondary }}>Agreed Rate</p>
            <p className="text-sm" style={{ color: contract.agreedPrice > 0 ? cn.green : cn.amber }}>
              {contract.agreedPrice > 0 ? formatPoints(contract.agreedPrice) : "Pending"}/day
            </p>
            {contract.agreedPrice > 0 && contract.agreedPrice < contract.listedPrice && (
              <p className="text-xs" style={{ color: cn.green }}>
                {Math.round((1 - contract.agreedPrice / contract.listedPrice) * 100)}% below listed
              </p>
            )}
          </div>
          <div>
            <p className="text-xs" style={{ color: cn.textSecondary }}>Duration</p>
            <p className="text-sm" style={{ color: cn.text }}>{contract.durationDays} days</p>
            <p className="text-xs" style={{ color: cn.textSecondary }}>{contract.startDate} → {contract.endDate}</p>
          </div>
          <div>
            <p className="text-xs" style={{ color: cn.textSecondary }}>Total Value</p>
            <p className="text-sm" style={{ color: cn.text }}>
              {contract.totalValue > 0 ? formatPoints(contract.totalValue) : "TBD"}
            </p>
            {contract.totalValue > 0 && (
              <p className="text-xs" style={{ color: cn.textSecondary }}>
                ≈ {formatBDT(pointsToBDT(contract.totalValue))}
              </p>
            )}
          </div>
        </div>

        {/* Fee Breakdown */}
        {contract.platformRevenue > 0 && (
          <div className="p-4 rounded-xl" style={{ background: cn.purpleBg }}>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4" style={{ color: cn.purple }} />
              <p className="text-sm" style={{ color: cn.purple }}>Platform Fee Breakdown</p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <p style={{ color: cn.textSecondary }}>
                  {contract.partyA.name} ({contract.partyAFeePercent}%)
                </p>
                <p style={{ color: cn.text }}>{formatPoints(contract.partyAFee)}</p>
              </div>
              <div>
                <p style={{ color: cn.textSecondary }}>
                  {contract.partyB.name} ({contract.partyBFeePercent}%)
                </p>
                <p style={{ color: cn.text }}>{formatPoints(contract.partyBFee)}</p>
              </div>
              <div>
                <p style={{ color: cn.textSecondary }}>Total Platform Revenue</p>
                <p style={{ color: cn.purple }}>{formatPoints(contract.platformRevenue)}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Make Offer Form */}
      {showOfferForm && (
        <div className="finance-card p-5">
          <h2 className="mb-4 flex items-center gap-2" style={{ color: cn.text }}>
            <Send className="w-5 h-5" style={{ color: cn.green }} />
            Make an Offer
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: cn.textSecondary }}>
                Daily Rate (CarePoints)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={offerRate}
                  onChange={(e) => setOfferRate(e.target.value)}
                  placeholder={`Listed: ${contract.listedPrice} CP/day`}
                  className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: cn.border, background: cn.bgInput, color: cn.text }}
                />
                {offerRate && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: cn.textSecondary }}>
                    = {formatBDT(pointsToBDT(parseInt(offerRate) * contract.durationDays))} total
                  </div>
                )}
              </div>
              {offerRate && parseInt(offerRate) > 0 && (
                <div className="mt-2 p-3 rounded-lg text-xs" style={{ background: cn.bgInput }}>
                  <div className="flex justify-between">
                    <span style={{ color: cn.textSecondary }}>
                      {formatPoints(parseInt(offerRate))}/day × {contract.durationDays} days
                    </span>
                    <span style={{ color: cn.text }}>
                      {formatPoints(parseInt(offerRate) * contract.durationDays)}
                    </span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span style={{ color: cn.textSecondary }}>
                      Platform fee ({DEFAULT_PLATFORM_FEE_PERCENT}%)
                    </span>
                    <span style={{ color: cn.purple }}>
                      -{formatPoints(Math.round(parseInt(offerRate) * contract.durationDays * DEFAULT_PLATFORM_FEE_PERCENT / 100))}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: cn.textSecondary }}>
                Message (optional)
              </label>
              <textarea
                value={offerMessage}
                onChange={(e) => setOfferMessage(e.target.value)}
                rows={3}
                placeholder="Explain your offer..."
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none resize-none"
                style={{ borderColor: cn.border, background: cn.bgInput, color: cn.text }}
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleSubmitOffer}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm cn-touch-target"
                style={{ background: "var(--cn-gradient-guardian)" }}>
                <Send className="w-4 h-4" /> Send Offer
              </button>
              <button onClick={() => setShowOfferForm(false)}
                className="px-4 py-2.5 rounded-xl text-sm cn-touch-target border"
                style={{ borderColor: cn.border, color: cn.textSecondary }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Negotiation History */}
      {contract.offers.length > 0 && (
        <div className="finance-card p-5">
          <button
            onClick={() => setShowNegotiationHistory(!showNegotiationHistory)}
            className="w-full flex items-center justify-between mb-4 cn-touch-target"
          >
            <h2 className="flex items-center gap-2" style={{ color: cn.text }}>
              <Handshake className="w-5 h-5" style={{ color: cn.amber }} />
              Negotiation History ({contract.offers.length} offers)
            </h2>
            {showNegotiationHistory
              ? <ChevronUp className="w-5 h-5" style={{ color: cn.textSecondary }} />
              : <ChevronDown className="w-5 h-5" style={{ color: cn.textSecondary }} />
            }
          </button>

          {showNegotiationHistory && (
            <div className="space-y-4">
              {contract.offers.map((offer, idx) => (
                <OfferCard key={offer.id} offer={offer} isLast={idx === contract.offers.length - 1} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons (for pending offers) */}
      {lastOffer?.status === "pending" && (
        <div className="finance-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5" style={{ color: cn.amber }} />
            <p className="text-sm" style={{ color: cn.text }}>Action Required</p>
          </div>
          <p className="text-xs mb-4" style={{ color: cn.textSecondary }}>
            {lastOffer.offeredByName} has offered {formatPoints(lastOffer.pointsPerDay)}/day for {lastOffer.durationDays} days
            (total: {formatPoints(lastOffer.totalPoints)})
          </p>
          <div className="flex flex-wrap gap-2">
            <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm cn-touch-target"
              style={{ background: "#5FB865" }}
              onClick={() => handleAcceptOffer(lastOffer.id)}>
              <CheckCircle className="w-4 h-4" /> Accept Offer
            </button>
            <button onClick={() => setShowOfferForm(true)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm cn-touch-target"
              style={{ background: "var(--cn-gradient-guardian)" }}>
              <MessageSquare className="w-4 h-4" /> Counter Offer
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm cn-touch-target border"
              style={{ borderColor: "#EF4444", color: "#EF4444" }}
              onClick={() => handleRejectOffer(lastOffer.id)}>
              <XCircle className="w-4 h-4" /> Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function OfferCard({ offer, isLast }: { offer: NegotiationOffer; isLast: boolean }) {
  const statusCfg = OFFER_STATUS_COLORS[offer.status];
  const roleColor = offer.offeredByRole === "guardian" ? cn.green
    : offer.offeredByRole === "agency" ? cn.teal
    : cn.pink;

  return (
    <div className="relative pl-6">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-[11px] top-8 bottom-0 w-0.5" style={{ background: cn.borderLight }} />
      )}
      {/* Timeline dot */}
      <div className="absolute left-0 top-2 w-6 h-6 rounded-full flex items-center justify-center"
        style={{ background: statusCfg.bg }}>
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: statusCfg.color }} />
      </div>

      <div className="p-4 rounded-xl" style={{ background: cn.bgInput }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px]"
              style={{ background: roleColor }}>
              {offer.offeredByName.charAt(0)}
            </div>
            <p className="text-sm" style={{ color: cn.text }}>{offer.offeredByName}</p>
            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: cn.bgCard, color: cn.textSecondary }}>
              {offer.offeredByRole}
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px]"
            style={{ background: statusCfg.bg, color: statusCfg.color }}>
            {offer.status}
          </span>
        </div>

        <div className="flex items-center gap-4 mb-2">
          <div>
            <p className="text-xs" style={{ color: cn.textSecondary }}>Rate</p>
            <p className="text-sm" style={{ color: cn.text }}>{formatPoints(offer.pointsPerDay)}/day</p>
          </div>
          <ArrowRight className="w-3 h-3" style={{ color: cn.textSecondary }} />
          <div>
            <p className="text-xs" style={{ color: cn.textSecondary }}>Total</p>
            <p className="text-sm" style={{ color: cn.text }}>{formatPoints(offer.totalPoints)}</p>
          </div>
          <div>
            <p className="text-xs" style={{ color: cn.textSecondary }}>Days</p>
            <p className="text-sm" style={{ color: cn.text }}>{offer.durationDays}</p>
          </div>
        </div>

        <p className="text-xs" style={{ color: cn.textSecondary }}>{offer.message}</p>

        {offer.responseMessage && (
          <div className="mt-2 p-2.5 rounded-lg border-l-2" style={{ background: cn.bgCard, borderColor: statusCfg.color }}>
            <p className="text-xs italic" style={{ color: cn.textSecondary }}>
              Response: {offer.responseMessage}
            </p>
          </div>
        )}

        <p className="text-xs mt-2" style={{ color: cn.textSecondary }}>
          {new Date(offer.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}
