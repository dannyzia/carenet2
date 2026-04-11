"use client";
import React from "react";
import { Star, MapPin, ShieldCheck, Clock, Award, Calendar, MessageCircle, Phone, ArrowLeft, ChevronRight, CheckCircle2, Heart, Building2, Shield } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { Link, useParams, useLocation } from "react-router";
import { PageHero } from "@/frontend/components/PageHero";
import { cn } from "@/frontend/theme/tokens";
import { useAsyncData, useDocumentTitle, useCareSeekerBasePath } from "@/frontend/hooks";
import { guardianService } from "@/backend/services/guardian.service";
import { PageSkeleton } from "@/frontend/components/PageSkeleton";
import { useTranslation } from "react-i18next";
import { CareSeekerIsolationRedirect, useCareSeekerIsolationTarget } from "@/frontend/hooks/useCareSeekerIsolationRedirect";

export default function CaregiverPublicProfilePage() {
  const isolationTarget = useCareSeekerIsolationTarget();
  if (isolationTarget) {
    return <CareSeekerIsolationRedirect />;
  }
  return <CaregiverPublicProfilePageContent />;
}

function CaregiverPublicProfilePageContent() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.caregiverPublicProfile", "Caregiver Public Profile"));

  const base = useCareSeekerBasePath();
  const location = useLocation();
  const { id } = useParams();
  const { data: caregiver, loading } = useAsyncData(() => guardianService.getCaregiverPublicProfile(id ?? "c1"), [id]);

  if (loading || !caregiver) return <PageSkeleton />;

  return (
    <div>
      <PageHero gradient="radial-gradient(143.86% 887.35% at -10.97% -22.81%, #FEB4C5 0%, #DB869A 100%)" className="h-64 relative overflow-hidden"><div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" /></PageHero>
      <div className="max-w-4xl mx-auto px-6 -mt-32 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="finance-card p-6 text-center">
              <div className="relative inline-block mb-4"><img src={caregiver.image} alt={caregiver.name} className="w-32 h-32 rounded-3xl object-cover ring-4 ring-white shadow-xl mx-auto" /><div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-2 rounded-full border-4 border-white shadow-lg"><ShieldCheck className="w-5 h-5" /></div></div>
              <h1 className="text-2xl font-bold text-gray-800">{caregiver.name}</h1>
              <p className="text-[#FEB4C5] font-semibold text-sm mb-2">{caregiver.type}</p>
              <Link to={`${base}/agency/${caregiver.agency.id}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs mb-4" style={{ background: cn.tealBg, color: cn.teal }}><Building2 className="w-3 h-3" />Works with: {caregiver.agency.name}</Link>
              <div className="flex justify-center items-center gap-1 mb-6"><Star className="w-5 h-5 text-yellow-400 fill-yellow-400" /><span className="font-bold text-gray-800">{caregiver.rating}</span><span className="text-gray-400 ml-1">({caregiver.reviews} reviews)</span></div>
              <div className="space-y-3 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm"><span className="text-gray-500 flex items-center"><MapPin className="w-4 h-4 mr-2" /> Location</span><span className="font-semibold text-gray-800">{caregiver.location}</span></div>
                <div className="flex items-center justify-between text-sm"><span className="text-gray-500 flex items-center"><Clock className="w-4 h-4 mr-2" /> Experience</span><span className="font-semibold text-gray-800">{caregiver.experience}</span></div>
                <div className="flex items-center justify-between text-sm"><span className="text-gray-500 flex items-center"><Heart className="w-4 h-4 mr-2" /> Rate</span><span className="font-bold text-[#7CE577] text-lg">{caregiver.price}<span className="text-xs text-gray-400 font-normal">/hr</span></span></div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Link
                to={`${base}/care-requirement-wizard?agency=${caregiver.agency.id}`}
                state={{ wizardReturnTo: `${location.pathname}${location.search}` }}
              >
                <Button className="w-full h-14 rounded-2xl shadow-lg text-lg font-bold" style={{ background: "var(--cn-gradient-guardian)" }}>Submit Care Requirement</Button>
              </Link>
              <Link to={`${base}/agency/${caregiver.agency.id}`}><Button variant="outline" className="w-full h-12 rounded-xl" style={{ borderColor: cn.teal, color: cn.teal }}><Building2 className="w-5 h-5 mr-2" /> Contact Agency</Button></Link>
            </div>
          </div>
          <div className="lg:col-span-2 space-y-8">
            <div className="finance-card p-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">About Me</h2>
              <p className="text-gray-600 leading-relaxed mb-8">{caregiver.bio}</p>
              <h3 className="font-bold text-gray-800 mb-4 flex items-center"><Award className="w-5 h-5 mr-2 text-[#FEB4C5]" />Specialties</h3>
              <div className="flex flex-wrap gap-2 mb-8">{caregiver.specialties.map(spec => (<span key={spec} className="px-4 py-2 bg-[#FFF5F7] text-[#DB869A] text-sm font-medium rounded-xl border border-[#FEB4C5]/20">{spec}</span>))}</div>
              <h3 className="font-bold text-gray-800 mb-4 flex items-center"><Award className="w-5 h-5 mr-2 text-[#7CE577]" />Education & Certifications</h3>
              <div className="space-y-4">{caregiver.education.map((edu, idx) => (<div key={idx} className="flex gap-4"><div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0"><CheckCircle2 className="w-5 h-5 text-[#7CE577]" /></div><div><p className="font-bold text-gray-800">{edu.degree}</p><p className="text-sm text-gray-500">{edu.school} \u2022 {edu.year}</p></div></div>))}</div>
            </div>
            <div className="finance-card p-8">
              <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-gray-800 flex items-center"><Calendar className="w-5 h-5 mr-2 text-[#FEB4C5]" />Availability</h2><span className="text-xs px-3 py-1 rounded-lg" style={{ background: cn.amberBg, color: cn.amber }}>Availability managed by agency</span></div>
              <div className="grid grid-cols-7 gap-2">{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (<div key={i} className="text-center"><div className="text-[10px] font-bold text-gray-400 mb-2">{day}</div><div className={`h-12 rounded-xl flex items-center justify-center ${i < 5 ? 'bg-[#E8F9E7] text-[#5FB865]' : 'bg-gray-100 text-gray-300'}`}>{i < 5 ? <CheckCircle2 className="w-5 h-5" /> : '-'}</div></div>))}</div>
            </div>
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: ".finance-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.4); border-radius: 2rem; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.03); }" }} />
    </div>
  );
}
