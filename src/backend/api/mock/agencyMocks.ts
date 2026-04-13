import type {
  Agency, AgencyCaregiver, AgencyJob,
  CaregiverPayout, PayoutStatus, PayoutHistoryItem, SettlementPeriod,
  AgencyTransaction, AgencyClient, AgencyMonthlyData, AgencyPerformanceData,
  ActiveShift, ShiftAlert, AgencyRevenuePoint, JobApplication, RosterCaregiver,
  RequirementInboxItem, AgencySettings, StorefrontData, Branch,
  ClientCarePlanData, StaffAttendanceData, StaffHiringData,
  DocumentVerificationItem, CarePlanTemplate, AgencyIncident,
} from "@/backend/models";

/** Agency directory listings */
export const MOCK_AGENCIES: Agency[] = [
  { id: "a1", name: "HealthCare Pro BD", tagline: "Trusted Home Healthcare Since 2018", rating: 4.8, reviews: 124, location: "Gulshan, Dhaka", serviceAreas: ["Gulshan", "Banani", "Baridhara"], specialties: ["Elder Care", "Post-Op", "Night Care"], caregiverCount: 24, verified: true, responseTime: "< 4 hours", image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=200&h=200" },
  { id: "a2", name: "Green Care Agency", tagline: "Compassionate Care, Professional Service", rating: 4.6, reviews: 87, location: "Dhanmondi, Dhaka", serviceAreas: ["Dhanmondi", "Mohammadpur", "Lalmatia"], specialties: ["Elderly Care", "Dementia", "Mobility"], caregiverCount: 18, verified: true, responseTime: "< 6 hours", image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=200&h=200" },
  { id: "a3", name: "CareFirst BD", tagline: "Your Family's Health Partner", rating: 4.7, reviews: 95, location: "Uttara, Dhaka", serviceAreas: ["Uttara", "Tongi", "Airport Area"], specialties: ["Pediatric Care", "Special Needs", "Physiotherapy"], caregiverCount: 15, verified: true, responseTime: "< 8 hours", image: "https://images.unsplash.com/photo-1551190822-a9ce113ac100?auto=format&fit=crop&q=80&w=200&h=200" },
];

/** Agency's own caregiver roster */
export const MOCK_AGENCY_CAREGIVERS: AgencyCaregiver[] = [
  { id: 1, name: "Karim Uddin", specialty: "Elderly Care", location: "Dhanmondi", phone: "0171X", rating: 4.8, jobs: 12, joined: "Jan 2026", status: "active", verified: true },
  { id: 2, name: "Fatema Akter", specialty: "Pediatric Care", location: "Uttara", phone: "0181X", rating: 4.9, jobs: 18, joined: "Dec 2025", status: "active", verified: true },
  { id: 3, name: "Nazmul Hasan", specialty: "Physiotherapy", location: "Mirpur", phone: "0191X", rating: 4.7, jobs: 8, joined: "Feb 2026", status: "active", verified: false },
  { id: 4, name: "Salma Begum", specialty: "Post-Op Care", location: "Gulshan", phone: "0161X", rating: 4.6, jobs: 5, joined: "Mar 2026", status: "on-leave", verified: true },
  { id: 5, name: "Amina Hossain", specialty: "Dementia Care", location: "Sylhet", phone: "0191X", rating: 4.5, jobs: 3, joined: "Mar 2026", status: "pending", verified: false },
];

/** Agency job management records */
export const MOCK_AGENCY_JOBS: AgencyJob[] = [
  { id: "JOB-2026-0087", reqId: "CR-2026-0042", careType: "Full Day Care (Elder)", location: "Gulshan-2, Dhaka", skills: ["Elder Care", "Mobility Assistance"], experience: "3-5 years", shiftType: "Day (8AM-8PM)", rate: "৳ 1,200-1,800/shift", applications: 5, posted: "Mar 15", status: "applications" },
  { id: "JOB-2026-0086", reqId: "CR-2026-0041", careType: "Night Nurse", location: "Dhanmondi, Dhaka", skills: ["Nursing", "Vital Monitoring"], experience: "2+ years", shiftType: "Night (8PM-8AM)", rate: "৳ 1,500-2,000/shift", applications: 3, posted: "Mar 14", status: "interview" },
  { id: "JOB-2026-0085", reqId: "CR-2026-0040", careType: "Pediatric Special Needs", location: "Uttara, Dhaka", skills: ["Pediatric", "Cerebral Palsy", "PT Support"], experience: "3+ years", shiftType: "Day (8AM-6PM)", rate: "৳ 1,800-2,500/shift", applications: 2, posted: "Mar 13", status: "open" },
];

// ─── Agency Payroll Data ───
export const MOCK_CAREGIVER_PAYOUTS: CaregiverPayout[] = [
  { name: "Karim Uddin", placements: 2, shifts: 28, hours: 336, rate: 1200, gross: 33600, deductions: 0, net: 33600, status: "pending", method: "bKash", account: "0171X-XXXXXX" },
  { name: "Fatema Akter", placements: 1, shifts: 24, hours: 288, rate: 1400, gross: 33600, deductions: 1500, net: 32100, status: "pending", method: "Nagad", account: "0181X-XXXXXX" },
  { name: "Nasrin Begum", placements: 1, shifts: 14, hours: 168, rate: 1000, gross: 14000, deductions: 0, net: 14000, status: "processing", method: "bKash", account: "0191X-XXXXXX" },
  { name: "Rashid Khan", placements: 1, shifts: 10, hours: 80, rate: 1500, gross: 15000, deductions: 500, net: 14500, status: "paid", method: "Bank Transfer", account: "DBBL ****1234" },
];
export const MOCK_PAYOUT_HISTORY: PayoutHistoryItem[] = [
  { date: "Mar 1, 2026", caregiver: "Karim Uddin", amount: 28800, method: "bKash", methodColor: "#D12053", ref: "PAY-20260301-001", account: "0171X-XXXXXX" },
  { date: "Mar 1, 2026", caregiver: "Fatema Akter", amount: 26600, method: "Nagad", methodColor: "#ED6E1B", ref: "PAY-20260301-002", account: "0181X-XXXXXX" },
  { date: "Feb 15, 2026", caregiver: "Karim Uddin", amount: 31200, method: "bKash", methodColor: "#D12053", ref: "PAY-20260215-001", account: "0171X-XXXXXX" },
];
export const MOCK_SETTLEMENT_PERIODS: SettlementPeriod[] = [
  { period: "Mar 1-15, 2026", status: "active", received: 156000, paid: 94200, pending: 65700 },
  { period: "Feb 16-28, 2026", status: "settled", received: 128000, paid: 128000, pending: 0 },
];

// ─── Agency Transactions ───
export const MOCK_AGENCY_TRANSACTIONS: AgencyTransaction[] = [
  { id: 1, desc: "Rashed Hossain \u2013 Care Package (Mar)", amount: "+\u09F3 32,400", type: "credit", date: "Mar 14", status: "completed" },
  { id: 2, desc: "Caregiver Payroll \u2013 March (Week 2)", amount: "-\u09F3 84,000", type: "debit", date: "Mar 14", status: "completed" },
  { id: 3, desc: "Tahmid Khan \u2013 Care Package (Mar)", amount: "+\u09F3 18,000", type: "credit", date: "Mar 10", status: "completed" },
  { id: 4, desc: "Platform Fee \u2013 5%", amount: "-\u09F3 15,600", type: "debit", date: "Mar 1", status: "completed" },
  { id: 5, desc: "Sara Ahmed \u2013 New Client Deposit", amount: "+\u09F3 8,400", type: "credit", date: "Mar 5", status: "completed" },
];

// ─── Agency Clients ───
export const MOCK_AGENCY_CLIENTS: AgencyClient[] = [
  { id: 1, name: "Rashed Hossain", type: "Guardian", patients: ["Abdul Rahman (Father)", "Rahela Begum (Mother)"], location: "Gulshan, Dhaka", since: "Jan 2026", spend: "\u09F3 32,400", status: "active" },
  { id: 2, name: "Tahmid Khan", type: "Guardian", patients: ["Salam Khan (Father)"], location: "Chittagong", since: "Feb 2026", spend: "\u09F3 18,000", status: "active" },
  { id: 3, name: "Sara Ahmed", type: "Guardian", patients: ["Nasrin Ahmed (Mother)"], location: "Sylhet", since: "Mar 2026", spend: "\u09F3 8,400", status: "new" },
];

// ─── Agency Reports Data ───
export const MOCK_AGENCY_MONTHLY_DATA: AgencyMonthlyData[] = [
  { month: "Oct", clients: 12, caregivers: 18, revenue: 185000 }, { month: "Nov", clients: 14, caregivers: 20, revenue: 218000 },
  { month: "Dec", clients: 13, caregivers: 19, revenue: 195000 }, { month: "Jan", clients: 16, caregivers: 22, revenue: 265000 },
  { month: "Feb", clients: 17, caregivers: 23, revenue: 248000 }, { month: "Mar", clients: 18, caregivers: 24, revenue: 312000 },
];
export const MOCK_AGENCY_PERFORMANCE_DATA: AgencyPerformanceData[] = [
  { month: "Oct", rating: 4.5 }, { month: "Nov", rating: 4.6 }, { month: "Dec", rating: 4.7 },
  { month: "Jan", rating: 4.7 }, { month: "Feb", rating: 4.8 }, { month: "Mar", rating: 4.8 },
];

// ─── Shift Monitoring ───
export const MOCK_ACTIVE_SHIFTS: ActiveShift[] = [
  { caregiver: "Karim Uddin", patient: "Mr. Abdul Rahman", time: "8PM-8AM", checkedIn: "7:55 PM", status: "on-time", lastLog: "12 min ago", placement: "PL-2026-0018" },
  { caregiver: "Fatema Akter", patient: "Baby Arif", time: "8AM-8PM", checkedIn: "8:02 AM", status: "on-time", lastLog: "45 min ago", placement: "PL-2026-0019" },
  { caregiver: "Nasrin Begum", patient: "Mrs. Salma Begum", time: "8PM-8AM", checkedIn: "-", status: "late", lastLog: "N/A", placement: "PL-2026-0020" },
  { caregiver: "Rashid Khan", patient: "Mr. Rafiqul Islam", time: "8AM-8PM", checkedIn: "8:15 AM", status: "grace", lastLog: "1h 20m ago", placement: "PL-2026-0021" },
];
export const MOCK_SHIFT_ALERTS: ShiftAlert[] = [
  {
    type: "missed",
    text: "Nasrin Begum has not checked in for 8PM shift (Mr. Salma Begum)",
    time: "30 min overdue",
    caregiverName: "Nasrin Begum",
    patientName: "Mrs. Salma Begum",
  },
  {
    type: "no-log",
    text: "No care log from Rashid Khan for 1h 20m (Mr. Rafiqul Islam)",
    time: "Warning",
    caregiverName: "Rashid Khan",
    patientName: "Mr. Rafiqul Islam",
  },
];

// ─── Agency Revenue Chart Data (Dashboard) ───
export const MOCK_AGENCY_REVENUE_DATA: AgencyRevenuePoint[] = [
  { month: "Oct", amount: 185000 }, { month: "Nov", amount: 218000 },
  { month: "Dec", amount: 195000 }, { month: "Jan", amount: 265000 },
  { month: "Feb", amount: 248000 }, { month: "Mar", amount: 312000 },
];

// ─── Job Applications ───
export const MOCK_JOB_APPLICATIONS: JobApplication[] = [
  { id: "APP-001", name: "Karim Uddin", rating: 4.8, experience: "6 years", specialties: ["Elder Care", "Mobility Assistance"], skills: ["Medication Management", "Vital Signs"], gender: "Male", location: "Gulshan, Dhaka", matchScore: 95, appliedDate: "Mar 15", lastActivity: "2h ago", status: "new", certifications: ["Basic Life Support", "Elder Care Certified"], previousJobs: 24, completionRate: 98 },
  { id: "APP-002", name: "Nasrin Begum", rating: 4.7, experience: "4 years", specialties: ["Elder Care", "Night Care"], skills: ["Medication Management"], gender: "Female", location: "Uttara, Dhaka", matchScore: 82, appliedDate: "Mar 15", lastActivity: "5h ago", status: "new", certifications: ["Elder Care Certified"], previousJobs: 16, completionRate: 95 },
  { id: "APP-004", name: "Fatema Akter", rating: 4.9, experience: "8 years", specialties: ["Elder Care", "Dementia", "Nursing"], skills: ["Medication Management", "Wound Care"], gender: "Female", location: "Dhanmondi, Dhaka", matchScore: 98, appliedDate: "Mar 14", lastActivity: "2h ago", status: "interview", certifications: ["Registered Nurse", "Dementia Care Specialist", "BLS"], previousJobs: 42, completionRate: 100 },
];

// ─── Caregiver Roster (for Requirement Review) ───
export const MOCK_CAREGIVER_ROSTER: RosterCaregiver[] = [
  { id: "c1", name: "Karim Uddin", specialty: "Elder Care", rating: 4.8, experience: "6 years", available: true },
  { id: "c2", name: "Fatema Akter", specialty: "Nursing", rating: 4.9, experience: "8 years", available: true },
  { id: "c3", name: "Nasrin Begum", specialty: "Elder Care", rating: 4.7, experience: "4 years", available: false },
];

// ─── Requirements Inbox ───
export const MOCK_REQUIREMENTS_INBOX: RequirementInboxItem[] = [
  { id: "REQ-101", guardianName: "Fatima Rahman", guardianVerified: true, guardianPlacements: 3, patientName: "Abdul Rahman", patientAge: 68, patientCondition: "Post-hip replacement", careType: "Elderly Care", duration: "3 months", shiftPreference: "Day + Night", budgetMin: 1500, budgetMax: 2500, location: "Gulshan-2, Dhaka", specialRequirements: "Wheelchair access needed, experience with post-surgical recovery preferred", submittedDate: "Mar 14", submittedAgo: "2 hours ago", responseDeadline: "Respond in 22 hrs", status: "new" as const, priority: "urgent" as const, isNew: true },
  { id: "REQ-098", guardianName: "Zubayer Ahmed", guardianVerified: true, guardianPlacements: 1, patientName: "Ayesha Begum", patientAge: 72, patientCondition: "Dementia care", careType: "Specialized Care", duration: "6 months", shiftPreference: "Full-time", budgetMin: 2000, budgetMax: 3000, location: "Dhanmondi, Dhaka", specialRequirements: "Experience with dementia patients, patience and empathy essential", submittedDate: "Mar 12", submittedAgo: "2 days ago", responseDeadline: "Overdue", status: "under-review" as const, priority: "normal" as const, isNew: false },
  { id: "REQ-095", guardianName: "Nusrat Jahan", guardianVerified: false, guardianPlacements: 0, patientName: "Karim Mia", patientAge: 55, patientCondition: "Stroke recovery", careType: "Night Care", duration: "1 month", shiftPreference: "Night only", budgetMin: 1200, budgetMax: 1800, location: "Uttara, Dhaka", specialRequirements: "Night monitoring, medication management", submittedDate: "Mar 10", submittedAgo: "4 days ago", responseDeadline: "", status: "proposal-sent" as const, priority: "normal" as const, isNew: false },
];

export const MOCK_AGENCY_SETTINGS: AgencySettings = {
  name: "HealthCare Pro BD", email: "admin@healthcarepro.bd", phone: "+880 1700-000000",
  address: "Gulshan-2, Dhaka", license: "DGHS-2024-1234", established: 2018,
  services: ["Elderly Care", "Post-Op Recovery", "Night Care", "Pediatric Care"],
  commissionRate: 15, payoutSchedule: "weekly" as const, hourlyRate: 350,
  complianceDocs: [
    { name: "Trade License", status: "valid", expires: "Dec 2026" },
    { name: "Tax Identification (TIN)", status: "valid", expires: "N/A" },
    { name: "Professional Liability Insurance", status: "valid", expires: "Sep 2026" },
    { name: "Staff Background Check Policy", status: "review", expires: "Needs update" },
  ],
};

export const MOCK_STOREFRONT_DATA: StorefrontData = {
  agency: {
    name: "HealthCare Pro BD",
    rating: 4.8,
    reviews: 124,
    tagline: "Trusted Home Healthcare Since 2018",
    established: 2018,
    successRate: 99.2,
    responseTime: "<15 min",
    tier: "Tier 1",
    location: "Banani, Dhaka",
    caregiverCount: 85,
  },
  services: [
    { id: "s1", name: "Full Day Care", price: 2000, description: "Comprehensive 8AM-8PM care package", popular: true },
    { id: "s2", name: "Night Care", price: 1800, description: "Overnight monitoring 8PM-8AM", popular: false },
    { id: "s3", name: "Post-Op Recovery", price: 3000, description: "Specialized post-surgery care", popular: true },
  ],
  staff: [
    { id: "sf1", name: "Dr. Rahat Khan", role: "Sr. Nurse Specialist", imageUrl: "https://images.unsplash.com/photo-1559839734-2b71f1536783?auto=format&fit=crop&q=80&w=200&h=200" },
    { id: "sf2", name: "Sumi Akter", role: "Physiotherapist", imageUrl: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=200&h=200" },
  ],
  reviewItems: [
    { rating: 5, text: "Excellent professional service during my father's recovery.", authorName: "Zubayer Ahmed", authorRole: "Guardian", createdAt: "2026-03-10T12:00:00Z" },
    { rating: 5, text: "Responsive team and compassionate caregivers.", authorName: "Fatima Rahman", authorRole: "Guardian", createdAt: "2026-03-05T10:00:00Z" },
  ],
};

export const MOCK_BRANCHES: Branch[] = [
  { id: "b1", name: "Gulshan Branch (HQ)", address: "House 42, Road 11, Gulshan-2", city: "Dhaka", staff: 24, active: true, performance: "Excellent" },
  { id: "b2", name: "Dhanmondi Branch", address: "Road 27, Dhanmondi", city: "Dhaka", staff: 16, active: true, performance: "Good" },
  { id: "b3", name: "Uttara Branch", address: "Sector 7, Uttara", city: "Dhaka", staff: 12, active: false, performance: "Standby" },
];

export const MOCK_CLIENT_CARE_PLAN: ClientCarePlanData = {
  client: { name: "Abdul Rahman", age: 68, condition: "Post-hip replacement" },
  plan: {
    goals: ["Independent mobility within 6 weeks", "Pain management below 3/10", "Resume daily activities"],
    schedule: [
      { day: "Mon-Fri", shift: "Day", caregiver: "Sumaiya Akter", tasks: ["Physiotherapy exercises", "Medication administration", "Vital checks"] },
      { day: "Mon-Fri", shift: "Night", caregiver: "Karim Uddin", tasks: ["Nighttime monitoring", "Pain management"] },
    ],
    medications: [{ name: "Paracetamol 500mg", frequency: "3x daily" }, { name: "Omeprazole 20mg", frequency: "1x morning" }],
  },
};

export const MOCK_STAFF_ATTENDANCE: StaffAttendanceData = {
  date: "March 15, 2026",
  staff: [
    { id: "cg1", name: "Sumaiya Akter", role: "Senior Caregiver", status: "present" as const, checkIn: "7:55 AM", checkOut: null },
    { id: "cg2", name: "Karim Uddin", role: "Caregiver", status: "present" as const, checkIn: "8:02 AM", checkOut: null },
    { id: "cg3", name: "Nasrin Begum", role: "Caregiver", status: "late" as const, checkIn: "8:45 AM", checkOut: null },
    { id: "cg4", name: "Rashid Khan", role: "Caregiver", status: "absent" as const, checkIn: null, checkOut: null },
  ],
};

export const MOCK_STAFF_HIRING: StaffHiringData = {
  openPositions: [
    { id: "p1", title: "Senior Caregiver", location: "Gulshan", applicants: 12, posted: "Mar 10" },
    { id: "p2", title: "Night Nurse", location: "Dhanmondi", applicants: 8, posted: "Mar 12" },
  ],
  recentApplicants: [
    { id: "a1", name: "Tahmina Khatun", role: "Caregiver", experience: "3 years", rating: 4.5, status: "interview" as const },
    { id: "a2", name: "Mizanur Rahman", role: "Nurse", experience: "5 years", rating: 4.8, status: "screening" as const },
    { id: "a3", name: "Sharmin Akter", role: "Caregiver", experience: "1 year", rating: 4.2, status: "new" as const },
  ],
};

// ─── Document Verification Queue ───
export const MOCK_VERIFICATION_QUEUE: DocumentVerificationItem[] = [
  { id: "dv-1", caregiverId: "cg-1", caregiverName: "Fatema Akter", documentName: "National ID (Front)", category: "nid", submittedAt: "2026-03-15T10:30:00Z", fileUrl: "/mock/nid-front.jpg", thumbnailUrl: "/mock/nid-front-thumb.jpg", status: "pending" },
  { id: "dv-2", caregiverId: "cg-1", caregiverName: "Fatema Akter", documentName: "National ID (Back)", category: "nid", submittedAt: "2026-03-15T10:31:00Z", fileUrl: "/mock/nid-back.jpg", thumbnailUrl: "/mock/nid-back-thumb.jpg", status: "pending" },
  { id: "dv-3", caregiverId: "cg-2", caregiverName: "Karim Uddin", documentName: "Nursing Diploma", category: "education", submittedAt: "2026-03-14T09:00:00Z", fileUrl: "/mock/nursing-diploma.pdf", status: "pending" },
  { id: "dv-4", caregiverId: "cg-3", caregiverName: "Nazmul Hasan", documentName: "Police Clearance", category: "police_verification", submittedAt: "2026-03-13T14:00:00Z", fileUrl: "/mock/police-clearance.pdf", status: "pending" },
  { id: "dv-5", caregiverId: "cg-2", caregiverName: "Karim Uddin", documentName: "First Aid Certificate", category: "training", submittedAt: "2026-03-12T11:00:00Z", fileUrl: "/mock/first-aid-cert.pdf", status: "approved", reviewNote: "Valid certification", reviewedBy: "Admin", reviewedAt: "2026-03-13T09:00:00Z" },
];

// ─── Care Plan Templates ───
export const MOCK_CARE_TEMPLATES: CarePlanTemplate[] = [
  {
    id: "tpl-1", name: "Elderly Diabetes Care", condition: "Type 2 Diabetes",
    description: "Comprehensive daily care plan for elderly patients managing Type 2 Diabetes with diet, medication, and activity monitoring.",
    tasks: [
      { label: "Blood sugar check", frequency: "3x daily" },
      { label: "Meal preparation (diabetic diet)", frequency: "3x daily" },
      { label: "Medication administration", frequency: "2x daily" },
      { label: "30-min walking exercise", frequency: "1x daily" },
      { label: "Foot inspection", frequency: "1x daily" },
    ],
    medications: [
      { name: "Metformin", dosage: "500mg", frequency: "Twice daily" },
      { name: "Insulin Glargine", dosage: "10 units", frequency: "Once daily (bedtime)" },
    ],
    schedule: [
      { day: "Daily", shift: "Morning", tasks: ["Blood sugar check", "Breakfast prep", "Morning medication", "Walking exercise"] },
      { day: "Daily", shift: "Afternoon", tasks: ["Lunch prep", "Blood sugar check", "Foot inspection"] },
      { day: "Daily", shift: "Evening", tasks: ["Dinner prep", "Evening medication", "Blood sugar check", "Insulin injection"] },
    ],
  },
  {
    id: "tpl-2", name: "Post-Stroke Rehabilitation", condition: "Stroke Recovery",
    description: "Structured recovery plan for stroke patients including physiotherapy, speech therapy, and daily living assistance.",
    tasks: [
      { label: "Range of motion exercises", frequency: "2x daily" },
      { label: "Speech therapy drills", frequency: "1x daily" },
      { label: "Blood pressure monitoring", frequency: "3x daily" },
      { label: "Meal assistance", frequency: "3x daily" },
      { label: "Cognitive stimulation activities", frequency: "1x daily" },
    ],
    medications: [
      { name: "Aspirin", dosage: "75mg", frequency: "Once daily" },
      { name: "Atorvastatin", dosage: "20mg", frequency: "Once daily (evening)" },
    ],
    schedule: [
      { day: "Daily", shift: "Morning", tasks: ["BP check", "Breakfast assistance", "ROM exercises", "Speech drills"] },
      { day: "Daily", shift: "Afternoon", tasks: ["Lunch assistance", "BP check", "Cognitive activities"] },
      { day: "Daily", shift: "Evening", tasks: ["Dinner assistance", "BP check", "ROM exercises", "Evening medication"] },
    ],
  },
  {
    id: "tpl-3", name: "Pediatric Cerebral Palsy", condition: "Cerebral Palsy",
    description: "Specialized daily care for children with cerebral palsy including physical therapy, feeding support, and developmental activities.",
    tasks: [
      { label: "Stretching routine", frequency: "3x daily" },
      { label: "Feeding assistance", frequency: "3x daily" },
      { label: "Supported standing practice", frequency: "2x daily" },
      { label: "Sensory play activities", frequency: "1x daily" },
      { label: "Communication exercises", frequency: "2x daily" },
    ],
    medications: [
      { name: "Baclofen", dosage: "5mg", frequency: "Three times daily" },
    ],
    schedule: [
      { day: "Daily", shift: "Morning", tasks: ["Morning stretching", "Breakfast feeding", "Communication exercises"] },
      { day: "Daily", shift: "Afternoon", tasks: ["Lunch feeding", "Standing practice", "Sensory play", "Stretching"] },
      { day: "Daily", shift: "Evening", tasks: ["Dinner feeding", "Standing practice", "Evening stretching", "Bedtime routine"] },
    ],
  },
];

// ─── Incidents (W09 — Agency Incidents Management) ───
export const MOCK_AGENCY_INCIDENTS: AgencyIncident[] = [
  {
    id: "INC-2026-0012",
    title: "Patient fall during morning routine",
    description: "Patient attempted to stand unassisted and fell near the bathroom door. No serious injury sustained. Ice pack applied to right knee. Guardian notified immediately.",
    severity: "high",
    status: "open",
    reportedBy: "Karim Uddin",
    patientName: "Mr. Rahim Ahmed",
    placementId: "PL-2026-0033",
    reportedAt: "2026-03-18T07:45:00Z",
  },
  {
    id: "INC-2026-0011",
    title: "Medication administered late",
    description: "Evening medication delayed by 2 hours due to caregiver shift handoff miscommunication. Medication was administered safely. No adverse effects observed.",
    severity: "medium",
    status: "resolved",
    reportedBy: "Fatema Akter",
    patientName: "Mrs. Laila Begum",
    placementId: "PL-2026-0027",
    reportedAt: "2026-03-17T21:10:00Z",
    resolvedAt: "2026-03-18T09:00:00Z",
    resolutionNote: "Shift handoff checklist updated. Both caregivers briefed on medication schedule. Guardian acknowledged resolution.",
  },
  {
    id: "INC-2026-0010",
    title: "Caregiver no-show — emergency coverage arranged",
    description: "Assigned caregiver did not report for morning shift and was unreachable by phone. Backup caregiver deployed within 90 minutes. Patient care uninterrupted.",
    severity: "critical",
    status: "escalated",
    reportedBy: "Agency Supervisor",
    patientName: "Mr. Nazrul Islam",
    placementId: "PL-2026-0021",
    reportedAt: "2026-03-16T08:05:00Z",
  },
  {
    id: "INC-2026-0009",
    title: "Minor allergic reaction to new soap product",
    description: "Patient developed mild skin rash on forearm after caregiver used a new soap brand during bathing. Product removed immediately. Rash subsiding.",
    severity: "low",
    status: "in-review",
    reportedBy: "Salma Begum",
    patientName: "Ms. Runa Khatun",
    placementId: "PL-2026-0018",
    reportedAt: "2026-03-15T14:30:00Z",
  },
  {
    id: "INC-2026-0008",
    title: "Vital signs outside normal range",
    description: "Patient blood pressure reading of 170/110 mmHg recorded during morning check. Doctor contacted. Patient advised rest and existing medication adjusted per physician guidance.",
    severity: "high",
    status: "resolved",
    reportedBy: "Nasrin Begum",
    patientName: "Mr. Abul Kashem",
    placementId: "PL-2026-0015",
    reportedAt: "2026-03-14T09:20:00Z",
    resolvedAt: "2026-03-14T14:00:00Z",
    resolutionNote: "Doctor consulted. Medication adjusted. Follow-up BP checks every 4 hours. Patient stabilised by afternoon.",
  },
];
