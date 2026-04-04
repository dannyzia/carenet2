import { useState, useRef } from "react";
import { cn } from "@/frontend/theme/tokens";
import { AlertTriangle, Camera, MapPin, CheckCircle, Upload, X, Clock, FileText, ChevronRight } from "lucide-react";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { guardianService } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { useTranslation } from "react-i18next";

const INCIDENT_TYPES = [
  { value: "fall", label: "Fall", icon: "🚶", color: "#EF4444" },
  { value: "medication_error", label: "Medication Error", icon: "💊", color: "#F59E0B" },
  { value: "behavioral", label: "Behavioral Incident", icon: "⚠️", color: "#F97316" },
  { value: "equipment", label: "Equipment Failure", icon: "🔧", color: "#6B7280" },
  { value: "skin_integrity", label: "Skin Integrity", icon: "🩹", color: "#8B5CF6" },
  { value: "other", label: "Other", icon: "📋", color: "#0288D1" },
];

const SEVERITY_LEVELS = [
  { value: "low", label: "Low", color: "#0288D1", desc: "Minor, no injury" },
  { value: "medium", label: "Medium", color: "#F59E0B", desc: "Requires attention" },
  { value: "high", label: "High", color: "#F97316", desc: "Injury or risk" },
  { value: "critical", label: "Critical", color: "#EF4444", desc: "Emergency" },
];

export default function GuardianIncidentReportPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.guardianIncidentReport", "Guardian incident report"));

  const { data: patients, loading } = useAsyncData(() => guardianService.getPatients());
  const { data: history, loading: l2 } = useAsyncData(() => guardianService.getIncidentHistory());
  if (loading || l2 || !patients || !history) return <PageSkeleton cards={3} />;
  return <IncidentContent patients={patients} history={history} />;
}

function IncidentContent({ patients, history }: { patients: any[]; history: any[] }) {
  const [mode, setMode] = useState<"list" | "form">("list");
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ type: "", severity: "", patientId: "", description: "", immediateAction: "", photos: [] as string[] });
  const [submitted, setSubmitted] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);

  const addPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm(f => ({ ...f, photos: [...f.photos, reader.result as string] }));
    reader.readAsDataURL(file);
  };

  const removePhoto = (idx: number) => setForm(f => ({ ...f, photos: f.photos.filter((_, i) => i !== idx) }));

  const handleSubmit = async () => {
    await guardianService.reportIncident({
      type: form.type, severity: form.severity, patientId: form.patientId,
      description: form.description, immediateAction: form.immediateAction, photos: form.photos,
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto space-y-5">
        <div className="finance-card p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{ background: "rgba(95,184,101,0.15)" }}>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <p style={{ color: cn.textHeading }}>Incident Reported</p>
          <p className="text-sm" style={{ color: cn.textSecondary }}>Your report has been submitted. The agency and guardian have been notified.</p>
          <button onClick={() => { setSubmitted(false); setMode("list"); setStep(0); setForm({ type: "", severity: "", patientId: "", description: "", immediateAction: "", photos: [] }); }}
            className="px-6 py-2.5 rounded-xl text-white text-sm" style={{ background: "var(--cn-gradient-guardian)" }}>
            Back to Incidents
          </button>
        </div>
      </div>
    );
  }

  if (mode === "list") {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div><h1 className="text-xl" style={{ color: cn.textHeading }}>Incident Reports</h1><p className="text-sm mt-0.5" style={{ color: cn.textSecondary }}>{history.length} incidents on record</p></div>
          <button onClick={() => { setMode("form"); setStep(0); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm" style={{ background: "var(--cn-gradient-guardian)" }}>
            <AlertTriangle className="w-4 h-4" /> Report Incident
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SEVERITY_LEVELS.map(s => {
            const count = history.filter((h: any) => h.severity === s.value).length;
            return (
              <div key={s.value} className="finance-card p-3 text-center">
                <p className="text-lg" style={{ color: s.color }}>{count}</p>
                <p className="text-xs" style={{ color: cn.textSecondary }}>{s.label}</p>
              </div>
            );
          })}
        </div>

        <div className="space-y-2">
          {history.map((h: any) => {
            const sev = SEVERITY_LEVELS.find(s => s.value === h.severity);
            return (
              <div key={h.id} className="finance-card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-8 rounded-full" style={{ background: sev?.color }} />
                  <div>
                    <p className="text-sm" style={{ color: cn.textHeading }}>{h.type}</p>
                    <p className="text-xs" style={{ color: cn.textSecondary }}>{h.patient} · {h.date}</p>
                  </div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{
                  background: h.status === "resolved" ? "rgba(95,184,101,0.1)" : h.status === "closed" ? "rgba(107,114,128,0.1)" : "rgba(245,158,11,0.1)",
                  color: h.status === "resolved" ? cn.green : h.status === "closed" ? cn.textSecondary : "var(--cn-amber)",
                }}>
                  {h.status.replace("_", " ")}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── Multi-step form ───
  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl" style={{ color: cn.textHeading }}>Report Incident</h1>
          <p className="text-sm" style={{ color: cn.textSecondary }}>Step {step + 1} of 4</p>
        </div>
        <button onClick={() => setMode("list")} className="text-sm" style={{ color: cn.textSecondary }}>Cancel</button>
      </div>

      {/* Progress */}
      <div className="flex gap-1">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="flex-1 h-1 rounded-full" style={{ background: i <= step ? cn.pink : cn.bgInput }} />
        ))}
      </div>

      {/* Step 0: Type */}
      {step === 0 && (
        <div className="space-y-3">
          <p className="text-sm" style={{ color: cn.textHeading }}>What type of incident?</p>
          <div className="grid grid-cols-2 gap-2">
            {INCIDENT_TYPES.map(t => (
              <button key={t.value} onClick={() => { setForm(f => ({ ...f, type: t.value })); setStep(1); }}
                className="finance-card p-4 text-center hover:scale-[1.02] transition-transform" style={{ borderColor: form.type === t.value ? t.color : undefined, borderWidth: form.type === t.value ? 2 : undefined }}>
                <span className="text-2xl">{t.icon}</span>
                <p className="text-sm mt-1" style={{ color: cn.text }}>{t.label}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 1: Severity + Patient */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <p className="text-sm mb-2" style={{ color: cn.textHeading }}>Severity</p>
            <div className="grid grid-cols-2 gap-2">
              {SEVERITY_LEVELS.map(s => (
                <button key={s.value} onClick={() => setForm(f => ({ ...f, severity: s.value }))}
                  className="finance-card p-3 text-left" style={{ borderColor: form.severity === s.value ? s.color : undefined, borderWidth: form.severity === s.value ? 2 : undefined }}>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ background: s.color }} /><span className="text-sm" style={{ color: cn.text }}>{s.label}</span></div>
                  <p className="text-xs mt-0.5" style={{ color: cn.textSecondary }}>{s.desc}</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm mb-1.5 block" style={{ color: cn.textHeading }}>Patient</label>
            <select value={form.patientId} onChange={e => setForm(f => ({ ...f, patientId: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border text-sm" style={{ background: cn.bgInput, borderColor: cn.border, color: cn.text }}>
              <option value="">Select patient</option>
              {patients.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <button onClick={() => setStep(2)} disabled={!form.severity || !form.patientId}
            className="w-full py-3 rounded-xl text-white text-sm disabled:opacity-50" style={{ background: "var(--cn-gradient-guardian)" }}>
            Continue
          </button>
        </div>
      )}

      {/* Step 2: Description */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="text-sm mb-1.5 block" style={{ color: cn.textHeading }}>What happened?</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={4} placeholder="Describe the incident in detail..."
              className="w-full px-4 py-3 rounded-xl border text-sm resize-none" style={{ background: cn.bgInput, borderColor: cn.border, color: cn.text }} />
          </div>
          <div>
            <label className="text-sm mb-1.5 block" style={{ color: cn.textHeading }}>Immediate action taken</label>
            <textarea value={form.immediateAction} onChange={e => setForm(f => ({ ...f, immediateAction: e.target.value }))}
              rows={2} placeholder="What did you do immediately?"
              className="w-full px-4 py-3 rounded-xl border text-sm resize-none" style={{ background: cn.bgInput, borderColor: cn.border, color: cn.text }} />
          </div>
          <button onClick={() => setStep(3)} disabled={!form.description}
            className="w-full py-3 rounded-xl text-white text-sm disabled:opacity-50" style={{ background: "var(--cn-gradient-guardian)" }}>
            Continue
          </button>
        </div>
      )}

      {/* Step 3: Photos + Submit */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <p className="text-sm mb-2" style={{ color: cn.textHeading }}>Attach Photos (optional)</p>
            <div className="flex flex-wrap gap-2">
              {form.photos.map((url, i) => (
                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => removePhoto(i)} className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {form.photos.length < 4 && (
                <button onClick={() => photoRef.current?.click()} className="w-20 h-20 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1" style={{ borderColor: cn.border, color: cn.textSecondary }}>
                  <Camera className="w-5 h-5" /><span className="text-xs">Add</span>
                </button>
              )}
            </div>
            <input ref={photoRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={addPhoto} />
          </div>

          {/* Summary */}
          <div className="finance-card p-4 space-y-2" style={{ borderLeft: `3px solid ${SEVERITY_LEVELS.find(s => s.value === form.severity)?.color}` }}>
            <p className="text-xs" style={{ color: cn.textSecondary }}>Summary</p>
            <p className="text-sm" style={{ color: cn.textHeading }}>{INCIDENT_TYPES.find(t => t.value === form.type)?.label} — {form.severity.toUpperCase()}</p>
            <p className="text-xs" style={{ color: cn.textSecondary }}>{form.description.slice(0, 100)}...</p>
            <p className="text-xs" style={{ color: cn.textSecondary }}>{form.photos.length} photo(s) attached</p>
          </div>

          <button onClick={handleSubmit} className="w-full py-3 rounded-xl text-white text-sm" style={{ background: "var(--cn-gradient-guardian)" }}>
            Submit Incident Report
          </button>
        </div>
      )}

      {/* Back button for steps > 0 */}
      {step > 0 && (
        <button onClick={() => setStep(s => s - 1)} className="w-full py-2 text-sm" style={{ color: cn.textSecondary }}>
          ← Back
        </button>
      )}
    </div>
  );
}
