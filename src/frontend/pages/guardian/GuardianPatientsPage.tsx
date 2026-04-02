import { useState } from "react";
import { cn } from "@/frontend/theme/tokens";
import { Plus, Heart, Activity, Phone, Edit3, Trash2, ChevronDown, FileText } from "lucide-react";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { guardianService } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { useTranslation } from "react-i18next";

export default function GuardianPatientsPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.guardianPatients", "Guardian Patients"));

  const { data: rawPatients, loading } = useAsyncData(() => guardianService.getPatients());

  if (loading || !rawPatients) return <PageSkeleton cards={3} />;

  const patients = rawPatients.map((p, i) => ({
    ...p, id: i + 1, blood: p.bloodGroup || "",
  }));

  return <GuardianPatientsContent patients={patients} />;
}

function GuardianPatientsContent({ patients }: { patients: any[] }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-semibold" style={{ color: "#535353" }}>My Patients</h1><p className="text-sm" style={{ color: "#848484" }}>Manage and monitor your patients' care</p></div>
          <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm" style={{ background: "radial-gradient(143.86% 887.35% at -10.97% -22.81%, #A8F5A3 0%, #5FB865 100%)" }}><Plus className="w-4 h-4" /> Add Patient</button>
        </div>

        {showAdd && (
          <div className="finance-card p-5">
            <h2 className="font-semibold mb-4" style={{ color: "#535353" }}>Add New Patient</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[["Full Name", "text", "Patient's full name"], ["Date of Birth", "date", ""], ["Phone", "tel", "+880 1X-XXXX-XXXX"], ["Blood Group", "text", "e.g. O+"]].map(([label, type, placeholder]) => (<div key={label as string}><label className="block text-sm font-medium mb-1.5" style={{ color: "#535353" }}>{label as string}</label><input type={type as string} placeholder={placeholder as string} className="input-field" /></div>))}
              <div><label className="block text-sm font-medium mb-1.5" style={{ color: "#535353" }}>Relation</label><select className="input-field">{["Select relation", "Father", "Mother", "Spouse", "Sibling", "Other"].map(o => <option key={o}>{o}</option>)}</select></div>
              <div><label className="block text-sm font-medium mb-1.5" style={{ color: "#535353" }}>Primary Condition</label><input type="text" placeholder="e.g. Diabetes, Stroke..." className="input-field" /></div>
            </div>
            <div className="flex gap-3 mt-4"><button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-lg border text-sm" style={{ borderColor: "#E5E7EB", color: "#535353" }}>Cancel</button><button className="flex-1 py-2.5 rounded-lg text-white text-sm" style={{ background: "radial-gradient(143.86% 887.35% at -10.97% -22.81%, #A8F5A3 0%, #5FB865 100%)" }}>Save Patient</button></div>
          </div>
        )}

        {patients.map(p => (
          <div key={p.id} className="finance-card overflow-hidden">
            <button className="w-full p-5 flex items-center justify-between text-left" onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
              <div className="flex items-center gap-4"><div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ background: `${p.color}80` }}>{p.avatar}</div><div><p className="font-semibold" style={{ color: "#535353" }}>{p.name}</p><p className="text-sm" style={{ color: "#848484" }}>{p.relation} • Age {p.age} • {p.blood}</p></div></div>
              <div className="flex items-center gap-3"><span className="badge-pill" style={{ background: p.status === "active" ? "#7CE57720" : "#8082ED20", color: p.status === "active" ? "#5FB865" : "#7B5EA7" }}>{p.status}</span><ChevronDown className="w-5 h-5 transition-transform" style={{ color: "#848484", transform: expanded === p.id ? "rotate(180deg)" : "" }} /></div>
            </button>
            {expanded === p.id && (
              <div className="px-5 pb-5 border-t" style={{ borderColor: "#F3F4F6" }}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
                  <div><h3 className="text-sm font-semibold mb-2" style={{ color: "#535353" }}>Medical Conditions</h3><div className="space-y-1.5">{p.conditions.map(c => (<div key={c} className="flex items-center gap-2 text-sm"><div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: p.color }} /><span style={{ color: "#535353" }}>{c}</span></div>))}</div></div>
                  <div><h3 className="text-sm font-semibold mb-2" style={{ color: "#535353" }}>Latest Vitals</h3><div className="grid grid-cols-2 gap-2">{Object.entries(p.vitals).map(([key, val]) => (<div key={key} className="p-2 rounded-lg" style={{ background: "#F9FAFB" }}><p className="text-xs capitalize" style={{ color: "#848484" }}>{key}</p><p className="text-sm font-semibold mt-0.5" style={{ color: "#535353" }}>{val}</p></div>))}</div></div>
                  <div><h3 className="text-sm font-semibold mb-2" style={{ color: "#535353" }}>Current Caregiver</h3><div className="p-3 rounded-xl" style={{ background: `${p.color}15` }}><p className="font-semibold text-sm" style={{ color: "#535353" }}>{p.caregiver.name}</p><p className="text-xs mt-0.5" style={{ color: "#848484" }}>★ {p.caregiver.rating} • Since {p.caregiver.since}</p></div></div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border hover:bg-gray-50" style={{ borderColor: "#E5E7EB", color: "#535353" }}><Phone className="w-3.5 h-3.5" /> Call</button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border hover:bg-gray-50" style={{ borderColor: "#E5E7EB", color: "#535353" }}><FileText className="w-3.5 h-3.5" /> Care Log</button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border hover:bg-gray-50" style={{ borderColor: "#E5E7EB", color: "#535353" }}><Edit3 className="w-3.5 h-3.5" /> Edit</button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border hover:bg-red-50" style={{ borderColor: "#EF4444", color: "#EF4444" }}><Trash2 className="w-3.5 h-3.5" /> Remove</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <style dangerouslySetInnerHTML={{ __html: ".finance-card { background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); } .badge-pill { display: inline-flex; align-items: center; padding: 0.2rem 0.5rem; border-radius: 999px; font-size: 0.7rem; font-weight: 500; } .input-field { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #E5E7EB; border-radius: 8px; outline: none; font-size: 0.875rem; color: #535353; background: white; } .input-field:focus { border-color: #5FB865; }" }} />
    </>
  );
}
