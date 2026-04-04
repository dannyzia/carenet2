/** A job posting created by a guardian or agency */
export interface Job {
  id: string;
  title: string;
  patient?: string;
  age?: number;
  location: string;
  description?: string;
  salary?: string;
  type?: string;
  budget?: string;
  duration?: string;
  experience: string;
  skills: string[];
  agency?: { name: string; rating: number; verified: boolean };
  posted: string;
  urgent?: boolean;
  rating?: number | null;
  status?: string;
}

/** Rich job detail (extends Job for detail page) */
export interface JobDetail {
  id: number;
  title: string;
  patient: string;
  age: number;
  gender: string;
  location: string;
  type: string;
  budget: string;
  budgetBreakdown: string;
  duration: string;
  shift: string;
  rating: number | null;
  posted: string;
  urgent: boolean;
  skills: string[];
  description: string;
  requirements: string[];
  guardianName: string;
  guardianVerified: boolean;
  guardianImg: string;
  applicants: number;
  careType: string;
}

/** Agency job management record */
export interface AgencyJob {
  id: string;
  reqId: string;
  careType: string;
  location: string;
  skills: string[];
  experience: string;
  shiftType: string;
  rate: string;
  applications: number;
  posted: string;
  status: "open" | "applications" | "interview" | "offer" | "filled" | "closed";
}

/** Shift plan for a caregiver */
export interface ShiftPlan {
  id: string;
  patientName: string;
  date: string;
  shiftTime: string;
  status: "active" | "upcoming" | "completed";
  tasks: { label: string; done: boolean }[];
  /** Raw DB shift status when loaded from Supabase (for check-in / check-out gating) */
  dbStatus?: string;
}

/** Caregiver's assigned patient (from their perspective) */
export interface AssignedPatient {
  id: string;
  name: string;
  age: number;
  gender: string;
  conditions: string[];
  agency: string;
  placementId: string;
  careType: string;
  schedule: string;
  nextShift: string;
  nextShiftIn: string;
  guardian: string;
  guardianPhone: string;
  active: boolean;
}