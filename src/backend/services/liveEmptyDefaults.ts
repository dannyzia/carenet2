/**
 * Empty payloads for live Supabase users when DB queries fail or return no rows.
 * Never substitute in-app mock barrel data for these sessions (see useInAppMockDataset).
 */
import type {
  AdminDashboardData,
  AdminPaymentsData,
  AuditLogsData,
  CMSPageData,
  DisputeData,
  PolicyData,
  PromoData,
  AdminSettingsData,
  UserInspectorData,
  VerificationCaseData,
  ModeratorDashboardStats,
} from "@/backend/models";
import type {
  StorefrontData,
  StaffAttendanceData,
  StaffHiringData,
  Branch,
} from "@/backend/models/agency.model";
import type { ShopDashboardStats } from "@/backend/models/shop.model";
import type { CaregiverDashboardSummary } from "@/backend/models/caregiver.model";

export const EMPTY_ADMIN_DASHBOARD: AdminDashboardData = {
  summary: {
    totalUsers: 0,
    totalUsersChangeLabel: "—",
    activeCaregivers: 0,
    activeCaregiversChangeLabel: "—",
    revenueMonthLabel: "—",
    revenueThisMonthBdt: 0,
    revenueChangeLabel: "—",
    platformGrowthPercent: 0,
    platformGrowthChangeLabel: "—",
    pointsInCirculation: 0,
    pendingDuesCp: 0,
    contractsTotal: 0,
    platformRevenueCp: 0,
  },
  userGrowth: [],
  revenueData: [],
  pieData: [],
  pendingItems: [],
  recentActivity: [],
};

export const EMPTY_ADMIN_PAYMENTS: AdminPaymentsData = {
  chartData: [],
  transactions: [],
};

export const EMPTY_AUDIT_LOGS: AuditLogsData = {
  stats: [
    { label: "Total Events", val: "0" },
    { label: "Security Alerts", val: "0" },
    { label: "Data Integrity", val: "—" },
    { label: "Auth Success", val: "—" },
  ],
  logs: [],
};

export const EMPTY_CMS_PAGE: CMSPageData = {
  stats: [],
  content: [],
};

export const EMPTY_DISPUTE_DATA: DisputeData = {
  stats: [],
  disputes: [],
};

export const EMPTY_POLICY_DATA: PolicyData = {
  policies: [],
};

export const EMPTY_PROMO_DATA: PromoData = {
  stats: [],
  promos: [],
};

export const EMPTY_USER_INSPECTOR: UserInspectorData = {
  user: {
    id: "",
    name: "",
    email: "",
    phone: "",
    role: "",
    status: "",
    verified: false,
    joined: "",
    stats: { shifts: 0, earnings: "—", rating: 0, reviews: 0 },
    recentActivity: [],
  },
};

export function emptyVerificationCase(id: string): VerificationCaseData {
  return {
    id,
    type: "",
    status: "pending",
    applicant: { name: "", role: "", submitted: "" },
    documents: [],
    checks: [],
  };
}

export const EMPTY_ADMIN_SETTINGS: AdminSettingsData = {
  platformName: "",
  supportEmail: "",
  supportPhone: "",
  defaultLanguage: "",
  timezone: "",
  platformFee: "",
  withdrawalMin: "",
  withdrawalMax: "",
  withdrawalFee: "",
  maintenanceMode: false,
  caregiverVerification: false,
  agencyVerification: false,
  shopVerification: false,
  emailNotifications: false,
  smsNotifications: false,
  pushNotifications: false,
  maxLoginAttempts: "",
  sessionTimeout: "",
  mfaRequired: false,
};

export const EMPTY_STOREFRONT: StorefrontData = {
  agency: {
    name: "",
    rating: 0,
    reviews: 0,
    tagline: "",
  },
  services: [],
  staff: [],
  reviewItems: [],
};

/** Settings card shape returned by getAgencySettings (extends storefront fields). */
export const EMPTY_AGENCY_SETTINGS_CARD = {
  name: "",
  tagline: "",
  location: "",
  serviceAreas: [] as string[],
  specialties: [] as string[],
  verified: false,
  responseTime: undefined as string | undefined,
  image: undefined as string | undefined,
};

export const EMPTY_STAFF_ATTENDANCE: StaffAttendanceData = {
  date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
  staff: [],
};

export const EMPTY_STAFF_HIRING: StaffHiringData = {
  openPositions: [],
  recentApplicants: [],
};

export const EMPTY_BRANCHES: Branch[] = [];

export const EMPTY_MODERATOR_DASHBOARD_STATS: ModeratorDashboardStats = {
  pendingReviews: 0,
  openReports: 0,
  contentFlags: 0,
  resolvedToday: 0,
};

export const EMPTY_CAREGIVER_DASHBOARD_SUMMARY: CaregiverDashboardSummary = {
  activeJobs: 0,
  avgRating: 0,
  reviewCount: 0,
  thisMonthBdt: 0,
  hoursThisMonth: 0,
  weekJobsDelta: 0,
  vsLastMonthPercent: 0,
  earningsTrendPercent: 0,
};

export const EMPTY_SHOP_DASHBOARD_STATS: ShopDashboardStats = {
  totalSalesBdt: 0,
  activeProducts: 0,
  newOrders: 0,
  totalCustomers: 0,
  salesChangeLabel: "—",
  salesChangePositive: true,
  productsChangeLabel: "—",
  productsChangePositive: true,
  ordersChangeLabel: "—",
  ordersChangePositive: true,
  customersChangeLabel: "—",
  customersChangePositive: true,
};
