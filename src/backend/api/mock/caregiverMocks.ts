import type {
  CaregiverProfile, CareNote, AssignedPatient, Job, ShiftPlan, Prescription, JobDetail,
  TaxChartDataPoint, DashboardEarningsPoint, RecentJob, UpcomingScheduleItem, CaregiverDashboardSummary,
  MonthlyEarningsPoint, CaregiverTransaction, CaregiverPaymentMethod,
  CaregiverDocument, RequiredDocument, ScheduleBlock, UpcomingBooking,
  MedScheduleItem, CaregiverProfileData, RecentCareLog, PastPatient,
  DailyEarningsDetail, JobApplicationDetail, PayoutSettings,
  CaregiverPortfolio, CaregiverReference, ShiftDetailData,
  SkillsAssessment, TrainingModule,
} from "@/backend/models";

/** Caregiver search results / marketplace profiles */
export const MOCK_CAREGIVER_PROFILES: CaregiverProfile[] = [
  { id: "1", name: "Dr. Rahat Khan", type: "Certified Nurse", rating: 4.9, reviews: 124, location: "Gulshan, Dhaka", experience: "8 years", verified: true, specialties: ["Post-Op Care", "Elderly Care"], agency: "HealthCare Pro BD", image: "https://images.unsplash.com/photo-1559839734-2b71f1536783?auto=format&fit=crop&q=80&w=200&h=200" },
  { id: "2", name: "Karim Uddin", type: "Home Caregiver", rating: 4.8, reviews: 89, location: "Dhanmondi, Dhaka", experience: "5 years", verified: true, specialties: ["Elderly Care", "Mobility Assistance"], agency: "Green Care Agency", image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200&h=200" },
  { id: "3", name: "Fatema Akter", type: "Child Specialist", rating: 4.9, reviews: 156, location: "Uttara, Dhaka", experience: "6 years", verified: true, specialties: ["Pediatric Care", "Special Needs"], agency: "CareFirst BD", image: "https://images.unsplash.com/photo-1594824476967-48c8b964d31e?auto=format&fit=crop&q=80&w=200&h=200" },
  { id: "4", name: "Nazmul Hasan", type: "Physiotherapist", rating: 4.7, reviews: 67, location: "Mirpur, Dhaka", experience: "4 years", verified: false, specialties: ["Physical Therapy", "Post-Op Rehab"], image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200&h=200" },
];

/** Patients currently assigned to the logged-in caregiver */
export const MOCK_ASSIGNED_PATIENTS: AssignedPatient[] = [
  {
    id: "p1", name: "Mr. Abdul Rahman", age: 74, gender: "Male",
    conditions: ["Elderly", "Mobility Issues", "Diabetes"],
    agency: "HealthCare Pro BD", placementId: "PL-2026-0018", careType: "Night Care",
    schedule: "8PM-8AM, Mon-Fri",
    nextShift: "Tonight 8:00 PM", nextShiftIn: "Starts in 4 hours",
    guardian: "Rashed Hossain", guardianPhone: "+880 1700-000001",
    active: true,
  },
  {
    id: "p2", name: "Baby Arif", age: 4, gender: "Male",
    conditions: ["Cerebral Palsy", "Requires PT"],
    agency: "HealthCare Pro BD", placementId: "PL-2026-0019", careType: "Specialized Medical",
    schedule: "8AM-8PM, Mon-Sat",
    nextShift: "Tomorrow 8:00 AM", nextShiftIn: "Starts in 18 hours",
    guardian: "Fatima Khatun", guardianPhone: "+880 1700-000002",
    active: true,
  },
];

/** Caregiver job listings */
export const MOCK_CAREGIVER_JOBS: Job[] = [
  { id: "1", title: "Elderly Care – Live-in", patient: "Mr. Rahim Ahmed", age: 74, location: "Dhanmondi, Dhaka", type: "Elderly Care", budget: "৳ 800/day", duration: "Long-term", rating: null, posted: "2h ago", urgent: true, skills: ["Mobility assistance", "Medication management", "Companionship"], experience: "3+ years" },
  { id: "2", title: "Post-Surgery Nurse", patient: "Mrs. Nasreen Begum", age: 52, location: "Gulshan, Dhaka", type: "Medical", budget: "৳ 1,200/day", duration: "3 months", rating: null, posted: "5h ago", urgent: false, skills: ["Wound care", "IV management", "Vital monitoring"], experience: "2+ years" },
  { id: "3", title: "Child Caregiver – Autism Specialist", patient: "Baby Rafi", age: 6, location: "Uttara, Dhaka", type: "Pediatric", budget: "৳ 25,000/month", duration: "Long-term", rating: null, posted: "1d ago", urgent: false, skills: ["ABA therapy basics", "Communication support", "Patience & empathy"], experience: "2+ years" },
];

/** Care notes written by caregivers */
export const MOCK_CARE_NOTES: CareNote[] = [
  { id: "n1", patientName: "Mr. Abdul Rahman", date: "2026-03-16", time: "10:30 PM", category: "observation", title: "Restless sleep, mild confusion", content: "Patient showed signs of restlessness around 10 PM. Appeared mildly confused when waking briefly. Oriented to person but not time. Settled after gentle reassurance. Monitoring closely.", mood: "Agitated", pinned: true, tags: ["sleep", "cognition"], attachments: 0 },
  { id: "n2", patientName: "Mr. Abdul Rahman", date: "2026-03-16", time: "6:00 AM", category: "vitals", title: "Morning vitals - BP slightly elevated", content: "BP: 145/92. Heart rate: 78 bpm. Temperature: 36.8°C. Informed guardian about elevated BP. Recommended doctor follow-up.", mood: "Calm", pinned: false, tags: ["vitals", "blood-pressure"], attachments: 1 },
  { id: "n3", patientName: "Baby Arif", date: "2026-03-15", time: "3:45 PM", category: "activity", title: "Great PT session today", content: "Arif completed 20 minutes of guided stretching and 15 minutes of supported standing. Showed improved balance compared to last week.", mood: "Happy", pinned: false, tags: ["physical-therapy", "progress"], attachments: 2 },
];

/** Shift plans for the logged-in caregiver */
export const MOCK_SHIFT_PLANS: ShiftPlan[] = [
  { id: "sp-1", patientName: "Mr. Abdul Rahman", date: "2026-03-16", shiftTime: "8:00 PM - 8:00 AM", status: "active", dbStatus: "checked-in", tasks: [
    { label: "Evening medication (Amlodipine 5mg)", done: true },
    { label: "Blood pressure check", done: true },
    { label: "Dinner supervision", done: false },
    { label: "Night comfort round (11 PM)", done: false },
    { label: "Morning medication (Metformin 500mg)", done: false },
  ]},
  { id: "sp-2", patientName: "Baby Arif", date: "2026-03-17", shiftTime: "8:00 AM - 8:00 PM", status: "upcoming", dbStatus: "scheduled", tasks: [
    { label: "Morning stretching routine", done: false },
    { label: "Speech therapy exercises", done: false },
    { label: "Lunch & medication", done: false },
    { label: "Afternoon PT session", done: false },
    { label: "Parent handoff report", done: false },
  ]},
];

/** Prescriptions managed by caregiver */
export const MOCK_PRESCRIPTIONS: Prescription[] = [
  { id: "rx-001", patientName: "Mr. Abdul Rahman", medicineName: "Amlodipine", dosage: "5mg", frequency: "Once daily", timing: ["Morning"], duration: "Ongoing", prescribedBy: "Dr. Kamal Hossain", startDate: "2026-01-15", endDate: "", instructions: "Take after breakfast with water", status: "active", refillDate: "2026-03-25" },
  { id: "rx-002", patientName: "Mr. Abdul Rahman", medicineName: "Metformin", dosage: "500mg", frequency: "Twice daily", timing: ["Morning", "Evening"], duration: "Ongoing", prescribedBy: "Dr. Kamal Hossain", startDate: "2026-01-15", endDate: "", instructions: "Take with meals", status: "active", refillDate: "2026-03-20" },
  { id: "rx-003", patientName: "Baby Arif", medicineName: "Baclofen", dosage: "5mg", frequency: "Three times daily", timing: ["Morning", "Afternoon", "Evening"], duration: "3 months", prescribedBy: "Dr. Nadia Islam", startDate: "2026-02-01", endDate: "2026-05-01", instructions: "Give with food to reduce stomach upset", status: "active" },
];

/** Rich job detail records for CaregiverJobDetailPage */
export const MOCK_JOB_DETAILS: Record<string, JobDetail> = {
  "1": {
    id: 1, title: "Elderly Care – Live-in", patient: "Mr. Rahim Ahmed", age: 74, gender: "Male",
    location: "Dhanmondi, Dhaka", type: "Elderly Care", budget: "৳ 800/day",
    budgetBreakdown: "৳ 800/day × 30 days = ৳ 24,000/month",
    duration: "Long-term", shift: "24/7 Live-in", rating: null,
    posted: "2h ago", urgent: true, careType: "Live-in",
    skills: ["Mobility assistance", "Medication management", "Companionship", "Personal hygiene", "Meal preparation"],
    description: "We are seeking a compassionate and experienced caregiver for our 74-year-old father who requires round-the-clock live-in care. The ideal candidate will assist with daily activities, medication reminders, mobility support, and provide companionship. Our father enjoys light conversation, watching news, and afternoon walks.",
    requirements: ["Minimum 2 years of elderly care experience", "Ability to lift up to 50 lbs", "Non-smoker preferred", "Bengali speaking required", "Valid NID and background check"],
    guardianName: "Rahim Family", guardianVerified: true,
    guardianImg: "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&q=80&w=100&h=100",
    applicants: 4,
  },
  "2": {
    id: 2, title: "Post-Surgery Recovery Care", patient: "Mrs. Fatema Begum", age: 58, gender: "Female",
    location: "Gulshan, Dhaka", type: "Post-Surgery", budget: "৳ 1,200/day",
    budgetBreakdown: "৳ 1,200/day × 90 days = ৳ 108,000 total",
    duration: "3 months", shift: "Day (8am – 8pm)", rating: 4.8,
    posted: "5h ago", urgent: false, careType: "Day Care",
    skills: ["Wound care", "Physiotherapy support", "Medication", "Vitals monitoring", "Post-op nursing"],
    description: "Looking for a certified caregiver with post-surgical care experience for our mother recovering from a knee replacement. Duties include wound dressing changes, medication scheduling, physiotherapy exercises, and vitals logging. The family will be home in the evenings.",
    requirements: ["Nursing diploma or equivalent required", "Post-surgical care experience (1+ year)", "Ability to perform basic physiotherapy exercises", "Good documentation skills", "References required"],
    guardianName: "Fatema Family", guardianVerified: true,
    guardianImg: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100&h=100",
    applicants: 7,
  },
  "3": {
    id: 3, title: "Child Care – Special Needs", patient: "Rahman Family", age: 8, gender: "Male",
    location: "Chittagong", type: "Child Care", budget: "৳ 700/day",
    budgetBreakdown: "৳ 700/day × 180 days = ৳ 126,000 total",
    duration: "6 months", shift: "Day (9am – 5pm)", rating: 4.6,
    posted: "1d ago", urgent: false, careType: "Day Care",
    skills: ["Special education", "Behavioral support", "ABA therapy", "Sensory activities", "Communication skills"],
    description: "Seeking a patient and skilled caregiver with special needs experience for our 8-year-old son who is on the autism spectrum. The role involves structured play, ABA-based routines, school support, and sensory activities. We need someone who can build trust and maintain a calm, consistent environment.",
    requirements: ["Experience working with children with autism", "ABA therapy training preferred", "Patience and adaptability", "Education background a plus", "First aid certified"],
    guardianName: "Mr. & Mrs. Rahman", guardianVerified: true,
    guardianImg: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=100&h=100",
    applicants: 3,
  },
  "4": {
    id: 4, title: "Dementia Patient Care", patient: "Mr. Salam Khan", age: 80, gender: "Male",
    location: "Sylhet", type: "Dementia Care", budget: "৳ 1,500/day",
    budgetBreakdown: "৳ 1,500/day – ongoing long-term",
    duration: "Long-term", shift: "24/7 Live-in", rating: null,
    posted: "2d ago", urgent: true, careType: "Live-in",
    skills: ["Memory care", "Safety monitoring", "Behavioral management", "Wandering prevention", "Gentle communication"],
    description: "Experienced dementia caregiver needed for an 80-year-old grandfather in the mid-stage of Alzheimer's. The caregiver must be trained in dementia care, capable of managing difficult behaviors with compassion, preventing wandering, and ensuring 24-hour safety. Must live on-site.",
    requirements: ["Dementia/Alzheimer's care certification preferred", "Minimum 3 years of dementia care experience", "Physical stamina for 24/7 care", "Calm and patient temperament", "Bengali and basic English literacy"],
    guardianName: "Khan Family", guardianVerified: false,
    guardianImg: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=100&h=100",
    applicants: 2,
  },
  "5": {
    id: 5, title: "Physiotherapy Sessions", patient: "Mrs. Nasrin Akter", age: 45, gender: "Female",
    location: "Mirpur, Dhaka", type: "Physiotherapy", budget: "৳ 1,000/session",
    budgetBreakdown: "৳ 1,000/session × 3 sessions/week × 8 weeks",
    duration: "2 months", shift: "Flexible (3x per week)", rating: 4.9,
    posted: "3d ago", urgent: false, careType: "Visit-based",
    skills: ["Exercise therapy", "Pain management", "Mobility", "Massage therapy", "Patient education"],
    description: "Seeking a licensed physiotherapist for home sessions with our 45-year-old mother recovering from a lower back injury. Sessions will focus on core strengthening, flexibility, pain management, and home exercise coaching. Flexible scheduling available.",
    requirements: ["Licensed physiotherapist (BPT or equivalent)", "2+ years clinical experience", "Experience with musculoskeletal conditions", "Own transport preferred", "Good communication skills"],
    guardianName: "Akter Family", guardianVerified: true,
    guardianImg: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=100&h=100",
    applicants: 9,
  },
  "6": {
    id: 6, title: "Palliative Care Support", patient: "Anonymous", age: 67, gender: "Male",
    location: "Rajshahi", type: "Palliative Care", budget: "৳ 2,000/day",
    budgetBreakdown: "৳ 2,000/day – ongoing as needed",
    duration: "Ongoing", shift: "Day (7am – 7pm)", rating: null,
    posted: "4d ago", urgent: true, careType: "Day Care",
    skills: ["Pain management", "Emotional support", "Family coordination", "End-of-life care", "Comfort care"],
    description: "A compassionate palliative care specialist is needed for a 67-year-old patient with a terminal illness. The role requires exceptional emotional intelligence, pain and symptom management, and the ability to support both the patient and family. Dignity, comfort, and quality of life are the primary goals.",
    requirements: ["Palliative or hospice care training essential", "Nursing background preferred", "Strong emotional resilience", "Experience with terminal illness care", "Family counseling skills"],
    guardianName: "Confidential", guardianVerified: true,
    guardianImg: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=100&h=100",
    applicants: 1,
  },
};

// ─── Tax Report Chart Data ───
export const MOCK_TAX_REPORT_DATA: TaxChartDataPoint[] = [
  { month: "Oct", income: 45000 }, { month: "Nov", income: 52000 },
  { month: "Dec", income: 48000 }, { month: "Jan", income: 61000 },
  { month: "Feb", income: 55000 }, { month: "Mar", income: 65000 },
];

// ─── Caregiver Dashboard Data ───
export const MOCK_CAREGIVER_EARNINGS_CHART: DashboardEarningsPoint[] = [
  { month: "Oct", amount: 8200 }, { month: "Nov", amount: 9400 }, { month: "Dec", amount: 7800 },
  { month: "Jan", amount: 11200 }, { month: "Feb", amount: 10500 }, { month: "Mar", amount: 13400 },
];

export const MOCK_CAREGIVER_DASHBOARD_SUMMARY: CaregiverDashboardSummary = {
  activeJobs: 3,
  avgRating: 4.8,
  reviewCount: 128,
  thisMonthBdt: 13400,
  hoursThisMonth: 94,
  weekJobsDelta: 1,
  vsLastMonthPercent: 27,
  earningsTrendPercent: 27,
};

export const MOCK_RECENT_JOBS: RecentJob[] = [
  { id: 1, patient: "Mr. Rahim Ahmed", type: "Elderly Care", date: "Today, 9:00 AM", status: "active", amount: "\u09F3 800/day" },
  { id: 2, patient: "Mrs. Fatema Begum", type: "Post-Surgery Care", date: "Yesterday", status: "completed", amount: "\u09F3 1,200/day" },
  { id: 3, patient: "Tariq Hassan", type: "Physiotherapy", date: "Mar 12", status: "completed", amount: "\u09F3 1,000/day" },
  { id: 4, patient: "Nadia Islam", type: "Child Care", date: "Mar 10", status: "cancelled", amount: "\u09F3 600/day" },
];

export const MOCK_UPCOMING_SCHEDULE: UpcomingScheduleItem[] = [
  { shiftId: "shift-demo-1", time: "9:00 AM", patient: "Mr. Rahim Ahmed", type: "Morning routine", duration: "2h" },
  { shiftId: "shift-demo-2", time: "2:00 PM", patient: "New Client", type: "Initial consultation", duration: "1h" },
  { shiftId: "shift-demo-3", time: "5:00 PM", patient: "Mrs. Hossain", type: "Evening care", duration: "3h" },
];

// ─── Caregiver Earnings Page Data ───
export const MOCK_MONTHLY_EARNINGS: MonthlyEarningsPoint[] = [
  { month: "Oct", earned: 8200, withdrawn: 6000 }, { month: "Nov", earned: 9400, withdrawn: 8000 },
  { month: "Dec", earned: 7800, withdrawn: 7500 }, { month: "Jan", earned: 11200, withdrawn: 9000 },
  { month: "Feb", earned: 10500, withdrawn: 10000 }, { month: "Mar", earned: 13400, withdrawn: 5000 },
];

export const MOCK_TRANSACTIONS: CaregiverTransaction[] = [
  { id: 1, desc: "Mr. Rahim Ahmed \u2013 Elderly Care (7 days)", date: "Mar 14", amount: "+\u09F3 5,600", type: "credit", status: "completed" },
  { id: 2, desc: "Withdrawal to bKash", date: "Mar 12", amount: "-\u09F3 5,000", type: "debit", status: "completed" },
  { id: 3, desc: "Mrs. Fatema \u2013 Post Surgery (5 days)", date: "Mar 10", amount: "+\u09F3 6,000", type: "credit", status: "completed" },
  { id: 4, desc: "Platform Fee (March)", date: "Mar 1", amount: "-\u09F3 450", type: "debit", status: "completed" },
  { id: 5, desc: "Tariq Hassan \u2013 Physiotherapy (3 sessions)", date: "Feb 28", amount: "+\u09F3 3,000", type: "credit", status: "completed" },
  { id: 6, desc: "Withdrawal to Rocket", date: "Feb 25", amount: "-\u09F3 10,000", type: "debit", status: "completed" },
  { id: 7, desc: "Bonus \u2013 Top Caregiver", date: "Feb 20", amount: "+\u09F3 500", type: "credit", status: "bonus" },
];

export const MOCK_PAYMENT_METHODS: CaregiverPaymentMethod[] = [
  { name: "bKash", number: "01712-XXXXXX", logo: "\u{1F49A}", primary: true },
  { name: "Nagad", number: "01811-XXXXXX", logo: "\u{1F534}", primary: false },
  { name: "Rocket", number: "018XX-XXXXXX", logo: "\u{1F49C}", primary: false },
];

// ─── Caregiver Documents Page Data ───
export const MOCK_CAREGIVER_DOCUMENTS: CaregiverDocument[] = [
  { id: 1, name: "National ID Card", type: "Identity", status: "verified", uploaded: "Jan 15, 2026", expiry: null, file: "NID_Karim_Uddin.pdf", size: "2.3 MB" },
  { id: 2, name: "Nursing Certificate", type: "Qualification", status: "verified", uploaded: "Jan 16, 2026", expiry: "Dec 2027", file: "Nursing_Cert.pdf", size: "1.8 MB" },
  { id: 3, name: "Police Clearance Certificate", type: "Background Check", status: "verified", uploaded: "Jan 20, 2026", expiry: "Jan 2027", file: "PCC_2026.pdf", size: "985 KB" },
  { id: 4, name: "First Aid Certificate", type: "Qualification", status: "pending", uploaded: "Mar 10, 2026", expiry: "Mar 2028", file: "FirstAid_Cert.pdf", size: "1.2 MB" },
  { id: 5, name: "COVID-19 Vaccination Card", type: "Health", status: "verified", uploaded: "Feb 5, 2026", expiry: null, file: "Covid_Vax.jpg", size: "450 KB" },
  { id: 6, name: "Reference Letter \u2013 Dhaka Hospital", type: "Reference", status: "pending", uploaded: "Mar 12, 2026", expiry: null, file: "Ref_Letter_DH.pdf", size: "890 KB" },
];

export const MOCK_REQUIRED_DOCUMENTS: RequiredDocument[] = [
  { name: "Updated Medical Fitness Certificate", due: "Due in 30 days", urgent: true },
  { name: "Caregiver Training Certificate (2026)", due: "Optional", urgent: false },
];

// ─── Caregiver Schedule Page Data ───
export const MOCK_SCHEDULE_DATA: Record<string, ScheduleBlock[]> = {
  "Mon": [{ label: "Morning Routine", patient: "Mr. Rahim Ahmed", duration: 2, color: "#FEB4C5", startHour: 9 }],
  "Tue": [
    { label: "Physiotherapy", patient: "Mrs. Nasrin", duration: 1, color: "#A8AAFF", startHour: 10 },
    { label: "Evening Care", patient: "Mr. Rahim Ahmed", duration: 2, color: "#FEB4C5", startHour: 15 },
  ],
  "Wed": [{ label: "Post-Surgery Care", patient: "Mrs. Fatema", duration: 3, color: "#80CBC4", startHour: 9 }],
  "Thu": [
    { label: "Morning Routine", patient: "Mr. Rahim Ahmed", duration: 2, color: "#FEB4C5", startHour: 9 },
    { label: "Consultation", patient: "New Client", duration: 1, color: "#FFD49A", startHour: 14 },
  ],
  "Fri": [{ label: "Full Day Care", patient: "Salam Khan", duration: 4, color: "#81D4FA", startHour: 10 }],
  "Sat": [{ label: "Weekly Assessment", patient: "Mr. Rahim Ahmed", duration: 1, color: "#FEB4C5", startHour: 11 }],
};

export const MOCK_UPCOMING_BOOKINGS: UpcomingBooking[] = [
  { id: 1, patient: "Mr. Rahim Ahmed", type: "Morning Routine", date: "Mon\u2013Fri", time: "9:00\u201311:00 AM", status: "confirmed" },
  { id: 2, patient: "Mrs. Fatema Begum", type: "Post-Surgery Care", date: "Wed", time: "9:00 AM\u201312:00 PM", status: "confirmed" },
  { id: 3, patient: "New Client \u2013 Tariq", type: "Initial Consultation", date: "Thu", time: "2:00\u20133:00 PM", status: "pending" },
  { id: 4, patient: "Mrs. Nasrin Akter", type: "Physiotherapy", date: "Tue, Thu", time: "10:00\u201311:00 AM", status: "confirmed" },
];

// ─── Caregiver Med Schedule ───
export const MOCK_MED_SCHEDULE: MedScheduleItem[] = [
  { id: "ms-1", patientName: "Mr. Abdul Rahman", medicineName: "Amlodipine", dosage: "5mg", scheduledTime: "08:00 AM", timing: "morning", instructions: "After breakfast", taken: true, takenAt: "08:12 AM" },
  { id: "ms-2", patientName: "Mr. Abdul Rahman", medicineName: "Metformin", dosage: "500mg", scheduledTime: "08:30 AM", timing: "morning", instructions: "With breakfast", taken: true, takenAt: "08:35 AM" },
  { id: "ms-3", patientName: "Baby Arif", medicineName: "Baclofen", dosage: "2.5mg", scheduledTime: "09:00 AM", timing: "morning", instructions: "With food, monitor drowsiness", taken: true, takenAt: "09:05 AM" },
  { id: "ms-4", patientName: "Baby Arif", medicineName: "Baclofen", dosage: "2.5mg", scheduledTime: "02:00 PM", timing: "afternoon", instructions: "With lunch", taken: null },
  { id: "ms-5", patientName: "Mr. Abdul Rahman", medicineName: "Metformin", dosage: "500mg", scheduledTime: "07:00 PM", timing: "evening", instructions: "With dinner", taken: null },
  { id: "ms-6", patientName: "Baby Arif", medicineName: "Baclofen", dosage: "2.5mg", scheduledTime: "09:00 PM", timing: "night", instructions: "Before bed", taken: null },
  { id: "ms-7", patientName: "Mr. Abdul Rahman", medicineName: "Insulin Glargine", dosage: "10 units", scheduledTime: "10:00 PM", timing: "night", instructions: "Subcutaneous injection", taken: null },
];

// ─── Caregiver Profile Data ───
export const MOCK_CAREGIVER_PROFILE_DATA: CaregiverProfileData = {
  name: "Karim Uddin", title: "Senior Caregiver",
  bio: "Experienced caregiver with 8+ years in elderly and post-surgery care. Trained nurse with certifications in dementia care and first aid. Dedicated to providing compassionate, professional care.",
  phone: "+880 1712-345678", email: "karim.uddin@example.com",
  location: "Dhanmondi, Dhaka", experience: "8 years", rate: "\u09F3 800 \u2013 \u09F3 1,500/day",
  skills: ["Elderly Care", "Dementia Care", "Post-Surgery Recovery", "Medication Management", "Mobility Assistance", "Wound Care", "Physiotherapy Support", "Patient Monitoring"],
  languages: ["Bengali (Native)", "English (Conversational)", "Hindi (Basic)"],
};

// ─── Recent Care Logs ───
export const MOCK_RECENT_CARE_LOGS: RecentCareLog[] = [
  { type: "Vitals", time: "10:30 PM", detail: "BP: 130/85, HR: 76, Temp: 98.4\u00B0F", iconType: "vitals", color: "#0288D1" },
  { type: "Medication", time: "10:00 PM", detail: "Amlodipine 5mg administered", iconType: "medication", color: "#5FB865" },
  { type: "Meal", time: "9:00 PM", detail: "Dinner - Normal portion, good appetite", iconType: "meal", color: "#E64A19" },
];

// ─── Past Patients (for Assigned Patients page) ───
export const MOCK_PAST_PATIENTS: PastPatient[] = [
  { name: "Mrs. Salma Begum", dates: "Nov 1 - Nov 30, 2025", totalShifts: 28, rating: 4.7 },
  { name: "Mr. Rafiqul Islam", dates: "Aug 15 - Oct 14, 2025", totalShifts: 55, rating: 4.9 },
];

// ─── Daily Earnings Detail ───
export const MOCK_DAILY_EARNINGS_DETAIL: DailyEarningsDetail = {
  date: "March 15, 2026", totalEarnings: 4200, shifts: 2, hours: 16,
  breakdown: [
    { id: "s1", client: "Mrs. Fatima Rahman", type: "Elderly Care", hours: 8, rate: 300, total: 2400, time: "8:00 AM - 4:00 PM" },
    { id: "s2", client: "Mr. Zubayer Ahmed", type: "Post-Surgery", hours: 8, rate: 225, total: 1800, time: "5:00 PM - 1:00 AM" },
  ],
};

export const MOCK_JOB_APPLICATION_DETAIL: JobApplicationDetail = {
  id: "app-1", jobTitle: "Live-in Elderly Care Specialist", agency: "Dhaka Care Agency", location: "Dhanmondi, Dhaka",
  salary: "\u09F325,000/month", status: "under_review" as const, appliedDate: "Mar 12, 2026",
  requirements: ["3+ years elderly care", "First aid certified", "Bengali fluent"],
  timeline: [
    { step: "Application Submitted", date: "Mar 12", done: true },
    { step: "Under Review", date: "Mar 13", done: false },
    { step: "Interview", date: "TBD", done: false },
  ],
};

export const MOCK_PAYOUT_SETTINGS: PayoutSettings = {
  methods: [
    { id: "bkash", name: "bKash", account: "017XX-XXXXXX", primary: true },
    { id: "nagad", name: "Nagad", account: "018XX-XXXXXX", primary: false },
  ],
  schedule: "weekly" as const,
  minPayout: 500,
};

export const MOCK_CAREGIVER_PORTFOLIO: CaregiverPortfolio = {
  bio: "Experienced caregiver with 5+ years in elderly and post-surgical care across Dhaka.",
  specialties: ["Elderly Care", "Post-Surgery Recovery", "Diabetes Management", "Wound Care"],
  certifications: [
    { name: "Advanced First Aid", issuer: "Red Crescent BD", year: 2024 },
    { name: "Geriatric Care Specialist", issuer: "BRAC University", year: 2023 },
  ],
  experience: [
    { role: "Senior Caregiver", org: "Dhaka Care Agency", period: "2023 - Present" },
    { role: "Home Nurse", org: "MedPro Healthcare", period: "2021 - 2023" },
  ],
};

export const MOCK_CAREGIVER_REFERENCES: CaregiverReference[] = [
  { id: "r1", name: "Dr. Anika Sultana", role: "Supervising Physician", org: "Dhaka Medical College", phone: "+880 171X-XXXXXX", status: "verified" as const },
  { id: "r2", name: "Mrs. Fatima Rahman", role: "Former Client (Guardian)", org: "N/A", phone: "+880 181X-XXXXXX", status: "pending" as const },
  { id: "r3", name: "Karim Ahmed", role: "Agency Manager", org: "Dhaka Care Agency", phone: "+880 191X-XXXXXX", status: "verified" as const },
];

export const MOCK_SHIFT_DETAIL: ShiftDetailData = {
  id: "shift-1", client: "Mrs. Fatima Rahman", type: "Elderly Care", status: "in_progress" as const,
  date: "March 15, 2026", startTime: "8:00 AM", endTime: "4:00 PM", hours: 8,
  rate: 300, total: 2400, location: "House 12, Road 5, Dhanmondi, Dhaka",
  tasks: [
    { name: "Morning medications", done: true }, { name: "Blood pressure check", done: true },
    { name: "Assist with bathing", done: false }, { name: "Prepare lunch", done: false },
  ],
  notes: "Patient is allergic to penicillin. Prefers Bengali-medium communication.",
};

export const MOCK_SKILLS_ASSESSMENT: SkillsAssessment = {
  overall: 78,
  categories: [
    { name: "Clinical Skills", score: 85, max: 100 },
    { name: "Communication", score: 72, max: 100 },
    { name: "Emergency Response", score: 90, max: 100 },
    { name: "Medication Management", score: 65, max: 100 },
    { name: "Patient Comfort", score: 80, max: 100 },
  ],
  recommendations: [
    "Complete Advanced Medication Management course",
    "Practice communication scenarios with Bengali-medium patients",
  ],
};

export const MOCK_TRAINING_MODULES: TrainingModule[] = [
  { id: "t1", title: "Advanced Wound Care", category: "Clinical", duration: "4 hours", progress: 75, status: "in_progress" as const, xpReward: 50, thumbnailUrl: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&q=80&w=200&h=120" },
  { id: "t2", title: "Diabetes Management", category: "Clinical", duration: "3 hours", progress: 100, status: "completed" as const, xpReward: 40 },
  { id: "t3", title: "Emergency First Response", category: "Safety", duration: "6 hours", progress: 0, status: "not_started" as const, xpReward: 60 },
  { id: "t4", title: "Patient Communication", category: "Soft Skills", duration: "2 hours", progress: 30, status: "in_progress" as const, xpReward: 30, thumbnailUrl: "https://images.unsplash.com/photo-1527137342181-19aab11a8ee1?auto=format&fit=crop&q=80&w=200&h=120" },
  { id: "t5", title: "Geriatric Nutrition", category: "Clinical", duration: "3 hours", progress: 100, status: "completed" as const, xpReward: 40 },
];

// ─── Incident History (Phase 7) ───
export const MOCK_INCIDENT_HISTORY: Array<{
  id: string; type: string; severity: string; date: string; status: string; patient: string;
}> = [
  { id: "inc-1", type: "Fall", severity: "high", date: "2026-03-15", status: "resolved", patient: "Rashida Begum" },
  { id: "inc-2", type: "Medication Error", severity: "critical", date: "2026-03-12", status: "under_review", patient: "Kamal Hossain" },
  { id: "inc-3", type: "Behavioral", severity: "medium", date: "2026-03-08", status: "resolved", patient: "Nasreen Akhter" },
  { id: "inc-4", type: "Equipment Failure", severity: "low", date: "2026-02-28", status: "closed", patient: "Abdul Matin" },
];

// ─── Handoff Notes (Phase 9) ───
export const MOCK_HANDOFF_NOTES: Array<{
  id: string; fromCaregiver: string; toCaregiver: string; notes: string;
  flaggedItems: string[]; createdAt: string;
}> = [
  {
    id: "ho-1", fromCaregiver: "Fatema Akter", toCaregiver: "Karim Uddin",
    notes: "Patient had a good morning. Ate full breakfast. Blood pressure slightly elevated at 145/90. Monitor closely.",
    flaggedItems: ["BP elevated — recheck in 2 hours", "Refused afternoon medication — inform guardian"],
    createdAt: "2026-03-16T14:00:00Z",
  },
  {
    id: "ho-2", fromCaregiver: "Karim Uddin", toCaregiver: "Dr. Rahat Khan",
    notes: "Evening shift was calm. Patient slept from 9pm. Wound dressing changed at 7pm — healing well.",
    flaggedItems: ["Check wound dressing at 7am"],
    createdAt: "2026-03-16T22:00:00Z",
  },
  {
    id: "ho-3", fromCaregiver: "Dr. Rahat Khan", toCaregiver: "Fatema Akter",
    notes: "Night was uneventful. Patient woke once at 3am for water. All vitals stable.",
    flaggedItems: [],
    createdAt: "2026-03-17T06:00:00Z",
  },
];

// ─── Shift Check-in Mock (Phase 5) ───
export const MOCK_SHIFT_CHECKIN_DATA = {
  expectedLocation: { lat: 23.8103, lng: 90.4125, address: "House 42, Road 11, Dhanmondi, Dhaka" },
  maxDistanceMeters: 200,
};