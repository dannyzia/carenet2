"use client";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { PageSkeleton } from "@/frontend/components/PageSkeleton";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, CreditCard, Truck, MapPin, Phone, User, Mail, ChevronRight, CheckCircle, ShieldCheck, Building2, Calendar, Lock, ShoppingBag } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { cn } from "@/frontend/theme/tokens";
import { useTranslation } from "react-i18next";
import { shopService } from "@/backend/services";

export default function CheckoutPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.checkout", "Checkout"));

  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("bKash");
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", address: "", city: "", postalCode: "" });
  const { data: cartItems, loading: cartLoading } = useAsyncData(() => shopService.getCartItems());

  if (cartLoading) return <PageSkeleton />;

  const subtotal = (cartItems || []).reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartTotal = subtotal;
  const handleNext = () => { if (step < 3) setStep(step + 1); else navigate("/shop/order-success"); };
  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-20">
      <div className="bg-white shadow-sm sticky top-0 z-20"><div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between"><h1 className="text-xl font-black text-gray-800">Checkout</h1><div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest"><Lock className="w-4 h-4 text-[#7CE577]" /><span className="hidden sm:inline">SSL Secure Payment</span></div></div></div>
      <div className="max-w-7xl mx-auto px-4 py-8"><div className="grid grid-cols-1 lg:grid-cols-3 gap-12"><div className="lg:col-span-2 space-y-12"><div className="flex justify-between items-center px-4 md:px-12 relative">{[1, 2, 3].map((s) => (<div key={s} className="flex flex-col items-center gap-2 bg-[#F5F7FA] px-2 z-10"><div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold ${step >= s ? "bg-[#DB869A] border-[#DB869A] text-white shadow-lg" : "bg-white border-gray-200 text-gray-400"}`}>{step > s ? <CheckCircle className="w-6 h-6" /> : s}</div><span className={`text-[10px] font-black uppercase tracking-widest ${step >= s ? "text-gray-800" : "text-gray-400"}`}>{s === 1 ? "Shipping" : s === 2 ? "Payment" : "Confirm"}</span></div>))}</div>
      {step === 1 && (<div className="space-y-8"><h2 className="text-2xl font-black text-gray-800 flex items-center gap-3"><div className="p-3 rounded-2xl bg-[#DB869A]/10 text-[#DB869A]"><Truck className="w-6 h-6" /></div>Shipping Details</h2><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="space-y-2"><label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Full Name</label><div className="relative"><User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full h-14 pl-12 pr-4 bg-white border border-gray-100 rounded-2xl outline-none text-gray-700" /></div></div><div className="space-y-2"><label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Phone</label><div className="relative"><Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full h-14 pl-12 pr-4 bg-white border border-gray-100 rounded-2xl outline-none text-gray-700" /></div></div><div className="md:col-span-2 space-y-2"><label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Shipping Address</label><div className="relative"><MapPin className="absolute left-4 top-4 w-4 h-4 text-gray-400" /><textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full min-h-[100px] pl-12 pr-4 pt-4 bg-white border border-gray-100 rounded-2xl outline-none text-gray-700 resize-none" /></div></div></div></div>)}
      {step === 2 && (<div className="space-y-8"><h2 className="text-2xl font-black text-gray-800 flex items-center gap-3"><div className="p-3 rounded-2xl bg-[#DB869A]/10 text-[#DB869A]"><CreditCard className="w-6 h-6" /></div>Payment Method</h2><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[{ id: "bKash", name: "bKash / Mobile Wallet" }, { id: "Card", name: "Credit / Debit Card" }, { id: "Cash", name: "Cash on Delivery" }].map((method) => (<button key={method.id} onClick={() => setPaymentMethod(method.id)} className={`p-6 rounded-3xl border-2 text-left transition-all ${paymentMethod === method.id ? "bg-white border-[#DB869A] shadow-xl scale-[1.02]" : "bg-white border-gray-50 hover:border-gray-200"}`}><p className="font-black text-sm">{method.name}</p>{paymentMethod === method.id && <div className="absolute top-4 right-4 text-[#DB869A]"><CheckCircle className="w-6 h-6" /></div>}</button>))}</div></div>)}
      {step === 3 && (<div className="space-y-8"><h2 className="text-2xl font-black text-gray-800 flex items-center gap-3"><div className="p-3 rounded-2xl bg-[#DB869A]/10 text-[#DB869A]"><ShieldCheck className="w-6 h-6" /></div>Final Confirmation</h2><div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm"><h4 className="font-bold text-gray-800 mb-2">{formData.name}</h4><p className="text-gray-500 text-sm">{formData.address}, {formData.city}</p><p className="text-gray-500 text-sm mt-2">{formData.phone}</p><p className="text-gray-500 text-sm mt-2">Payment: {paymentMethod}</p></div></div>)}</div>
      <div className="space-y-6"><div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-2xl space-y-8 sticky top-24"><h2 className="text-xl font-black text-gray-800">Order Summary</h2><div className="space-y-3 pt-6 border-t border-gray-100"><div className="flex justify-between text-gray-400 text-[10px] font-black uppercase tracking-widest"><span>Subtotal</span><span className="text-gray-800">{"\u09F3"}{subtotal.toLocaleString()}</span></div><div className="flex justify-between text-gray-400 text-[10px] font-black uppercase tracking-widest"><span>Shipping</span><span className="text-[#5FB865]">FREE</span></div></div><div className="pt-6 border-t border-gray-100 flex justify-between items-baseline"><span className="text-gray-500 font-bold">Total</span><span className="text-4xl font-black text-gray-900">{"\u09F3"}{cartTotal.toLocaleString()}</span></div><Button onClick={handleNext} className="w-full h-16 rounded-3xl bg-[#DB869A] text-white text-lg font-black hover:bg-[#DB869A]/90 shadow-2xl flex items-center justify-center gap-3"><span>{step === 3 ? "Place Order Now" : "Continue"}</span><ChevronRight className="w-6 h-6" /></Button></div></div></div></div>
    </div>
  );
}