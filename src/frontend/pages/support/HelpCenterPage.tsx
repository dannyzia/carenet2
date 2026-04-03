"use client";

import React from "react";
import { 
  HelpCircle, 
  Search, 
  ArrowLeft, 
  ChevronRight, 
  BookOpen, 
  MessageCircle, 
  Phone, 
  LifeBuoy, 
  ShieldCheck, 
  CreditCard, 
  User, 
  Briefcase,
  FileText
} from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { useNavigate } from "react-router";
import { cn } from "@/frontend/theme/tokens";
import { PageHero } from "@/frontend/components/PageHero";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { supportService } from "@/backend/services/support.service";
import { PageSkeleton } from "@/frontend/components/PageSkeleton";
import { useTranslation } from "react-i18next";

export default function HelpCenterPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.helpCenter", "Help Center"));

  const navigate = useNavigate();
  const { data: helpData, loading } = useAsyncData(() => supportService.getHelpCenterData());

  if (loading || !helpData) return <PageSkeleton />;

  return (
    <div>
      {/* Simple Header */}
      <div className="p-6" style={{ background: "var(--cn-gradient-caregiver)" }}>
        <h1 className="text-xl font-bold text-white mb-4">Help Center</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search help articles..." 
            className="w-full h-12 pl-10 pr-4 rounded-xl bg-white text-gray-800 border-none outline-none"
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-20 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
           {[
             { label: "Getting Started", icon: PlayCircle, color: "bg-blue-50 text-blue-500" },
             { label: "Payments & Fees", icon: CreditCard, color: "bg-orange-50 text-orange-500" },
             { label: "Trust & Safety", icon: ShieldCheck, color: "bg-[#E8F9E7] text-[#5FB865]" },
             { label: "Account Settings", icon: User, color: "bg-[#FFF5F7] text-[#DB869A]" }
           ].map((cat, i) => (
             <div key={i} className="finance-card p-8 text-center group hover:translate-y-[-4px] transition-all cursor-pointer">
                <div className={`w-16 h-16 rounded-3xl ${cat.color} flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform`}>
                   <cat.icon className="w-8 h-8" />
                </div>
                <h3 className="font-black text-gray-800 mb-2">{cat.label}</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">12 Articles</p>
             </div>
           ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
           {/* Popular Articles */}
           <div className="lg:col-span-2 space-y-8">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                 <BookOpen className="w-6 h-6 text-[#7CE577]" />
                 Popular Articles
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {[
                   "How to book a verified caregiver?",
                   "Understanding platform service fees",
                   "How to verify your medical credentials?",
                   "Adding multiple patients to one account",
                   "CareNet refund and cancellation policy",
                   "Managing your shop inventory"
                 ].map((art, i) => (
                   <div key={i} className="finance-card p-6 flex items-center justify-between group hover:border-[#7CE577] transition-all cursor-pointer">
                      <span className="text-sm font-bold text-gray-700 group-hover:text-[#5FB865] transition-colors">{art}</span>
                      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500" />
                   </div>
                 ))}
              </div>
              
              <div className="finance-card p-10 bg-[#111827] text-white relative overflow-hidden">
                 <div className="relative z-10">
                    <h3 className="text-2xl font-black mb-4">Can't find what you're looking for?</h3>
                    <p className="text-white/50 text-sm mb-8 max-w-md">Our support team is available 24/7 to assist you with any platform-related issues or medical inquiries.</p>
<div className="flex gap-4">
                       <Button onClick={() => navigate("/support/ticket")} className="h-12 px-6 rounded-xl bg-[#FEB4C5] hover:bg-[#DB869A] text-white font-medium">
                           Submit a Ticket
                       </Button>
                     </div>
                 </div>
                 <LifeBuoy className="absolute -bottom-10 -right-10 w-64 h-64 text-white/5 opacity-10" />
              </div>
           </div>

           {/* Quick Support Sidebar */}
           <div className="lg:col-span-1 space-y-6">
              <div className="finance-card p-8">
                 <h3 className="font-bold text-gray-800 mb-6">Contact Support</h3>
                 <div className="space-y-6">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-[#5FB865]"><Phone className="w-5 h-5" /></div>
                       <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Hotline</p>
                          <p className="text-sm font-black text-gray-800">+880 171XXXXXXX</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500"><MessageCircle className="w-5 h-5" /></div>
                       <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">WhatsApp</p>
                          <p className="text-sm font-black text-gray-800">+880 172XXXXXXX</p>
                       </div>
                    </div>
                 </div>
</div>
            </div>
         </div>
      </div>
    </div>
  );
}

const PlayCircle = ({ className }: { className?: string }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <polygon points="10 8 16 12 10 16 10 8"></polygon>
  </svg>
);