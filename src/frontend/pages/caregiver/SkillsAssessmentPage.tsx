import { Award, CheckCircle, Clock, Star, BookOpen, ChevronRight, Zap, Shield, AlertCircle, Brain, CheckCircle2 } from "lucide-react";
import React, { useState } from "react";
import { Button } from "@/frontend/components/ui/button";
import { useNavigate } from "react-router";
import { cn } from "@/frontend/theme/tokens";
import { PageHero } from "@/frontend/components/PageHero";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { caregiverService } from "@/backend/services/caregiver.service";
import { PageSkeleton } from "@/frontend/components/PageSkeleton";
import { useTranslation } from "react-i18next";

export default function SkillsAssessmentPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.skillsAssessment", "Skills Assessment"));

  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const { data: assessment, loading } = useAsyncData(() => caregiverService.getSkillsAssessment());

  if (loading || !assessment) return <PageSkeleton />;

  return (
    <div>
      <PageHero gradient="radial-gradient(143.86% 887.35% at -10.97% -22.81%, #7CE577 0%, #5FB865 100%)">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-12 text-white"><div className="flex items-center gap-4"><h1 className="text-2xl font-bold">Skills Certification</h1></div><div className="px-4 py-2 rounded-full bg-white/10 text-[10px] font-black uppercase tracking-[0.2em] border border-white/10">Infection Control Level 1</div></div>
          <div className="max-w-2xl mx-auto space-y-4"><div className="flex justify-between text-xs font-bold text-white/60 uppercase"><span>Progress: {Math.round((step/5)*100)}%</span><span>Question {step}/5</span></div><div className="w-full h-2 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-white transition-all duration-500" style={{ width: `${(step/5)*100}%` }} /></div></div>
        </div>
      </PageHero>
      <div className="max-w-3xl mx-auto px-6 -mt-16">
        <div className="finance-card p-10 md:p-16">
          {step <= 5 ? (
            <div className="space-y-10 animate-in fade-in duration-500">
              <div className="space-y-4"><span className="text-[10px] font-black text-[#7CE577] uppercase tracking-widest px-3 py-1 bg-[#E8F9E7] rounded-full">Clinical Practice</span><h2 className="text-3xl font-black text-gray-800 leading-tight">When administering oral medication to an elderly patient with dysphagia, which position is safest?</h2></div>
              <div className="grid grid-cols-1 gap-4">
                {["Lying flat on the back (Supine)", "Sitting upright at 90 degrees (High Fowler's)", "Lying on the left side (Sims' position)", "Slightly reclined at 30 degrees (Semi-Fowler's)"].map((ans, i) => (
                  <button key={i} onClick={() => setStep(prev => prev + 1)} className="p-6 rounded-3xl border-2 border-gray-100 hover:border-[#7CE577] hover:bg-[#E8F9E7]/30 transition-all text-left group">
                    <div className="flex items-center gap-6"><div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-xs font-black text-gray-400 group-hover:bg-white group-hover:text-[#5FB865] transition-all">{String.fromCharCode(65 + i)}</div><span className="text-sm font-bold text-gray-600 group-hover:text-gray-800 transition-colors">{ans}</span></div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 animate-in zoom-in duration-500">
              <div className="relative inline-block mb-10"><div className="w-32 h-32 bg-[#E8F9E7] rounded-full flex items-center justify-center mx-auto"><Award className="w-16 h-16 text-[#5FB865]" /></div><div className="absolute -bottom-2 -right-2 bg-[#7CE577] text-white p-2 rounded-xl shadow-xl"><CheckCircle2 className="w-6 h-6" /></div></div>
              <h2 className="text-4xl font-black text-gray-800 mb-4">Certification Passed!</h2>
              <p className="text-gray-400 max-w-sm mx-auto mb-12">You have successfully earned the **Infection Control Level 1** badge. This will now be visible on your public profile.</p>
              <div className="p-8 rounded-[2.5rem] bg-gray-50 border border-gray-100 mb-12"><div className="flex justify-between items-center mb-4"><span className="text-xs font-bold text-gray-400 uppercase">Score</span><span className="text-xl font-black text-[#5FB865]">5/5 (100%)</span></div><div className="flex justify-between items-center"><span className="text-xs font-bold text-gray-400 uppercase">Points Earned</span><span className="text-xl font-black text-[#FEB4C5]">+150 XP</span></div></div>
              <div className="flex flex-col gap-3"><Button onClick={() => navigate("/caregiver/training")} className="h-16 rounded-3xl bg-gray-900 text-white font-black shadow-xl">Back to Training Hub</Button><Button variant="ghost" className="h-14 text-[10px] font-black uppercase tracking-widest text-gray-400">Share Certificate</Button></div>
            </div>
          )}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: ".finance-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.4); border-radius: 3.5rem; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.03); }" }} />
    </div>
  );
}