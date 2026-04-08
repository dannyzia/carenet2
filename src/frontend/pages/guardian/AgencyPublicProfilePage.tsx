import { cn } from "@/frontend/theme/tokens";
import { Link, useParams, useLocation } from "react-router";
import { Building2, Star, MapPin, Phone, Mail, Shield, Users, Clock, ChevronLeft, Heart, CheckCircle2, MessageSquare } from "lucide-react";
import { useAsyncData, useDocumentTitle, useCareSeekerBasePath } from "@/frontend/hooks";
import { guardianService } from "@/backend/services/guardian.service";
import { PageSkeleton } from "@/frontend/components/PageSkeleton";
import { useTranslation } from "react-i18next";

export default function AgencyPublicProfilePage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.agencyPublicProfile", "Agency Public Profile"));

  const base = useCareSeekerBasePath();
  const location = useLocation();
  const { id } = useParams();
  const { data: agency, loading } = useAsyncData(() => guardianService.getAgencyPublicProfile(id ?? "a1"), [id]);

  if (loading || !agency) return <PageSkeleton />;

  return (
    <>
      <div className="max-w-3xl mx-auto space-y-6 pb-8">
        <Link to={`${base}/search`} className="inline-flex items-center gap-1 text-sm" style={{ color: cn.textSecondary }}><ChevronLeft className="w-4 h-4" /> Back to Search</Link>
        <div className="rounded-2xl p-6 text-white relative overflow-hidden" style={{ background: "var(--cn-gradient-agency)" }}>
          <div className="flex items-center gap-4"><div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-xl shrink-0">HP</div><div><div className="flex items-center gap-2"><h1 className="text-xl">{agency.name}</h1><Shield className="w-5 h-5 text-white/80" /></div><p className="text-sm text-white/70">{agency.tagline}</p><div className="flex items-center gap-3 mt-1 text-sm text-white/80"><span className="flex items-center gap-1"><Star className="w-3 h-3" /> {agency.rating} ({agency.reviewCount} reviews)</span><span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {agency.location}</span></div></div></div>
        </div>
        <div className="finance-card p-4 flex flex-wrap gap-4 text-sm" style={{ color: cn.textSecondary }}><span className="flex items-center gap-1.5"><Phone className="w-4 h-4" /> {agency.phone}</span><span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {agency.email}</span><span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> Est. {agency.established}</span></div>
        <div className="finance-card p-5"><h2 className="text-sm mb-2" style={{ color: cn.text }}>About</h2><p className="text-sm" style={{ color: cn.textSecondary }}>{agency.about}</p></div>
        <div><h2 className="text-sm mb-3" style={{ color: cn.text }}>Services Offered</h2><div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{agency.services.map((s) => (<div key={s.name} className="finance-card p-4"><div className="flex items-center gap-2 mb-1"><Heart className="w-4 h-4" style={{ color: cn.teal }} /><h3 className="text-sm" style={{ color: cn.text }}>{s.name}</h3></div><p className="text-xs mb-2" style={{ color: cn.textSecondary }}>{s.desc}</p><p className="text-sm" style={{ color: cn.green }}>Starting {s.rate}</p></div>))}</div></div>
        <div><h2 className="text-sm mb-3" style={{ color: cn.text }}>Our Caregivers</h2><div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">{agency.caregivers.map((c) => (<div key={c.name} className="finance-card p-3 min-w-[140px] text-center shrink-0"><div className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-xs" style={{ background: cn.pinkBg, color: cn.pink }}>{c.name.split(" ").map((w) => w[0]).join("")}</div><p className="text-sm truncate" style={{ color: cn.text }}>{c.name}</p><p className="text-xs" style={{ color: cn.textSecondary }}>{c.specialty}</p><p className="text-xs mt-1 flex items-center justify-center gap-1" style={{ color: cn.amber }}><Star className="w-3 h-3" />{c.rating}</p></div>))}</div></div>
        <div><h2 className="text-sm mb-3" style={{ color: cn.text }}>Reviews ({agency.reviewCount})</h2><div className="space-y-3">{agency.reviews.map((r, i) => (<div key={i} className="finance-card p-4"><div className="flex items-center justify-between mb-2"><span className="text-sm" style={{ color: cn.text }}>{r.author}</span><div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, j) => (<Star key={j} className="w-3 h-3" style={{ color: j < r.rating ? cn.amber : cn.border }} fill={j < r.rating ? cn.amber : "none"} />))}</div></div><p className="text-sm" style={{ color: cn.textSecondary }}>{r.text}</p><p className="text-xs mt-2" style={{ color: cn.textSecondary }}>{r.date}</p></div>))}</div></div>
        <div className="finance-card p-4"><h2 className="text-sm mb-3" style={{ color: cn.text }}>Coverage & Guarantees</h2><div className="space-y-2">{[{ icon: Shield, text: "24/7 Coverage Guarantee" }, { icon: Users, text: "Caregiver Replacement within 4 hours" }, { icon: Clock, text: "Response Time SLA: under 2 hours" }].map((g) => (<div key={g.text} className="flex items-center gap-2 text-sm" style={{ color: cn.textSecondary }}><g.icon className="w-4 h-4" style={{ color: cn.green }} /><span>{g.text}</span></div>))}</div></div>
        <Link
          to={`${base}/care-requirement-wizard?agency=${id || "a1"}`}
          state={{ wizardReturnTo: `${location.pathname}${location.search}` }}
          className="block w-full py-3.5 rounded-xl text-white text-center text-sm"
          style={{ background: "var(--cn-gradient-guardian)" }}
        >
          Submit Care Requirement
        </Link>
      </div>
    </>
  );
}