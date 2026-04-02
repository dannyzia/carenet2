"use client";
import React, { useState } from "react";
import { Plus, Image as ImageIcon, Save, Trash2, ArrowLeft, Package, Settings, CheckCircle2, ShieldCheck, Tag, BarChart, Eye, ChevronRight } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { useNavigate } from "react-router";
import { cn } from "@/frontend/theme/tokens";
import { PageHero } from "@/frontend/components/shared/PageHero";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { PageSkeleton } from "@/frontend/components/PageSkeleton";
import { useTranslation } from "react-i18next";

export default function ProductEditorPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.productEditor", "Product Editor"));

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("basic");
  const { data, loading, error } = useAsyncData(() => {
    // Simulate an API call to fetch product data
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          productName: "Omron M2 Basic Blood Pressure Monitor",
          category: "Monitoring",
          brand: "Omron",
          fullDescription: "Write a detailed description...",
          retailPrice: 3500,
          discountedPrice: 3200,
          stockQuantity: 50,
          sku: "OM-BP-001",
          images: [],
          optimizationScore: 85,
          keywords: ["high quality images", "optimized keywords"]
        });
      }, 1000);
    });
  });

  if (loading) {
    return <PageSkeleton />;
  }

  if (error) {
    return <div>Error loading product data</div>;
  }

  const product = data as {
    productName: string;
    category: string;
    brand: string;
    fullDescription: string;
    retailPrice: number;
    discountedPrice: number;
    stockQuantity: number;
    sku: string;
    images: string[];
    optimizationScore: number;
    keywords: string[];
  };

  return (
    <div>
      <PageHero gradient="radial-gradient(143.86% 887.35% at -10.97% -22.81%, #1F2937 0%, #111827 100%)" className="pt-8 pb-32 px-6"><div className="max-w-5xl mx-auto"><div className="flex justify-between items-center mb-8"><h1 className="text-2xl font-bold text-white">Product Editor</h1><div className="flex gap-2"><Button variant="ghost" className="text-white hover:bg-white/10 rounded-xl px-4 h-12 font-bold"><Eye className="w-4 h-4 mr-2" /> Preview</Button><Button className="bg-[#7CE577] hover:bg-[#5FB865] text-white font-bold rounded-xl h-12 px-6 shadow-lg"><Save className="w-4 h-4 mr-2" /> Publish Product</Button></div></div><div className="flex gap-8 border-b border-white/10">{[{ id: "basic", label: "Basic Info" }, { id: "pricing", label: "Inventory & Pricing" }, { id: "media", label: "Media & SEO" }, { id: "shipping", label: "Shipping" }].map(t => (<button key={t.id} onClick={() => setActiveTab(t.id)} className={`pb-4 text-sm font-bold transition-all relative ${activeTab === t.id ? 'text-white' : 'text-white/40 hover:text-white/60'}`}>{t.label}{activeTab === t.id && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#7CE577] rounded-full" />}</button>))}</div></div></PageHero>
      <div className="max-w-5xl mx-auto px-6 -mt-16"><div className="grid grid-cols-1 lg:grid-cols-3 gap-8"><div className="lg:col-span-2 space-y-6"><div className="finance-card p-8">{activeTab === "basic" && (<div className="space-y-6"><h2 className="text-lg font-bold text-gray-800">General Information</h2><div className="space-y-2"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Product Name</label><input className="w-full h-14 px-5 rounded-2xl bg-gray-50 border border-gray-100 outline-none font-bold text-gray-800" placeholder="e.g. Omron M2 Basic Blood Pressure Monitor" value={product.productName} readOnly /></div><div className="grid grid-cols-2 gap-6"><div className="space-y-2"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Category</label><select aria-label="Category" className="w-full h-14 px-5 rounded-2xl bg-gray-50 border border-gray-100 outline-none font-bold text-gray-800"><option>Monitoring</option><option>Mobility</option><option>Surgical</option></select></div><div className="space-y-2"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Brand</label><input className="w-full h-14 px-5 rounded-2xl bg-gray-50 border border-gray-100 outline-none font-bold text-gray-800" placeholder="Omron" value={product.brand} readOnly /></div></div><div className="space-y-2"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Full Description</label><textarea className="w-full p-5 rounded-2xl bg-gray-50 border border-gray-100 outline-none font-medium text-gray-600 min-h-[160px]" placeholder="Write a detailed description..." value={product.fullDescription} readOnly /></div></div>)}{activeTab === "pricing" && (<div className="space-y-6"><h2 className="text-lg font-bold text-gray-800">Commercial Details</h2><div className="grid grid-cols-2 gap-6"><div className="space-y-2"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Retail Price ({"\u09F3"})</label><input type="number" className="w-full h-14 px-5 rounded-2xl bg-gray-50 border border-gray-100 outline-none font-black text-gray-800" placeholder="3500" value={product.retailPrice} readOnly /></div><div className="space-y-2"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Discounted Price ({"\u09F3"})</label><input type="number" className="w-full h-14 px-5 rounded-2xl bg-gray-50 border border-gray-100 outline-none font-black text-[#7CE577]" placeholder="3200" value={product.discountedPrice} readOnly /></div></div><div className="grid grid-cols-2 gap-6"><div className="space-y-2"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Stock Quantity</label><input type="number" className="w-full h-14 px-5 rounded-2xl bg-gray-50 border border-gray-100 outline-none font-bold text-gray-800" placeholder="50" value={product.stockQuantity} readOnly /></div><div className="space-y-2"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">SKU / ID</label><input className="w-full h-14 px-5 rounded-2xl bg-gray-50 border border-gray-100 outline-none font-bold text-gray-400" placeholder="OM-BP-001" value={product.sku} readOnly /></div></div></div>)}{activeTab === "media" && (<div className="space-y-6"><h2 className="text-lg font-bold text-gray-800">Product Media</h2><div className="grid grid-cols-3 gap-4"><div className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-[#7CE577] hover:bg-[#E8F9E7]/20 cursor-pointer transition-all"><Plus className="w-6 h-6 mb-2" /><span className="text-[10px] font-bold uppercase">Add Photo</span></div></div></div>)}</div></div><div className="lg:col-span-1 space-y-6"><div className="finance-card p-8"><h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2"><BarChart className="w-4 h-4 text-[#7CE577]" />Optimization Score</h3><div className="space-y-4"><div className="flex justify-between items-end mb-1"><span className="text-xs font-bold text-gray-500">Completeness</span><span className="text-lg font-black text-[#7CE577]">{product.optimizationScore}%</span></div><div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-[#7CE577]" style={{ width: `${product.optimizationScore}%` }} /></div><div className="space-y-2 pt-4">{product.keywords.map((keyword, index) => (
            <p key={index} className="text-[10px] text-[#5FB865] flex items-center gap-1 font-bold"><CheckCircle2 className="w-3 h-3" /> {keyword}</p>
          ))}</div></div></div><div className="finance-card p-6 bg-gray-900 text-white"><h3 className="font-bold mb-4 flex items-center gap-2"><Tag className="w-4 h-4 text-[#FEB4C5]" />Quick Actions</h3><div className="space-y-2"><Button variant="ghost" className="w-full justify-between text-white/70 hover:text-white hover:bg-white/10 h-10 px-3 text-xs"><span>Duplicate Product</span><ChevronRight className="w-4 h-4" /></Button><Button variant="ghost" className="w-full justify-between text-red-400 hover:text-red-300 hover:bg-red-400/10 h-10 px-3 text-xs"><span>Archive Product</span><Trash2 className="w-4 h-4" /></Button></div></div></div></div></div>
      <style dangerouslySetInnerHTML={{ __html: ".finance-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.4); border-radius: 2.5rem; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.03); }" }} />
    </div>
  );
}