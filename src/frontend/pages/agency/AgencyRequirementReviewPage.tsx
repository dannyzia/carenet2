import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router";
import { cn } from "@/frontend/theme/tokens";
import {
  ChevronLeft,
  Send,
  Star,
  CheckCircle2,
  AlertCircle,
  MapPin,
} from "lucide-react";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { agencyService } from "@/backend/services/agency.service";
import { marketplaceService } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/frontend/auth/AuthContext";
import { useAriaToast } from "@/frontend/hooks/useAriaToast";
import type { UCCFPricingRequest, StaffLevel } from "@/backend/models";

const levelLabels: Record<StaffLevel, string> = {
  L1: "Caregiver",
  L2: "Trained",
  L3: "Nurse",
  L4: "ICU Nurse",
};

export default function AgencyRequirementReviewPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(
    tDocTitle(
      "pageTitles.agencyRequirementReview",
      "Agency Requirement Review",
    ),
  );
  const { t } = useTranslation("common", {
    keyPrefix: "agencyRequirementBoard",
  });
  const toast = useAriaToast();
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: caregiverRoster, loading: loadingRoster } = useAsyncData(() =>
    agencyService.getCaregiverRoster(),
  );
  const { data: request, loading: loadingReq } = useAsyncData(
    () => marketplaceService.getCareRequestById(id || ""),
    [id],
  );

  const [selectedCaregiver, setSelectedCaregiver] = useState<string | null>(
    null,
  );
  const [proposedRate, setProposedRate] = useState("");
  const [coverMessage, setCoverMessage] = useState("");
  const [deviationRemarks, setDeviationRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loadingReq || loadingRoster) return <PageSkeleton cards={3} />;

  if (!request) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center">
        <AlertCircle
          className="w-12 h-12 mx-auto mb-3"
          style={{ color: cn.borderLight }}
          aria-hidden
        />
        <p className="text-sm" style={{ color: cn.textSecondary }}>
          Requirement not found or no longer available.
        </p>
        <Link
          to="/agency/requirements-inbox"
          className="text-sm mt-3 inline-block"
          style={{ color: cn.teal }}
        >
          Back to Requirements Inbox
        </Link>
      </div>
    );
  }

  const pricing = request.pricing as UCCFPricingRequest;
  const isClosed = !["published", "bidding"].includes(request.status);
  const pricingPeriod =
    pricing.preferred_model === "daily"
      ? "day"
      : pricing.preferred_model === "hourly"
        ? "hour"
        : "mo";

  const handleSendProposal = async () => {
    if (!proposedRate) {
      toast.error(t("bidPriceRequired"));
      return;
    }
    if (!user?.id) {
      toast.error("Not authenticated.");
      return;
    }
    setSubmitting(true);
    try {
      await marketplaceService.submitBid({
        contract_id: request.id,
        agency_id: user.id,
        agency_name: user.name || "Agency",
        proposed_pricing: {
          base_price: Number(proposedRate),
          pricing_model: pricing.preferred_model || "monthly",
        },
        proposed_staffing: request.staffing,
        proposed_schedule: request.schedule,
        message: coverMessage || undefined,
        remarks: deviationRemarks || undefined,
      });
      toast.success(t("bidSubmitted"));
      navigate("/agency/bid-management");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to submit proposal.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = () => {
    navigate("/agency/requirements-inbox");
  };

  return (
    <>
      <div className="max-w-3xl mx-auto space-y-6 pb-20">
        <Link
          to="/agency/requirements-inbox"
          className="inline-flex items-center gap-1 text-sm"
          style={{ color: cn.textSecondary }}
        >
          <ChevronLeft className="w-4 h-4" /> Back to Inbox
        </Link>

        <div className="flex items-center gap-3">
          <h1 className="text-xl" style={{ color: cn.text }}>
            Review Requirement
          </h1>
          {isClosed && (
            <span
              className="px-2 py-0.5 rounded-full text-xs"
              style={{ background: "rgba(239,68,68,0.12)", color: "#EF4444" }}
            >
              Closed
            </span>
          )}
        </div>

        {/* ── Requirement Details ── */}
        <div className="finance-card p-5 space-y-3">
          <h3 className="text-sm" style={{ color: cn.text }}>
            Requirement Details
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs" style={{ color: cn.textSecondary }}>
                Request ID
              </p>
              <p style={{ color: cn.text }}>{request.id}</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: cn.textSecondary }}>
                Title
              </p>
              <p style={{ color: cn.text }}>{request.meta.title}</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: cn.textSecondary }}>
                Guardian
              </p>
              <p className="flex items-center gap-1" style={{ color: cn.text }}>
                {request.party?.name || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs" style={{ color: cn.textSecondary }}>
                Patient
              </p>
              <p style={{ color: cn.text }}>
                {request.care_subject?.condition_summary || request.meta.title}
                {request.care_subject?.age
                  ? `, ${request.care_subject.age}y`
                  : ""}
              </p>
            </div>
            <div>
              <p className="text-xs" style={{ color: cn.textSecondary }}>
                Care Type
              </p>
              <p style={{ color: cn.text }}>
                {request.meta.category?.join(", ") || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs" style={{ color: cn.textSecondary }}>
                Duration
              </p>
              <p style={{ color: cn.text }}>
                {request.meta.duration_type?.replace(/_/g, " ") || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs" style={{ color: cn.textSecondary }}>
                Shift
              </p>
              <p style={{ color: cn.text }}>
                {request.schedule?.hours_per_day || 8}h/day{" "}
                {request.schedule?.shift_type || ""}
              </p>
            </div>
            <div>
              <p className="text-xs" style={{ color: cn.textSecondary }}>
                Budget
              </p>
              <p style={{ color: cn.green }}>
                ৳{pricing.budget_min?.toLocaleString()} – ৳
                {pricing.budget_max?.toLocaleString()}/{pricingPeriod}
              </p>
            </div>
            <div>
              <p className="text-xs" style={{ color: cn.textSecondary }}>
                Location
              </p>
              <p className="flex items-center gap-1" style={{ color: cn.text }}>
                <MapPin className="w-3 h-3 shrink-0" aria-hidden />{" "}
                {[request.meta.location.area, request.meta.location.city]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>
            <div>
              <p className="text-xs" style={{ color: cn.textSecondary }}>
                Staff Level
              </p>
              <p style={{ color: cn.text }}>
                {request.staffing.required_level} (
                {levelLabels[request.staffing.required_level] ??
                  request.staffing.required_level}
                )
              </p>
            </div>
          </div>

          {(request.care_subject?.condition_summary ||
            request.medical?.diagnosis) && (
            <div>
              <p className="text-xs mb-1" style={{ color: cn.textSecondary }}>
                Special Requirements
              </p>
              <p className="text-sm" style={{ color: cn.text }}>
                {request.care_subject?.condition_summary ||
                  request.medical?.diagnosis ||
                  "—"}
              </p>
            </div>
          )}

          {request.medical?.devices?.length ||
          request.medical?.procedures_required?.length ? (
            <div className="flex flex-wrap gap-1">
              {(request.medical?.devices || []).map((d) => (
                <span
                  key={d}
                  className="px-2 py-0.5 rounded-full text-xs"
                  style={{
                    background: "rgba(239,68,68,0.08)",
                    color: "#EF4444",
                  }}
                >
                  {d}
                </span>
              ))}
              {(request.medical?.procedures_required || []).map((p) => (
                <span
                  key={p}
                  className="px-2 py-0.5 rounded-full text-xs"
                  style={{
                    background: "rgba(232,168,56,0.08)",
                    color: "#E8A838",
                  }}
                >
                  {p}
                </span>
              ))}
            </div>
          ) : null}

          {request.care_subject?.risk_level === "high" && (
            <div className="flex items-center gap-1">
              <AlertCircle
                className="w-3 h-3"
                style={{ color: "#EF4444" }}
                aria-hidden
              />
              <span className="text-xs" style={{ color: "#EF4444" }}>
                High risk patient
              </span>
            </div>
          )}
        </div>

        {/* ── Propose Caregiver ── */}
        {caregiverRoster && caregiverRoster.length > 0 && (
          <div className="finance-card p-5 space-y-4">
            <h3 className="text-sm" style={{ color: cn.text }}>
              Propose Caregiver
            </h3>
            <div className="space-y-2">
              {caregiverRoster.map((cg) => (
                <button
                  key={cg.id}
                  type="button"
                  onClick={() => cg.available && setSelectedCaregiver(cg.id)}
                  className="w-full p-3 rounded-xl text-left flex items-center gap-3 transition-all"
                  style={{
                    background:
                      selectedCaregiver === cg.id ? cn.tealBg : cn.bgInput,
                    border: `1.5px solid ${selectedCaregiver === cg.id ? cn.teal : cn.border}`,
                    opacity: cg.available ? 1 : 0.5,
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs"
                    style={{ background: cn.pinkBg, color: cn.pink }}
                  >
                    {cg.name
                      .split(" ")
                      .map((w) => w[0])
                      .join("")}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm" style={{ color: cn.text }}>
                      {cg.name}
                    </p>
                    <p className="text-xs" style={{ color: cn.textSecondary }}>
                      {cg.specialty} | {cg.experience} |{" "}
                      <Star
                        className="w-3 h-3 inline"
                        style={{ color: cn.amber }}
                      />{" "}
                      {cg.rating}
                    </p>
                  </div>
                  {!cg.available && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: "rgba(239,68,68,0.1)",
                        color: "#EF4444",
                      }}
                    >
                      Busy
                    </span>
                  )}
                  {selectedCaregiver === cg.id && (
                    <CheckCircle2
                      className="w-5 h-5"
                      style={{ color: cn.teal }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Proposal Details ── */}
        <div className="finance-card p-5 space-y-4">
          <h3 className="text-sm" style={{ color: cn.text }}>
            Proposal Details
          </h3>
          <div>
            <label
              className="text-xs mb-1 block"
              style={{ color: cn.textSecondary }}
            >
              Proposed Rate (BDT/{pricingPeriod})
            </label>
            <div className="relative">
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
                style={{ color: cn.textSecondary }}
              >
                ৳
              </span>
              <input
                type="number"
                value={proposedRate}
                onChange={(e) => setProposedRate(e.target.value)}
                className="w-full pl-8 pr-4 py-3 rounded-xl border text-sm"
                style={{
                  background: cn.bgInput,
                  borderColor: cn.border,
                  color: cn.text,
                }}
                placeholder={`${pricing.budget_min ?? ""} – ${pricing.budget_max ?? ""}`}
              />
            </div>
          </div>
          <div>
            <label
              className="text-xs mb-1.5 block"
              style={{ color: cn.textSecondary }}
            >
              Cover Message
            </label>
            <textarea
              rows={2}
              value={coverMessage}
              onChange={(e) => setCoverMessage(e.target.value)}
              placeholder="Why your agency is the best fit…"
              className="w-full px-4 py-3 rounded-xl border text-sm resize-none"
              style={{
                background: cn.bgInput,
                borderColor: cn.border,
                color: cn.text,
              }}
            />
          </div>
          <div>
            <label
              className="text-xs mb-1.5 block"
              style={{ color: cn.textSecondary }}
            >
              <AlertCircle
                className="w-3 h-3 inline mr-1"
                style={{ color: "#E8A838" }}
                aria-hidden
              />
              Deviation remarks (if you cannot fully meet the request)
            </label>
            <textarea
              rows={2}
              value={deviationRemarks}
              onChange={(e) => setDeviationRemarks(e.target.value)}
              placeholder="Optional: explain gaps and how you will compensate…"
              className="w-full px-4 py-3 rounded-xl border text-sm resize-none"
              style={{
                background: cn.bgInput,
                borderColor: cn.border,
                color: cn.text,
              }}
            />
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => void handleSendProposal()}
            disabled={submitting || isClosed}
            className="flex-1 py-3 rounded-xl text-white text-sm flex items-center justify-center gap-2 disabled:opacity-50 cn-touch-target"
            style={{ background: "var(--cn-gradient-agency)" }}
          >
            <Send className="w-4 h-4" aria-hidden />
            {submitting
              ? "Submitting…"
              : isClosed
                ? "Requirement Closed"
                : "Send Proposal to Guardian"}
          </button>
          <button
            type="button"
            onClick={handleDecline}
            disabled={submitting}
            className="py-3 px-6 rounded-xl text-sm border disabled:opacity-50 cn-touch-target"
            style={{ borderColor: "#EF4444", color: "#EF4444" }}
          >
            Decline
          </button>
        </div>
      </div>
    </>
  );
}
