import { BookOpen, Play, CheckCircle, Clock, Award, Star, Lock, ChevronRight, BarChart2, Download, Search, PlayCircle } from "lucide-react";
import React from "react";
import { Button } from "@/frontend/components/ui/button";
import { PageHero } from "@/frontend/components/PageHero";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { caregiverService } from "@/backend/services/caregiver.service";
import { PageSkeleton } from "@/frontend/components/PageSkeleton";
import { useTranslation } from "react-i18next";

export default function TrainingPortalPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.trainingPortal", "Training Portal"));

  const { data: modules, loading } = useAsyncData(() => caregiverService.getTrainingModules());

  if (loading || !modules) return <PageSkeleton />;

  return (
    <div>
      <PageHero gradient="radial-gradient(143.86% 887.35% at -10.97% -22.81%, #FEB4C5 0%, #DB869A 100%)">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-8"><div className="flex items-center gap-4"><h1 className="text-2xl font-bold text-white">Learning Hub</h1></div><div className="relative w-64"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 w-4 h-4" /><input type="text" placeholder="Search courses..." className="w-full bg-white/10 border border-white/20 rounded-xl h-10 pl-10 pr-4 text-white placeholder:text-white/50 text-sm outline-none focus:bg-white/20 transition-all" /></div></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="finance-card p-6 !bg-white/10 !backdrop-blur-xl !border-white/20 flex items-center gap-4"><div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white"><BookOpen /></div><div><p className="text-white font-black text-xl">4</p><p className="text-white/60 text-[10px] font-bold uppercase">Active Courses</p></div></div>
            <div className="finance-card p-6 !bg-white/10 !backdrop-blur-xl !border-white/20 flex items-center gap-4"><div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white"><Award /></div><div><p className="text-white font-black text-xl">12</p><p className="text-white/60 text-[10px] font-bold uppercase">Certificates</p></div></div>
            <div className="finance-card p-6 !bg-white/10 !backdrop-blur-xl !border-white/20 flex items-center gap-4"><div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white"><Star /></div><div><p className="text-white font-black text-xl">450</p><p className="text-white/60 text-[10px] font-bold uppercase">Reward Points</p></div></div>
          </div>
        </div>
      </PageHero>
      <div className="max-w-5xl mx-auto px-6 -mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-6">In Progress</h2>
              <div className="space-y-4">
                {[{ title: "Advanced Geriatric Care", progress: 75, lessons: "12/16", img: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&q=80&w=200&h=120" }, { title: "Psychological Support Basics", progress: 30, lessons: "3/10", img: "https://images.unsplash.com/photo-1527137342181-19aab11a8ee1?auto=format&fit=crop&q=80&w=200&h=120" }].map((c, i) => (
                  <div key={i} className="finance-card p-4 flex gap-6 hover:translate-x-1 transition-all">
                    <div className="w-40 h-24 rounded-2xl overflow-hidden flex-shrink-0 relative"><img src={c.img} className="w-full h-full object-cover" alt={c.title} /><div className="absolute inset-0 bg-black/20 flex items-center justify-center"><PlayCircle className="w-8 h-8 text-white" /></div></div>
                    <div className="flex-1 min-w-0"><h3 className="font-bold text-gray-800 text-lg mb-2 truncate">{c.title}</h3><div className="flex items-center gap-4 text-xs text-gray-400 mb-4"><span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {c.lessons} Lessons</span><span className="flex items-center gap-1 font-bold text-[#FEB4C5]">{c.progress}% Done</span></div><div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-[#FEB4C5]" style={{ width: `${c.progress}%` }} /></div></div>
                  </div>
                ))}
              </div>
            </section>
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-6">Recommended for You</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[{ title: "Infection Control 2026", duration: "4 hrs", rating: 4.9, points: 50 }, { title: "Pediatric Care Essentials", duration: "6 hrs", rating: 4.7, points: 75 }, { title: "Patient Communication", duration: "3 hrs", rating: 4.8, points: 30 }, { title: "Diabetes Management", duration: "5 hrs", rating: 5.0, points: 100 }].map((c, i) => (
                  <div key={i} className="finance-card p-6 group hover:border-[#FEB4C5] transition-all">
                    <div className="w-10 h-10 rounded-xl bg-[#FFF5F7] flex items-center justify-center text-[#FEB4C5] mb-4 group-hover:bg-[#FEB4C5] group-hover:text-white transition-all"><BookOpen className="w-5 h-5" /></div>
                    <h3 className="font-bold text-gray-800 mb-2">{c.title}</h3>
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-gray-400"><span>{c.duration}</span><span className="text-[#FEB4C5]">+{c.points} XP</span></div>
                  </div>
                ))}
              </div>
            </section>
          </div>
          <div className="lg:col-span-1 space-y-6">
            <div className="finance-card p-8 bg-gradient-to-br from-[#FEB4C5] to-[#DB869A] text-white"><h3 className="text-xl font-bold mb-6">Leaderboard</h3><div className="space-y-4">{[{ name: "Sumaiya A.", rank: 1, points: 2450 }, { name: "Rafiq H.", rank: 2, points: 2120 }, { name: "You", rank: 12, points: 450 }].map((p, i) => (<div key={i} className={`flex items-center gap-4 p-3 rounded-2xl ${p.name === "You" ? 'bg-white/20' : 'bg-white/10'}`}><span className="font-black text-lg w-6">{p.rank}</span><div className="flex-1"><p className="font-bold text-sm">{p.name}</p><p className="text-[10px] text-white/60">{p.points} XP</p></div></div>))}</div><Button variant="ghost" className="w-full mt-6 text-white text-xs font-bold border border-white/20 hover:bg-white/10">View Global Rankings</Button></div>
            <div className="finance-card p-8"><h3 className="font-bold text-gray-800 mb-6">Unlocked Badges</h3><div className="grid grid-cols-3 gap-4">{[1, 2, 3, 4, 5].map(b => (<div key={b} className="aspect-square rounded-2xl bg-gray-50 flex items-center justify-center text-gray-200">{b === 1 ? <Award className="w-8 h-8 text-[#7CE577]" /> : <Lock className="w-6 h-6" />}</div>))}</div></div>
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: ".finance-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.4); border-radius: 2.5rem; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.03); }" }} />
    </div>
  );
}