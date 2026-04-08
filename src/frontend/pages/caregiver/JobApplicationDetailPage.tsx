import { ArrowLeft, MapPin, Clock, DollarSign, User, Star, CheckCircle, Building2, Calendar, FileText, CheckCircle2, ShieldCheck, MessageSquare } from "lucide-react";
import React from "react";
import { Button } from "@/frontend/components/ui/button";
import { useNavigate, useParams } from "react-router";
import { PageHero } from "@/frontend/components/PageHero";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { caregiverService } from "@/backend/services/caregiver.service";
import { PageSkeleton } from "@/frontend/components/PageSkeleton";
import { useTranslation } from "react-i18next";

export default function JobApplicationDetailPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.jobApplicationDetail", "Job Application Detail"));

  const { id } = useParams();
  const navigate = useNavigate();
  const { data: application, loading } = useAsyncData(() => caregiverService.getJobApplicationDetail(id ?? ""), [id]);

  if (loading || !application) return <PageSkeleton />;

  return (
    <>
      <PageHero gradient="radial-gradient(143.86% 887.35% at -10.97% -22.81%, #7CE577 0%, #5FB865 100%)">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8"><h1 className="text-2xl font-bold text-white">Application Detail</h1></div>
          <div className="finance-card p-6 !bg-white/10 !backdrop-blur-xl !border-white/20 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white"><Building2 className="w-7 h-7" /></div>
              <div><p className="text-white font-bold text-lg">{application.jobTitle}</p><p className="text-white/70 text-sm">Applied on {application.appliedDate}</p></div>
            </div>
            <div className="px-4 py-2 rounded-full bg-[#E8F9E7] text-[#5FB865] text-xs font-bold uppercase tracking-widest">{application.status.replace(/_/g, " ")}</div>
          </div>
        </div>
      </PageHero>

      <div className="max-w-4xl mx-auto px-6 -mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="finance-card p-8">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Job Overview</h2>
              <div className="grid grid-cols-2 gap-6 mb-8">
                {[{ icon: Calendar, label: "Applied", value: application.appliedDate }, { icon: MapPin, label: "Location", value: application.location }, { icon: Building2, label: "Agency", value: application.agency }, { icon: User, label: "Salary", value: application.salary }].map(item => {
                  const Icon = item.icon;
                  return (<div key={item.label} className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center"><Icon className="w-5 h-5 text-gray-400" /></div><div><p className="text-[10px] font-bold text-gray-400 uppercase">{item.label}</p><p className="text-sm font-bold text-gray-800">{item.value}</p></div></div>);
                })}
              </div>
              <h3 className="font-bold text-gray-800 mb-3">Job Description</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-6">Seeking a certified caregiver for overnight assistance following a hip replacement surgery. Responsibilities include monitoring vitals, managing medication schedule, assisting with mobility to the restroom, and ensuring patient comfort.</p>
              <h3 className="font-bold text-gray-800 mb-3">Requirements</h3>
              <div className="flex flex-wrap gap-2">{application.requirements.map(s => (<span key={s} className="px-3 py-1.5 bg-gray-50 text-gray-500 text-xs font-bold rounded-lg border border-gray-100">{s}</span>))}</div>
            </div>
            <div className="finance-card p-8">
              <h2 className="text-xl font-bold text-gray-800 mb-8">Application Status</h2>
              <div className="space-y-8 relative before:absolute before:left-5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                {application.timeline.map((step, i) => (
                  <div key={i} className="flex gap-6 relative z-10">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm ${step.done ? 'bg-[#E8F9E7] text-[#5FB865]' : 'bg-gray-100 text-gray-400'}`}><CheckCircle2 className="w-5 h-5" /></div>
                    <div><p className="font-bold text-gray-800">{step.step}</p><p className="text-xs text-gray-400">{step.date}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-1 space-y-6">
            <div className="finance-card p-6 bg-gradient-to-br from-[#7CE577]/10 to-[#5FB865]/10 border-[#7CE577]/20">
              <h3 className="font-bold text-gray-800 mb-4">Salary / Payout</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Offered</span><span className="font-bold text-gray-800">{application.salary}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Status</span><span className="font-bold text-gray-800 capitalize">{application.status.replace(/_/g, " ")}</span></div>
                <div className="pt-3 border-t border-[#7CE577]/20 flex justify-between items-center"><span className="font-bold text-gray-800">Agency</span><span className="text-sm font-bold text-[#5FB865]">{application.agency}</span></div>
              </div>
            </div>
            <div className="finance-card p-6">
              <h3 className="font-bold text-gray-800 mb-4">Agency</h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#E8F9E7] flex items-center justify-center text-[#5FB865] font-bold text-lg">{application.agency.charAt(0)}</div>
                <div><p className="font-bold text-gray-800">{application.agency}</p><div className="flex items-center text-[10px] text-gray-400"><ShieldCheck className="w-3 h-3 text-[#7CE577] mr-1" /> {application.location}</div></div>
              </div>
              <Button variant="ghost" className="w-full h-12 rounded-xl text-sm font-bold text-[#FEB4C5] bg-[#FFF5F7]"><MessageSquare className="w-4 h-4 mr-2" /> Message Agency</Button>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: ".finance-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.4); border-radius: 2rem; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.03); }" }} />
    </>
  );
}