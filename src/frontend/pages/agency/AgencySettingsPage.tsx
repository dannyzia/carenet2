import { useState, useRef, type ChangeEvent } from "react";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { agencyService } from "@/backend/services/agency.service";
import { PageSkeleton } from "@/frontend/components/PageSkeleton";
import { cn } from "@/frontend/theme/tokens";
import {
  Building2, MapPin, Clock, Bell, CreditCard, Shield,
  Save, Camera, CheckCircle2, Upload, FileText, X, Plus,
} from "lucide-react";
import { useTranslation } from "react-i18next";

const DEFAULT_AREAS = ["Gulshan", "Banani", "Dhanmondi", "Uttara", "Mirpur", "Mohammadpur", "Bashundhara", "Badda"];
const DEFAULT_SERVICES = [
  { name: "Elderly Home Care", enabled: true },
  { name: "Post-Surgical Recovery", enabled: true },
  { name: "Pediatric Care", enabled: true },
  { name: "Maternity Care", enabled: false },
  { name: "Palliative Care", enabled: false },
  { name: "Physiotherapy", enabled: true },
];
const DEFAULT_NOTIFS = [
  { label: "New care requirement matches", desc: "When guardians post requirements matching your service areas", enabled: true },
  { label: "Shift alerts", desc: "Late check-ins, missed check-outs", enabled: true },
  { label: "Incident reports", desc: "Immediate alerts for incident reports filed", enabled: true },
  { label: "Payment notifications", desc: "Invoice payments, payroll processing", enabled: true },
  { label: "Platform announcements", desc: "CareNet platform updates", enabled: false },
];

export default function AgencySettingsPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.agencySettings", "Agency Settings"));

  const [activeTab, setActiveTab] = useState("profile");
  const { data: settingsData, loading } = useAsyncData(() => agencyService.getAgencySettings());

  // Profile form state — seeded from loaded data
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [seeded, setSeeded] = useState(false);

  // Service areas state
  const [areas, setAreas] = useState<string[]>(DEFAULT_AREAS);
  const [newArea, setNewArea] = useState("");

  // Services toggles
  const [services, setServices] = useState(DEFAULT_SERVICES);

  // Notification toggles
  const [notifs, setNotifs] = useState(DEFAULT_NOTIFS);

  // Hourly rate / payment terms
  const [hourlyRate, setHourlyRate] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("Net 7 days");

  // Save feedback
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // File upload ref
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadedDoc, setUploadedDoc] = useState<string | null>(null);

  if (loading || !settingsData) return <PageSkeleton />;

  // Seed controlled state from loaded data once
  if (!seeded) {
    setName(settingsData.name ?? "");
    setPhone(settingsData.phone ?? "");
    setEmail(settingsData.email ?? "");
    setAddress(settingsData.address ?? "");
    setHourlyRate(String(settingsData.hourlyRate ?? 350));
    setSeeded(true);
  }

  const complianceDocs = settingsData.complianceDocs ?? [
    { name: "Trade License", status: "valid" as const, expires: "—" },
    { name: "Tax Identification (TIN)", status: "valid" as const, expires: "N/A" },
    { name: "Professional Liability Insurance", status: "valid" as const, expires: "—" },
    { name: "Staff Background Check Policy", status: "review" as const, expires: "Needs update" },
  ];

  const handleSaveProfile = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const addArea = () => {
    const trimmed = newArea.trim();
    if (trimmed && !areas.includes(trimmed)) {
      setAreas([...areas, trimmed]);
    }
    setNewArea("");
  };

  const removeArea = (area: string) => setAreas(areas.filter((a) => a !== area));

  const toggleService = (idx: number) =>
    setServices(services.map((s, i) => (i === idx ? { ...s, enabled: !s.enabled } : s)));

  const toggleNotif = (idx: number) =>
    setNotifs(notifs.map((n, i) => (i === idx ? { ...n, enabled: !n.enabled } : n)));

  const handleUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setUploadedDoc(file.name);
  };

  const tabs = [
    { id: "profile", label: "Agency Profile", icon: Building2 },
    { id: "services", label: "Service Areas", icon: MapPin },
    { id: "operations", label: "Operations", icon: Clock },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "billing", label: "Billing", icon: CreditCard },
    { id: "compliance", label: "Compliance", icon: Shield },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl" style={{ color: cn.textHeading }}>Agency Settings</h1>
        <p className="text-sm mt-0.5" style={{ color: cn.textSecondary }}>
          Manage your agency profile, service areas, and operational settings
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap shrink-0 cn-touch-target"
              style={{
                background: activeTab === tab.id ? "var(--cn-teal-bg)" : "transparent",
                color: activeTab === tab.id ? "var(--cn-teal)" : cn.textSecondary,
              }}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Profile ── */}
      {activeTab === "profile" && (
        <div className="space-y-4">
          <div className="finance-card p-5 space-y-4">
            <h3 className="text-sm" style={{ color: cn.text }}>Basic Information</h3>
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-xl"
                style={{ background: "var(--cn-gradient-agency)" }}
              >
                {name.slice(0, 2).toUpperCase() || "AG"}
              </div>
              <button
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border cn-touch-target"
                style={{ borderColor: cn.border, color: cn.textSecondary }}
                onClick={() => alert("Logo upload coming soon")}
              >
                <Camera className="w-3 h-3" /> Change Logo
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: cn.textSecondary }}>Agency Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border text-sm"
                  style={{ background: cn.bgInput, borderColor: cn.border, color: cn.text }}
                />
              </div>
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: cn.textSecondary }}>Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border text-sm"
                  style={{ background: cn.bgInput, borderColor: cn.border, color: cn.text }}
                />
              </div>
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: cn.textSecondary }}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border text-sm"
                  style={{ background: cn.bgInput, borderColor: cn.border, color: cn.text }}
                />
              </div>
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: cn.textSecondary }}>Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border text-sm"
                  style={{ background: cn.bgInput, borderColor: cn.border, color: cn.text }}
                />
              </div>
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm cn-touch-target disabled:opacity-60"
              style={{ background: saved ? cn.green : "var(--cn-gradient-agency)" }}
            >
              {saved ? (
                <><CheckCircle2 className="w-4 h-4" /> Saved!</>
              ) : (
                <><Save className="w-4 h-4" /> {saving ? "Saving…" : "Save Changes"}</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Service Areas ── */}
      {activeTab === "services" && (
        <div className="space-y-4">
          <div className="finance-card p-5 space-y-4">
            <h3 className="text-sm" style={{ color: cn.text }}>Service Coverage Areas</h3>
            <div className="flex flex-wrap gap-2">
              {areas.map((area) => (
                <span
                  key={area}
                  className="px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5"
                  style={{ background: "var(--cn-teal-bg)", color: "var(--cn-teal)" }}
                >
                  <MapPin className="w-3 h-3" />
                  {area}
                  <button
                    onClick={() => removeArea(area)}
                    className="ml-1 opacity-50 hover:opacity-100 cn-touch-target"
                    aria-label={`Remove ${area}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add new area…"
                value={newArea}
                onChange={(e) => setNewArea(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addArea()}
                className="flex-1 px-4 py-2.5 rounded-xl border text-sm"
                style={{ background: cn.bgInput, borderColor: cn.border, color: cn.text }}
              />
              <button
                onClick={addArea}
                aria-label="Add service area"
                className="px-4 py-2.5 rounded-xl text-white text-sm cn-touch-target"
                style={{ background: "var(--cn-gradient-agency)" }}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="finance-card p-5 space-y-4">
            <h3 className="text-sm" style={{ color: cn.text }}>Care Services Offered</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {services.map((service, idx) => (
                <div
                  key={service.name}
                  className="flex items-center justify-between p-3 rounded-xl border"
                  style={{ borderColor: service.enabled ? "var(--cn-teal)" : cn.border }}
                >
                  <span className="text-sm" style={{ color: cn.text }}>{service.name}</span>
                  <button
                    onClick={() => toggleService(idx)}
                    aria-label={`Toggle ${service.name}`}
                    className={`w-10 h-6 rounded-full flex items-center px-0.5 transition-all cn-touch-target ${service.enabled ? "justify-end" : "justify-start"}`}
                    style={{ background: service.enabled ? "var(--cn-teal)" : cn.borderLight }}
                  >
                    <div className="w-5 h-5 rounded-full bg-white shadow" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Notifications ── */}
      {activeTab === "notifications" && (
        <div className="finance-card p-5 space-y-4">
          <h3 className="text-sm" style={{ color: cn.text }}>Notification Preferences</h3>
          {notifs.map((pref, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ background: cn.bgInput }}>
              <div>
                <p className="text-sm" style={{ color: cn.text }}>{pref.label}</p>
                <p className="text-xs" style={{ color: cn.textSecondary }}>{pref.desc}</p>
              </div>
              <button
                onClick={() => toggleNotif(i)}
                aria-label={`Toggle ${pref.label}`}
                className={`w-10 h-6 rounded-full flex items-center px-0.5 transition-all cn-touch-target ${pref.enabled ? "justify-end" : "justify-start"}`}
                style={{ background: pref.enabled ? "var(--cn-teal)" : cn.borderLight }}
              >
                <div className="w-5 h-5 rounded-full bg-white shadow" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Billing ── */}
      {activeTab === "billing" && (
        <div className="space-y-4">
          <div className="finance-card p-5 space-y-4">
            <h3 className="text-sm" style={{ color: cn.text }}>Payment Settings</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: cn.textSecondary }}>Default Hourly Rate (BDT)</label>
                <input
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border text-sm"
                  style={{ background: cn.bgInput, borderColor: cn.border, color: cn.text }}
                />
              </div>
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: cn.textSecondary }}>Invoice Payment Terms</label>
                <select
                  aria-label="Invoice payment terms"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border text-sm"
                  style={{ background: cn.bgInput, borderColor: cn.border, color: cn.text }}
                >
                  <option>Net 7 days</option>
                  <option>Net 15 days</option>
                  <option>Net 30 days</option>
                </select>
              </div>
            </div>
          </div>
          <div className="finance-card p-5 space-y-3">
            <h3 className="text-sm" style={{ color: cn.text }}>Bank Account</h3>
            <div className="p-3 rounded-xl flex items-center gap-3" style={{ background: cn.bgInput }}>
              <CreditCard className="w-5 h-5" style={{ color: "var(--cn-teal)" }} />
              <div>
                <p className="text-sm" style={{ color: cn.text }}>Dutch Bangla Bank Ltd</p>
                <p className="text-xs" style={{ color: cn.textSecondary }}>Account: ****4521 · Banani Branch</p>
              </div>
              <CheckCircle2 className="w-4 h-4 ml-auto" style={{ color: cn.green }} />
            </div>
          </div>
        </div>
      )}

      {/* ── Compliance ── */}
      {activeTab === "compliance" && (
        <div className="space-y-4">
          <div className="finance-card p-5 space-y-3">
            <h3 className="text-sm" style={{ color: cn.text }}>Verification Status</h3>
            <div className="p-3 rounded-xl flex items-center gap-3" style={{ background: cn.greenBg }}>
              <CheckCircle2 className="w-5 h-5" style={{ color: cn.green }} />
              <div>
                <p className="text-sm" style={{ color: cn.green }}>Verified Agency</p>
                <p className="text-xs" style={{ color: cn.textSecondary }}>Last verified: Feb 15, 2026</p>
              </div>
            </div>
          </div>
          <div className="finance-card p-5 space-y-3">
            <h3 className="text-sm" style={{ color: cn.text }}>Required Documents</h3>
            {complianceDocs.map((doc, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ background: cn.bgInput }}>
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4" style={{ color: cn.textSecondary }} />
                  <div>
                    <p className="text-sm" style={{ color: cn.text }}>{doc.name}</p>
                    <p className="text-xs" style={{ color: cn.textSecondary }}>Expires: {doc.expires}</p>
                  </div>
                </div>
                <span
                  className="px-2 py-0.5 rounded-full text-xs"
                  style={{
                    background: doc.status === "valid" ? cn.greenBg : cn.amberBg,
                    color: doc.status === "valid" ? cn.green : cn.amber,
                  }}
                >
                  {doc.status === "valid" ? "Valid" : "Needs Review"}
                </span>
              </div>
            ))}
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={handleUpload}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm cn-touch-target"
              style={{ borderColor: cn.border, color: cn.textSecondary }}
            >
              <Upload className="w-4 h-4" />
              {uploadedDoc ? `Uploaded: ${uploadedDoc}` : "Upload Document"}
            </button>
          </div>
        </div>
      )}

      {/* ── Operations ── */}
      {activeTab === "operations" && (
        <div className="space-y-4">
          <div className="finance-card p-5 space-y-4">
            <h3 className="text-sm" style={{ color: cn.text }}>Operating Hours</h3>
            <div className="space-y-2">
              {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"].map((day) => (
                <div key={day} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: cn.bgInput }}>
                  <span className="text-sm w-24" style={{ color: cn.text }}>{day}</span>
                  <input type="time" defaultValue="08:00" className="px-2 py-1.5 rounded-lg border text-sm" style={{ background: cn.bgCard, borderColor: cn.border, color: cn.text }} />
                  <span style={{ color: cn.textSecondary }}>to</span>
                  <input type="time" defaultValue="22:00" className="px-2 py-1.5 rounded-lg border text-sm" style={{ background: cn.bgCard, borderColor: cn.border, color: cn.text }} />
                </div>
              ))}
            </div>
          </div>
          <div className="finance-card p-5 space-y-4">
            <h3 className="text-sm" style={{ color: cn.text }}>Shift Configuration</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: cn.textSecondary }}>Default Shift Duration</label>
                <select aria-label="Default shift duration" className="w-full px-4 py-3 rounded-xl border text-sm" style={{ background: cn.bgInput, borderColor: cn.border, color: cn.text }}>
                  <option>8 hours</option>
                  <option>12 hours</option>
                </select>
              </div>
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: cn.textSecondary }}>Late Tolerance (minutes)</label>
                <input type="number" defaultValue="15" className="w-full px-4 py-3 rounded-xl border text-sm" style={{ background: cn.bgInput, borderColor: cn.border, color: cn.text }} />
              </div>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: ".finance-card { background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }" }} />
    </div>
  );
}
