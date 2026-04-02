"use client";
import React, { useState } from "react";
import { Search, Filter, MapPin, Star, ChevronRight, User, Clock, ShieldCheck, Calendar, Building2, Users, Shield, X, SlidersHorizontal, Loader2 } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { Link } from "react-router";
import { cn } from "@/frontend/theme/tokens";
import { PageHero } from "@/frontend/components/PageHero";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose, DrawerFooter } from "@/frontend/components/ui/drawer";
import { useAsyncData, useDebouncedSearch, useDocumentTitle, useCareSeekerBasePath } from "@/frontend/hooks";
import { agencyService, caregiverService } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import type { Agency, CaregiverProfile } from "@/backend/models";
import { useTranslation } from "react-i18next";

type SearchTab = "agencies" | "caregivers";

export default function CaregiverSearchPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.caregiverSearch", "Caregiver Search"));

  // Initial data load (all)
  const { data: allAgencies, loading: loadingA } = useAsyncData(() => agencyService.searchAgencies());
  const { data: allCaregivers, loading: loadingC } = useAsyncData(() => caregiverService.searchCaregivers(""));

  // Debounced search overlays
  const agencySearch = useDebouncedSearch<Agency[]>((q) => agencyService.searchAgencies(q), 300);
  const caregiverSearch = useDebouncedSearch<CaregiverProfile[]>((q) => caregiverService.searchCaregivers(q), 300);

  const [activeTab, setActiveTab] = useState<SearchTab>("agencies");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const base = useCareSeekerBasePath();

  if ((loadingA || loadingC) || !allAgencies || !allCaregivers) return <PageSkeleton cards={4} />;

  // Use search results when user is typing, otherwise show all
  const searchTerm = agencySearch.query;
  const setSearchTerm = (q: string) => { agencySearch.setQuery(q); caregiverSearch.setQuery(q); };
  const mockAgencies = searchTerm.trim() ? (agencySearch.results ?? allAgencies) : allAgencies;
  const mockCaregivers = searchTerm.trim() ? (caregiverSearch.results ?? allCaregivers) : allCaregivers;
  const isSearching = agencySearch.loading || caregiverSearch.loading;

  const filterOptions = [
    { group: "Specialty", items: ["Elder Care", "Pediatric", "Post-Op", "Night Care", "Dementia", "Respite", "Disability", "Palliative"] },
    { group: "Location", items: ["Gulshan", "Banani", "Dhanmondi", "Uttara", "Mirpur", "Mohammadpur"] },
    { group: "Rating", items: ["4.5+ Stars", "4.0+ Stars", "3.5+ Stars"] },
  ];
  const toggleFilter = (item: string) => { setSelectedFilters((prev) => prev.includes(item) ? prev.filter((f) => f !== item) : [...prev, item]); };

  return (
    <div>
      <PageHero gradient="var(--cn-gradient-guardian)" className="pt-8 md:pt-12 pb-20 md:pb-24 px-4 md:px-6 relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10 text-white">
          <h1 className="text-2xl md:text-3xl mb-2">Find a Care Agency</h1>
          <p className="text-white/70 text-sm mb-4 md:mb-6">Agencies provide verified caregivers, 24/7 coverage, and guaranteed replacement</p>
          <div className="relative group flex gap-2">
            <div className="relative flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#FEB4C5] transition-colors" /><input type="text" placeholder="Search by agency, specialty, or location..." className="w-full h-12 md:h-14 pl-12 pr-4 rounded-2xl bg-white text-gray-800 shadow-xl border-none focus:ring-2 focus:ring-white/50 outline-none" style={{ fontSize: "16px" }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
            <button onClick={() => setFilterOpen(true)} className="md:hidden w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0"><SlidersHorizontal className="w-5 h-5 text-white" /></button>
          </div>
          <div className="hidden md:flex gap-3 mt-4 overflow-x-auto pb-2 cn-scroll-x">{["Elder Care", "Pediatric", "Post-Op", "Night Care", "Dementia", "Respite"].map((tag) => (<button key={tag} onClick={() => toggleFilter(tag)} className="px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors" style={{ background: selectedFilters.includes(tag) ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}>{tag}</button>))}</div>
          {selectedFilters.length > 0 && (<div className="flex md:hidden gap-2 mt-3 overflow-x-auto cn-scroll-x">{selectedFilters.map((f) => (<button key={f} onClick={() => toggleFilter(f)} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs whitespace-nowrap bg-white/30 backdrop-blur-md">{f} <X className="w-3 h-3" /></button>))}</div>)}
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
      </PageHero>

      <Drawer open={filterOpen} onOpenChange={setFilterOpen}>
        <DrawerContent className="max-h-[80vh]">
          <DrawerHeader className="flex items-center justify-between px-4 py-3"><DrawerTitle>Filters</DrawerTitle><DrawerClose asChild><Button variant="ghost" size="icon" className="cn-touch-target"><X className="w-5 h-5" /></Button></DrawerClose></DrawerHeader>
          <div className="px-4 pb-4 overflow-y-auto cn-scroll-mobile space-y-6">{filterOptions.map((group) => (<div key={group.group}><h4 className="text-sm mb-3" style={{ color: cn.textHeading }}>{group.group}</h4><div className="flex flex-wrap gap-2">{group.items.map((item) => (<button key={item} onClick={() => toggleFilter(item)} className="px-3 py-2 rounded-xl text-sm transition-all cn-touch-target" style={{ background: selectedFilters.includes(item) ? cn.greenBg : cn.bgInput, color: selectedFilters.includes(item) ? cn.green : cn.text, border: `1px solid ${selectedFilters.includes(item) ? cn.green : cn.border}` }}>{item}</button>))}</div></div>))}</div>
          <DrawerFooter className="px-4 pb-6"><div className="flex gap-3"><Button variant="outline" className="flex-1 rounded-xl" onClick={() => setSelectedFilters([])}>Clear All</Button><Button className="flex-1 rounded-xl text-white" style={{ background: "var(--cn-gradient-guardian)" }} onClick={() => setFilterOpen(false)}>Apply ({selectedFilters.length})</Button></div></DrawerFooter>
        </DrawerContent>
      </Drawer>

      <div className="max-w-4xl mx-auto px-4 md:px-6 -mt-10 md:-mt-12 relative z-20">
        <div className="flex gap-2 mb-6">
          <button onClick={() => setActiveTab("agencies")} className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm transition-all shadow-sm" style={{ background: activeTab === "agencies" ? cn.bgCard : "transparent", color: activeTab === "agencies" ? cn.green : "white", border: `1px solid ${activeTab === "agencies" ? cn.border : "rgba(255,255,255,0.3)"}` }}><Building2 className="w-4 h-4" /> Agencies</button>
          <button onClick={() => setActiveTab("caregivers")} className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm transition-all shadow-sm" style={{ background: activeTab === "caregivers" ? cn.bgCard : "transparent", color: activeTab === "caregivers" ? cn.pink : "white", border: `1px solid ${activeTab === "caregivers" ? cn.border : "rgba(255,255,255,0.3)"}` }}><User className="w-4 h-4" /> Browse Caregivers</button>
        </div>

        {activeTab === "agencies" && (<>
          <div className="flex justify-between items-center mb-6"><p style={{ color: cn.textSecondary }} className="text-sm">{mockAgencies.length} verified agencies</p><Button variant="outline" className="rounded-xl" style={{ borderColor: cn.green, color: cn.green }}><Filter className="w-4 h-4 mr-2" />Filters</Button></div>
          <div className="space-y-4">{mockAgencies.map((agency) => (<div key={agency.id} className="finance-card p-5"><div className="flex gap-4"><div className="relative flex-shrink-0"><img src={agency.image} alt={agency.name} className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white shadow-md" />{agency.verified && (<div className="absolute -bottom-1 -right-1 p-1 rounded-full border-2 border-white shadow-sm" style={{ background: cn.teal }}><Shield className="w-3 h-3 text-white" /></div>)}</div><div className="flex-1 min-w-0"><h3 className="text-base truncate" style={{ color: cn.text }}>{agency.name}</h3><p className="text-sm" style={{ color: cn.teal }}>{agency.tagline}</p><div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2"><div className="flex items-center text-sm" style={{ color: cn.textSecondary }}><Star className="w-4 h-4 mr-1" style={{ color: cn.amber }} /><span>{agency.rating}</span><span className="ml-1 opacity-60">({agency.reviews})</span></div><div className="flex items-center text-sm" style={{ color: cn.textSecondary }}><MapPin className="w-4 h-4 mr-1" style={{ color: cn.pink }} />{agency.location}</div><div className="flex items-center text-sm" style={{ color: cn.textSecondary }}><Users className="w-4 h-4 mr-1" style={{ color: cn.green }} />{agency.caregiverCount} caregivers</div><div className="flex items-center text-sm" style={{ color: cn.textSecondary }}><Clock className="w-4 h-4 mr-1" style={{ color: cn.teal }} />Response: {agency.responseTime}</div></div><div className="flex gap-2 mt-3">{agency.specialties.map((spec) => (<span key={spec} className="px-2 py-0.5 rounded-full text-xs" style={{ background: cn.greenBg, color: cn.green }}>{spec}</span>))}</div><div className="flex gap-2 mt-4"><Link to={`${base}/agency/${agency.id}`} className="px-4 py-2 rounded-xl text-sm border flex items-center gap-1" style={{ borderColor: cn.teal, color: cn.teal }}>View Agency Profile</Link><Link to={`${base}/care-requirement-wizard?agency=${agency.id}`} className="px-4 py-2 rounded-xl text-sm text-white flex items-center gap-1" style={{ background: "var(--cn-gradient-guardian)" }}>Submit Care Requirement</Link></div></div></div></div>))}</div>
        </>)}

        {activeTab === "caregivers" && (<>
          <div className="finance-card p-3 mb-4 flex items-center gap-2 text-sm" style={{ background: cn.amberBg, border: `1px solid rgba(232,168,56,0.3)` }}><ShieldCheck className="w-4 h-4 shrink-0" style={{ color: cn.amber }} /><span style={{ color: cn.amber }}>Caregivers are hired through agencies. Browse profiles below for research, then submit a care requirement to their agency.</span></div>
          <div className="flex justify-between items-center mb-6"><p style={{ color: cn.textSecondary }} className="text-sm">324 caregivers across all agencies</p><Button variant="outline" className="rounded-xl" style={{ borderColor: cn.pink, color: cn.pink }}><Filter className="w-4 h-4 mr-2" />Filters</Button></div>
          <div className="space-y-4">{mockCaregivers.map((caregiver) => (<Link key={caregiver.id} to={`${base}/caregiver/${caregiver.id}`} className="block finance-card p-5 hover:scale-[1.01] transition-all"><div className="flex gap-5"><div className="relative flex-shrink-0"><img src={caregiver.image} alt={caregiver.name} className="w-20 h-20 rounded-2xl object-cover ring-2 ring-white shadow-md" />{caregiver.verified && (<div className="absolute -bottom-1 -right-1 bg-green-500 text-white p-1 rounded-full border-2 border-white shadow-sm"><ShieldCheck className="w-3 h-3" /></div>)}</div><div className="flex-1 min-w-0"><div className="flex justify-between items-start mb-1"><div><h3 className="text-base truncate" style={{ color: cn.text }}>{caregiver.name}</h3><p className="text-sm" style={{ color: cn.pink }}>{caregiver.type}</p></div><span className="px-2 py-1 rounded-lg text-xs shrink-0" style={{ background: cn.tealBg, color: cn.teal }}>{caregiver.agency}</span></div><div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2"><div className="flex items-center text-sm" style={{ color: cn.textSecondary }}><Star className="w-4 h-4 mr-1" style={{ color: cn.amber }} /><span>{caregiver.rating}</span><span className="ml-1 opacity-60">({caregiver.reviews})</span></div><div className="flex items-center text-sm" style={{ color: cn.textSecondary }}><MapPin className="w-4 h-4 mr-1" style={{ color: cn.pink }} />{caregiver.location}</div><div className="flex items-center text-sm" style={{ color: cn.textSecondary }}><Clock className="w-4 h-4 mr-1" style={{ color: cn.green }} />{caregiver.experience} exp</div></div><div className="flex gap-2 mt-3">{caregiver.specialties.map((spec) => (<span key={spec} className="px-2 py-0.5 rounded-full text-xs" style={{ background: cn.bgInput, color: cn.textSecondary }}>{spec}</span>))}</div><p className="text-xs mt-2" style={{ color: cn.textSecondary }}>Availability managed by agency</p></div><div className="flex flex-col justify-center pl-2"><ChevronRight className="w-5 h-5" style={{ color: cn.textSecondary }} /></div></div></Link>))}</div>
        </>)}
        <div className="mt-8 text-center"><Button variant="ghost" style={{ color: cn.textSecondary }}>Load more {activeTab === "agencies" ? "agencies" : "caregivers"}</Button></div>
      </div>
    </div>
  );
}