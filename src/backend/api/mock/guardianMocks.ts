import type {
  Patient, SpendingDataPoint,
  GuardianDashboardPatient, CareRequirementMessage, WizardAgency,
  CareRequirement, MessageChat, GuardianTransaction, GuardianInvoice,
  GuardianAppointment, GuardianTodayEvent, PastCaregiverReview,
  ReceivedReview, PlacementShiftHistory, CaregiverTimelineEntry,
  GuardianActivity, GuardianDashboardAlert, GuardianDashboardSummary,
  AgencyPublicProfile, CaregiverPublicProfile,
  ComparisonCaregiver, GuardianProfile, InvoiceDetail,
} from "@/backend/models";

/** Guardian's registered patients */
export const MOCK_GUARDIAN_PATIENTS: Patient[] = [
  {
    id: "p1", name: "Abdul Rahman", relation: "Father", age: 74, gender: "Male",
    bloodGroup: "B+", dob: "Jan 5, 1952", location: "Dhanmondi, Dhaka", phone: "+880 1712-XXXXXX",
    conditions: ["Mobility Issues", "Arthritis", "Mild Hypertension"],
    caregiver: { name: "Karim Uddin", rating: 4.8, since: "Jan 2026" },
    status: "active", avatar: "A", color: "#DB869A",
    vitals: { bp: "130/85", glucose: "Normal", pulse: "72 bpm", weight: "68 kg" },
  },
  {
    id: "p2", name: "Rahela Begum", relation: "Mother", age: 68, gender: "Female",
    bloodGroup: "O+", dob: "Aug 12, 1958", location: "Dhanmondi, Dhaka", phone: "+880 1712-XXXXXX",
    conditions: ["Diabetes", "Hypertension"],
    caregiver: { name: "Fatema Akter", rating: 4.9, since: "Feb 2026" },
    status: "active", avatar: "R", color: "#7B5EA7",
    vitals: { bp: "140/90", glucose: "High", pulse: "76 bpm", weight: "62 kg" },
  },
];

/** Guardian dashboard spending chart data */
export const MOCK_GUARDIAN_SPENDING: SpendingDataPoint[] = [
  { month: "Oct", amount: 12000 }, { month: "Nov", amount: 14500 },
  { month: "Dec", amount: 13200 }, { month: "Jan", amount: 15800 },
  { month: "Feb", amount: 14900 }, { month: "Mar", amount: 16200 },
];

// ─── Guardian Dashboard Patients (summary cards) ───
export const MOCK_GUARDIAN_DASHBOARD_PATIENTS: GuardianDashboardPatient[] = [
  { id: 1, name: "Mr. Abdul Rahman (Father)", age: 74, condition: "Elderly – Mobility Issues", caregiver: "Karim Uddin", status: "Active Care", statusColor: "var(--cn-green)" },
  { id: 2, name: "Mrs. Rahela Begum (Mother)", age: 68, condition: "Diabetes, Hypertension", caregiver: "Fatema Akter", status: "Stable", statusColor: "var(--cn-purple)" },
];

// ─── Care Requirement Detail Messages ───
export const MOCK_CARE_REQUIREMENT_MESSAGES: CareRequirementMessage[] = [
  { from: "agency", name: "HealthCare Pro BD", text: "Thank you for submitting your requirement. We are reviewing the details and will propose a care plan shortly.", time: "Mar 15, 2:30 PM" },
  { from: "guardian", name: "You", text: "Thank you. Please note that my father prefers a Bangla-speaking caregiver.", time: "Mar 15, 3:15 PM" },
  { from: "agency", name: "HealthCare Pro BD", text: "Noted. We have Bangla-speaking caregivers available. We'll include this preference in the proposal.", time: "Mar 15, 3:45 PM" },
];

// ─── Care Requirement Wizard Agencies ───
export const MOCK_WIZARD_AGENCIES: WizardAgency[] = [
  { id: "a1", name: "HealthCare Pro BD", rating: 4.8, reviews: 124, location: "Gulshan, Dhaka", specialties: ["Elder Care", "Post-Op"], verified: true },
  { id: "a2", name: "CareFirst Bangladesh", rating: 4.6, reviews: 89, location: "Dhanmondi, Dhaka", specialties: ["Pediatric", "Disability"], verified: true },
  { id: "a3", name: "Golden Age Care", rating: 4.9, reviews: 67, location: "Uttara, Dhaka", specialties: ["Elder Care", "Dementia"], verified: true },
];

// ─── Care Requirements List ───
export const MOCK_CARE_REQUIREMENTS: CareRequirement[] = [
  { id: "CR-2026-0042", patient: "Mr. Abdul Rahman", careType: "Full Day Care", agency: "HealthCare Pro BD", schedule: "Mar 18 - Jun 18, Day shift", budget: "\u09F3 2,000-3,500/day", submitted: "Mar 15", status: "submitted", note: "Agency reviewing \u2014 estimated response in 12 hours" },
  { id: "CR-2026-0039", patient: "Mrs. Rahela Begum", careType: "Post-Op Recovery", agency: "Golden Age Care", schedule: "Apr 1 - Apr 30, 24-Hour", budget: "\u09F3 4,000-6,000/day", submitted: "Mar 13", status: "reviewing", note: "Agency requested additional medical records" },
  { id: "CR-2026-0035", patient: "Mr. Abdul Rahman", careType: "Night Care", agency: "HealthCare Pro BD", schedule: "Jan 10 - Mar 10, Night shift", budget: "\u09F3 1,800-2,800/day", submitted: "Jan 8", status: "active", note: "Placement active \u2014 Caregiver Karim on duty" },
  { id: "CR-2026-0028", patient: "Mrs. Rahela Begum", careType: "Daily Check-in", agency: "CareFirst Bangladesh", schedule: "Nov 1 - Nov 30, Day shift", budget: "\u09F3 800-1,200/day", submitted: "Oct 28", status: "completed", note: "Completed successfully" },
];

// ─── Shared Messages Page Chats ───
export const MOCK_MESSAGE_CHATS: MessageChat[] = [
  { id: 1, name: "HealthCare Pro BD", lastMessage: "We've reviewed your care requirement and will send a proposal shortly.", time: "2m ago", unread: true, active: true, role: "agency", stage: "Requirement Stage" },
  { id: 2, name: "Anisur Rahman", lastMessage: "Yes, I will be there at 9 AM for the shift.", time: "1h ago", unread: false, active: false, role: "caregiver", stage: "Placement Active" },
  { id: 3, name: "CareFirst Bangladesh", lastMessage: "Your care requirement has been accepted.", time: "4h ago", unread: true, active: false, role: "agency", stage: "Placement Active" },
  { id: 4, name: "Fatema Akter", lastMessage: "Care log submitted for today's shift.", time: "1d ago", unread: false, active: false, role: "caregiver", stage: "Placement Active" },
];

// ─── Guardian Payments ───
export const MOCK_GUARDIAN_TRANSACTIONS: GuardianTransaction[] = [
  { id: 1, desc: "HealthCare Pro BD \u2014 Placement PL-2026-0018", patient: "Abdul Rahman", date: "Mar 14", amount: 8400, type: "debit", status: "completed" },
  { id: 2, desc: "CareFirst Bangladesh \u2014 Placement PL-2026-0020", patient: "Rahela Begum", date: "Mar 10", amount: 9600, type: "debit", status: "completed" },
  { id: 3, desc: "bKash Recharge", patient: "\u2013", date: "Mar 8", amount: 20000, type: "credit", status: "completed" },
  { id: 4, desc: "Marketplace \u2014 Medical Equipment", patient: "Abdul Rahman", date: "Mar 5", amount: 3200, type: "debit", status: "completed" },
  { id: 5, desc: "HealthCare Pro BD \u2014 Placement PL-2026-0018", patient: "Abdul Rahman", date: "Mar 7", amount: 8400, type: "debit", status: "completed" },
  { id: 6, desc: "CareNet Platform Fee", patient: "\u2013", date: "Mar 1", amount: 200, type: "debit", status: "completed" },
  { id: 7, desc: "CareFirst Bangladesh \u2014 Pending (Mar 8-15)", patient: "Rahela Begum", date: "Mar 15", amount: 9600, type: "debit", status: "pending" },
];
export const MOCK_GUARDIAN_INVOICES: GuardianInvoice[] = [
  { id: "CN-78902", month: "March 2026", amount: 30200, status: "partial", due: "Mar 31", agency: "HealthCare Pro BD + CareFirst Bangladesh" },
  { id: "CN-78801", month: "February 2026", amount: 18200, status: "paid", due: "Feb 28", agency: "HealthCare Pro BD" },
  { id: "CN-78700", month: "January 2026", amount: 16500, status: "paid", due: "Jan 31", agency: "HealthCare Pro BD" },
];

// ─── Guardian Schedule ───
export const MOCK_GUARDIAN_APPOINTMENTS: GuardianAppointment[] = [
  { id: 1, title: "Morning Care \u2013 Abdul Rahman", caregiver: "Karim Uddin", date: "Mon\u2013Fri", time: "9:00\u201311:00 AM", type: "Daily Care", color: "#DB869A", patient: "Abdul Rahman" },
  { id: 2, title: "Medication Review \u2013 Rahela Begum", caregiver: "Dr. Arif Hossain", date: "Wednesday", time: "3:00\u20134:00 PM", type: "Medical Visit", color: "#7B5EA7", patient: "Rahela Begum" },
  { id: 3, title: "Physiotherapy \u2013 Abdul Rahman", caregiver: "Nasrin Akter PT", date: "Tue, Thu", time: "10:00\u201311:00 AM", type: "Therapy", color: "#5FB865", patient: "Abdul Rahman" },
  { id: 4, title: "Night Nursing \u2013 Rahela Begum", caregiver: "Fatema Akter", date: "Daily", time: "9:00 PM\u20136:00 AM", type: "Night Care", color: "#0288D1", patient: "Rahela Begum" },
];
export const MOCK_GUARDIAN_TODAY_EVENTS: GuardianTodayEvent[] = [
  { time: "9:00 AM", title: "Morning Care", caregiver: "Karim Uddin", patient: "Abdul Rahman", color: "#DB869A" },
  { time: "10:00 AM", title: "Physiotherapy", caregiver: "Nasrin Akter PT", patient: "Abdul Rahman", color: "#5FB865" },
  { time: "3:00 PM", title: "Medication Review", caregiver: "Dr. Arif Hossain", patient: "Rahela Begum", color: "#7B5EA7" },
  { time: "9:00 PM", title: "Night Nursing begins", caregiver: "Fatema Akter", patient: "Rahela Begum", color: "#0288D1" },
];

// ─── Guardian Reviews ───
export const MOCK_PAST_CAREGIVERS: PastCaregiverReview[] = [
  { id: 1, name: "Karim Uddin", type: "Elderly Care", period: "Jan\u2013Mar 2026", avatar: "K", color: "#DB869A", reviewed: false },
  { id: 2, name: "Fatema Akter", type: "Nursing Care", period: "Feb\u2013Mar 2026", avatar: "F", color: "#5FB865", reviewed: true, myReview: { rating: 5, text: "Excellent care for my mother. Very professional." } },
];
export const MOCK_RECEIVED_REVIEWS: ReceivedReview[] = [
  { id: 1, from: "Karim Uddin", role: "Caregiver", date: "Mar 10", rating: 5, text: "Rashed is a wonderful guardian. Very responsive, clear instructions, and pays on time. It's a pleasure working with his family." },
];

// ─── Guardian Placement Detail ───
export const MOCK_PLACEMENT_SHIFT_HISTORY: PlacementShiftHistory[] = [
  { date: "Mar 15", caregiver: "Karim Uddin", time: "8PM-8AM", checkIn: "7:55 PM", checkOut: "8:05 AM", duration: "12h 10m", status: "completed", logs: 4 },
  { date: "Mar 14", caregiver: "Karim Uddin", time: "8PM-8AM", checkIn: "8:02 PM", checkOut: "8:00 AM", duration: "11h 58m", status: "completed", logs: 3 },
  { date: "Mar 13", caregiver: "Fatema Akter", time: "8PM-8AM", checkIn: "8:10 PM", checkOut: "8:00 AM", duration: "11h 50m", status: "late", logs: 3 },
  { date: "Mar 12", caregiver: "Karim Uddin", time: "8PM-8AM", checkIn: "7:58 PM", checkOut: "8:02 AM", duration: "12h 04m", status: "completed", logs: 5 },
  { date: "Mar 11", caregiver: "Karim Uddin", time: "8PM-8AM", checkIn: "-", checkOut: "-", duration: "-", status: "missed", logs: 0 },
];
export const MOCK_CAREGIVER_TIMELINE: CaregiverTimelineEntry[] = [
  { name: "Karim Uddin", dates: "Jan 10 - Feb 5", shifts: 26, rating: 4.8 },
  { name: "Fatema Akter", dates: "Feb 6 - Feb 20", shifts: 14, rating: 4.5 },
  { name: "Karim Uddin", dates: "Feb 21 - Ongoing", shifts: 22, rating: 4.9 },
];

// ─── Guardian Recent Activity (Dashboard) ───
export const MOCK_GUARDIAN_RECENT_ACTIVITY: GuardianActivity[] = [
  { iconType: "heart", text: "Care log updated for Mr. Abdul Rahman", time: "10 min ago", color: "#DB869A", link: "/guardian/care-log" },
  { iconType: "calendar", text: "Next appointment: Tomorrow 9:00 AM", time: "1h ago", color: "#5FB865", link: "/guardian/schedule" },
  { iconType: "creditCard", text: "Payment of \u09F3 4,800 processed", time: "2h ago", color: "#7B5EA7", link: "/guardian/payments" },
  { iconType: "message", text: "New message from Karim Uddin", time: "3h ago", color: "#E8A838", link: "/guardian/messages" },
  { iconType: "star", text: "Reminder: Rate Fatema Akter's service", time: "1d ago", color: "#E8A838", link: "/guardian/reviews" },
];

export const MOCK_GUARDIAN_DASHBOARD_ALERTS: GuardianDashboardAlert[] = [
  {
    id: "med-1",
    title: "Reminder: Mr. Rahman's 10 AM medication is due",
    subtitle: "The assigned caregiver has been notified. Open care log for details.",
    actionPath: "/guardian/care-log",
  },
];

export const MOCK_GUARDIAN_DASHBOARD_SUMMARY: GuardianDashboardSummary = {
  activePlacements: 2,
  monthlySpendBdt: 16200,
  totalSessions: 47,
};

// ─── Agency Public Profile ───
export const MOCK_AGENCY_PUBLIC_PROFILE: AgencyPublicProfile = {
  id: "a1", name: "HealthCare Pro BD", tagline: "Trusted Home Healthcare Since 2018", established: 2018, rating: 4.8, reviewCount: 124, location: "Gulshan-2, Dhaka", phone: "+880 1700-000000", email: "info@healthcarepro.bd",
  about: "HealthCare Pro BD is one of the leading home healthcare agencies in Dhaka. We provide 24/7 care coverage, caregiver replacement guarantees, and comprehensive training for all our caregivers.",
  services: [{ name: "Full Day Care", desc: "Comprehensive 8AM-8PM care", rate: "\u09F3 2,000/day" }, { name: "Night Care", desc: "Overnight monitoring 8PM-8AM", rate: "\u09F3 1,800/day" }, { name: "Post-Op Recovery", desc: "Specialized post-surgery care", rate: "\u09F3 3,000/day" }, { name: "Specialized Medical", desc: "Nursing & medical support", rate: "\u09F3 3,500/day" }],
  caregivers: [{ name: "Karim Uddin", specialty: "Elder Care", rating: 4.8 }, { name: "Fatema Akter", specialty: "Nursing", rating: 4.9 }, { name: "Nasrin Begum", specialty: "Child Care", rating: 4.7 }, { name: "Rashid Khan", specialty: "Physiotherapy", rating: 4.6 }],
  reviews: [{ author: "Rashed H.", rating: 5, text: "Excellent service. Karim was very attentive to my father's needs.", date: "Feb 2026" }, { author: "Nusrat J.", rating: 4, text: "Good agency. Reliable caregiver replacement when needed.", date: "Jan 2026" }, { author: "Aminul I.", rating: 5, text: "Professional and responsive. The 24-hour coverage was seamless.", date: "Dec 2025" }],
};

export const MOCK_CAREGIVER_PUBLIC_PROFILE: CaregiverPublicProfile = {
  name: "Dr. Rahat Khan", type: "Certified Nurse & Post-Op Specialist", rating: 4.9, reviews: 124, location: "Gulshan, Dhaka", price: "\u09F3800", experience: "8 years", verified: true,
  agency: { id: "a1", name: "HealthCare Pro BD" },
  bio: "Passionate healthcare professional with over 8 years of experience in clinical and home-based care.",
  specialties: ["Post-Op Care", "Elderly Care", "Wound Management", "IV Therapy", "Vital Monitoring"],
  education: [{ degree: "B.Sc. in Nursing", school: "Dhaka Medical College", year: "2015" }, { degree: "Advanced Cardiac Life Support (ACLS)", school: "Red Crescent", year: "2018" }],
  languages: ["Bangla", "English", "Hindi"],
  image: "https://images.unsplash.com/photo-1559839734-2b71f1536783?auto=format&fit=crop&q=80&w=400&h=400",
};

export const MOCK_COMPARISON_CAREGIVERS: ComparisonCaregiver[] = [
  { id: "c1", name: "Sumaiya Akter", type: "Elder Care Specialist", specialty: "Elder Care", rating: 4.9, reviews: 87, exp: "6 years", rate: "\u09F3800/hr", location: "Gulshan", verified: true, agency: { id: "a1", name: "HealthCare Pro BD" }, img: "https://images.unsplash.com/photo-1559839734-2b71f1536783?auto=format&fit=crop&q=80&w=200&h=200" },
  { id: "c2", name: "Karim Uddin", type: "Post-Op Recovery", specialty: "Post-Op Care", rating: 4.7, reviews: 64, exp: "4 years", rate: "\u09F3650/hr", location: "Dhanmondi", verified: true, agency: { id: "a2", name: "MedPro Healthcare" }, img: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200&h=200" },
  { id: "c3", name: "Nasrin Begum", type: "Elder Care Expert", specialty: "Elder Care", rating: 4.8, reviews: 102, exp: "8 years", rate: "\u09F3900/hr", location: "Uttara", verified: true, agency: { id: "a3", name: "Dhaka Care Agency" }, img: "https://images.unsplash.com/photo-1594824476967-48c8b964ac31?auto=format&fit=crop&q=80&w=200&h=200" },
];

export const MOCK_GUARDIAN_PROFILE: GuardianProfile = {
  name: "Rashed Hossain", phone: "+880 1714-567890", email: "rashed.hossain@email.com",
  location: "Gulshan, Dhaka", relation: "Son",
  bio: "Caring for my elderly parents through CareNet. Committed to ensuring the best quality care for my family.",
  emergencyContact: "+880 1811-XXXXXX",
};

export const MOCK_INVOICE_DETAIL: InvoiceDetail = {
  id: "CN-78902", status: "paid" as const,
  billedTo: { name: "Rashed Hossain", guardianId: "G-2345" },
  agency: { name: "HealthCare Pro BD", agencyId: "AGN-001", placementId: "PL-2026-0018" },
  period: { from: "March 1, 2026", to: "March 15, 2026" },
  issuedDate: "March 16, 2026", dueDate: "March 31, 2026", paidDate: "March 13, 2026", paidVia: "bKash Personal",
  lineItems: [
    { desc: "Home Care \u2014 Elderly (Day Shift)", qty: "10 shifts", rate: 1200, total: 12000 },
    { desc: "Home Care \u2014 Elderly (Night Shift)", qty: "5 shifts", rate: 1440, total: 7200 },
    { desc: "Basic Medical Supplies Bundle", qty: "1 set", rate: 1500, total: 1500 },
    { desc: "Travel & Logistics Fee", qty: "1", rate: 500, total: 500 },
  ],
  subtotal: 21200, platformFee: 1060, platformFeeRate: 5, vat: 159, vatRate: 15, earlyDiscount: 500, total: 21919,
};