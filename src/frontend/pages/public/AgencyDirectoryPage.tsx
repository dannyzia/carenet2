import { useState } from "react";
import { Link, useLocation } from "react-router";
import { cn } from "@/frontend/theme/tokens";
import { Search, MapPin, Star, Users, Shield, ChevronRight, Filter, Building2, CheckCircle2 } from "lucide-react";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { agencyService } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { useTranslation } from "react-i18next";

const specialties = ["All", "Elder Care", "Pediatric", "Post-Op", "Night Care", "Disability", "Respite", "Dementia", "Palliative"];

export default function AgencyDirectoryPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.agencyDirectory", "Agency Directory"));

  const location = useLocation();
  const { data: agencies, loading } = useAsyncData(() => agencyService.getDirectoryAgencies());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("All");
  const [minRating, setMinRating] = useState(0);

  if (loading || !agencies) return <PageSkeleton cards={4} />;

  const filtered = agencies.filter((a) => {
    const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty = selectedSpecialty === "All" || a.specialties.includes(selectedSpecialty);
    const matchesRating = a.rating >= minRating;
    return matchesSearch && matchesSpecialty && matchesRating;
  });

  return (
    <div className="min-h-screen" style={{ background: cn.bgPage }}>
      <div className="py-12 px-6 text-white" style={{ background: "var(--cn-gradient-agency)" }}>
        <div className="max-w-5xl mx-auto text-center">
          <Building2 className="w-10 h-10 mx-auto mb-3 text-white/80" />
          <h1 className="text-3xl mb-2">Find a Trusted Care Agency</h1>
          <p className="text-white/70 mb-6">Browse verified care agencies across Bangladesh</p>
          <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by agency name or location..." className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/15 backdrop-blur text-white placeholder-white/50 border border-white/20 text-sm" />
          </div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {specialties.map((s) => (
              <button key={s} onClick={() => setSelectedSpecialty(s)} className="px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all" style={{ background: selectedSpecialty === s ? cn.tealBg : cn.bgCard, color: selectedSpecialty === s ? cn.teal : cn.textSecondary, border: `1px solid ${selectedSpecialty === s ? cn.teal : cn.border}` }}>{s}</button>
            ))}
          </div>
          <select value={minRating} onChange={(e) => setMinRating(Number(e.target.value))} className="px-3 py-1.5 rounded-lg text-xs border" style={{ background: cn.bgCard, borderColor: cn.border, color: cn.text }}>
            <option value={0}>Any Rating</option>
            <option value={4}>4+ Stars</option>
            <option value={4.5}>4.5+ Stars</option>
          </select>
        </div>
        <p className="text-sm mb-4" style={{ color: cn.textSecondary }}>{filtered.length} agencies found</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((agency) => (
            <div key={agency.id} className="finance-card p-5 hover:shadow-md transition-all">
              <div className="flex items-start gap-4 mb-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-sm text-white shrink-0" style={{ background: "var(--cn-gradient-agency)" }}>{agency.logo}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm truncate" style={{ color: cn.text }}>{agency.name}</h3>
                    {agency.verified && <Shield className="w-4 h-4 shrink-0" style={{ color: cn.teal }} />}
                  </div>
                  <p className="text-xs" style={{ color: cn.textSecondary }}>{agency.tagline}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mb-3 text-xs" style={{ color: cn.textSecondary }}>
                <span className="flex items-center gap-1"><Star className="w-3 h-3" style={{ color: cn.amber }} /> {agency.rating} ({agency.reviews})</span>
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {agency.location}</span>
              </div>
              <div className="flex items-center gap-3 mb-3 text-xs" style={{ color: cn.textSecondary }}>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {agency.caregivers} caregivers</span>
                <span>{agency.years} years active</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {agency.specialties.map((s) => (<span key={s} className="px-2 py-0.5 rounded-full text-xs" style={{ background: cn.tealBg, color: cn.teal }}>{s}</span>))}
              </div>
              <div className="flex gap-2">
                <Link to={`/guardian/agency/${agency.id}`} className="flex-1 py-2 rounded-lg text-xs text-center border flex items-center justify-center gap-1" style={{ borderColor: cn.teal, color: cn.teal }}>View Profile <ChevronRight className="w-3 h-3" /></Link>
                <Link
                  to={`/guardian/care-requirement-wizard?agency=${agency.id}`}
                  state={{ wizardReturnTo: `${location.pathname}${location.search}` }}
                  className="flex-1 py-2 rounded-lg text-xs text-center text-white"
                  style={{ background: "var(--cn-gradient-agency)" }}
                >
                  Submit Requirement
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}