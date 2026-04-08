import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Plus, Phone, Edit3, Trash2, ChevronDown, FileText } from "lucide-react";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { guardianService } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { useTranslation } from "react-i18next";
import { USE_SUPABASE, sb } from "@/backend/services/_sb";

export default function GuardianPatientsPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.guardianPatients", "Guardian Patients"));

  const { data: rawPatients, loading } = useAsyncData(() => guardianService.getPatients());

  if (loading || !rawPatients) return <PageSkeleton cards={3} />;

  const patients = rawPatients.map((p) => ({
    ...p, blood: p.bloodGroup || "",
    avatar: p.avatar || p.name?.charAt(0)?.toUpperCase() || "?",
    color: p.color || "#5FB865",
  }));

  return <GuardianPatientsContent patients={patients} />;
}

function GuardianPatientsContent({ patients }: { patients: any[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleRemove = async (p: any) => {
    if (!confirm(`Remove ${p.name}? This cannot be undone.`)) return;
    setRemoving(p.id);
    try {
      if (USE_SUPABASE) {
        const { error } = await sb().from("patients").delete().eq("id", p.id);
        if (error) throw error;
      }
      window.location.reload();
    } catch (err: any) {
      alert(err.message || "Failed to remove patient");
    } finally {
      setRemoving(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div><h1 className="text-2xl font-semibold" style={{ color: "#535353" }}>My Patients</h1><p className="text-sm" style={{ color: "#848484" }}>Manage and monitor your patients' care</p></div>
          <Link
            to="/guardian/patient-intake"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm no-underline cn-touch-target"
            style={{ background: "radial-gradient(143.86% 887.35% at -10.97% -22.81%, #A8F5A3 0%, #5FB865 100%)" }}
          >
            <Plus className="w-4 h-4 shrink-0" aria-hidden />
            Add Patient
          </Link>
        </div>

        {patients.map(p => (
          <div key={p.id} className="finance-card overflow-hidden">
            <div className="w-full p-5 flex items-center justify-between text-left">
              <Link to={`/guardian/patient/${p.id}`} className="flex items-center gap-4 no-underline flex-1 min-w-0">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0" style={{ background: `${p.color}80` }}>{p.avatar}</div>
                <div className="min-w-0">
                  <p className="font-semibold" style={{ color: "#535353" }}>{p.name}</p>
                  <p className="text-sm truncate" style={{ color: "#848484" }}>{p.relation || "No relation"}{p.age ? ` \u2022 Age ${p.age}` : ""}{p.blood ? ` \u2022 ${p.blood}` : ""}</p>
                </div>
              </Link>
              <div className="flex items-center gap-3 shrink-0">
                <span className="badge-pill" style={{ background: p.status === "active" ? "#7CE57720" : "#8082ED20", color: p.status === "active" ? "#5FB865" : "#7B5EA7" }}>{p.status}</span>
                <button onClick={() => setExpanded(expanded === p.id ? null : p.id)} className="p-1">
                  <ChevronDown className="w-5 h-5 transition-transform" style={{ color: "#848484", transform: expanded === p.id ? "rotate(180deg)" : "" }} />
                </button>
              </div>
            </div>
            {expanded === p.id && (
              <div className="px-5 pb-5 border-t" style={{ borderColor: "#F3F4F6" }}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-2" style={{ color: "#535353" }}>Medical Conditions</h3>
                    {(p.conditions || []).length > 0 ? (
                      <div className="space-y-1.5">
                        {p.conditions.map((c: string) => (
                          <div key={c} className="flex items-center gap-2 text-sm">
                            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: p.color }} />
                            <span style={{ color: "#535353" }}>{c}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm" style={{ color: "#848484" }}>No conditions listed</p>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold mb-2" style={{ color: "#535353" }}>Latest Vitals</h3>
                    {p.vitals && Object.keys(p.vitals).length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(p.vitals).map(([key, val]) => (
                          <div key={key} className="p-2 rounded-lg" style={{ background: "#F9FAFB" }}>
                            <p className="text-xs capitalize" style={{ color: "#848484" }}>{key}</p>
                            <p className="text-sm font-semibold mt-0.5" style={{ color: "#535353" }}>{val as string}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm" style={{ color: "#848484" }}>No vitals recorded yet</p>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold mb-2" style={{ color: "#535353" }}>Current Caregiver</h3>
                    {p.caregiver ? (
                      <div className="p-3 rounded-xl" style={{ background: `${p.color}15` }}>
                        <p className="font-semibold text-sm" style={{ color: "#535353" }}>{p.caregiver.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#848484" }}>&#9733; {p.caregiver.rating} &bull; Since {p.caregiver.since}</p>
                      </div>
                    ) : (
                      <p className="text-sm" style={{ color: "#848484" }}>No caregiver assigned yet</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <a href={p.phone ? `tel:${p.phone}` : undefined} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border hover:bg-gray-50 no-underline" style={{ borderColor: "#E5E7EB", color: "#535353", opacity: p.phone ? 1 : 0.5, cursor: p.phone ? "pointer" : "not-allowed", textDecoration: "none" }}><Phone className="w-3.5 h-3.5" /> {p.phone ? "Call" : "No Phone"}</a>
                  <button onClick={() => navigate(`/guardian/patient/${p.id}`)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border hover:bg-gray-50" style={{ borderColor: "#E5E7EB", color: "#535353" }}><FileText className="w-3.5 h-3.5" /> Care Log</button>
                  <button onClick={() => navigate(`/guardian/patient-intake?edit=${p.id}`)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border hover:bg-gray-50" style={{ borderColor: "#E5E7EB", color: "#535353" }}><Edit3 className="w-3.5 h-3.5" /> Edit</button>
                  <button onClick={() => handleRemove(p)} disabled={removing === p.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border hover:bg-red-50" style={{ borderColor: "#EF4444", color: "#EF4444" }}><Trash2 className="w-3.5 h-3.5" /> {removing === p.id ? "Removing..." : "Remove"}</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <style dangerouslySetInnerHTML={{ __html: ".finance-card { background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); } .badge-pill { display: inline-flex; align-items: center; padding: 0.2rem 0.5rem; border-radius: 999px; font-size: 0.7rem; font-weight: 500; }" }} />
    </>
  );
}
