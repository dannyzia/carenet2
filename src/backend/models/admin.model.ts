/**
 * Admin Domain Models
 * Types for admin dashboard, verifications, reports, users, placements, moderation
 */

// ─── Dashboard ───
export interface UserGrowthPoint {
  month: string; caregivers: number; guardians: number; patients: number;
}

export interface RevenuePoint { month: string; revenue: number; }

export interface PieSlice { name: string; value: number; color: string; }

export interface PendingItem { type: string; count: number; color: string; path: string; }

export interface ActivityItem { text: string; time: string; type: string; }

export interface AdminDashboardSummary {
  totalUsers: number;
  totalUsersChangeLabel: string;
  activeCaregivers: number;
  activeCaregiversChangeLabel: string;
  revenueMonthLabel: string;
  revenueThisMonthBdt: number;
  revenueChangeLabel: string;
  platformGrowthPercent: number;
  platformGrowthChangeLabel: string;
  pointsInCirculation: number;
  pendingDuesCp: number;
  contractsTotal: number;
  platformRevenueCp: number;
}

export interface AdminDashboardData {
  summary: AdminDashboardSummary;
  userGrowth: UserGrowthPoint[];
  revenueData: RevenuePoint[];
  pieData: PieSlice[];
  pendingItems: PendingItem[];
  recentActivity: ActivityItem[];
}

// ─── Payments ───
export interface AdminChartPoint { month: string; income: number; payouts: number; }

export interface AdminTransaction {
  id: number; type: string; from: string; to: string;
  amount: string; fee: string; date: string; status: string;
}

export interface AdminPaymentsData {
  chartData: AdminChartPoint[];
  transactions: AdminTransaction[];
}

// ─── Guardian family member (shared) ───
export interface FamilyMember {
  name: string; relation: string; age: number;
  condition: string; activeCare: boolean; img: string;
}

// ─── Verifications ───
export interface AdminVerification {
  id: number; name: string; role: string; submitted: string;
  docs: string[]; status: string; location: string; specialty: string;
  avatar: string; color: string;
}

// ─── Reports ───
export interface AdminReport {
  id: number; type: string; reporter: string; against: string;
  reason: string; date: string; priority: string; status: string;
}

// ─── Users ───
export interface AdminUser {
  id: number; name: string; role: string; phone: string; location: string;
  joined: string; status: string; verified: boolean; avatar: string; color: string;
}

// ─── Agency Approvals ───
export interface AdminAgencyApproval {
  id: string; name: string; owner: string; email: string; registrationNo: string;
  location: string; serviceAreas: string[]; plannedCaregivers: number; documents: number;
  submittedDate: string; status: string; placements?: number; caregivers?: number;
  rating?: number; revenue?: string;
}

// ─── Placement Monitoring ───
export interface AdminPlacement {
  id: string; agency: string; guardian: string; patient: string; caregiver: string;
  start: string; status: string; compliance: number; rating: number; missedShifts: number;
}

export interface AgencyPerformanceRow {
  name: string; placements: number; rating: number; onTimeRate: string;
  incidentRate: string; revenue: string;
}

// ─── Alerts ───
export interface AdminAlert { type: string; text: string; severity: string; }

// ─── Financial Audit ───
export interface AuditChartDataPoint { day: string; rev: number; payout: number; }

// ─── System Health ───
export interface SystemPerformancePoint { time: string; latency: number; cpu: number; }

// ─── Moderator ───
export interface ModerationQueueItem {
  id: number; type: string; content: string; reporter: string; time: string; priority: string;
}

export interface ModeratorDashboardStats {
  pendingReviews: number;
  openReports: number;
  contentFlags: number;
  resolvedToday: number;
}

export interface FlaggedContent {
  id: number; type: string; content: string; reporter: string; time: string; severity: string; target: string; reason: string;
}

export interface ModeratorReview {
  id: number; reviewer: string; about: string; rating: number; text: string;
  date: string; flagReason: string | null; status: string;
}

export interface ModeratorReport {
  id: number; type: string; from: string; against: string;
  desc: string; priority: string; status: string; date: string;
}

export interface ModeratorSanction {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  type: "warning" | "mute" | "suspension" | "ban";
  reason: string;
  issuedBy: string;
  issuedAt: string;
  expiresAt?: string;
  status: "active" | "expired" | "revoked";
  notes?: string;
}

export interface ModeratorEscalation {
  id: string;
  sourceType: "report" | "review" | "content";
  sourceId: number;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "pending" | "in_review" | "resolved" | "dismissed";
  escalatedBy: string;
  escalatedAt: string;
  assignedTo?: string;
  resolvedAt?: string;
  resolution?: string;
}

export interface ContractDispute {
  id: string;
  contractId: string;
  filedBy: string;
  filedByRole: string;
  againstParty: string;
  reason: string;
  description: string;
  evidence: string[];
  status: "open" | "under_review" | "mediation" | "resolved" | "closed";
  priority: "low" | "medium" | "high";
  filedAt: string;
  resolvedAt?: string;
  resolution?: string;
  messages: DisputeMessage[];
}

export interface DisputeMessage {
  id: string;
  disputeId: string;
  senderName: string;
  senderRole: string;
  message: string;
  createdAt: string;
  isSystemMessage?: boolean;
}

// ─── Service Return Types (untyped methods) ───
export interface AuditLogEntry {
  time: string; action: string; uid: string; ip: string;
  severity: "info" | "warning" | "critical";
}

export interface AuditLogsStat { label: string; val: string; }

export interface AuditLogsData {
  stats: AuditLogsStat[];
  logs: AuditLogEntry[];
}

/** Recent high-severity rows from audit_logs for System Health */
export interface SecurityAlertItem {
  id: string;
  title: string;
  detail: string;
  severity: "warning" | "critical";
  timeLabel: string;
  source?: string;
}

export interface CMSContentItem {
  title: string; type: string; status: string; date: string; author: string;
}

export interface CMSPageData {
  stats: Array<{ label: string; val: string }>;
  content: CMSContentItem[];
}

export interface DisputeItem {
  id: string; parties: string; type: string; status: string; amount: string; date: string;
}

export interface DisputeData {
  stats: Array<{ label: string; val: string }>;
  disputes: DisputeItem[];
}

export interface PolicyItem {
  title: string; version: string; status: string; updated: string; category: string;
}

export interface PolicyData {
  policies: PolicyItem[];
}

export interface PromoItem {
  code: string; discount: string; type: string; status: string;
  used: number; limit: number | null; expires: string;
}

export interface PromoData {
  stats: Array<{ label: string; val: string }>;
  promos: PromoItem[];
}

export interface SupportTicketMessage {
  from: string; role: string; time: string; text: string;
}

export interface SupportTicketData {
  id: string; subject: string; status: string; priority: string;
  user: { name: string; role: string; email: string };
  created: string; category: string;
  messages: SupportTicketMessage[];
}

export interface UserInspectorActivity {
  action: string; detail: string; time: string;
}

export interface UserInspectorData {
  user: {
    id: string; name: string; email: string; phone: string;
    role: string; status: string; verified: boolean; joined: string;
    stats: { shifts: number; earnings: string; rating: number; reviews: number };
    recentActivity: UserInspectorActivity[];
  };
}

export interface VerificationCheck {
  name: string; result: string;
}

export interface VerificationDocument {
  name: string; status: string; size: string;
}

export interface VerificationCaseData {
  id: string; type: string; status: string;
  applicant: { name: string; role: string; submitted: string };
  documents: VerificationDocument[];
  checks: VerificationCheck[];
}

export interface AdminSettingsData {
  platformName: string; supportEmail: string; supportPhone: string;
  defaultLanguage: string; timezone: string;
  platformFee: string; withdrawalMin: string; withdrawalMax: string; withdrawalFee: string;
  maintenanceMode: boolean; caregiverVerification: boolean;
  agencyVerification: boolean; shopVerification: boolean;
  emailNotifications: boolean; smsNotifications: boolean; pushNotifications: boolean;
  maxLoginAttempts: string; sessionTimeout: string; mfaRequired: boolean;
}