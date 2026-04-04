import { useState } from "react";
import { Link } from "react-router";
import { cn } from "@/frontend/theme/tokens";
import { Shield, Users, ArrowRightLeft, UserCheck, Phone, Star, MapPin, Clock } from "lucide-react";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { backupService } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { ShiftReassignmentModal } from "@/frontend/components/shared/ShiftReassignmentModal";
import { useTranslation } from "react-i18next";

export default function BackupCaregiverPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.backupCaregiver", "Backup Caregiver"));

  const { data: assignments, loading: l1, refetch: r1 } = useAsyncData(() => backupService.getBackupAssignments());
  const { data: reassignments, loading: l2, refetch: r2 } = useAsyncData(() => backupService.getReassignmentHistory());
  const { data: standby, loading: l3 } = useAsyncData(() => backupService.getStandbyPool());
  if (l1 || l2 || l3 || !assignments || !reassignments || !standby) return <PageSkeleton cards={4} />;
  return (
    <BackupContent
      assignments={assignments}
      reassignments={reassignments}
      standby={standby}
      onRefresh={() => {
        void r1();
        void r2();
      }}
    />
  );
}

function BackupContent({
  assignments,
  reassignments,
  standby,
  onRefresh,
}: {
  assignments: any[];
  reassignments: any[];
  standby: any[];
  onRefresh: () => void;
}) {
  const { t } = useTranslation("common");
  const [tab, setTab] = useState<"assignments" | "standby" | "history">("assignments");
  const [reassignOpen, setReassignOpen] = useState(false);
  const [reassignShiftId, setReassignShiftId] = useState("");
  const [reassignBackups, setReassignBackups] = useState<{ caregiverId: string; caregiverName: string; available: boolean }[]>([]);
  const tabs = [
    { key: "assignments" as const, label: "Backup Pairs", icon: Shield, count: assignments.length },
    { key: "standby" as const, label: "Standby Pool", icon: Users, count: standby.filter((s: any) => s.available).length },
    { key: "history" as const, label: "Reassignments", icon: ArrowRightLeft, count: reassignments.length },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="text-xl" style={{ color: cn.textHeading }}>Backup & Standby Management</h1>
          <p className="text-sm mt-0.5" style={{ color: cn.textSecondary }}>Manage backup caregivers, standby pool, and shift reassignments</p>
        </div>
        <Link to="/agency/reassignment-history" className="text-sm shrink-0 underline" style={{ color: cn.pink }}>
          {t("reassignmentHistory.pageLink")}
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Active Backup Pairs", value: assignments.length, color: cn.green },
          { label: "Available Standby", value: standby.filter((s: any) => s.available).length, color: cn.pink },
          { label: "Reassignments (7d)", value: reassignments.length, color: "var(--cn-amber)" },
        ].map((s, i) => (
          <div key={i} className="finance-card p-3 text-center">
            <p className="text-lg" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs" style={{ color: cn.textSecondary }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: cn.bgInput }}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs transition-all"
            style={{ background: tab === t.key ? cn.bgCard : "transparent", color: tab === t.key ? cn.pink : cn.textSecondary, boxShadow: tab === t.key ? cn.shadowCard : "none" }}>
            <t.icon className="w-3.5 h-3.5" /> {t.label} <span className="opacity-60">({t.count})</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "assignments" && (
        <div className="space-y-3">
          {assignments.map((a: any) => (
            <div key={a.id} className="finance-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4" style={{ color: cn.green }} />
                  <span className="text-sm" style={{ color: cn.textHeading }}>Primary: {a.primaryCaregiverName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(95,184,101,0.1)", color: cn.green }}>Active</span>
                  {a.shiftId ? (
                    <button
                      type="button"
                      className="text-xs px-2 py-1 rounded-lg text-white"
                      style={{ background: "var(--cn-gradient-caregiver)" }}
                      onClick={() => {
                        setReassignShiftId(a.shiftId);
                        setReassignBackups(a.backupCaregivers);
                        setReassignOpen(true);
                      }}
                    >
                      {t("shiftReassignment.openAction")}
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="space-y-2">
                {a.backupCaregivers.map((b: any, idx: number) => (
                  <div key={b.caregiverId} className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: cn.bgInput }}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs w-5 h-5 rounded-full flex items-center justify-center" style={{ background: cn.pinkBg, color: cn.pink }}>
                        {b.priority}
                      </span>
                      <div>
                        <p className="text-sm" style={{ color: cn.text }}>{b.caregiverName}</p>
                        <div className="flex items-center gap-2 text-xs" style={{ color: cn.textSecondary }}>
                          <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{b.distance}</span>
                          <span className="flex items-center gap-0.5"><Star className="w-3 h-3" />{b.rating}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: b.available ? cn.green : "var(--cn-red)" }} />
                      <Phone className="w-3.5 h-3.5 cursor-pointer" style={{ color: cn.green }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "standby" && (
        <div className="space-y-2">
          {standby.map((s: any) => (
            <div key={s.caregiverId} className="finance-card p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm" style={{ background: cn.pinkBg, color: cn.pink }}>
                  {s.name.split(" ").map((n: string) => n[0]).join("")}
                </div>
                <div>
                  <p className="text-sm" style={{ color: cn.textHeading }}>{s.name}</p>
                  <p className="text-xs" style={{ color: cn.textSecondary }}>{s.specialty}</p>
                  <div className="flex items-center gap-2 text-xs mt-0.5" style={{ color: cn.textSecondary }}>
                    <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{s.distance}</span>
                    <span className="flex items-center gap-0.5"><Star className="w-3 h-3" />{s.rating}</span>
                    {s.lastShift && <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />Last: {s.lastShift}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: s.available ? "rgba(95,184,101,0.1)" : "rgba(239,68,68,0.1)", color: s.available ? cn.green : "var(--cn-red)" }}>
                  {s.available ? "Available" : "Busy"}
                </span>
                {s.available && (
                  <button className="text-xs px-3 py-1.5 rounded-lg text-white" style={{ background: "var(--cn-gradient-caregiver)" }}>
                    Assign
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "history" && (
        <div className="space-y-2">
          {reassignments.map((r: any) => (
            <div key={r.id} className="finance-card p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4" style={{ color: "var(--cn-amber)" }} />
                  <span className="text-sm" style={{ color: cn.textHeading }}>{r.fromCaregiverName} → {r.toCaregiverName}</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{
                  background: r.status === "completed" ? "rgba(95,184,101,0.1)" : r.status === "pending" ? "rgba(245,158,11,0.1)" : "rgba(59,130,246,0.1)",
                  color: r.status === "completed" ? cn.green : r.status === "pending" ? "var(--cn-amber)" : "var(--cn-blue)",
                }}>
                  {r.status}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs" style={{ color: cn.textSecondary }}>
                <span>Reason: {r.reason}</span>
                <span>By: {r.reassignedBy}</span>
                {r.billingAdjustment && <span style={{ color: cn.green }}>{r.billingAdjustment}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      <ShiftReassignmentModal
        open={reassignOpen}
        onOpenChange={setReassignOpen}
        shiftId={reassignShiftId}
        backups={reassignBackups}
        onCompleted={() => onRefresh()}
      />
    </div>
  );
}
