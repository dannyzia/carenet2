/**
 * Guardian Domain Models
 * Types for guardian-facing features: dashboard, placements, payments, reviews, scheduling
 */

// ─── Dashboard ───
export interface GuardianDashboardPatient {
  id: number; name: string; age: number; condition: string;
  caregiver: string; status: string; statusColor: string;
}

export interface GuardianActivity {
  iconType: "heart" | "calendar" | "creditCard" | "message" | "star";
  text: string; time: string; color: string;
  link?: string;
}

export interface GuardianDashboardAlert {
  id: string;
  title: string;
  subtitle?: string;
  actionPath: string;
}

export interface GuardianDashboardSummary {
  activePlacements: number;
  monthlySpendBdt: number;
  totalSessions: number;
}

// ─── Care Requirements ───
export interface CareRequirementMessage {
  from: string; name: string; text: string; time: string;
}

export interface WizardAgency {
  id: string; name: string; rating: number; reviews: number;
  location: string; specialties: string[]; verified: boolean;
}

export interface CareRequirement {
  id: string; patient: string; careType: string; agency: string;
  schedule: string; budget: string; submitted: string; status: string; note: string;
}

// ─── Placements ───
export interface GuardianPlacement {
  id: string; patient: string; agency: string; careType: string; startDate: string;
  endDate?: string; duration: string; currentCaregiver: string; onDuty: boolean;
  shiftsCompleted: number; shiftsTotal: number; status: string;
}

export interface PlacementShiftHistory {
  date: string; caregiver: string; time: string; checkIn: string; checkOut: string;
  duration: string; status: string; logs: number;
}

export interface CaregiverTimelineEntry {
  name: string; dates: string; shifts: number; rating: number;
}

// ─── Payments ───
export interface GuardianTransaction {
  id: number; desc: string; patient: string; date: string; amount: number;
  type: "credit" | "debit"; status: "completed" | "pending";
}

export interface GuardianInvoice {
  id: string; month: string; amount: number; status: "paid" | "partial" | "unpaid";
  due: string; agency: string;
}

export interface InvoiceLineItem {
  desc: string; qty: string; rate: number; total: number;
}

export interface InvoiceDetail {
  id: string; status: "paid" | "unpaid" | "partial";
  billedTo: { name: string; guardianId: string };
  agency: { name: string; agencyId: string; placementId: string };
  period: { from: string; to: string };
  issuedDate: string; dueDate: string; paidDate: string; paidVia: string;
  lineItems: InvoiceLineItem[];
  subtotal: number; platformFee: number; platformFeeRate: number;
  vat: number; vatRate: number; earlyDiscount: number; total: number;
}

// ─── Schedule ───
export interface GuardianAppointment {
  id: number; title: string; caregiver: string; date: string; time: string;
  type: string; color: string; patient: string;
}

export interface GuardianTodayEvent {
  time: string; title: string; caregiver: string; patient: string; color: string;
}

// ─── Reviews ───
export interface PastCaregiverReview {
  id: number; name: string; type: string; period: string; avatar: string; color: string;
  reviewed: boolean; myReview?: { rating: number; text: string };
}

export interface ReceivedReview {
  id: number; from: string; role: string; date: string; rating: number; text: string;
}

// ─── Messages ───
export interface MessageChat {
  id: number; name: string; lastMessage: string; time: string;
  unread: boolean; active: boolean; role: "agency" | "caregiver";
  stage: "Requirement Stage" | "Placement Active";
}

// ─── Profile ───
export interface GuardianProfile {
  name: string; phone: string; email: string;
  location: string; relation: string;
  bio: string; emergencyContact: string;
}

// ─── Public Profile Views ───
export interface AgencyPublicProfileService {
  name: string; desc: string; rate: string;
}

export interface AgencyPublicProfileCaregiver {
  name: string; specialty: string; rating: number;
}

export interface AgencyPublicProfileReview {
  author: string; rating: number; text: string; date: string;
}

export interface AgencyPublicProfile {
  id: string; name: string; tagline: string; established: number;
  rating: number; reviewCount: number; location: string;
  phone: string; email: string; about: string;
  services: AgencyPublicProfileService[];
  caregivers: AgencyPublicProfileCaregiver[];
  reviews: AgencyPublicProfileReview[];
}

export interface CaregiverPublicProfileEducation {
  degree: string; school: string; year: string;
}

export interface CaregiverPublicProfile {
  name: string; type: string; rating: number; reviews: number;
  location: string; price: string; experience: string; verified: boolean;
  agency: { id: string; name: string };
  bio: string; specialties: string[];
  education: CaregiverPublicProfileEducation[];
  languages: string[]; image: string;
}

export interface ComparisonCaregiver {
  id: string; name: string; type: string; specialty: string;
  rating: number; reviews: number; exp: string; rate: string;
  location: string; verified: boolean;
  agency: { id: string; name: string };
  img: string;
}
