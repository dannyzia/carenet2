import { Link, useParams } from "react-router";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/frontend/theme/tokens";
import { ChevronLeft, Plus, AlertTriangle, Link2 } from "lucide-react";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { agencyService, caregivingJobService, type CaregivingJobListRow } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { useTranslation } from "react-i18next";
import { Button } from "@/frontend/components/ui/button";
import { USE_SUPABASE } from "@/backend/services/supabase";

const statusColor: Record<string, { color: string; bg: string }> = {
  completed: { color: "#5FB865", bg: "rgba(95,184,101,0.12)" },
  scheduled: { color: "#0288D1", bg: "rgba(2,136,209,0.12)" },
  unassigned: { color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
};

export default function AgencyPlacementDetailPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.agencyPlacementDetail", "Agency Placement Detail"));

  const { t } = useTranslation("common", { keyPrefix: "agencyPlacementDetail" });
  const { id } = useParams();
  const placementId = id ?? "";

  const { data: shifts, loading: ls } = useAsyncData(() => agencyService.getPlacementShifts(placementId), [placementId]);
  const { data: placement, loading: lp, refetch: rfP } = useAsyncData(
    () => (USE_SUPABASE && placementId ? agencyService.getPlacementById(placementId) : Promise.resolve(undefined)),
    [placementId],
  );
  const { data: cjJobs, loading: lj, refetch: rfJ } = useAsyncData(
    () => (USE_SUPABASE ? caregivingJobService.listJobsWithAssignments() : Promise.resolve([])),
    [],
  );

  const [selJobId, setSelJobId] = useState("");
  const [selAssignId, setSelAssignId] = useState("");
  const [linkMsg, setLinkMsg] = useState<string | null>(null);
  const [linkBusy, setLinkBusy] = useState(false);

  useEffect(() => {
    if (!placement) return;
    setSelJobId(placement.caregivingJobId ?? "");
    setSelAssignId(placement.caregivingAssignmentId ?? "");
  }, [placement?.caregivingJobId, placement?.caregivingAssignmentId, placement]);

  useEffect(() => {
    const job = (cjJobs ?? []).find((j) => j.id === selJobId);
    if (!job || !selAssignId) return;
    const ok = job.caregiving_job_caregiver_assignments.some((a) => a.id === selAssignId);
    if (!ok) setSelAssignId("");
  }, [cjJobs, selJobId, selAssignId]);

  const selectedJob = useMemo(
    () => (cjJobs as CaregivingJobListRow[] | undefined)?.find((j) => j.id === selJobId),
    [cjJobs, selJobId],
  );

  if (ls || !shifts) return <PageSkeleton cards={3} />;

  const caregiverShiftMap = shifts
    .filter(s => s.caregiver)
    .reduce<Record<string, { shifts: number; isPrimary: boolean }>>((acc, s) => {
      acc[s.caregiver] = acc[s.caregiver]
        ? { ...acc[s.caregiver], shifts: acc[s.caregiver].shifts + 1 }
        : { shifts: 1, isPrimary: false };
      return acc;
    }, {});
  const sortedCaregivers = Object.entries(caregiverShiftMap)
    .sort(([, a], [, b]) => b.shifts - a.shifts)
    .map(([name, info], i) => ({ name, shifts: info.shifts, status: i === 0 ? "Primary" : "Backup" }));

  const completedShifts = shifts.filter(s => s.status === "completed").length;
  const ratePerShift = 1200;
  const agencyMarginRate = 0.27;
  const totalBilled = completedShifts * Math.round(ratePerShift / (1 - agencyMarginRate));
  const totalPaid = completedShifts * ratePerShift;
  const agencyMargin = totalBilled - totalPaid;

  const placementTitle = (placement?.id ?? placementId) || "PL-2026-0018";
  const placementStatus = placement?.status ?? "active";

  const onSaveCjLink = async () => {
    setLinkMsg(null);
    if (!USE_SUPABASE || !placementId) {
      setLinkMsg(t("cjDemo"));
      return;
    }
    setLinkBusy(true);
    try {
      await agencyService.updatePlacementCaregivingLink(placementId, {
        caregivingJobId: selJobId || null,
        caregivingAssignmentId: selAssignId || null,
      });
      setLinkMsg(t("cjSaved"));
      await rfP();
      await rfJ();
    } catch (e: unknown) {
      setLinkMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setLinkBusy(false);
    }
  };

  const onClearCjLink = () => {
    setSelJobId("");
    setSelAssignId("");
  };

  return (
    <>
      <div className="max-w-3xl mx-auto space-y-6 pb-8">
        <Link to="/agency/placements" className="inline-flex items-center gap-1 text-sm" style={{ color: cn.textSecondary }}><ChevronLeft className="w-4 h-4" /> Back to Placements</Link>
        <div className="finance-card p-5" style={{ borderLeft: `3px solid ${cn.teal}` }}>
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg" style={{ color: cn.text }}>{placementTitle}</h1>
            <span className="px-2.5 py-1 rounded-full text-xs capitalize" style={{ background: cn.greenBg, color: cn.green }}>{placementStatus}</span>
          </div>
          {placement ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <div><p className="text-xs" style={{ color: cn.textSecondary }}>Patient</p><p style={{ color: cn.text }}>{placement.patient}</p></div>
              <div><p className="text-xs" style={{ color: cn.textSecondary }}>Guardian</p><p style={{ color: cn.text }}>{placement.guardian}</p></div>
              <div><p className="text-xs" style={{ color: cn.textSecondary }}>Start</p><p style={{ color: cn.text }}>{placement.startDate || "—"}</p></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm"><div><p className="text-xs" style={{ color: cn.textSecondary }}>Patient</p><p style={{ color: cn.text }}>Mr. Abdul Rahman, 74y</p></div><div><p className="text-xs" style={{ color: cn.textSecondary }}>Guardian</p><p style={{ color: cn.text }}>Rashed Hossain</p></div><div><p className="text-xs" style={{ color: cn.textSecondary }}>Duration</p><p style={{ color: cn.text }}>Jan 10 - Mar 10</p></div></div>
          )}
        </div>

        {USE_SUPABASE && placementId && !lp && placement ? (
          <div className="finance-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4" style={{ color: cn.teal }} aria-hidden />
              <h3 className="text-sm" style={{ color: cn.text }}>{t("cjLinkTitle")}</h3>
            </div>
            <p className="text-xs" style={{ color: cn.textSecondary }}>{t("cjLinkSubtitle")}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs space-y-1" style={{ color: cn.textSecondary }}>
                <span>{t("cjJobLabel")}</span>
                <select
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput }}
                  value={selJobId}
                  onChange={(e) => {
                    setSelJobId(e.target.value);
                    setSelAssignId("");
                  }}
                >
                  <option value="">—</option>
                  {(cjJobs ?? []).map((j) => (
                    <option key={j.id} value={j.id}>{j.id.slice(0, 8)}… ({j.status})</option>
                  ))}
                </select>
              </label>
              <label className="text-xs space-y-1" style={{ color: cn.textSecondary }}>
                <span>{t("cjAssignmentLabel")}</span>
                <select
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput }}
                  value={selAssignId}
                  onChange={(e) => setSelAssignId(e.target.value)}
                  disabled={!selJobId}
                >
                  <option value="">—</option>
                  {(selectedJob?.caregiving_job_caregiver_assignments ?? []).map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.assignment_label} ({a.caregiver_agency_contract_id.slice(0, 8)}…)
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {linkMsg ? (
              <p
                className="text-xs"
                style={{ color: linkMsg === t("cjSaved") ? cn.green : "#b91c1c" }}
              >
                {linkMsg}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={onClearCjLink}>{t("cjClear")}</Button>
              <Button type="button" size="sm" disabled={linkBusy || lj} onClick={() => void onSaveCjLink()}>{t("cjSave")}</Button>
            </div>
          </div>
        ) : null}

        <div className="finance-card p-5"><div className="flex items-center justify-between mb-4"><h3 className="text-sm" style={{ color: cn.text }}>Shift Planner — This Week</h3><button className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg" style={{ background: cn.tealBg, color: cn.teal }}><Plus className="w-3 h-3" /> Add Shift</button></div><div className="space-y-2">{shifts.map((s) => { const sc = statusColor[s.status] || statusColor.scheduled; return (<div key={s.day} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: cn.bgInput }}><span className="w-10 text-sm" style={{ color: cn.text }}>{s.day}</span><div className="flex-1">{s.caregiver ? <span className="text-sm" style={{ color: cn.text }}>{s.caregiver}</span> : <span className="text-sm flex items-center gap-1" style={{ color: "#EF4444" }}><AlertTriangle className="w-3 h-3" /> Unassigned</span>}<p className="text-xs" style={{ color: cn.textSecondary }}>{s.time}</p></div><span className="px-2 py-0.5 rounded-full text-xs capitalize" style={{ background: sc.bg, color: sc.color }}>{s.status}</span></div>); })}</div></div>
        <div className="finance-card p-5"><h3 className="text-sm mb-3" style={{ color: cn.text }}>Assigned Caregivers</h3><div className="space-y-2">{sortedCaregivers.length > 0 ? sortedCaregivers.map((cg) => (<div key={cg.name} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: cn.bgInput }}><div className="w-8 h-8 rounded-full flex items-center justify-center text-xs" style={{ background: cn.pinkBg, color: cn.pink }}>{cg.name.split(" ").map((w: string) => w[0]).join("")}</div><div className="flex-1"><p className="text-sm" style={{ color: cn.text }}>{cg.name}</p><p className="text-xs" style={{ color: cn.textSecondary }}>{cg.shifts} shifts</p></div><span className="text-xs px-2 py-0.5 rounded-full" style={{ background: cg.status === "Primary" ? cn.tealBg : cn.amberBg, color: cg.status === "Primary" ? cn.teal : cn.amber }}>{cg.status}</span></div>)) : <p className="text-xs text-center py-3" style={{ color: cn.textSecondary }}>No caregivers assigned yet</p>}<button className="w-full p-3 rounded-xl border-2 border-dashed text-sm flex items-center justify-center gap-2" style={{ borderColor: cn.border, color: cn.textSecondary }}><Plus className="w-4 h-4" /> Assign New Caregiver</button></div></div>
        <div className="finance-card p-5"><h3 className="text-sm mb-3" style={{ color: cn.text }}>Financial Summary</h3><div className="grid grid-cols-3 gap-4 text-center"><div><p className="text-xs" style={{ color: cn.textSecondary }}>Billed to Guardian</p><p className="text-lg" style={{ color: cn.text }}>{"\u09F3"} {totalBilled.toLocaleString()}</p></div><div><p className="text-xs" style={{ color: cn.textSecondary }}>Paid to Caregivers</p><p className="text-lg" style={{ color: cn.pink }}>{"\u09F3"} {totalPaid.toLocaleString()}</p></div><div><p className="text-xs" style={{ color: cn.textSecondary }}>Agency Margin</p><p className="text-lg" style={{ color: cn.green }}>{"\u09F3"} {agencyMargin.toLocaleString()}</p></div></div></div>
      </div>
    </>
  );
}
