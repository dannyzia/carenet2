/** Caregiver profile visible in search/marketplace */
export interface CaregiverProfile {
  id: string;
  name: string;
  type: string;
  rating: number;
  reviews: number;
  location: string;
  experience: string;
  verified: boolean;
  specialties: string[];
  agency?: string;
  image?: string;
}

/** Caregiver as seen from an agency roster */
export interface AgencyCaregiver {
  id: number;
  name: string;
  specialty: string;
  location: string;
  phone: string;
  rating: number;
  jobs: number;
  joined: string;
  status: "active" | "inactive" | "on-leave" | "pending";
  verified: boolean;
}

/** Care note written by a caregiver */
export interface CareNote {
  id: string;
  patientName: string;
  date: string;
  time: string;
  category: "observation" | "medication" | "activity" | "incident" | "vitals";
  title: string;
  content: string;
  mood?: string;
  pinned: boolean;
  tags: string[];
  attachments: number;
}

// ─── Dashboard ───
export interface DashboardEarningsPoint { month: string; amount: number; }

export interface RecentJob {
  id: string | number; patient: string; type: string; date: string;
  status: "active" | "completed" | "cancelled"; amount: string;
}

export interface UpcomingScheduleItem {
  shiftId?: string;
  /** ISO date (YYYY-MM-DD) when known — used to filter “today” on live dashboards. */
  date?: string;
  time: string; patient: string; type: string; duration: string;
}

/** Caregiver home dashboard headline metrics */
export interface CaregiverDashboardSummary {
  activeJobs: number;
  avgRating: number;
  reviewCount: number;
  /** BDT amount for current month from earnings chart */
  thisMonthBdt: number;
  hoursThisMonth: number;
  weekJobsDelta: number;
  vsLastMonthPercent: number;
  earningsTrendPercent: number;
}

// ─── Earnings ───
export interface MonthlyEarningsPoint { month: string; earned: number; withdrawn: number; }

export interface CaregiverTransaction {
  id: number; desc: string; date: string; amount: string; type: string; status: string;
}

export interface CaregiverPaymentMethod { name: string; number: string; logo: string; primary: boolean; }

// ─── Documents ───
export interface CaregiverDocument {
  id: number; name: string; type: string; status: string;
  uploaded: string; expiry: string | null; file: string; size: string;
  category?: import("./upload.model").DocumentCategory;
  thumbnailUrl?: string;
  fileUrl?: string;
  captureMethod?: "camera" | "file";
}

export interface RequiredDocument { name: string; due: string; urgent: boolean; }

// ─── Schedule ───
export interface ScheduleBlock { label: string; patient: string; duration: number; color: string; startHour: number; }

export interface UpcomingBooking {
  id: number; patient: string; type: string; date: string; time: string; status: string;
}

// ─── Med Schedule ───
export interface MedScheduleItem {
  id: string; patientName: string; medicineName: string; dosage: string;
  scheduledTime: string; timing: "morning" | "afternoon" | "evening" | "night";
  instructions: string; taken: boolean | null; takenAt?: string;
}

// ─── Profile ───
export interface CaregiverProfileData {
  name: string; title: string; bio: string; phone: string; email: string;
  location: string; experience: string; rate: string;
  skills: string[]; languages: string[];
  avatarUrl?: string;
}

// ─── Care Logs ───
export interface RecentCareLog { type: string; time: string; detail: string; iconType: string; color: string; }

// ─── Past Patients ───
export interface PastPatient {
  name: string; dates: string; totalShifts: number; rating: number;
}

// ─── Tax ───
export interface TaxChartDataPoint { month: string; income: number; }

// ─── Reviews ───
export interface CaregiverReview {
  id: number; reviewer: string; role: string; rating: number; date: string;
  text: string; avatar: string; avatarColor: string;
}

// ─── Conversations ───
export interface RoleConversation {
  id: number; name: string; role: string; avatar: string; lastMsg: string;
  time: string; unread: number; online: boolean; color: string;
}

export interface InlineChatMessage {
  id: number; from: string; text: string; time: string; read?: boolean;
}

// ─── Service Return Types (untyped methods) ───
export interface DailyEarningsDetail {
  date: string; totalEarnings: number; shifts: number; hours: number;
  breakdown: Array<{
    id: string; client: string; type: string; hours: number;
    rate: number; total: number; time: string;
  }>;
}

export interface JobApplicationDetail {
  id: string; jobTitle: string; agency: string; location: string;
  salary: string; status: "under_review" | "accepted" | "rejected";
  appliedDate: string;
  requirements: string[];
  timeline: Array<{ step: string; date: string; done: boolean }>;
}

export interface PayoutSettings {
  methods: Array<{ id: string; name: string; account: string; primary: boolean }>;
  schedule: "weekly" | "biweekly" | "monthly";
  minPayout: number;
}

export interface CaregiverPortfolio {
  bio: string;
  specialties: string[];
  certifications: Array<{ name: string; issuer: string; year: number }>;
  experience: Array<{ role: string; org: string; period: string }>;
}

export interface CaregiverReference {
  id: string; name: string; role: string; org: string; phone: string;
  status: "verified" | "pending" | "expired";
}

export interface ShiftDetailData {
  id: string; client: string; type: string;
  status: "in_progress" | "completed" | "upcoming" | "cancelled";
  date: string; startTime: string; endTime: string; hours: number;
  rate: number; total: number; location: string;
  tasks: Array<{ name: string; done: boolean }>;
  notes: string;
}

export interface SkillsAssessment {
  overall: number;
  categories: Array<{ name: string; score: number; max: number }>;
  recommendations: string[];
}

export interface TrainingModule {
  id: string; title: string; category: string; duration: string;
  progress: number; status: "in_progress" | "completed" | "not_started";
  xpReward?: number;
  thumbnailUrl?: string;
  description?: string;
}