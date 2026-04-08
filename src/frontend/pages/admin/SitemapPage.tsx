import React, { useState, useMemo } from "react";
import { LayoutGrid, ExternalLink, Users, ShieldCheck, ShoppingBag, Settings, Activity, Lock, Search, Globe, Briefcase, HelpCircle, Store, X, ChevronDown, ChevronRight } from "lucide-react";
import { Link } from "react-router";
import { cn } from "@/frontend/theme/tokens";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { PageSkeleton } from "@/frontend/components/PageSkeleton";
import { useTranslation } from "react-i18next";

const pageGroups = [
  { category: "Public & Core", icon: Globe, color: "#3B82F6", pages: [
    { name: "Landing Page", path: "/" }, { name: "About", path: "/about" }, { name: "Privacy Policy", path: "/privacy" },
    { name: "Terms", path: "/terms" }, { name: "Features", path: "/features" }, { name: "Pricing", path: "/pricing" },
    { name: "Contact", path: "/contact" }, { name: "Marketplace", path: "/marketplace" }, { name: "Agency Directory", path: "/agencies" },
    { name: "Global Search", path: "/search" },
  ]},
  { category: "Authentication", icon: Lock, color: "#8B7AE8", pages: [
    { name: "Login", path: "/auth/login" }, { name: "Role Selection", path: "/auth/role-selection" },
    { name: "Register", path: "/auth/register/guardian" }, { name: "Forgot Password", path: "/auth/forgot-password" },
    { name: "Reset Password", path: "/auth/reset-password" }, { name: "Verification Result", path: "/auth/verification-result" },
  ]},
  { category: "Guardian", icon: Users, color: "#DB869A", pages: [
    { name: "Guardian Dashboard", path: "/guardian/dashboard" }, { name: "Care Requirement Wizard", path: "/guardian/care-requirement-wizard" },
    { name: "Search Caregivers", path: "/guardian/search" }, { name: "Bookings", path: "/guardian/bookings" },
  ]},
  { category: "Caregiver", icon: Activity, color: "#5FB865", pages: [
    { name: "Caregiver Dashboard", path: "/caregiver/dashboard" }, { name: "Jobs", path: "/caregiver/jobs" },
    { name: "Schedule", path: "/caregiver/schedule" }, { name: "Earnings", path: "/caregiver/earnings" },
  ]},
  { category: "Patient", icon: ShieldCheck, color: "#0288D1", pages: [
    { name: "Patient Dashboard", path: "/patient/dashboard" }, { name: "Care History", path: "/patient/care-history" },
    { name: "Medical Records", path: "/patient/medical-records" }, { name: "Profile", path: "/patient/profile" },
  ]},
  { category: "Agency", icon: Briefcase, color: "#00897B", pages: [
    { name: "Agency Dashboard", path: "/agency/dashboard" }, { name: "Caregivers", path: "/agency/caregivers" },
    { name: "Clients", path: "/agency/clients" }, { name: "Placements", path: "/agency/placements" },
    { name: "Requirements Inbox", path: "/agency/requirements-inbox" }, { name: "Jobs", path: "/agency/jobs" },
    { name: "Applications", path: "/agency/applications" }, { name: "Payments", path: "/agency/payments" },
    { name: "Payroll", path: "/agency/payroll" }, { name: "Reports", path: "/agency/reports" },
    { name: "Staff Hiring", path: "/agency/staff-hiring" }, { name: "Storefront", path: "/agency/storefront" },
    { name: "Settings", path: "/agency/settings" }, { name: "Branch Management", path: "/agency/branches" },
    { name: "Staff Attendance", path: "/agency/attendance" }, { name: "Shift Monitoring", path: "/agency/shift-monitoring" },
    { name: "Client Intake", path: "/agency/client-intake" }, { name: "Client Care Plan", path: "/agency/client-care-plan" },
    { name: "Incident Reports", path: "/agency/incident-report" }, { name: "Messages", path: "/agency/messages" },
  ]},
  { category: "Shop", icon: Store, color: "#E64A19", pages: [
    { name: "Shop Dashboard", path: "/shop/dashboard" }, { name: "Products", path: "/shop/products" },
    { name: "Orders", path: "/shop/orders" }, { name: "Inventory", path: "/shop/inventory" },
  ]},
  { category: "Shared", icon: Settings, color: "#6B7280", pages: [
    { name: "Dashboard", path: "/dashboard" }, { name: "Settings", path: "/settings" },
    { name: "Notifications", path: "/notifications" }, { name: "Messages", path: "/messages" },
  ]},
  { category: "Admin / Dev", icon: LayoutGrid, color: "#EF4444", pages: [
    { name: "Sitemap (this page)", path: "/admin/sitemap" }, { name: "Connectivity Demo", path: "/dev/connectivity" },
  ]},
];

export default function SitemapPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.sitemap", "Sitemap"));

  const [searchQuery, setSearchQuery] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(pageGroups.map(g => g.category)));

  const toggleGroup = (cat: string) => {
    setExpandedGroups(prev => { const next = new Set(prev); if (next.has(cat)) next.delete(cat); else next.add(cat); return next; });
  };

  const totalPages = pageGroups.reduce((sum, g) => sum + g.pages.length, 0);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return pageGroups;
    const q = searchQuery.toLowerCase();
    return pageGroups.map(g => ({ ...g, pages: g.pages.filter(p => p.name.toLowerCase().includes(q) || p.path.toLowerCase().includes(q)) })).filter(g => g.pages.length > 0);
  }, [searchQuery]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl" style={{ color: cn.text }}>Sitemap</h1><p className="text-sm" style={{ color: cn.textSecondary }}>{totalPages} pages across {pageGroups.length} categories</p></div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: cn.textSecondary }} />
        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search pages..." className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm" style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput }} />
        {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4" style={{ color: cn.textSecondary }} /></button>}
      </div>

      <div className="space-y-3">
        {filteredGroups.map((group) => {
          const Icon = group.icon;
          const isExpanded = expandedGroups.has(group.category);
          return (
            <div key={group.category} className="finance-card overflow-hidden">
              <button onClick={() => toggleGroup(group.category)} className="w-full p-4 flex items-center justify-between cn-touch-target">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${group.color}15` }}><Icon className="w-4 h-4" style={{ color: group.color }} /></div>
                  <span className="text-sm" style={{ color: cn.text }}>{group.category}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: cn.bgInput, color: cn.textSecondary }}>{group.pages.length}</span>
                </div>
                {isExpanded ? <ChevronDown className="w-4 h-4" style={{ color: cn.textSecondary }} /> : <ChevronRight className="w-4 h-4" style={{ color: cn.textSecondary }} />}
              </button>
              {isExpanded && (
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {group.pages.map((page) => (
                      <Link key={page.path} to={page.path} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 transition-all no-underline group">
                        <div><p className="text-xs group-hover:text-[#DB869A] transition-colors" style={{ color: cn.text }}>{page.name}</p><p className="text-[10px]" style={{ color: cn.textSecondary }}>{page.path}</p></div>
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: cn.textSecondary }} />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}