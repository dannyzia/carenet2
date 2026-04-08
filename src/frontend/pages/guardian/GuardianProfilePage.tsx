import { cn } from "@/frontend/theme/tokens";
import { Edit3, Camera, Phone, Mail, MapPin, User, Heart, Shield } from "lucide-react";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { guardianService } from "@/backend/services/guardian.service";
import { PageSkeleton } from "@/frontend/components/PageSkeleton";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function GuardianProfilePage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.guardianProfile", "Guardian Profile"));

  const { data: profileData, loading } = useAsyncData(() => guardianService.getGuardianProfile());
  const { data: patients } = useAsyncData(() => guardianService.getPatients());
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    if (profileData && !form) {
      setForm({ ...profileData });
    }
  }, [profileData, form]);

  if (loading || !profileData || !form) return <PageSkeleton />;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="finance-card overflow-hidden">
        <div className="h-24" style={{ background: "radial-gradient(143.86% 887.35% at -10.97% -22.81%, #A8F5A3 0%, #5FB865 100%)" }} />
        <div className="px-6 pb-6">
          <div className="flex justify-between items-end -mt-10 mb-4">
            <div className="relative w-fit"><div className="w-20 h-20 rounded-2xl border-4 border-white flex items-center justify-center text-2xl font-bold text-white" style={{ background: "radial-gradient(143.86% 887.35% at -10.97% -22.81%, #A8F5A3 0%, #5FB865 100%)" }}>{form.name ? form.name.charAt(0).toUpperCase() : "?"}</div><button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center border-2 border-white" style={{ background: "#5FB865" }}><Camera className="w-3.5 h-3.5 text-white" /></button></div>
            <button onClick={() => setEditing(!editing)} className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm" style={{ borderColor: "#5FB865", color: "#5FB865" }}><Edit3 className="w-4 h-4" /> {editing ? "Cancel" : "Edit"}</button>
          </div>
          <h1 className="text-xl font-bold" style={{ color: "#535353" }}>{form.name}</h1>
          <p className="text-sm" style={{ color: "#5FB865" }}>Guardian \u2022 {form.relation}</p>
          <p className="text-sm mt-2 leading-relaxed" style={{ color: "#848484" }}>{form.bio}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="finance-card p-5">
          <h2 className="font-semibold mb-4" style={{ color: "#535353" }}>Contact Information</h2>
          <div className="space-y-3">
            {[{ icon: Phone, label: "Phone", key: "phone" }, { icon: Mail, label: "Email", key: "email" }, { icon: MapPin, label: "Location", key: "location" }].map(f => {
              const Icon = f.icon;
              return (<div key={f.key} className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#7CE57720" }}><Icon className="w-4 h-4" style={{ color: "#5FB865" }} /></div>{editing ? (<input className="flex-1 input-field py-1.5" value={form[f.key as keyof typeof form]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />) : (<div><p className="text-xs" style={{ color: "#848484" }}>{f.label}</p><p className="text-sm font-medium" style={{ color: "#535353" }}>{form[f.key as keyof typeof form]}</p></div>)}</div>);
            })}
          </div>
        </div>
        <div className="finance-card p-5">
          <h2 className="font-semibold mb-4" style={{ color: "#535353" }}>Account Details</h2>
          <div className="space-y-3">
            {[{ icon: User, label: "Relation to Patient", value: form.relation }, { icon: Heart, label: "Patients Under Care", value: patients ? `${patients.length} patient${patients.length !== 1 ? "s" : ""}` : "—" }, { icon: Shield, label: "Account Status", value: "Verified \u2713", valueColor: "#5FB865" }].map((item, i) => { const Icon = item.icon; return (<div key={i} className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "#7CE57720" }}><Icon className="w-4 h-4" style={{ color: "#5FB865" }} /></div><div><p className="text-xs" style={{ color: "#848484" }}>{item.label}</p><p className="text-sm font-medium" style={{ color: item.valueColor || "#535353" }}>{item.value}</p></div></div>); })}
          </div>
        </div>
      </div>

      <div className="finance-card p-5">
        <h2 className="font-semibold mb-4" style={{ color: "#535353" }}>Emergency Contact</h2>
        <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "#EF444420" }}><Phone className="w-4 h-4" style={{ color: "#EF4444" }} /></div>{editing ? (<input className="flex-1 input-field" value={form.emergencyContact} onChange={e => setForm(p => ({ ...p, emergencyContact: e.target.value }))} />) : (<div><p className="text-xs" style={{ color: "#848484" }}>Emergency Number</p><p className="text-sm font-medium" style={{ color: "#535353" }}>{form.emergencyContact}</p></div>)}</div>
      </div>

      {editing && (<div className="flex gap-3"><button onClick={() => setEditing(false)} className="flex-1 py-3 rounded-xl border text-sm font-medium" style={{ borderColor: "#E5E7EB", color: "#535353" }}>Cancel</button><button onClick={() => setEditing(false)} className="flex-1 py-3 rounded-xl text-white text-sm font-medium" style={{ background: "radial-gradient(143.86% 887.35% at -10.97% -22.81%, #A8F5A3 0%, #5FB865 100%)" }}>Save Changes</button></div>)}

      <style dangerouslySetInnerHTML={{ __html: ".finance-card { background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); } .input-field { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #E5E7EB; border-radius: 8px; outline: none; font-size: 0.875rem; color: #535353; } .input-field:focus { border-color: #5FB865; }" }} />
    </div>
  );
}