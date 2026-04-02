import { cn } from "@/frontend/theme/tokens";
import { Settings, Shield, CreditCard, Bell, Globe, Users, Save, AlertCircle } from "lucide-react";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { adminService } from "@/backend/services/admin.service";
import { PageSkeleton } from "@/frontend/components/PageSkeleton";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

const sections = [{ id: "general", label: "General", icon: Settings }, { id: "security", label: "Security", icon: Shield }, { id: "payments", label: "Payments", icon: CreditCard }, { id: "notifications", label: "Notifications", icon: Bell }, { id: "platform", label: "Platform", icon: Globe }, { id: "roles", label: "Roles & Permissions", icon: Users }];

export default function AdminSettingsPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.adminSettings", "Admin Settings"));

  const { data: initialSettings, loading: loadingSettings } = useAsyncData(() => adminService.getSettingsData());
  const [activeSection, setActiveSection] = useState("general");
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState<Record<string, any> | null>(null);

  // Sync loaded settings into local state
  useEffect(() => {
    if (initialSettings && !settings) {
      setSettings(initialSettings);
    }
  }, [initialSettings, settings]);

  if (loadingSettings || !settings) {
    return <PageSkeleton cards={2} />;
  }

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const toggle = (key: string) => setSettings(s => ({ ...s, [key]: !s[key as keyof typeof s] }));
  const update = (key: string, val: string) => setSettings(s => ({ ...s, [key]: val }));
  const Toggle = ({ settingKey }: { settingKey: string }) => (<button onClick={() => toggle(settingKey)} className="relative w-12 h-6 rounded-full transition-all" style={{ background: settings[settingKey] ? "#5FB865" : "#E5E7EB" }}><span className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all" style={{ left: settings[settingKey] ? "calc(100% - 22px)" : "2px" }} /></button>);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-semibold" style={{ color: "#535353" }}>Platform Settings</h1><p className="text-sm" style={{ color: "#848484" }}>Configure CareNet platform settings</p></div><button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm" style={{ background: saved ? "#5FB865" : "radial-gradient(143.86% 887.35% at -10.97% -22.81%, #A8AAFF 0%, #6062CC 100%)" }}><Save className="w-4 h-4" /> {saved ? "Saved!" : "Save Changes"}</button></div>
      {settings && settings.maintenanceMode && (<div className="p-3 rounded-xl flex items-center gap-2" style={{ background: "#EF444420", border: "1px solid #EF444440" }}><AlertCircle className="w-4 h-4 shrink-0" style={{ color: "#EF4444" }} /><p className="text-sm" style={{ color: "#535353" }}>Maintenance mode is ON. The platform is not accessible to users.</p></div>)}
      <div className="flex flex-col lg:flex-row gap-5">
        <div className="lg:w-52 shrink-0"><div className="finance-card p-2">{sections.map(s => { const Icon = s.icon; return (<button key={s.id} onClick={() => setActiveSection(s.id)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all" style={{ background: activeSection === s.id ? "#8082ED20" : "transparent", color: activeSection === s.id ? "#7B5EA7" : "#535353" }}><Icon className="w-4 h-4" />{s.label}</button>); })}</div></div>
        <div className="flex-1 finance-card p-6">
          {activeSection === "general" && (<div className="space-y-5"><h2 className="font-semibold text-lg" style={{ color: "#535353" }}>General Settings</h2>{[["Platform Name", "platformName", "text"], ["Support Email", "supportEmail", "email"], ["Support Phone", "supportPhone", "tel"]].map(([label, key, type]) => (<div key={key}><label className="block text-sm font-medium mb-1.5" style={{ color: "#535353" }}>{label}</label><input type={type} className="input-field" value={String(settings[key] ?? "")} onChange={e => update(key, e.target.value)} /></div>))}<div><label className="block text-sm font-medium mb-1.5" style={{ color: "#535353" }}>Default Language</label><select className="input-field" value={String(settings.defaultLanguage ?? "English")} onChange={e => update("defaultLanguage", e.target.value)}>{["Bengali", "English"].map(l => <option key={l}>{l}</option>)}</select></div><div className="flex items-center justify-between p-4 rounded-xl" style={{ background: "#F9FAFB" }}><div><p className="text-sm font-medium" style={{ color: "#535353" }}>Maintenance Mode</p><p className="text-xs" style={{ color: "#848484" }}>Disable public access to the platform</p></div><Toggle settingKey="maintenanceMode" /></div></div>)}
          {activeSection === "payments" && (<div className="space-y-5"><h2 className="font-semibold text-lg" style={{ color: "#535353" }}>Payment Settings</h2>{[["Platform Fee (%)", "platformFee"], ["Min Withdrawal (\u09F3)", "withdrawalMin"], ["Max Withdrawal (\u09F3)", "withdrawalMax"], ["Withdrawal Fee (%)", "withdrawalFee"]].map(([label, key]) => (<div key={key}><label className="block text-sm font-medium mb-1.5" style={{ color: "#535353" }}>{label}</label><input type="number" className="input-field" value={String(settings[key] ?? "")} onChange={e => update(key, e.target.value)} /></div>))}</div>)}
          {activeSection === "security" && (<div className="space-y-5"><h2 className="font-semibold text-lg" style={{ color: "#535353" }}>Security Settings</h2>{[["Max Login Attempts", "maxLoginAttempts"], ["Session Timeout (min)", "sessionTimeout"]].map(([label, key]) => (<div key={key}><label className="block text-sm font-medium mb-1.5" style={{ color: "#535353" }}>{label}</label><input type="number" className="input-field" value={String(settings[key] ?? "")} onChange={e => update(key, e.target.value)} /></div>))}<div className="flex items-center justify-between p-4 rounded-xl" style={{ background: "#F9FAFB" }}><div><p className="text-sm font-medium" style={{ color: "#535353" }}>Require 2FA for Caregivers</p><p className="text-xs" style={{ color: "#848484" }}>Force two-factor authentication</p></div><Toggle settingKey="mfaRequired" /></div></div>)}
          {activeSection === "notifications" && (<div className="space-y-5"><h2 className="font-semibold text-lg" style={{ color: "#535353" }}>Notification Settings</h2>{[{ key: "emailNotifications", label: "Email Notifications", desc: "Send system notifications via email" }, { key: "smsNotifications", label: "SMS Notifications", desc: "Send alerts via SMS (bKash/Grameenphone)" }, { key: "pushNotifications", label: "Push Notifications", desc: "Send mobile push notifications" }].map(item => (<div key={item.key} className="flex items-center justify-between p-4 rounded-xl" style={{ background: "#F9FAFB" }}><div><p className="text-sm font-medium" style={{ color: "#535353" }}>{item.label}</p><p className="text-xs" style={{ color: "#848484" }}>{item.desc}</p></div><Toggle settingKey={item.key} /></div>))}</div>)}
          {activeSection === "platform" && (<div className="space-y-5"><h2 className="font-semibold text-lg" style={{ color: "#535353" }}>Verification Settings</h2>{[{ key: "caregiverVerification", label: "Require Caregiver Verification", desc: "New caregivers must be approved before listing" }, { key: "agencyVerification", label: "Require Agency Verification", desc: "Agencies must submit license before listing" }, { key: "shopVerification", label: "Require Shop Verification", desc: "Shops must submit trade license" }].map(item => (<div key={item.key} className="flex items-center justify-between p-4 rounded-xl" style={{ background: "#F9FAFB" }}><div><p className="text-sm font-medium" style={{ color: "#535353" }}>{item.label}</p><p className="text-xs" style={{ color: "#848484" }}>{item.desc}</p></div><Toggle settingKey={item.key} /></div>))}</div>)}
          {activeSection === "roles" && (<div className="space-y-4"><h2 className="font-semibold text-lg" style={{ color: "#535353" }}>Roles & Permissions</h2>{["Caregiver", "Guardian", "Patient", "Agency", "Shop", "Moderator"].map(role => (<div key={role} className="p-4 rounded-xl" style={{ background: "#F9FAFB" }}><p className="font-medium text-sm mb-2" style={{ color: "#535353" }}>{role}</p><div className="flex flex-wrap gap-2">{["View", "Edit Profile", "Receive Messages", "Make Payments"].map(perm => (<span key={perm} className="px-2.5 py-1 rounded-full text-xs" style={{ background: "#7B5EA720", color: "#7B5EA7" }}>{perm}</span>))}</div></div>))}</div>)}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: ".finance-card { background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); } .input-field { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #E5E7EB; border-radius: 8px; outline: none; font-size: 0.875rem; color: #535353; background: white; } .input-field:focus { border-color: #7B5EA7; }" }} />
    </div>
  );
}