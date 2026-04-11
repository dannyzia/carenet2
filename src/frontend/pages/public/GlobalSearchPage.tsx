"use client";

import React, { useState } from "react";
import { Search, ArrowLeft, X, Loader2, ChevronRight, Star, Link } from "lucide-react";
import { Link as RouterLink } from "react-router";
import { useTransitionNavigate } from "@/frontend/hooks/useTransitionNavigate";
import { cn } from "@/frontend/theme/tokens";
import { useDebouncedSearch, useDocumentTitle } from "@/frontend/hooks";
import { searchService, type GlobalSearchResults } from "@/backend/services";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/frontend/auth/AuthContext";
import { features } from "@/config/features";

export default function GlobalSearchPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.globalSearch", "Global Search"));

  const navigate = useTransitionNavigate();
  const { user } = useAuth();
  const seekerBase = user?.activeRole === "patient" ? "/patient" : "/guardian";
  const hideCaregiverResults =
    !features.careSeekerCaregiverContactEnabled &&
    !!user &&
    (user.activeRole === "guardian" || user.activeRole === "patient");
  const [activeTab, setActiveTab] = useState("all");
  const { query, setQuery, results, loading } = useDebouncedSearch<GlobalSearchResults>(
    (q) => searchService.globalSearch(q),
    300
  );

  const caregiversRaw = results?.caregivers ?? [];
  const caregivers = hideCaregiverResults ? [] : caregiversRaw;
  const agencies = results?.agencies ?? [];
  const jobs = results?.jobs ?? [];
  const totalResults = caregivers.length + agencies.length + jobs.length;

  return (
    <div className="p-4" style={{ background: "var(--cn-gradient-caregiver)" }}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg text-white"><ArrowLeft /></button>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search caregivers, agencies, jobs..."
              className="w-full h-12 pl-10 pr-10 rounded-xl bg-white border-none outline-none text-base"
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            )}
            {loading && (
              <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-500 animate-spin" />
            )}
          </div>
        </div>
        <div className="flex gap-4 text-white/80 text-sm">
          {[
            { id: "all", label: "All", count: totalResults },
            { id: "caregivers", label: "Caregivers", count: caregivers.length },
            { id: "agencies", label: "Agencies", count: agencies.length },
            { id: "jobs", label: "Jobs", count: jobs.length },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`pb-2 transition-all ${activeTab === t.id ? 'text-white font-medium border-b-2 border-white' : 'text-white/60'}`}>
              {t.label} ({t.count})
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-10">
            {/* Empty state */}
            {!query.trim() && (
              <div className="finance-card p-12 text-center">
                <Search className="w-10 h-10 mx-auto mb-4" style={{ color: cn.textSecondary }} />
                <h3 className="text-lg" style={{ color: cn.textHeading }}>Start typing to search</h3>
                <p className="text-sm mt-2" style={{ color: cn.textSecondary }}>Search across caregivers, agencies, and job listings</p>
              </div>
            )}

            {/* No results */}
            {query.trim() && !loading && totalResults === 0 && (
              <div className="finance-card p-12 text-center">
                <h3 className="text-lg" style={{ color: cn.textHeading }}>No results for "{query}"</h3>
                <p className="text-sm mt-2" style={{ color: cn.textSecondary }}>Try different keywords or browse categories</p>
              </div>
            )}

            {/* Caregivers section */}
            {(activeTab === "all" || activeTab === "caregivers") && caregivers.length > 0 && (
              <section className="space-y-6">
                <div className="flex justify-between items-center px-4">
                  <h2 className="text-xl text-gray-800">Caregivers</h2>
                  <RouterLink to={`${seekerBase}/search`} className="text-[10px] text-[#FEB4C5] uppercase tracking-widest">See all results</RouterLink>
                </div>
                <div className="space-y-3">
                  {caregivers.slice(0, 5).map(c => (
                    <RouterLink key={c.id} to={`${seekerBase}/caregiver/${c.id}`} className="finance-card p-5 flex items-center justify-between hover:border-[#FEB4C5] transition-all">
                      <div className="flex items-center gap-4">
                        <img src={c.image} className="w-14 h-14 rounded-2xl object-cover" alt={c.name} />
                        <div>
                          <h3 className="text-gray-800 leading-none">{c.name}</h3>
                          <p className="text-[10px] text-[#FEB4C5] uppercase mt-2">{c.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400 fill-yellow-400" /><span className="text-xs text-gray-800">{c.rating}</span></div>
                          <p className="text-[10px] text-gray-300 uppercase">{c.verified ? "Verified" : ""}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-200" />
                      </div>
                    </RouterLink>
                  ))}
                </div>
              </section>
            )}

            {/* Agencies section */}
            {(activeTab === "all" || activeTab === "agencies") && agencies.length > 0 && (
              <section className="space-y-6">
                <div className="flex justify-between items-center px-4">
                  <h2 className="text-xl text-gray-800">Agencies</h2>
                  <RouterLink to="/guardian/search" className="text-[10px] text-[#5FB865] uppercase tracking-widest">See all results</RouterLink>
                </div>
                <div className="space-y-3">
                  {agencies.slice(0, 3).map(a => (
                    <RouterLink key={a.id} to={`/guardian/agency/${a.id}`} className="finance-card p-5 flex items-center justify-between hover:border-[#5FB865] transition-all">
                      <div className="flex items-center gap-4">
                        <img src={a.image} className="w-14 h-14 rounded-2xl object-cover" alt={a.name} />
                        <div>
                          <h3 className="text-gray-800 leading-none">{a.name}</h3>
                          <p className="text-[10px] uppercase mt-2" style={{ color: cn.teal }}>{a.tagline}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <div className="flex items-center gap-1 text-xs" style={{ color: cn.textSecondary }}><Star className="w-3 h-3" style={{ color: cn.amber }} />{a.rating}</div>
                            <div className="flex items-center gap-1 text-xs" style={{ color: cn.textSecondary }}><MapPin className="w-3 h-3" style={{ color: cn.pink }} />{a.location}</div>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-200" />
                    </RouterLink>
                  ))}
                </div>
              </section>
            )}

            {/* Jobs section */}
            {(activeTab === "all" || activeTab === "jobs") && jobs.length > 0 && (
              <section className="space-y-6">
                <div className="flex justify-between items-center px-4">
                  <h2 className="text-xl text-gray-800">Jobs</h2>
                  <RouterLink to="/marketplace" className="text-[10px] text-[#0288D1] uppercase tracking-widest">See all results</RouterLink>
                </div>
                <div className="space-y-3">
                  {jobs.slice(0, 3).map(j => (
                    <RouterLink key={j.id} to={`/marketplace/job/${j.id}`} className="finance-card p-5 flex items-center justify-between hover:border-[#0288D1] transition-all">
                      <div>
                        <h3 className="text-gray-800 leading-none">{j.title}</h3>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1 text-xs" style={{ color: cn.textSecondary }}><MapPin className="w-3 h-3" style={{ color: cn.pink }} />{j.location}</div>
                          <div className="flex items-center gap-1 text-xs" style={{ color: cn.textSecondary }}><Clock className="w-3 h-3" style={{ color: cn.teal }} />{j.type}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm" style={{ color: cn.green }}>{j.salary}</span>
                        <ChevronRight className="w-5 h-5 text-gray-200" />
                      </div>
                    </RouterLink>
                  ))}
                </div>
              </section>
            )}
          </div>

          </div>
      </div>
    </div>
  );
}