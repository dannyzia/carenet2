import React from "react";
import type { Role } from "@/frontend/auth/types";
import type { TFunction } from "react-i18next";
import { features } from "@/config/features";
import {
  LayoutDashboard, ClipboardList, Megaphone, Shield, Heart, Calendar,
  MessageSquare, User, CreditCard, Receipt, Coins, Handshake, Star,
  Users, FileText, Home, Briefcase, DollarSign, CheckCircle, BarChart2,
  Wallet, Package, Plus, Inbox, Link2, Gavel, Radio, Globe, Flag,
} from "lucide-react";

/* ─── Navigation links per role ─── */
/* Organized into sections: main links + secondary/tool links */
export interface NavSection {
  sectionKey?: string;          // i18n key under sidebar.section.*
  links: { i18nKey: string; path: string; icon: React.ElementType }[];
}

export function filterCareSeekerCaregiverNavLinks(
  role: Role,
  links: NavSection["links"],
): NavSection["links"] {
  if (features.careSeekerCaregiverContactEnabled) return links;
  if (role !== "guardian" && role !== "patient") return links;
  return links.filter(
    (l) => l.i18nKey !== "findCaregivers" && l.i18nKey !== "compareCaregivers",
  );
}

export function getRoleNavSections(t: TFunction): Record<Role, NavSection[]> {
  return {
    guardian: [
      {
        sectionKey: "main",
        links: [
          { i18nKey: "dashboard", path: "/guardian/dashboard", icon: LayoutDashboard },
          { i18nKey: "careRequirements", path: "/guardian/care-requirements", icon: ClipboardList },
          { i18nKey: "marketplaceHub", path: "/guardian/marketplace-hub", icon: Megaphone },
          { i18nKey: "placements", path: "/guardian/placements", icon: Shield },
          { i18nKey: "myPatients", path: "/guardian/patients", icon: Heart },
          { i18nKey: "schedule", path: "/guardian/schedule", icon: Calendar },
          { i18nKey: "messages", path: "/guardian/messages", icon: MessageSquare },
          { i18nKey: "profile", path: "/guardian/profile", icon: User },
        ],
      },
      {
        sectionKey: "finance",
        links: [
          { i18nKey: "payments", path: "/guardian/payments", icon: CreditCard },
          { i18nKey: "billing", path: "/billing", icon: Receipt },
          { i18nKey: "wallet", path: "/wallet?role=guardian", icon: Coins },
          { i18nKey: "contracts", path: "/contracts?role=guardian", icon: Handshake },
          { i18nKey: "reviews", path: "/guardian/reviews", icon: Star },
        ],
      },
      {
        sectionKey: "tools",
        links: filterCareSeekerCaregiverNavLinks("guardian", [
          { i18nKey: "findCaregivers", path: "/guardian/search", icon: Users },
          { i18nKey: "compareCaregivers", path: "/guardian/caregiver-comparison", icon: Users },
        ]),
      },
    ],
    patient: [
      {
        sectionKey: "main",
        links: [
          { i18nKey: "dashboard", path: "/patient/dashboard", icon: LayoutDashboard },
          { i18nKey: "careRequirements", path: "/patient/care-requirements", icon: ClipboardList },
          { i18nKey: "marketplaceHub", path: "/patient/marketplace-hub", icon: Megaphone },
          { i18nKey: "placements", path: "/patient/placements", icon: Shield },
          { i18nKey: "careHistory", path: "/patient/care-history", icon: Heart },
          { i18nKey: "medicalRecords", path: "/patient/medical-records", icon: FileText },
          { i18nKey: "schedule", path: "/patient/schedule", icon: Calendar },
          { i18nKey: "messages", path: "/patient/messages", icon: MessageSquare },
          { i18nKey: "profile", path: "/patient/profile", icon: User },
        ],
      },
      {
        sectionKey: "tools",
        links: filterCareSeekerCaregiverNavLinks("patient", [
          { i18nKey: "findCaregivers", path: "/patient/search", icon: Users },
          { i18nKey: "postRequirement", path: "/patient/care-requirement-wizard", icon: FileText },
          { i18nKey: "newBooking", path: "/patient/booking", icon: Calendar },
        ]),
      },
      {
        sectionKey: "health",
        links: [
          { i18nKey: "vitalsTracking", path: "/patient/vitals", icon: Heart },
          { i18nKey: "medications", path: "/patient/medications", icon: ClipboardList },
          { i18nKey: "healthReport", path: "/patient/health-report", icon: BarChart2 },
          { i18nKey: "emergencyHub", path: "/patient/emergency", icon: Shield },
        ],
      },
      {
        sectionKey: "privacyBrowse",
        links: [
          { i18nKey: "dataPrivacy", path: "/patient/data-privacy", icon: Shield },
        ],
      },
    ],
    caregiver: [
      {
        sectionKey: "main",
        links: [
          { i18nKey: "dashboard", path: "/caregiver/dashboard", icon: LayoutDashboard },
          { i18nKey: "myPatients", path: "/caregiver/assigned-patients", icon: Heart },
          { i18nKey: "myJobs", path: "/caregiver/jobs", icon: Briefcase },
          { i18nKey: "marketplaceHub", path: "/caregiver/marketplace-hub", icon: Megaphone },
          { i18nKey: "careLog", path: "/caregiver/care-log", icon: ClipboardList },
          { i18nKey: "careNotes", path: "/caregiver/care-notes", icon: FileText },
          { i18nKey: "schedule", path: "/caregiver/schedule", icon: Calendar },
          { i18nKey: "messages", path: "/caregiver/messages", icon: MessageSquare },
          { i18nKey: "earnings", path: "/caregiver/earnings", icon: DollarSign },
          { i18nKey: "reviews", path: "/caregiver/reviews", icon: Star },
          { i18nKey: "documents", path: "/caregiver/documents", icon: FileText },
          { i18nKey: "profile", path: "/caregiver/profile", icon: User },
        ],
      },
      {
        sectionKey: "patientCare",
        links: [
          { i18nKey: "prescriptions", path: "/caregiver/prescription", icon: ClipboardList },
          { i18nKey: "medSchedule", path: "/caregiver/med-schedule", icon: Calendar },
          { i18nKey: "shiftPlanner", path: "/caregiver/shift-planner", icon: CheckCircle },
        ],
      },
      {
        sectionKey: "finance",
        links: [
          { i18nKey: "wallet", path: "/wallet?role=caregiver", icon: Coins },
          { i18nKey: "contracts", path: "/contracts?role=caregiver", icon: Handshake },
          { i18nKey: "billing", path: "/billing", icon: Receipt },
          { i18nKey: "dailyEarnings", path: "/caregiver/daily-earnings", icon: DollarSign },
          { i18nKey: "payoutSetup", path: "/caregiver/payout-setup", icon: Wallet },
          { i18nKey: "taxReports", path: "/caregiver/tax-reports", icon: FileText },
        ],
      },
      {
        sectionKey: "growth",
        links: [
          { i18nKey: "trainingPortal", path: "/caregiver/training", icon: Star },
          { i18nKey: "skillsAssessment", path: "/caregiver/skills-assessment", icon: CheckCircle },
          { i18nKey: "portfolio", path: "/caregiver/portfolio", icon: FileText },
          { i18nKey: "references", path: "/caregiver/references", icon: Users },
        ],
      },
    ],
    agency: [
      {
        sectionKey: "main",
        links: [
          { i18nKey: "dashboard", path: "/agency/dashboard", icon: LayoutDashboard },
          { i18nKey: "packageCreate", path: "/agency/package-create", icon: Plus },
          { i18nKey: "requirements", path: "/agency/requirements-inbox", icon: Inbox },
          { i18nKey: "careRequirementBoard", path: "/agency/care-requirement-board", icon: Megaphone },
          { i18nKey: "carePackageCatalog", path: "/agency/care-packages", icon: Package },
          { i18nKey: "bidManagement", path: "/agency/bid-management", icon: Gavel },
          { i18nKey: "packageLeads", path: "/agency/package-leads", icon: Package },
          { i18nKey: "caregivingJobs", path: "/agency/caregiving-jobs", icon: Link2 },
          { i18nKey: "jobManagement", path: "/agency/job-management", icon: Briefcase },
          { i18nKey: "placements", path: "/agency/placements", icon: Shield },
          { i18nKey: "shiftMonitor", path: "/agency/shift-monitoring", icon: Radio },
          { i18nKey: "caregivers", path: "/agency/caregivers", icon: Users },
          { i18nKey: "clients", path: "/agency/clients", icon: Heart },
          { i18nKey: "messages", path: "/agency/messages", icon: MessageSquare },
          { i18nKey: "reports", path: "/agency/reports", icon: BarChart2 },
          { i18nKey: "profile", path: "/agency/settings", icon: User },
        ],
      },
      {
        sectionKey: "operations",
        links: [
          { i18nKey: "staffHiring", path: "/agency/hiring", icon: Briefcase },
          { i18nKey: "staffAttendance", path: "/agency/attendance", icon: Calendar },
          { i18nKey: "clientIntake", path: "/agency/client-intake", icon: ClipboardList },
          { i18nKey: "incidentReport", path: "/agency/incident-report", icon: Flag },
          { i18nKey: "incidentsList", path: "/agency/incidents", icon: Flag },
          { i18nKey: "branches", path: "/agency/branches", icon: Radio },
        ],
      },
      {
        sectionKey: "financeSettings",
        links: [
          { i18nKey: "wallet", path: "/wallet?role=agency", icon: Coins },
          { i18nKey: "contracts", path: "/contracts?role=agency", icon: Handshake },
          { i18nKey: "billing", path: "/billing", icon: Receipt },
          { i18nKey: "payroll", path: "/agency/payroll", icon: Wallet },
          { i18nKey: "payments", path: "/agency/payments", icon: CreditCard },
          { i18nKey: "storefront", path: "/agency/storefront", icon: Home },
          { i18nKey: "settings", path: "/agency/settings", icon: BarChart2 },
        ],
      },
    ],
    shop: [
      {
        sectionKey: "main",
        links: [
          { i18nKey: "dashboard", path: "/shop/dashboard", icon: LayoutDashboard },
          { i18nKey: "products", path: "/shop/products", icon: Package },
          { i18nKey: "orders", path: "/shop/orders", icon: Heart },
          { i18nKey: "inventory", path: "/shop/inventory", icon: ClipboardList },
          { i18nKey: "analytics", path: "/shop/analytics", icon: BarChart2 },
          { i18nKey: "billing", path: "/billing", icon: Receipt },
        ],
      },
      {
        sectionKey: "management",
        links: [
          { i18nKey: "productEditor", path: "/shop/product-editor", icon: FileText },
          { i18nKey: "fulfillment", path: "/shop/fulfillment", icon: Package },
          { i18nKey: "merchantAnalytics", path: "/shop/merchant-analytics", icon: BarChart2 },
          { i18nKey: "onboarding", path: "/shop/onboarding", icon: CheckCircle },
        ],
      },
    ],
    channel_partner: [
      {
        sectionKey: "main",
        links: [
          { i18nKey: "dashboard", path: "/cp/dashboard", icon: LayoutDashboard },
          { i18nKey: "leads", path: "/cp/leads", icon: Users },
          { i18nKey: "commissions", path: "/cp/commissions", icon: DollarSign },
          { i18nKey: "rates", path: "/cp/rates", icon: BarChart2 },
          { i18nKey: "account", path: "/cp/account", icon: User },
        ],
      },
      {
        sectionKey: "tools",
        links: [
          { i18nKey: "createLead", path: "/cp/create-lead", icon: Plus },
        ],
      },
    ],
    admin: [
      {
        sectionKey: "main",
        links: [
          { i18nKey: "dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
          { i18nKey: "users", path: "/admin/users", icon: Users },
          { i18nKey: "verifications", path: "/admin/verifications", icon: CheckCircle },
          { i18nKey: "channelPartners", path: "/admin/channel-partners", icon: Users },
          { i18nKey: "agencyApprovals", path: "/admin/agency-approvals", icon: Radio },
          { i18nKey: "roleActivations", path: "/admin/role-activations", icon: Shield },
          { i18nKey: "placements", path: "/admin/placement-monitoring", icon: Shield },
          { i18nKey: "reports", path: "/admin/reports", icon: BarChart2 },
        ],
      },
      {
        sectionKey: "finance",
        links: [
          { i18nKey: "walletManagement", path: "/admin/wallet-management", icon: Coins },
          { i18nKey: "contractsOverview", path: "/admin/contracts", icon: Handshake },
          { i18nKey: "payments", path: "/admin/payments", icon: CreditCard },
          { i18nKey: "billing", path: "/billing", icon: Receipt },
        ],
      },
      {
        sectionKey: "system",
        links: [
          { i18nKey: "systemHealth", path: "/admin/system-health", icon: Radio },
          { i18nKey: "auditLogs", path: "/admin/audit-logs", icon: FileText },
          { i18nKey: "userInspector", path: "/admin/user-inspector", icon: Users },
          { i18nKey: "financialAudit", path: "/admin/financial-audit", icon: DollarSign },
          { i18nKey: "disputes", path: "/admin/disputes", icon: Flag },
        ],
      },
      {
        sectionKey: "contentConfig",
        links: [
          { i18nKey: "cmsManager", path: "/admin/cms", icon: FileText },
          { i18nKey: "policyManager", path: "/admin/policy", icon: Shield },
          { i18nKey: "promoManagement", path: "/admin/promos", icon: Star },
          { i18nKey: "languages", path: "/admin/languages", icon: Globe },
          { i18nKey: "settings", path: "/admin/settings", icon: BarChart2 },
        ],
      },
    ],
    moderator: [
      {
        sectionKey: "main",
        links: [
          { i18nKey: "dashboard", path: "/moderator/dashboard", icon: LayoutDashboard },
          { i18nKey: "reviews", path: "/moderator/reviews", icon: Star },
          { i18nKey: "reports", path: "/moderator/reports", icon: Flag },
          { i18nKey: "content", path: "/moderator/content", icon: FileText },
          { i18nKey: "roleActivations", path: "/moderator/activations", icon: Shield },
          { i18nKey: "billing", path: "/billing", icon: Receipt },
        ],
      },
    ],
  };
}
