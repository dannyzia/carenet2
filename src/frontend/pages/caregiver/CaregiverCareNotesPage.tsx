import { useState } from "react";
import { cn } from "@/frontend/theme/tokens";
import { FileText, Plus, Clock, User, Calendar, Search, Filter, AlertTriangle, Eye, Star, Tag, Camera, Mic, ChevronDown, Heart, Pill, Activity, MessageSquare, Pin, Footprints } from "lucide-react";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { caregiverService } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { useTranslation } from "react-i18next";

interface CareNote {
  id: string;
  patientName: string;
  date: string;
  time: string;
  category: string;
  title: string;
  content: string;
  mood?: string;
  severity?: "low" | "medium" | "high";
  pinned: boolean;
  tags: string[];
  attachments: number;
}

const categoryConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  observation: { label: "Observation", icon: Eye, color: "#0288D1" },
  incident: { label: "Incident", icon: AlertTriangle, color: "#EF4444" },
  medication: { label: "Medication", icon: Pill, color: "#5FB865" },
  progress: { label: "Progress", icon: Star, color: "#F59E0B" },
  family: { label: "Family Update", icon: Heart, color: "#E91E63" },
  general: { label: "General", icon: FileText, color: "#6B7280" },
  vitals: { label: "Vitals", icon: Activity, color: "#0288D1" },
  activity: { label: "Activity", icon: Footprints, color: "#8B5CF6" },
};

export default function CaregiverCareNotesPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.caregiverCareNotes", "Caregiver Care Notes"));

  const { data: loadedNotes, loading } = useAsyncData(() => caregiverService.getCareNotes());

  if (loading || !loadedNotes) return <PageSkeleton cards={4} />;

  return <CareNotesContent initialNotes={loadedNotes as CareNote[]} />;
}

function CareNotesContent({ initialNotes }: { initialNotes: CareNote[] }) {
  const [notes] = useState(initialNotes);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPatient, setFilterPatient] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedNote, setExpandedNote] = useState<string | null>(null);
  const [form, setForm] = useState({ patientName: "", category: "general", title: "", content: "", mood: "", severity: "" as string, tags: "" });

  const patients = [...new Set(notes.map(n => n.patientName))];
  const filtered = notes.filter(n => {
    if (filterCategory !== "all" && n.category !== filterCategory) return false;
    if (filterPatient !== "all" && n.patientName !== filterPatient) return false;
    if (searchQuery) { const q = searchQuery.toLowerCase(); return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || n.tags.some(t => t.includes(q)); }
    return true;
  });
  const sorted = [...filtered].sort((a, b) => { if (a.pinned !== b.pinned) return a.pinned ? -1 : 1; return `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`); });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h1 className="text-xl" style={{ color: cn.textHeading }}>Care Notes & Remarks</h1><p className="text-sm mt-0.5" style={{ color: cn.textSecondary }}>{notes.length} entries across {patients.length} patients</p></div>
        <button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm" style={{ background: "var(--cn-gradient-caregiver)" }}><Plus className="w-4 h-4" /> New Note</button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[{ label: "Observations", count: notes.filter(n => n.category === "observation").length, color: "#0288D1" }, { label: "Incidents", count: notes.filter(n => n.category === "incident").length, color: "#EF4444" }, { label: "Progress Notes", count: notes.filter(n => n.category === "progress").length, color: "#F59E0B" }, { label: "Pinned", count: notes.filter(n => n.pinned).length, color: cn.pink }].map((stat, i) => (
          <div key={i} className="finance-card p-3 text-center"><p className="text-lg" style={{ color: stat.color }}>{stat.count}</p><p className="text-xs" style={{ color: cn.textSecondary }}>{stat.label}</p></div>
        ))}
      </div>

      {showAddForm && (
        <div className="finance-card p-5 space-y-4" style={{ borderLeft: `3px solid ${cn.pink}` }}>
          <h3 className="text-sm flex items-center gap-2" style={{ color: cn.pink }}><FileText className="w-4 h-4" /> New Care Note</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className="text-xs mb-1.5 block" style={{ color: cn.textSecondary }}>Patient</label><select value={form.patientName} onChange={e => setForm({ ...form, patientName: e.target.value })} className="w-full px-4 py-3 rounded-xl border text-sm" style={{ background: cn.bgInput, borderColor: cn.border, color: cn.text }}><option value="">Select patient</option>{patients.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
            <div><label className="text-xs mb-1.5 block" style={{ color: cn.textSecondary }}>Category</label><select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-3 rounded-xl border text-sm" style={{ background: cn.bgInput, borderColor: cn.border, color: cn.text }}>{Object.entries(categoryConfig).map(([key, cfg]) => (<option key={key} value={key}>{cfg.label}</option>))}</select></div>
            <div><label className="text-xs mb-1.5 block" style={{ color: cn.textSecondary }}>Patient Mood</label><select value={form.mood} onChange={e => setForm({ ...form, mood: e.target.value })} className="w-full px-4 py-3 rounded-xl border text-sm" style={{ background: cn.bgInput, borderColor: cn.border, color: cn.text }}><option value="">Optional</option><option value={"\u{1F60A} Happy"}>{"\u{1F60A} Happy"}</option><option value={"\u{1F610} Neutral"}>{"\u{1F610} Neutral"}</option><option value={"\u{1F622} Sad"}>{"\u{1F622} Sad"}</option><option value={"\u{1F624} Agitated"}>{"\u{1F624} Agitated"}</option><option value={"\u{1F634} Drowsy"}>{"\u{1F634} Drowsy"}</option></select></div>
          </div>
          {form.category === "incident" && (<div><label className="text-xs mb-1.5 block" style={{ color: cn.textSecondary }}>Severity</label><div className="flex gap-2">{(["low", "medium", "high"] as const).map(s => (<button key={s} onClick={() => setForm({ ...form, severity: s })} className="flex-1 py-2 rounded-lg text-xs border capitalize" style={{ borderColor: form.severity === s ? "#EF4444" : cn.border, color: form.severity === s ? "#EF4444" : cn.text, background: form.severity === s ? "rgba(239,68,68,0.1)" : "transparent" }}>{s}</button>))}</div></div>)}
          <div><label className="text-xs mb-1.5 block" style={{ color: cn.textSecondary }}>Title</label><input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Brief summary of the note" className="w-full px-4 py-3 rounded-xl border text-sm" style={{ background: cn.bgInput, borderColor: cn.border, color: cn.text }} /></div>
          <div><label className="text-xs mb-1.5 block" style={{ color: cn.textSecondary }}>Detailed Notes</label><textarea rows={4} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Write your observations, remarks, or incident details here..." className="w-full px-4 py-3 rounded-xl border text-sm resize-none" style={{ background: cn.bgInput, borderColor: cn.border, color: cn.text }} /></div>
          <div><label className="text-xs mb-1.5 block" style={{ color: cn.textSecondary }}>Tags (comma separated)</label><input type="text" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="e.g., fall-risk, sleep, medication" className="w-full px-4 py-3 rounded-xl border text-sm" style={{ background: cn.bgInput, borderColor: cn.border, color: cn.text }} /></div>
          <div className="flex gap-3"><button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm" style={{ borderColor: cn.border, color: cn.textSecondary }}><Camera className="w-4 h-4" /> Photo</button><button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm" style={{ borderColor: cn.border, color: cn.textSecondary }}><Mic className="w-4 h-4" /> Voice Note</button></div>
          <div className="flex gap-3 pt-2"><button className="px-5 py-2.5 rounded-xl text-white text-sm" style={{ background: "var(--cn-gradient-caregiver)" }}>Save Note</button><button onClick={() => setShowAddForm(false)} className="px-5 py-2.5 rounded-xl text-sm border" style={{ borderColor: cn.border, color: cn.textSecondary }}>Cancel</button></div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border" style={{ borderColor: cn.border, background: cn.bgInput }}><Search className="w-4 h-4" style={{ color: cn.textSecondary }} /><input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search notes..." className="bg-transparent outline-none text-sm" style={{ color: cn.text }} /></div>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="px-3 py-2 rounded-xl border text-sm" style={{ borderColor: cn.border, background: cn.bgInput, color: cn.text }}><option value="all">All Categories</option>{Object.entries(categoryConfig).map(([key, cfg]) => (<option key={key} value={key}>{cfg.label}</option>))}</select>
        <select value={filterPatient} onChange={e => setFilterPatient(e.target.value)} className="px-3 py-2 rounded-xl border text-sm" style={{ borderColor: cn.border, background: cn.bgInput, color: cn.text }}><option value="all">All Patients</option>{patients.map(p => <option key={p} value={p}>{p}</option>)}</select>
      </div>

      <div className="space-y-3">
        {sorted.map(note => {
          const cfg = categoryConfig[note.category] ?? categoryConfig.general;
          const Icon = cfg.icon;
          const isExpanded = expandedNote === note.id;
          return (
            <div key={note.id} className="finance-card p-4 sm:p-5 cursor-pointer" style={{ borderLeft: `3px solid ${cfg.color}` }} onClick={() => setExpandedNote(isExpanded ? null : note.id)}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${cfg.color}15` }}><Icon className="w-4 h-4" style={{ color: cfg.color }} /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {note.pinned && <Pin className="w-3 h-3 shrink-0" style={{ color: cn.pink }} />}
                    <span className="text-sm" style={{ color: cn.text }}>{note.title}</span>
                    {note.severity && (<span className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: note.severity === "high" ? "rgba(239,68,68,0.15)" : note.severity === "medium" ? "rgba(245,158,11,0.15)" : "rgba(107,114,128,0.15)", color: note.severity === "high" ? "#EF4444" : note.severity === "medium" ? "#F59E0B" : "#6B7280" }}>{note.severity}</span>)}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs" style={{ color: cn.textSecondary }}>
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> {note.patientName}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {note.date}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {note.time}</span>
                    {note.mood && <span>{note.mood}</span>}
                  </div>
                  {isExpanded ? (
                    <div className="mt-3">
                      <p className="text-sm whitespace-pre-wrap" style={{ color: cn.text, lineHeight: "1.6" }}>{note.content}</p>
                      {note.tags.length > 0 && (<div className="flex flex-wrap gap-1.5 mt-3">{note.tags.map(tag => (<span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]" style={{ background: cn.bgInput, color: cn.textSecondary }}><Tag className="w-2.5 h-2.5" /> {tag}</span>))}</div>)}
                      {note.attachments > 0 && (<p className="text-xs mt-2 flex items-center gap-1" style={{ color: cn.pink }}><Camera className="w-3 h-3" /> {note.attachments} attachment(s)</p>)}
                    </div>
                  ) : (<p className="text-xs mt-1 line-clamp-2" style={{ color: cn.textSecondary }}>{note.content}</p>)}
                </div>
                <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} style={{ color: cn.textSecondary }} />
              </div>
            </div>
          );
        })}
      </div>

      {sorted.length === 0 && (<div className="finance-card p-8 text-center"><FileText className="w-8 h-8 mx-auto mb-2" style={{ color: cn.textSecondary }} /><p className="text-sm" style={{ color: cn.textSecondary }}>No care notes found</p></div>)}
    </div>
  );
}