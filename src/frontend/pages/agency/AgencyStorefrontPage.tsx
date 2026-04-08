"use client";
import React from "react";
import { Building, Star, MapPin, ShieldCheck, Users, Heart, Award, Clock } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { agencyService } from "@/backend/services/agency.service";
import { PageSkeleton } from "@/frontend/components/PageSkeleton";
import { useTranslation } from "react-i18next";

const defaultStaffImg =
  "https://images.unsplash.com/photo-1559839734-2b71f1536783?auto=format&fit=crop&q=80&w=200&h=200";

function StarRow({ rating }: { rating: number }) {
  const n = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${i < n ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`}
        />
      ))}
    </div>
  );
}

export default function AgencyStorefrontPage() {
  const { t, t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.agencyStorefront", "Agency Storefront"));

  const { data: storefront, loading } = useAsyncData(() => agencyService.getStorefrontData());

  if (loading || !storefront) return <PageSkeleton />;

  const agencyName = storefront.agency.name || "Agency";
  const agencyRating = storefront.agency.rating || 0;
  const agencyReviews = storefront.agency.reviews || 0;
  const agencyTagline = storefront.agency.tagline || "";
  const serviceNames = storefront.services.map(s => s.name);
  const established = storefront.agency.established;
  const successRate = storefront.agency.successRate;
  const responseTime = storefront.agency.responseTime;
  const tier = storefront.agency.tier;
  const locationLabel = storefront.agency.location?.trim() || "—";
  const staffTotal = storefront.agency.caregiverCount ?? storefront.staff.length;
  const staffMeta =
    staffTotal > 0 ? `${staffTotal}+ Active Staff` : storefront.staff.length > 0 ? "Featured team" : "—";

  return (
    <div>
      <div className="h-96 relative overflow-hidden -mx-4 md:-mx-6 -mt-4 md:-mt-6 mb-6">
        <img
          src="https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1600&h=600"
          className="w-full h-full object-cover"
          alt={t("agencyStorefrontPage.agencyCoverAlt", "Agency cover image")}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12 z-10 text-white">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-3xl bg-white p-3 flex items-center justify-center shadow-2xl">
                <Building className="w-12 h-12 text-[#FEB4C5]" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-4xl font-black">{agencyName}</h1>
                  <ShieldCheck className="w-6 h-6 text-[#7CE577]" />
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-white/80">
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /> {agencyRating.toFixed(1)} (
                    {agencyReviews.toLocaleString()} Reviews)
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-[#FEB4C5]" /> {locationLabel}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-[#7CE577]" /> {staffMeta}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button className="h-12 px-8 rounded-2xl bg-white text-gray-900 font-bold hover:bg-gray-100 shadow-xl">
                {t("agencyStorefrontPage.bookInstitutionalCare", "Book Institutional Care")}
              </Button>
              <Button className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 border border-white/20">
                <Heart className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-12 -mt-6 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            <section className="finance-card p-10">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">About Our Agency</h2>
              <p className="text-gray-600 leading-relaxed text-lg">
                {agencyTagline ||
                  `${agencyName} is a trusted healthcare staffing agency providing quality home care and institutional support.`}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
                {[
                  { label: "Founded", val: established ? String(established) : "—", icon: Award },
                  { label: "Success Rate", val: successRate != null ? `${successRate}%` : "—", icon: Star },
                  { label: "Response", val: responseTime || "—", icon: Clock },
                  { label: "Verified", val: tier || "Standard", icon: ShieldCheck },
                ].map((stat, i) => (
                  <div key={i} className="text-center p-4 rounded-3xl bg-gray-50 border border-gray-100">
                    <stat.icon className="w-6 h-6 mx-auto mb-3 text-[#FEB4C5]" />
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{stat.label}</p>
                    <p className="font-black text-gray-800">{stat.val}</p>
                  </div>
                ))}
              </div>
            </section>
            <section>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800">Featured Staff</h2>
                <Button variant="ghost" className="text-[#FEB4C5] font-bold">
                  {staffTotal > 0
                    ? `View all ${staffTotal} members`
                    : storefront.staff.length > 0
                      ? `View all ${storefront.staff.length} featured`
                      : "Team"}
                </Button>
              </div>
              {storefront.staff.length === 0 ? (
                <p className="text-sm text-gray-500">No featured staff listed yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {storefront.staff.map(s => (
                    <div
                      key={s.id}
                      className="finance-card p-6 flex items-center gap-5 group hover:border-[#FEB4C5] transition-all"
                    >
                      <img
                        src={s.imageUrl || defaultStaffImg}
                        className="w-20 h-20 rounded-2xl object-cover shadow-lg"
                        alt={s.name}
                      />
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800 text-lg group-hover:text-[#FEB4C5] transition-colors">
                          {s.name}
                        </h3>
                        <p className="text-sm text-gray-400 font-medium mb-4">{s.role}</p>
                        <Button variant="outline" className="h-9 px-4 rounded-xl text-xs font-bold border-gray-200">
                          View Profile
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
          <div className="lg:col-span-1 space-y-8">
            <div className="finance-card p-10 bg-[#1F2937] text-white">
              <h3 className="text-xl font-bold mb-6">Service Offerings</h3>
              <div className="space-y-4">
                {(serviceNames.length > 0 ? serviceNames : ["Care Services"]).map((s, i) => (
                  <div key={i} className="flex items-center gap-3 py-3 border-b border-white/10 last:border-none">
                    <div className="w-2 h-2 rounded-full bg-[#7CE577]" />
                    <span className="text-sm font-medium text-white/80">{s}</span>
                  </div>
                ))}
              </div>
              <Button className="w-full mt-10 h-14 bg-[#7CE577] hover:bg-[#5FB865] text-white font-black rounded-2xl shadow-xl">
                {t("agencyStorefrontPage.getPersonalizedQuote", "Get Personalized Quote")}
              </Button>
            </div>
            <div className="finance-card p-8">
              <h3 className="font-bold text-gray-800 mb-6">Patient Reviews</h3>
              {storefront.reviewItems.length === 0 ? (
                <p className="text-sm text-gray-500">No reviews yet.</p>
              ) : (
                <div className="space-y-6">
                  {storefront.reviewItems.map((r, idx) => (
                    <div key={idx} className="space-y-3 pb-6 border-b border-gray-50 last:border-none last:pb-0">
                      <StarRow rating={r.rating} />
                      <p className="text-xs text-gray-500 italic leading-relaxed">&quot;{r.text}&quot;</p>
                      <p className="text-[10px] font-bold text-gray-800">
                        — {r.authorName}
                        {r.authorRole ? `, ${r.authorRole}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <style
        dangerouslySetInnerHTML={{
          __html:
            ".finance-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.4); border-radius: 3rem; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.05); }",
        }}
      />
    </div>
  );
}
