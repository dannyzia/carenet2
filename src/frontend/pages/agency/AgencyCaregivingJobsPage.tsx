import { useMemo, useState } from "react";
import { Briefcase, Link2, Plus } from "lucide-react";
import { cn } from "@/frontend/theme/tokens";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { caregivingJobService, type AgencyConvergenceContractRow, type CaregivingJobListRow } from "@/backend/services";
import { assertCompatiblePair } from "@/backend/domain/caregivingJob/assertCompatible";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { useTranslation } from "react-i18next";
import { Button } from "@/frontend/components/ui/button";
import { useAuth } from "@/backend/store/auth/AuthContext";
import { USE_SUPABASE } from "@/backend/services/supabase";

function cacRowsCompatibleWithGac(gac: AgencyConvergenceContractRow, cacs: AgencyConvergenceContractRow[]) {
  return cacs.filter((cac) => {
    try {
      assertCompatiblePair(
        {
          contract_party_scope: "guardian_agency",
          gac_kind: gac.gac_kind,
          staffing_channel: null,
        },
        {
          contract_party_scope: "caregiver_agency",
          gac_kind: null,
          staffing_channel: cac.staffing_channel,
        },
      );
      return true;
    } catch {
      return false;
    }
  });
}

export default function AgencyCaregivingJobsPage() {
  const { t: tDoc } = useTranslation("common");
  useDocumentTitle(tDoc("pageTitles.agencyCaregivingJobs", "Caregiving jobs"));

  const { t } = useTranslation("common", { keyPrefix: "agencyCaregivingJobs" });
  const { user } = useAuth();
  const agencyId = user?.id ?? "";

  const { data: gacs, loading: lg, refetch: rfG } = useAsyncData(() => caregivingJobService.listAgencyGacContracts(), []);
  const { data: cacs, loading: lc, refetch: rfC } = useAsyncData(() => caregivingJobService.listAgencyCacContracts(), []);
  const { data: jobs, loading: lj, refetch: rfJ } = useAsyncData(() => caregivingJobService.listJobsWithAssignments(), []);

  const [gacId, setGacId] = useState("");
  const [cacId, setCacId] = useState("");
  const [assignmentLabel, setAssignmentLabel] = useState("primary");
  const [startDate, setStartDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [addJobId, setAddJobId] = useState("");
  const [addCacId, setAddCacId] = useState("");
  const [addLabel, setAddLabel] = useState("support-2");
  const [addRole, setAddRole] = useState<string | null>("support");

  const selectedGac = useMemo(() => gacs?.find((g) => g.id === gacId), [gacs, gacId]);
  const compatibleCacs = useMemo(() => {
    if (!selectedGac || !cacs) return [];
    return cacRowsCompatibleWithGac(selectedGac, cacs);
  }, [selectedGac, cacs]);

  const addTargetJob = useMemo(() => jobs?.find((j) => j.id === addJobId), [jobs, addJobId]);
  const addJobGac = useMemo(() => {
    if (!addTargetJob || !gacs) return undefined;
    return gacs.find((g) => g.id === addTargetJob.guardian_agency_contract_id);
  }, [addTargetJob, gacs]);
  const compatibleCacsForAdd = useMemo(() => {
    if (!addJobGac || !cacs) return [];
    return cacRowsCompatibleWithGac(addJobGac, cacs);
  }, [addJobGac, cacs]);

  if (lg || lc || lj || !gacs || !cacs || !jobs) return <PageSkeleton cards={3} />;

  const refetchAll = async () => {
    await Promise.all([rfG(), rfC(), rfJ()]);
  };

  const onCreate = async () => {
    setErr(null);
    if (!USE_SUPABASE) {
      setErr(t("demoOnly"));
      return;
    }
    if (!agencyId) {
      setErr(t("noAgency"));
      return;
    }
    setBusy(true);
    try {
      await caregivingJobService.createCaregivingJob({
        gacId,
        cacId,
        agencyId,
        assignmentLabel,
        startDate: startDate.trim() || null,
        schedulePattern: null,
      });
      setAssignmentLabel("primary");
      await refetchAll();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const onAddCaregiver = async () => {
    setErr(null);
    if (!USE_SUPABASE) {
      setErr(t("demoOnly"));
      return;
    }
    setBusy(true);
    try {
      await caregivingJobService.addCaregiverToJob({
        jobId: addJobId,
        cacId: addCacId,
        assignmentLabel: addLabel,
        role: addRole,
      });
      setAddLabel("support-2");
      await refetchAll();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  if (!USE_SUPABASE) {
    return (
      <div className="space-y-4 max-w-3xl">
        <h1 className="text-xl" style={{ color: cn.text }}>{t("title")}</h1>
        <p className="text-sm" style={{ color: cn.textSecondary }}>{t("demoOnly")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl pb-10">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: cn.tealBg }}>
          <Briefcase className="w-5 h-5" style={{ color: cn.teal }} />
        </div>
        <div>
          <h1 className="text-xl" style={{ color: cn.text }}>{t("title")}</h1>
          <p className="text-sm" style={{ color: cn.textSecondary }}>{t("subtitle")}</p>
        </div>
      </div>

      {err ? (
        <div className="rounded-lg border px-4 py-3 text-sm" style={{ borderColor: "#fecaca", color: "#b91c1c", background: "#fef2f2" }}>
          {err}
        </div>
      ) : null}

      <section className="finance-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4" style={{ color: cn.teal }} aria-hidden />
          <h2 className="text-sm font-medium" style={{ color: cn.text }}>{t("createSection")}</h2>
        </div>
        <p className="text-xs" style={{ color: cn.textSecondary }}>{t("createHint")}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs space-y-1" style={{ color: cn.textSecondary }}>
            <span>{t("gacLabel")}</span>
            <select
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput }}
              value={gacId}
              onChange={(e) => {
                setGacId(e.target.value);
                setCacId("");
              }}
            >
              <option value="">{t("selectPlaceholder")}</option>
              {gacs.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title.slice(0, 60)} — {g.gac_kind}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs space-y-1" style={{ color: cn.textSecondary }}>
            <span>{t("cacLabel")}</span>
            <select
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput }}
              value={cacId}
              onChange={(e) => setCacId(e.target.value)}
              disabled={!gacId}
            >
              <option value="">{t("selectPlaceholder")}</option>
              {compatibleCacs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title.slice(0, 60)} — {c.staffing_channel}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs space-y-1" style={{ color: cn.textSecondary }}>
            <span>{t("assignmentLabel")}</span>
            <input
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput }}
              value={assignmentLabel}
              onChange={(e) => setAssignmentLabel(e.target.value)}
              placeholder="primary"
            />
          </label>
          <label className="text-xs space-y-1" style={{ color: cn.textSecondary }}>
            <span>{t("startDateOptional")}</span>
            <input
              type="date"
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>
        </div>
        <Button type="button" disabled={busy || !gacId || !cacId || !assignmentLabel.trim()} onClick={() => void onCreate()}>
          <Plus className="w-4 h-4 mr-1" aria-hidden />
          {t("createCta")}
        </Button>
      </section>

      <section className="finance-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Plus className="w-4 h-4" style={{ color: cn.teal }} aria-hidden />
          <h2 className="text-sm font-medium" style={{ color: cn.text }}>{t("addCaregiverSection")}</h2>
        </div>
        <p className="text-xs" style={{ color: cn.textSecondary }}>{t("addCaregiverHint")}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs space-y-1" style={{ color: cn.textSecondary }}>
            <span>{t("jobLabel")}</span>
            <select
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput }}
              value={addJobId}
              onChange={(e) => {
                setAddJobId(e.target.value);
                setAddCacId("");
              }}
            >
              <option value="">{t("selectPlaceholder")}</option>
              {jobs.map((j: CaregivingJobListRow) => (
                <option key={j.id} value={j.id}>
                  {j.id.slice(0, 8)}… — {j.status}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs space-y-1" style={{ color: cn.textSecondary }}>
            <span>{t("cacLabel")}</span>
            <select
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput }}
              value={addCacId}
              onChange={(e) => setAddCacId(e.target.value)}
              disabled={!addJobId}
            >
              <option value="">{t("selectPlaceholder")}</option>
              {compatibleCacsForAdd.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title.slice(0, 60)} — {c.staffing_channel}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs space-y-1" style={{ color: cn.textSecondary }}>
            <span>{t("assignmentLabel")}</span>
            <input
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput }}
              value={addLabel}
              onChange={(e) => setAddLabel(e.target.value)}
            />
          </label>
          <label className="text-xs space-y-1" style={{ color: cn.textSecondary }}>
            <span>{t("roleOptional")}</span>
            <input
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput }}
              value={addRole ?? ""}
              onChange={(e) => setAddRole(e.target.value.trim() || null)}
              placeholder="support"
            />
          </label>
        </div>
        <Button type="button" disabled={busy || !addJobId || !addCacId || !addLabel.trim()} onClick={() => void onAddCaregiver()}>
          {t("addCaregiverCta")}
        </Button>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium" style={{ color: cn.text }}>{t("listHeading")}</h2>
        {jobs.length === 0 ? (
          <p className="text-sm" style={{ color: cn.textSecondary }}>{t("emptyJobs")}</p>
        ) : (
          <ul className="space-y-2">
            {jobs.map((j) => (
              <li key={j.id} className="finance-card p-4 text-sm">
                <div className="flex flex-wrap justify-between gap-2">
                  <span style={{ color: cn.text }}>{t("jobId")}: {j.id}</span>
                  <span style={{ color: cn.textSecondary }}>{j.status}</span>
                </div>
                <p className="text-xs mt-1" style={{ color: cn.textSecondary }}>{t("gacShort")}: {j.guardian_agency_contract_id}</p>
                {j.caregiving_job_caregiver_assignments.length === 0 ? (
                  <p className="text-xs mt-2" style={{ color: cn.textSecondary }}>{t("noAssignments")}</p>
                ) : (
                  <ul className="mt-2 space-y-1 text-xs" style={{ color: cn.textSecondary }}>
                    {j.caregiving_job_caregiver_assignments.map((a) => (
                      <li key={a.id}>
                        {a.assignment_label} — CAC {a.caregiver_agency_contract_id.slice(0, 8)}… ({a.role ?? "—"})
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
