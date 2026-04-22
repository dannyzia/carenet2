import type {
  AdminDashboardData, AdminPaymentsData, FamilyMember,
  AdminVerification, AdminReport, AdminUser, AdminAgencyApproval,
  AdminPlacement, AgencyPerformanceRow, AdminAlert,
  GuardianPlacement, AgencyPlacement, CaregiverReview,
  RoleConversation, InlineChatMessage, ModeratorReview, ModeratorReport,
  DirectoryAgency, PlacementShift, AuditChartDataPoint,
  ModerationQueueItem, ModeratorDashboardStats, FlaggedContent, SystemPerformancePoint,
  AuditLogsData, CMSPageData, DisputeData, PolicyData, PromoData,
  SupportTicketData, UserInspectorData, VerificationCaseData, AdminSettingsData,
  ModeratorSanction, ModeratorEscalation, ContractDispute,
} from "@/backend/models";

/** Admin dashboard aggregate data */
export const MOCK_ADMIN_DASHBOARD: AdminDashboardData = {
  summary: {
    totalUsers: 5034,
    totalUsersChangeLabel: "+12% this month",
    activeCaregivers: 1520,
    activeCaregiversChangeLabel: "142 pending verify",
    revenueMonthLabel: "Mar",
    revenueThisMonthBdt: 289000,
    revenueChangeLabel: "+23% vs Feb",
    platformGrowthPercent: 18,
    platformGrowthChangeLabel: "Month-over-month",
    pointsInCirculation: 10_200_000,
    pendingDuesCp: 31020,
    contractsTotal: 5,
    platformRevenueCp: 20020,
  },
  userGrowth: [
    { month: "Oct", caregivers: 820, guardians: 1100, patients: 650 },
    { month: "Nov", caregivers: 960, guardians: 1280, patients: 720 },
    { month: "Dec", caregivers: 1050, guardians: 1400, patients: 810 },
    { month: "Jan", caregivers: 1240, guardians: 1650, patients: 920 },
    { month: "Feb", caregivers: 1380, guardians: 1890, patients: 1040 },
    { month: "Mar", caregivers: 1520, guardians: 2100, patients: 1180 },
  ],
  revenueData: [
    { month: "Oct", revenue: 145000 },
    { month: "Nov", revenue: 178000 },
    { month: "Dec", revenue: 162000 },
    { month: "Jan", revenue: 218000 },
    { month: "Feb", revenue: 234000 },
    { month: "Mar", revenue: 289000 },
  ],
  pieData: [
    { name: "Caregivers", value: 1520, color: "var(--cn-pink)" },
    { name: "Guardians", value: 2100, color: "var(--cn-green)" },
    { name: "Patients", value: 1180, color: "var(--cn-purple)" },
    { name: "Agencies", value: 145, color: "var(--cn-amber)" },
    { name: "Shops", value: 89, color: "var(--cn-blue)" },
  ],
  pendingItems: [
    { type: "Verification", count: 23, color: "#E8A838", path: "/admin/verifications" },
    { type: "Reports", count: 8, color: "#EF4444", path: "/admin/reports" },
    { type: "Disputes", count: 5, color: "#7B5EA7", path: "/admin/reports" },
    { type: "Withdrawals", count: 12, color: "#5FB865", path: "/admin/payments" },
  ],
  recentActivity: [
    { text: "New caregiver verified: Rahima Akter", time: "5m ago", type: "verify" },
    { text: "Dispute #1247 resolved in favor of Guardian", time: "20m ago", type: "resolve" },
    { text: "New agency registered: HealthCare Pro BD", time: "1h ago", type: "new" },
    { text: "Payment withdrawal: \u09F3 45,000 (bKash)", time: "2h ago", type: "payment" },
    { text: "Report flagged: Review content violation", time: "3h ago", type: "flag" },
  ],
};

/** Admin payments page data */
export const MOCK_ADMIN_PAYMENTS: AdminPaymentsData = {
  chartData: [
    { month: "Oct", income: 145000, payouts: 118000 },
    { month: "Nov", income: 178000, payouts: 142000 },
    { month: "Dec", income: 162000, payouts: 130000 },
    { month: "Jan", income: 218000, payouts: 175000 },
    { month: "Feb", income: 234000, payouts: 190000 },
    { month: "Mar", income: 289000, payouts: 224000 },
  ],
  transactions: [
    { id: 1, type: "Guardian Payment", from: "Rashed Hossain", to: "Karim Uddin", amount: "\u09F3 5,600", fee: "\u09F3 280", date: "Mar 14", status: "completed" },
    { id: 2, type: "Caregiver Withdrawal", from: "Platform", to: "Karim Uddin (bKash)", amount: "\u09F3 5,000", fee: "\u09F3 25", date: "Mar 13", status: "completed" },
    { id: 3, type: "Guardian Payment", from: "Tahmid Khan", to: "Fatema Akter", amount: "\u09F3 8,400", fee: "\u09F3 420", date: "Mar 12", status: "completed" },
    { id: 4, type: "Shop Sale", from: "MedShop BD", to: "Platform", amount: "\u09F3 12,800", fee: "\u09F3 640", date: "Mar 11", status: "completed" },
    { id: 5, type: "Pending Withdrawal", from: "Platform", to: "Nasrin Begum (Nagad)", amount: "\u09F3 3,200", fee: "\u09F3 16", date: "Mar 15", status: "pending" },
    { id: 6, type: "Dispute Refund", from: "Platform", to: "Guardian \u2013 Anwar", amount: "\u09F3 2,400", fee: "\u09F3 0", date: "Mar 10", status: "completed" },
  ],
};

/** Guardian family members */
export const MOCK_FAMILY_MEMBERS: FamilyMember[] = [
  { name: "Mrs. Fatema Begum", relation: "Mother", age: 72, condition: "Post-Op Recovery", activeCare: true, img: "https://i.pravatar.cc/100?u=mother" },
  { name: "Mr. Abdul Haque", relation: "Father", age: 78, condition: "Hypertension", activeCare: false, img: "https://i.pravatar.cc/100?u=father" },
  { name: "Zayan Ahmed", relation: "Son", age: 8, condition: "General Health", activeCare: false, img: "https://i.pravatar.cc/100?u=son" },
];

// ─── Admin Verifications ───
export const MOCK_ADMIN_VERIFICATIONS: AdminVerification[] = [
  { id: 1, name: "Rahima Akter", role: "Caregiver", submitted: "Mar 13", docs: ["NID", "Nursing Certificate", "Police Clearance"], status: "pending", location: "Dhaka", specialty: "Elderly Care", avatar: "R", color: "#DB869A" },
  { id: 2, name: "HealthCare Pro BD", role: "Agency", submitted: "Mar 12", docs: ["Trade License", "Agency Registration", "Insurance"], status: "pending", location: "Dhaka", specialty: "Multi-specialty", avatar: "H", color: "#00897B" },
  { id: 3, name: "Md. Shahadat Hossain", role: "Caregiver", submitted: "Mar 11", docs: ["NID", "First Aid Certificate"], status: "under_review", location: "Chittagong", specialty: "Physiotherapy", avatar: "S", color: "#DB869A" },
  { id: 4, name: "MediStore BD", role: "Shop", submitted: "Mar 10", docs: ["Trade License", "Drug License", "NID"], status: "under_review", location: "Sylhet", specialty: "Medicines", avatar: "M", color: "#E64A19" },
  { id: 5, name: "Nasrin Begum", role: "Caregiver", submitted: "Mar 8", docs: ["NID", "Nursing Certificate", "Police Clearance", "Reference"], status: "approved", location: "Rajshahi", specialty: "Child Care", avatar: "N", color: "#DB869A" },
];

// ─── Admin Reports ───
export const MOCK_ADMIN_REPORTS: AdminReport[] = [
  { id: 1, type: "Behavior", reporter: "Rashed Hossain (Guardian)", against: "Karim Uddin (Caregiver)", reason: "Arrived 2 hours late without notification for 3 consecutive days.", date: "Mar 13", priority: "medium", status: "open" },
  { id: 2, type: "Fraud", reporter: "Nasrin Akter (Caregiver)", against: "Anonymous Guardian", reason: "Refused to pay for completed services and threatened to leave negative review.", date: "Mar 12", priority: "high", status: "investigating" },
  { id: 3, type: "Content", reporter: "Admin Auto-Flag", against: "MedShop BD (Shop)", reason: "Product listing with unverified health claims detected by content filter.", date: "Mar 11", priority: "medium", status: "resolved" },
  { id: 4, type: "Safety", reporter: "Fatema Akter (Caregiver)", against: "Tahmid Khan (Guardian)", reason: "Guardian asked caregiver to perform unauthorized medical procedures.", date: "Mar 10", priority: "high", status: "open" },
  { id: 5, type: "Impersonation", reporter: "Platform System", against: "Unknown User", reason: "Account attempting to pose as a verified medical professional.", date: "Mar 9", priority: "critical", status: "investigating" },
];

// ─── Admin Users ───
export const MOCK_ADMIN_USERS: AdminUser[] = [
  { id: 1, name: "Karim Uddin", role: "Caregiver", phone: "01712-XXXXXX", location: "Dhaka", joined: "Jan 15", status: "active", verified: true, avatar: "K", color: "#DB869A" },
  { id: 2, name: "Rashed Hossain", role: "Guardian", phone: "01714-XXXXXX", location: "Gulshan", joined: "Feb 2", status: "active", verified: true, avatar: "R", color: "#5FB865" },
  { id: 3, name: "Fatema Akter", role: "Caregiver", phone: "01811-XXXXXX", location: "Mirpur", joined: "Feb 10", status: "active", verified: true, avatar: "F", color: "#DB869A" },
  { id: 4, name: "Rahman Family Agency", role: "Agency", phone: "01912-XXXXXX", location: "Chittagong", joined: "Mar 1", status: "pending", verified: false, avatar: "R", color: "#E8A838" },
  { id: 5, name: "MedShop BD", role: "Shop", phone: "01613-XXXXXX", location: "Sylhet", joined: "Mar 5", status: "active", verified: true, avatar: "M", color: "#E64A19" },
  { id: 6, name: "Nasrin Akter", role: "Caregiver", phone: "01515-XXXXXX", location: "Rajshahi", joined: "Mar 8", status: "suspended", verified: false, avatar: "N", color: "#DB869A" },
  { id: 7, name: "Dr. Arif Hossain", role: "Patient", phone: "01316-XXXXXX", location: "Dhaka", joined: "Mar 10", status: "active", verified: true, avatar: "A", color: "#0288D1" },
  { id: 8, name: "HealthCare Pro BD", role: "Agency", phone: "01217-XXXXXX", location: "Dhaka", joined: "Mar 12", status: "pending", verified: false, avatar: "H", color: "#00897B" },
  { id: 9, name: "Tanvir Ahmed", role: "Moderator", phone: "01817-XXXXXX", location: "Dhaka", joined: "Mar 14", status: "active", verified: true, avatar: "T", color: "#FFB74D" },
];

// ─── Admin Agency Approvals ───
export const MOCK_ADMIN_AGENCY_APPROVALS: AdminAgencyApproval[] = [
  { id: "AGY-001", name: "SafeHands Care BD", owner: "Mahbub Alam", email: "info@safehands.bd", registrationNo: "RJSC-2025-48921", location: "Sylhet", serviceAreas: ["Sylhet City", "Sunamganj"], plannedCaregivers: 12, documents: 4, submittedDate: "Mar 12, 2026", status: "pending" },
  { id: "AGY-002", name: "HomeCare Chittagong", owner: "Rezaul Karim", email: "hello@homecare-ctg.bd", registrationNo: "RJSC-2025-52103", location: "Chittagong", serviceAreas: ["Agrabad", "Nasirabad", "GEC"], plannedCaregivers: 8, documents: 3, submittedDate: "Mar 10, 2026", status: "pending" },
  { id: "AGY-003", name: "HealthCare Pro BD", owner: "Tanvir Rahman", email: "info@healthcarepro.bd", registrationNo: "RJSC-2018-12345", location: "Dhaka", serviceAreas: ["Gulshan", "Banani", "Baridhara"], plannedCaregivers: 24, documents: 5, submittedDate: "Feb 8, 2026", status: "approved", placements: 8, caregivers: 24, rating: 4.8, revenue: "\u09F3 312K" },
  { id: "AGY-004", name: "CareFirst Bangladesh", owner: "Sharmin Akhter", email: "care@carefirst.bd", registrationNo: "RJSC-2021-34567", location: "Dhaka", serviceAreas: ["Dhanmondi", "Lalmatia"], plannedCaregivers: 18, documents: 5, submittedDate: "Jan 15, 2026", status: "approved", placements: 6, caregivers: 18, rating: 4.6, revenue: "\u09F3 248K" },
  { id: "AGY-005", name: "QuickCare Rajshahi", owner: "Salam Hossain", email: "quickcare@mail.com", registrationNo: "RJSC-2025-55000", location: "Rajshahi", serviceAreas: ["Rajshahi City"], plannedCaregivers: 5, documents: 2, submittedDate: "Mar 5, 2026", status: "rejected" },
];

// ─── Admin Placement Monitoring ───
export const MOCK_ADMIN_PLACEMENTS: AdminPlacement[] = [
  { id: "PL-2026-0018", agency: "HealthCare Pro BD", guardian: "Rashed Hossain", patient: "Mr. Abdul Rahman", caregiver: "Karim Uddin", start: "Jan 10", status: "active", compliance: 96, rating: 4.8, missedShifts: 1 },
  { id: "PL-2026-0019", agency: "HealthCare Pro BD", guardian: "Fatima Khatun", patient: "Baby Arif", caregiver: "Fatema Akter", start: "Feb 1", status: "active", compliance: 100, rating: 4.9, missedShifts: 0 },
  { id: "PL-2026-0020", agency: "CareFirst Bangladesh", guardian: "Aminul Islam", patient: "Mrs. Jahanara", caregiver: "Nasrin Begum", start: "Feb 15", status: "active", compliance: 82, rating: 4.2, missedShifts: 4 },
  { id: "PL-2026-0021", agency: "Golden Age Care", guardian: "Kamal Uddin", patient: "Mr. Shamsul Haque", caregiver: "Rashid Khan", start: "Mar 1", status: "active", compliance: 91, rating: 4.5, missedShifts: 2 },
  { id: "PL-2026-0022", agency: "CareFirst Bangladesh", guardian: "Nusrat Jahan", patient: "Mr. Rafiqul Islam", caregiver: "Tariq Hasan", start: "Mar 5", status: "active", compliance: 100, rating: 4.7, missedShifts: 0 },
];
export const MOCK_AGENCY_PERFORMANCE: AgencyPerformanceRow[] = [
  { name: "HealthCare Pro BD", placements: 8, rating: 4.8, onTimeRate: "96%", incidentRate: "2%", revenue: "\u09F3 312K" },
  { name: "Golden Age Care", placements: 5, rating: 4.7, onTimeRate: "93%", incidentRate: "1%", revenue: "\u09F3 185K" },
  { name: "CareFirst Bangladesh", placements: 6, rating: 4.4, onTimeRate: "88%", incidentRate: "5%", revenue: "\u09F3 248K" },
  { name: "MedAssist Home Care", placements: 3, rating: 4.5, onTimeRate: "91%", incidentRate: "3%", revenue: "\u09F3 95K" },
];

// ─── Admin Alerts ───
export const MOCK_ADMIN_ALERTS: AdminAlert[] = [
  { type: "compliance", text: "PL-2026-0020 (CareFirst) has 82% shift compliance — below 90% threshold", severity: "warning" },
  { type: "incident", text: "Open incident report on PL-2026-0021 (Golden Age Care) — fall detected", severity: "critical" },
  { type: "nolog", text: "No care logs for 28+ hours on PL-2026-0020 (CareFirst)", severity: "warning" },
];

// ─── Guardian Placements ───
export const MOCK_GUARDIAN_PLACEMENTS: GuardianPlacement[] = [
  { id: "PL-2026-0018", patient: "Mr. Abdul Rahman", agency: "HealthCare Pro BD", careType: "Night Care", startDate: "Jan 10, 2026", endDate: "Mar 10, 2026", duration: "2 Months", currentCaregiver: "Karim Uddin", onDuty: true, shiftsCompleted: 42, shiftsTotal: 60, status: "active" },
  { id: "PL-2026-0022", patient: "Mrs. Rahela Begum", agency: "Golden Age Care", careType: "Post-Op Recovery", startDate: "Apr 1, 2026", endDate: "Apr 30, 2026", duration: "1 Month", currentCaregiver: "Fatema Akter", onDuty: false, shiftsCompleted: 0, shiftsTotal: 30, status: "upcoming" },
  { id: "PL-2025-0091", patient: "Mr. Abdul Rahman", agency: "CareFirst Bangladesh", careType: "Daily Check-in", startDate: "Nov 1, 2025", endDate: "Nov 30, 2025", duration: "1 Month", currentCaregiver: "Nasrin Begum", onDuty: false, shiftsCompleted: 30, shiftsTotal: 30, status: "completed" },
];

// ─── Agency Placements ───
export const MOCK_AGENCY_PLACEMENTS: AgencyPlacement[] = [
  { id: "PL-2026-0018", patient: "Mr. Abdul Rahman", guardian: "Rashed Hossain", careType: "Night Care", caregiver: "Karim Uddin", startDate: "Jan 10", status: "active" },
  { id: "PL-2026-0019", patient: "Baby Arif", guardian: "Fatima Khatun", careType: "Specialized Medical", caregiver: "Fatema Akter", startDate: "Feb 1", status: "active" },
  { id: "PL-2026-0022", patient: "Mrs. Jahanara Islam", guardian: "Aminul Islam", careType: "Post-Op Recovery", caregiver: "Nasrin Begum", startDate: "Apr 1", status: "upcoming" },
  { id: "PL-2025-0091", patient: "Mr. Shamsul Haque", guardian: "Kamal Uddin", careType: "Daily Check-in", caregiver: "Rashid Khan", startDate: "Nov 1", status: "completed" },
];

// ─── Caregiver Reviews ───
export const MOCK_CAREGIVER_REVIEWS: CaregiverReview[] = [
  { id: 1, reviewer: "Mrs. Fatema Begum", role: "Guardian", rating: 5, date: "Mar 10", text: "Karim was absolutely wonderful with my mother. He was punctual, caring, and professional. My mother felt very comfortable with him. Highly recommended!", avatar: "F", avatarColor: "#5FB865" },
  { id: 2, reviewer: "Rahman Family", role: "Guardian", rating: 5, date: "Mar 3", text: "Excellent caregiver! Very patient with our child who has special needs. He adapted his approach perfectly and the progress has been remarkable.", avatar: "R", avatarColor: "#DB869A" },
  { id: 3, reviewer: "Mr. Hassan Ali", role: "Patient", rating: 4, date: "Feb 25", text: "Good care overall. Knowledgeable about medication management and always on time. Could improve on communication with family members.", avatar: "H", avatarColor: "#7B5EA7" },
  { id: 4, reviewer: "Nasrin Akter", role: "Patient", rating: 5, date: "Feb 18", text: "The physiotherapy sessions were very effective. Karim explained each exercise clearly and monitored my progress carefully. I recovered faster than expected!", avatar: "N", avatarColor: "#E8A838" },
  { id: 5, reviewer: "Salam Khan", role: "Guardian", rating: 4, date: "Feb 12", text: "Very professional and empathetic. Dealt with my father's dementia with great patience and skill. Would hire again.", avatar: "S", avatarColor: "#0288D1" },
];

// ─── Caregiver Conversations ───
export const MOCK_CAREGIVER_CONVERSATIONS: RoleConversation[] = [
  { id: 1, name: "Mr. Rahim Ahmed", role: "Patient", avatar: "R", lastMsg: "What time will you arrive tomorrow?", time: "2m ago", unread: 2, online: true, color: "#DB869A" },
  { id: 2, name: "Mrs. Fatema Begum", role: "Guardian", avatar: "F", lastMsg: "Thank you for the update \u{1F64F}", time: "1h ago", unread: 0, online: false, color: "#5FB865" },
  { id: 3, name: "CareNet Support", role: "Platform", avatar: "C", lastMsg: "Your verification is complete!", time: "3h ago", unread: 1, online: true, color: "#7B5EA7" },
  { id: 4, name: "Rahman Family", role: "Guardian", avatar: "R", lastMsg: "Can you cover next Sunday?", time: "Yesterday", unread: 0, online: false, color: "#E8A838" },
  { id: 5, name: "Dr. Nasrin Akter", role: "Doctor", avatar: "N", lastMsg: "Please send the care log.", time: "2d ago", unread: 0, online: false, color: "#0288D1" },
];
export const MOCK_CAREGIVER_CHAT_MESSAGES: InlineChatMessage[] = [
  { id: 1, from: "them", text: "Good morning! How is Mr. Ahmed doing today?", time: "9:02 AM", read: true },
  { id: 2, from: "me", text: "Good morning! He had a good night. His vitals are normal and he ate breakfast well \u{1F60A}", time: "9:15 AM", read: true },
  { id: 3, from: "them", text: "Did he take his morning medication?", time: "9:18 AM", read: true },
  { id: 4, from: "me", text: "Yes, all medications taken on time. I also did his morning physiotherapy exercises.", time: "9:25 AM", read: true },
  { id: 5, from: "them", text: "What time will you arrive tomorrow?", time: "10:30 AM", read: false },
];

// ─── Guardian Conversations ───
export const MOCK_GUARDIAN_CONVERSATIONS: RoleConversation[] = [
  { id: 1, name: "Karim Uddin", role: "Caregiver", avatar: "K", lastMsg: "Mr. Rahman took his medication \u2713", time: "5m ago", unread: 1, online: true, color: "#DB869A" },
  { id: 2, name: "Fatema Akter", role: "Caregiver", avatar: "F", lastMsg: "Good evening! Mrs. Begum is sleeping.", time: "30m ago", unread: 0, online: true, color: "#5FB865" },
  { id: 3, name: "Dr. Arif Hossain", role: "Doctor", avatar: "D", lastMsg: "Please bring the blood reports tomorrow.", time: "2h ago", unread: 0, online: false, color: "#7B5EA7" },
  { id: 4, name: "CareNet Support", role: "Platform", avatar: "C", lastMsg: "Your payment was processed successfully!", time: "Yesterday", unread: 0, online: true, color: "#0288D1" },
];
export const MOCK_GUARDIAN_CHAT_MESSAGES: InlineChatMessage[] = [
  { id: 1, from: "them", text: "Good morning! Mr. Rahman woke up at 7 AM and had breakfast well.", time: "7:32 AM" },
  { id: 2, from: "me", text: "Thank you Karim! Did he take his morning medication?", time: "7:35 AM" },
  { id: 3, from: "them", text: "Yes, all 3 tablets taken at 8:00 AM as prescribed. Vitals: BP 130/85, pulse 72.", time: "8:05 AM" },
  { id: 4, from: "me", text: "Great! Please make sure he does his physiotherapy exercises today.", time: "8:10 AM" },
  { id: 5, from: "them", text: "Mr. Rahman took his medication \u2713", time: "12:30 PM" },
];

// ─── Moderator Reviews ───
export const MOCK_MODERATOR_REVIEWS: ModeratorReview[] = [
  { id: 1, reviewer: "Anonymous User", about: "Karim Uddin (Caregiver)", rating: 1, text: "This caregiver was terrible. Never showed up and stole items from my home!", date: "Mar 13", flagReason: "Unverified claim of theft \u2013 no evidence provided", status: "flagged" },
  { id: 2, reviewer: "Tahmid Khan", about: "MedShop BD", rating: 5, text: "Great shop! Fast delivery and quality products.", date: "Mar 12", flagReason: "Suspected fake review (IP match with shop owner)", status: "flagged" },
  { id: 3, reviewer: "Nasrin Akter", about: "Rahman Care Agency", rating: 2, text: "The agency sent an unqualified caregiver. Very disappointed with the service level.", date: "Mar 11", flagReason: "Profanity in original text \u2013 cleaned by filter", status: "pending" },
  { id: 4, reviewer: "Sara Ahmed", about: "Fatema Akter (Caregiver)", rating: 4, text: "Good caregiver overall. Punctual and professional.", date: "Mar 10", flagReason: null, status: "approved" },
];

// ─── Moderator Reports ───
export const MOCK_MODERATOR_REPORTS: ModeratorReport[] = [
  { id: 1, type: "Harassment", from: "Caregiver Karim", against: "Guardian Tahmid", desc: "Guardian made inappropriate personal requests outside caregiving scope.", priority: "high", status: "open", date: "Mar 14" },
  { id: 2, type: "Payment Fraud", from: "Caregiver Fatema", against: "Guardian Ali", desc: "Guardian refused payment after services were rendered and completed.", priority: "high", status: "investigating", date: "Mar 12" },
  { id: 3, type: "Fake Profile", from: "System Auto-flag", against: "User ID #4521", desc: "Profile using stock photo and unverifiable credentials.", priority: "medium", status: "open", date: "Mar 11" },
  { id: 4, type: "Spam", from: "Multiple Users", against: "Agency CarePro", desc: "Agency sending unsolicited messages to multiple users.", priority: "low", status: "resolved", date: "Mar 10" },
];

// ─── Agency Directory (AgencyDirectoryPage) ───
export const MOCK_DIRECTORY_AGENCIES: DirectoryAgency[] = [
  { id: "a1", name: "HealthCare Pro BD", tagline: "Trusted Home Healthcare Since 2018", rating: 4.8, reviews: 124, location: "Gulshan, Dhaka", areas: ["Gulshan", "Banani", "Baridhara"], specialties: ["Elder Care", "Post-Op", "Night Care"], caregivers: 24, years: 8, verified: true, logo: "HP" },
  { id: "a2", name: "CareFirst Bangladesh", tagline: "Compassionate Pediatric & Disability Care", rating: 4.6, reviews: 89, location: "Dhanmondi, Dhaka", areas: ["Dhanmondi", "Lalmatia", "Mohammadpur"], specialties: ["Pediatric", "Disability", "Respite"], caregivers: 18, years: 5, verified: true, logo: "CF" },
  { id: "a3", name: "Golden Age Care", tagline: "Specialized Elderly & Dementia Care", rating: 4.9, reviews: 67, location: "Uttara, Dhaka", areas: ["Uttara", "Tongi", "Airport Area"], specialties: ["Elder Care", "Dementia", "Palliative"], caregivers: 15, years: 12, verified: true, logo: "GA" },
  { id: "a4", name: "MedAssist Home Care", tagline: "Medical-Grade Home Care Services", rating: 4.5, reviews: 45, location: "Agrabad, Chittagong", areas: ["Agrabad", "Nasirabad", "Halishahar"], specialties: ["Post-Op", "Night Care", "Elder Care"], caregivers: 10, years: 3, verified: true, logo: "MA" },
  { id: "a5", name: "NurtureCare Dhaka", tagline: "Round-the-Clock Nursing Support", rating: 4.7, reviews: 56, location: "Mirpur, Dhaka", areas: ["Mirpur", "Pallabi", "Kazipara"], specialties: ["Elder Care", "Night Care", "Respite"], caregivers: 12, years: 4, verified: false, logo: "NC" },
  { id: "a6", name: "Little Stars Pediatric Care", tagline: "Expert Child Care at Home", rating: 4.8, reviews: 38, location: "Bashundhara, Dhaka", areas: ["Bashundhara", "Badda", "Khilkhet"], specialties: ["Pediatric", "Disability"], caregivers: 8, years: 2, verified: true, logo: "LS" },
];

// ─── Agency Placement Detail Shifts ───
export const MOCK_PLACEMENT_SHIFTS: PlacementShift[] = [
  { day: "Mon", caregiver: "Karim Uddin", time: "8PM-8AM", status: "completed" },
  { day: "Tue", caregiver: "Karim Uddin", time: "8PM-8AM", status: "completed" },
  { day: "Wed", caregiver: "Fatema Akter", time: "8PM-8AM", status: "completed" },
  { day: "Thu", caregiver: "Karim Uddin", time: "8PM-8AM", status: "scheduled" },
  { day: "Fri", caregiver: "Karim Uddin", time: "8PM-8AM", status: "scheduled" },
  { day: "Sat", caregiver: "", time: "8PM-8AM", status: "unassigned" },
  { day: "Sun", caregiver: "Karim Uddin", time: "8PM-8AM", status: "scheduled" },
];

// ─── Financial Audit Chart Data ───
export const MOCK_AUDIT_CHART_DATA: AuditChartDataPoint[] = [
  { day: "01", rev: 120000, payout: 95000 }, { day: "05", rev: 150000, payout: 110000 },
  { day: "10", rev: 110000, payout: 85000 }, { day: "15", rev: 180000, payout: 140000 },
  { day: "20", rev: 140000, payout: 105000 }, { day: "25", rev: 210000, payout: 165000 },
  { day: "30", rev: 195000, payout: 150000 },
];

export const MOCK_MODERATOR_DASHBOARD_STATS: ModeratorDashboardStats = {
  pendingReviews: 18,
  openReports: 8,
  contentFlags: 5,
  resolvedToday: 12,
};

// ─── Moderator Dashboard Queue ───
export const MOCK_MODERATION_QUEUE: ModerationQueueItem[] = [
  { id: 1, type: "Review", content: "Review by Nasrin K. – contains possible inappropriate language", reporter: "Auto-flagged", time: "10m ago", priority: "medium" },
  { id: 2, type: "Report", content: "Dispute between caregiver and guardian about payment amount", reporter: "Rashed H.", time: "45m ago", priority: "high" },
  { id: 3, type: "Content", content: "Profile bio contains contact details (policy violation)", reporter: "Auto-flagged", time: "2h ago", priority: "low" },
  { id: 4, type: "Review", content: "Potential fake 5-star review on Karim U.'s profile (from same IP)", reporter: "System", time: "3h ago", priority: "medium" },
  { id: 5, type: "Report", content: "User reported for repeatedly canceling appointments last-minute", reporter: "Karim U.", time: "5h ago", priority: "low" },
];

// ─── Moderator Flagged Content ───
export const MOCK_FLAGGED_CONTENT: FlaggedContent[] = [
  { id: 1, type: "Review", content: "Misleading review on caregiver profile - claims fake credentials", reporter: "System Auto-flag", time: "1h ago", severity: "high", target: "Caregiver #4521", reason: "Misinformation" },
  { id: 2, type: "Listing", content: "Agency listing with unverified medical claims", reporter: "Guardian Rashed H.", time: "3h ago", severity: "medium", target: "Agency #112", reason: "Unverified Claims" },
  { id: 3, type: "Message", content: "Inappropriate language in guardian-caregiver chat", reporter: "AI Content Filter", time: "5h ago", severity: "low", target: "Chat #8842", reason: "Language Policy" },
  { id: 4, type: "Profile", content: "Caregiver profile photo doesn't match verified identity", reporter: "Verification Bot", time: "8h ago", severity: "high", target: "Caregiver #2201", reason: "Identity Mismatch" },
];

// ─── System Health Performance Data ───
export const MOCK_SYSTEM_PERFORMANCE: SystemPerformancePoint[] = [
  { time: "14:00", latency: 12, cpu: 15 }, { time: "14:15", latency: 18, cpu: 22 },
  { time: "14:30", latency: 15, cpu: 18 }, { time: "14:45", latency: 25, cpu: 45 },
  { time: "15:00", latency: 14, cpu: 20 }, { time: "15:15", latency: 12, cpu: 16 },
];

// ─── Audit Logs ───
export const MOCK_AUDIT_LOGS: AuditLogsData = {
  stats: [{ label: "Total Events", val: "1.2M" }, { label: "Security Alerts", val: "14" }, { label: "Data Integrity", val: "100%" }, { label: "Auth Success", val: "99.8%" }],
  logs: [
    { time: "15:22:45", action: "AUTH_LOGIN_SUCCESS", uid: "U-90212", ip: "103.22.45.122", severity: "info" as const },
    { time: "15:20:12", action: "PAYOUT_PROCESS_TRIGGER", uid: "SYS_CRON", ip: "127.0.0.1", severity: "info" as const },
    { time: "15:18:05", action: "NID_VETTING_FAIL", uid: "U-44122", ip: "202.45.12.89", severity: "warning" as const },
    { time: "15:15:33", action: "ADMIN_LOCK_ACCOUNT", uid: "ADM-001", ip: "10.0.0.5", severity: "critical" as const, metadata: { targetUser: "U-44122", reason: "suspected fraud" } },
    { time: "15:12:10", action: "API_SECRET_ROTATED", uid: "SYS_KERN", ip: "localhost", severity: "critical" as const },
    { time: "15:10:00", action: "PRODUCT_PRICE_UPDATE", uid: "SHOP-44", ip: "103.22.45.110", severity: "info" as const },
    { time: "15:09:05", action: "CP_REGISTRATION", uid: "CP-001", ip: "103.22.45.111", severity: "info" as const, metadata: { cp_id: "CP-001", cp_user_id: "U-1001", referralCode: "REF-CP-ABC123" } },
    { time: "15:08:50", action: "CP_APPROVED", uid: "ADM-003", ip: "10.0.0.7", severity: "info" as const, metadata: { cp_id: "CP-001", approvedBy: "ADM-003" } },
    { time: "15:08:35", action: "CP_LEAD_CREATED", uid: "CP-001", ip: "103.22.45.111", severity: "info" as const, metadata: { cp_id: "CP-001", leadUserId: "U-2002", leadRole: "guardian" } },
    { time: "15:08:25", action: "CP_RATE_SET", uid: "ADM-003", ip: "10.0.0.7", severity: "info" as const, metadata: { cp_id: "CP-001", leadRole: "caregiver", rate: "10.00" } },
    { time: "15:08:22", action: "CP_COMMISSION_CREDITED", uid: "ADM-002", ip: "10.0.0.6", severity: "info" as const, metadata: { cp_id: "CP-003", amount: "\u09F3 12,500" } },
    { time: "15:08:15", action: "CP_LEAD_ACTIVATED", uid: "CP-001", ip: "103.22.45.111", severity: "info" as const, metadata: { cp_id: "CP-001", leadUserId: "U-2002" } },
    { time: "15:08:12", action: "CP_RATE_EXPIRING", uid: "SYS_CRON", ip: "127.0.0.1", severity: "warning" as const, metadata: { cp_id: "CP-001", leadRole: "shop", expiresAt: "2026-04-25" } },
    { time: "15:08:10", action: "CP_COMMISSION_SKIPPED_NO_RATE", uid: "SYS_TRIG", ip: "127.0.0.1", severity: "info" as const, metadata: { cp_id: "CP-006", leadUserId: "U-2005", reason: "no active rate" } },
    { time: "15:08:08", action: "CP_COMMISSION_REVERSED", uid: "ADM-005", ip: "10.0.0.9", severity: "warning" as const, metadata: { cp_id: "CP-003", invoiceId: "INV-991", reversalReason: "dispute refund" } },
    { time: "15:08:05", action: "CP_LEAD_REASSIGNED", uid: "ADM-006", ip: "10.0.0.10", severity: "info" as const, metadata: { cp_id: "CP-001", leadUserId: "U-2002", previousCpId: "CP-004" } },
    { time: "15:08:00", action: "CP_SUSPENDED", uid: "ADM-004", ip: "10.0.0.8", severity: "warning" as const, metadata: { cp_id: "CP-005", reason: "policy violation" } },
    { time: "15:07:55", action: "CP_REJECTED", uid: "ADM-004", ip: "10.0.0.8", severity: "warning" as const, metadata: { cp_id: "CP-006", reason: "incomplete documentation" } },
    { time: "15:07:50", action: "CP_DEACTIVATED", uid: "ADM-004", ip: "10.0.0.8", severity: "warning" as const, metadata: { cp_id: "CP-007", reason: "inactivity" } },
    { time: "15:07:45", action: "CP_RATE_RENEWED", uid: "ADM-003", ip: "10.0.0.7", severity: "info" as const, metadata: { cp_id: "CP-001", leadRole: "guardian", newRate: "12.00" } },
    { time: "15:07:40", action: "CP_RATE_EXPIRED", uid: "SYS_CRON", ip: "127.0.0.1", severity: "warning" as const, metadata: { cp_id: "CP-002", leadRole: "agency", expiresAt: "2026-04-20" } },
    { time: "15:07:35", action: "CP_APPLICATION_PENDING", uid: "CP-008", ip: "103.22.45.115", severity: "info" as const, metadata: { cp_id: "CP-008", cp_user_id: "U-3001", businessName: "Test Business" } },
    { time: "15:07:30", action: "CP_COMMISSION_REVERSED_ADMIN", uid: "ADM-005", ip: "10.0.0.9", severity: "warning" as const, metadata: { cp_id: "CP-003", invoiceId: "INV-992", reversalReason: "admin override" } },
    { time: "15:07:25", action: "CP_LEAD_DEACTIVATED", uid: "ADM-006", ip: "10.0.0.10", severity: "info" as const, metadata: { cp_id: "CP-001", leadUserId: "U-2003", deactivationReason: "user request" } },
    { time: "15:07:20", action: "CP_REAPPLICATION", uid: "CP-006", ip: "103.22.45.118", severity: "info" as const, metadata: { cp_id: "CP-006", cp_user_id: "U-3002", previousRejectionReason: "incomplete documentation" } },
    { time: "15:07:15", action: "CP_LOGIN", uid: "CP-001", ip: "103.22.45.111", severity: "info" as const, metadata: { cp_id: "CP-001", loginMethod: "email" } },
    { time: "15:07:10", action: "CP_STATUS_CHANGED", uid: "ADM-003", ip: "10.0.0.7", severity: "info" as const, metadata: { cp_id: "CP-001", previousStatus: "pending_approval", newStatus: "active" } },
    { time: "15:07:05", action: "CP_LEAD_ATTRIBUTED", uid: "SYS_TRIG", ip: "127.0.0.1", severity: "info" as const, metadata: { cp_id: "CP-001", leadUserId: "U-2004", attributionMethod: "referral_code" } },
    { time: "15:07:00", action: "CP_RATE_CHANGED", uid: "ADM-003", ip: "10.0.0.7", severity: "info" as const, metadata: { cp_id: "CP-001", leadRole: "agency", previousRate: "10.00", newRate: "12.00" } },
    { time: "15:06:55", action: "CP_COMMISSION_CALCULATED", uid: "SYS_TRIG", ip: "127.0.0.1", severity: "info" as const, metadata: { cp_id: "CP-003", invoiceId: "INV-993", calculatedAmount: "৳ 8,500" } },
    { time: "15:06:50", action: "CP_COMMISSION_SKIPPED_CP_INACTIVE", uid: "SYS_TRIG", ip: "127.0.0.1", severity: "info" as const, metadata: { cp_id: "CP-005", leadUserId: "U-2006", reason: "CP suspended" } },
    { time: "15:06:45", action: "CP_PAYOUT_REQUESTED", uid: "CP-003", ip: "103.22.45.112", severity: "info" as const, metadata: { cp_id: "CP-003", requestedAmount: "৳ 25,000" } },
    { time: "15:06:40", action: "CP_PAYOUT_PROCESSED", uid: "ADM-007", ip: "10.0.0.11", severity: "info" as const, metadata: { cp_id: "CP-003", payoutAmount: "৳ 25,000", transactionId: "TXN-789" } },
    { time: "15:06:35", action: "CP_PAYOUT_CONFIRMED", uid: "SYS_BANK", ip: "10.0.0.12", severity: "info" as const, metadata: { cp_id: "CP-003", confirmationRef: "BANK-REF-456" } },
    { time: "15:06:30", action: "CP_PROFILE_VIEWED", uid: "ADM-008", ip: "10.0.0.13", severity: "info" as const, metadata: { cp_id: "CP-001", viewerId: "ADM-008" } },
    { time: "15:06:25", action: "CP_REACTIVATED", uid: "ADM-004", ip: "10.0.0.8", severity: "info" as const, metadata: { cp_id: "CP-005", previousStatus: "suspended", newStatus: "active" } },
    { time: "15:06:20", action: "CP_COMMISSION_PAID", uid: "SYS_BANK", ip: "10.0.0.12", severity: "info" as const, metadata: { cp_id: "CP-003", commissionId: "COM-123", paymentRef: "PAY-789" } },
    { time: "15:06:15", action: "CP_ACTIVATION_LINK_SENT", uid: "SYS_AUTH", ip: "127.0.0.1", severity: "info" as const, metadata: { leadUserId: "U-2007", activationMethod: "email" } },
    { time: "15:06:10", action: "CP_ACTIVATION_LINK_RESENT", uid: "CP-001", ip: "103.22.45.111", severity: "info" as const, metadata: { leadUserId: "U-2007", resendCount: "1" } },
  ],
};

export const MOCK_CMS_PAGE_DATA: CMSPageData = {
  stats: [{ label: "Active Pages", val: "42" }, { label: "Blog Posts", val: "128" }, { label: "Media Assets", val: "1.5k" }, { label: "Pending Review", val: "4" }],
  content: [
    { title: "Post-Op Recovery Tips", type: "Blog", status: "Published", date: "Mar 12, 10:45 AM", author: "Dr. Farhana" },
    { title: "Privacy Policy Update 2026", type: "Page", status: "Published", date: "Mar 10, 02:30 PM", author: "Legal Team" },
    { title: "About Us Redesign", type: "Page", status: "Draft", date: "Mar 08, 09:12 AM", author: "Design" },
    { title: "Geriatric Care Study", type: "Blog", status: "Scheduled", date: "Mar 18, 08:00 AM", author: "Admin" },
  ],
};

export const MOCK_DISPUTE_DATA: DisputeData = {
  stats: [{ label: "Open Disputes", val: "8" }, { label: "Avg Resolution", val: "3.2d" }, { label: "Escalated", val: "2" }, { label: "Resolved (30d)", val: "42" }],
  disputes: [
    { id: "DIS-4401", parties: "Guardian Fatima vs Agency Dhaka Care", type: "Payment", status: "open", amount: "\u09F312,500", date: "Mar 14" },
    { id: "DIS-4398", parties: "Caregiver Rahat vs Guardian Zubayer", type: "Service Quality", status: "escalated", amount: "\u09F38,200", date: "Mar 12" },
    { id: "DIS-4395", parties: "Agency MedPro vs Caregiver Arif", type: "Shift Dispute", status: "open", amount: "\u09F35,000", date: "Mar 10" },
  ],
};

export const MOCK_POLICY_DATA: PolicyData = {
  policies: [
    { title: "Terms of Service", version: "3.2", status: "Published", updated: "Mar 10, 2026", category: "Legal" },
    { title: "Privacy Policy", version: "2.8", status: "Published", updated: "Mar 08, 2026", category: "Legal" },
    { title: "Caregiver Code of Conduct", version: "1.5", status: "Draft", updated: "Mar 15, 2026", category: "Operations" },
    { title: "Refund Policy", version: "2.1", status: "Published", updated: "Feb 28, 2026", category: "Finance" },
  ],
};

export const MOCK_PROMO_DATA: PromoData = {
  stats: [{ label: "Active Promos", val: "6" }, { label: "Total Redemptions", val: "1,240" }, { label: "Revenue Impact", val: "+\u09F345K" }, { label: "Avg Discount", val: "15%" }],
  promos: [
    { code: "WELCOME25", discount: "25%", type: "New User", status: "active", used: 342, limit: 500, expires: "Apr 30" },
    { code: "EIDMUBARAK", discount: "20%", type: "Seasonal", status: "active", used: 198, limit: 1000, expires: "Mar 31" },
    { code: "AGENCY10", discount: "10%", type: "Agency", status: "active", used: 89, limit: 200, expires: "May 15" },
    { code: "REFER50", discount: "\u09F350 off", type: "Referral", status: "paused", used: 611, limit: null, expires: "None" },
  ],
};

export const MOCK_SUPPORT_TICKET: SupportTicketData = {
  id: "TKT-001", subject: "Payment not received for completed shift", status: "open", priority: "high",
  user: { name: "Dr. Rahat Khan", role: "Caregiver", email: "rahat@email.com" },
  created: "Mar 12, 2026 10:30 AM", category: "Payments",
  messages: [
    { from: "Dr. Rahat Khan", role: "Caregiver", time: "Mar 12, 10:30 AM", text: "I completed a 12-hour shift on March 10 but haven't received payment. Order #SH-90211." },
    { from: "Support Bot", role: "System", time: "Mar 12, 10:31 AM", text: "Thank you for reaching out. Your ticket has been assigned to our payments team." },
    { from: "Admin Karim", role: "Admin", time: "Mar 12, 02:15 PM", text: "Looking into this. The payout was stuck in processing. Releasing now." },
  ],
};

export const MOCK_USER_INSPECTOR: UserInspectorData = {
  user: {
    id: "U-90212", name: "Dr. Rahat Khan", email: "rahat@carenet.bd", phone: "+880 1712-XXXXXX",
    role: "Caregiver", status: "active", verified: true, joined: "Jan 15, 2025",
    stats: { shifts: 142, earnings: "\u09F3185,000", rating: 4.8, reviews: 38 },
    recentActivity: [
      { action: "Shift completed", detail: "12h shift at Dhanmondi client", time: "2h ago" },
      { action: "Payout received", detail: "\u09F33,500 via bKash", time: "1d ago" },
      { action: "Document uploaded", detail: "NID verification scan", time: "3d ago" },
    ],
  },
};

export const MOCK_VERIFICATION_CASE: VerificationCaseData = {
  id: "VER-001", type: "NID Verification", status: "pending",
  applicant: { name: "Arif Hossain", role: "Caregiver", submitted: "Mar 10, 2026" },
  documents: [
    { name: "National ID (Front)", status: "uploaded", size: "2.1 MB" },
    { name: "National ID (Back)", status: "uploaded", size: "1.8 MB" },
    { name: "Selfie with NID", status: "uploaded", size: "3.2 MB" },
  ],
  checks: [
    { name: "Name Match", result: "pass" }, { name: "DOB Match", result: "pass" },
    { name: "Photo Match", result: "pending" }, { name: "Address Verification", result: "pending" },
  ],
};

export const MOCK_ADMIN_SETTINGS: AdminSettingsData = {
  platformName: "CareNet Bangladesh", supportEmail: "support@carenet.com.bd",
  supportPhone: "+880 9678-XXXXXX", defaultLanguage: "Bengali", timezone: "Asia/Dhaka",
  platformFee: "5", withdrawalMin: "500", withdrawalMax: "50000", withdrawalFee: "0.5",
  maintenanceMode: false, caregiverVerification: true, agencyVerification: true,
  shopVerification: true, emailNotifications: true, smsNotifications: true,
  pushNotifications: true, maxLoginAttempts: "5", sessionTimeout: "30", mfaRequired: false,
};

// ─── Moderator Sanctions ───
export const MOCK_MODERATOR_SANCTIONS: ModeratorSanction[] = [
  { id: "SAN-001", userId: "u-044", userName: "Rafiq Islam", userRole: "caregiver", type: "warning", reason: "Inappropriate language in review response", issuedBy: "Mod: Tahira", issuedAt: "2026-03-10T09:00:00Z", status: "active" },
  { id: "SAN-002", userId: "u-078", userName: "Sadia Khatun", userRole: "guardian", type: "mute", reason: "Spam messages to multiple agencies", issuedBy: "Mod: Tahira", issuedAt: "2026-03-08T14:30:00Z", expiresAt: "2026-03-15T14:30:00Z", status: "active", notes: "7-day mute for repeated spam" },
  { id: "SAN-003", userId: "u-112", userName: "Jobayer Hossain", userRole: "caregiver", type: "suspension", reason: "Fake credential documents uploaded", issuedBy: "Mod: Admin", issuedAt: "2026-03-05T11:00:00Z", expiresAt: "2026-04-05T11:00:00Z", status: "active", notes: "30-day suspension pending investigation" },
  { id: "SAN-004", userId: "u-023", userName: "Nusrat Jahan", userRole: "guardian", type: "warning", reason: "Threatening message to caregiver", issuedBy: "Mod: Tahira", issuedAt: "2026-02-28T16:00:00Z", status: "expired" },
  { id: "SAN-005", userId: "u-091", userName: "Kamrul Hasan", userRole: "caregiver", type: "ban", reason: "Multiple fraudulent payment proofs — permanent ban", issuedBy: "Mod: Admin", issuedAt: "2026-02-20T10:00:00Z", status: "active" },
  { id: "SAN-006", userId: "u-056", userName: "Farhana Begum", userRole: "agency", type: "suspension", reason: "Unlicensed caregivers deployed", issuedBy: "Mod: Admin", issuedAt: "2026-02-15T09:00:00Z", expiresAt: "2026-03-15T09:00:00Z", status: "expired" },
  { id: "SAN-007", userId: "u-134", userName: "Abdul Karim", userRole: "caregiver", type: "mute", reason: "Posting misleading service descriptions", issuedBy: "Mod: Tahira", issuedAt: "2026-03-12T08:00:00Z", expiresAt: "2026-03-19T08:00:00Z", status: "active" },
  { id: "SAN-008", userId: "u-067", userName: "Rima Akter", userRole: "guardian", type: "warning", reason: "Abusive review content", issuedBy: "Mod: Tahira", issuedAt: "2026-03-14T13:00:00Z", status: "revoked", notes: "Revoked after appeal — misunderstanding" },
];

// ─── Moderator Escalations ───
export const MOCK_MODERATOR_ESCALATIONS: ModeratorEscalation[] = [
  { id: "ESC-001", sourceType: "report", sourceId: 1, title: "Credential fraud — forged nursing license", description: "User u-112 uploaded a forged nursing license. Verified against BNMC database — no match. Requires admin-level account action.", priority: "critical", status: "pending", escalatedBy: "Mod: Tahira", escalatedAt: "2026-03-14T10:00:00Z" },
  { id: "ESC-002", sourceType: "report", sourceId: 3, title: "Patient safety concern — missed medication", description: "Guardian reported caregiver missed critical medication dose. Patient was hospitalized. Requires urgent investigation and potential legal review.", priority: "critical", status: "in_review", escalatedBy: "Mod: Tahira", escalatedAt: "2026-03-13T15:00:00Z", assignedTo: "Admin: Farhan" },
  { id: "ESC-003", sourceType: "content", sourceId: 5, title: "Hate speech in community forum post", description: "User posted discriminatory content targeting specific ethnic group in community forum. Content removed, but user has history of similar behavior.", priority: "high", status: "pending", escalatedBy: "Mod: Kamal", escalatedAt: "2026-03-12T11:30:00Z" },
  { id: "ESC-004", sourceType: "review", sourceId: 2, title: "Coordinated fake reviews detected", description: "Pattern of 5-star reviews from newly created accounts for agency 'GreenCare BD'. Suspected review manipulation ring.", priority: "high", status: "in_review", escalatedBy: "Mod: Tahira", escalatedAt: "2026-03-11T09:00:00Z", assignedTo: "Admin: Farhan" },
  { id: "ESC-005", sourceType: "report", sourceId: 6, title: "Payment proof tampering", description: "User submitted digitally altered bKash screenshots. Amount and transaction ID appear manipulated. Financial fraud investigation needed.", priority: "high", status: "resolved", escalatedBy: "Mod: Kamal", escalatedAt: "2026-03-08T14:00:00Z", assignedTo: "Admin: Farhan", resolvedAt: "2026-03-10T16:00:00Z", resolution: "User banned permanently. Evidence forwarded to legal." },
  { id: "ESC-006", sourceType: "content", sourceId: 8, title: "Unsolicited contact info sharing", description: "Caregiver profile contains personal phone number and home address, bypassing platform communication. Potential safety risk.", priority: "medium", status: "resolved", escalatedBy: "Mod: Tahira", escalatedAt: "2026-03-07T10:00:00Z", assignedTo: "Mod: Kamal", resolvedAt: "2026-03-07T14:00:00Z", resolution: "Contact info removed. User warned." },
  { id: "ESC-007", sourceType: "report", sourceId: 9, title: "Agency operating without valid trade license", description: "Spot check revealed agency 'CarePlus BD' trade license expired 6 months ago. Currently has 12 active placements.", priority: "medium", status: "pending", escalatedBy: "Mod: Kamal", escalatedAt: "2026-03-15T08:00:00Z" },
];

// ─── Contract Disputes (detailed, with message threads) ───
export const MOCK_CONTRACT_DISPUTES: ContractDispute[] = [
  {
    id: "DSP-001",
    contractId: "CTR-2026-0001",
    filedBy: "Rashed Hossain",
    filedByRole: "guardian",
    againstParty: "GreenCare Agency",
    reason: "Service quality below agreed standards",
    description: "The caregiver assigned by GreenCare Agency has consistently arrived late (30-60 min) for the past 2 weeks. Additionally, the care log entries are incomplete — several medication administration records are missing. The contract specified 'senior-level care with medication management' but the service received falls short.",
    evidence: ["Late arrival screenshots (timestamped)", "Incomplete care logs export", "Original contract terms PDF"],
    status: "under_review",
    priority: "high",
    filedAt: "2026-03-10T09:30:00Z",
    messages: [
      { id: "dm-1", disputeId: "DSP-001", senderName: "Rashed Hossain", senderRole: "guardian", message: "I have documented evidence of 8 late arrivals in 14 days. The care quality for my father has deteriorated significantly since the assignment change on March 1st.", createdAt: "2026-03-10T09:30:00Z" },
      { id: "dm-2", disputeId: "DSP-001", senderName: "System", senderRole: "system", message: "Dispute DSP-001 opened. Both parties have been notified. A mediator will be assigned within 24 hours.", createdAt: "2026-03-10T09:31:00Z", isSystemMessage: true },
      { id: "dm-3", disputeId: "DSP-001", senderName: "GreenCare Agency", senderRole: "agency", message: "We acknowledge the late arrivals and sincerely apologize. Our caregiver Fatima had transportation issues. We have arranged a backup caregiver and will provide a 15% discount on the remaining contract period.", createdAt: "2026-03-10T14:15:00Z" },
      { id: "dm-4", disputeId: "DSP-001", senderName: "Mediator: Admin Farhan", senderRole: "admin", message: "I've reviewed both parties' evidence. The late arrivals are documented. I recommend: (1) GreenCare provides 20% discount for remaining period, (2) assigns a senior caregiver, (3) daily check-in reports for 2 weeks. Do both parties agree?", createdAt: "2026-03-11T10:00:00Z" },
    ],
  },
  {
    id: "DSP-002",
    contractId: "CTR-2026-0003",
    filedBy: "CareFirst Agency",
    filedByRole: "agency",
    againstParty: "Kamal Ahmed",
    reason: "Caregiver abandoned placement without notice",
    description: "Caregiver Kamal Ahmed stopped showing up for shifts on March 8th without any notice or communication. The patient (elderly, requires daily assistance) was left without care for a full day before we could arrange emergency coverage. This violates the contract's 7-day notice requirement.",
    evidence: ["Missed shift records", "Emergency coverage invoice", "Contract clause screenshot"],
    status: "mediation",
    priority: "high",
    filedAt: "2026-03-09T07:00:00Z",
    messages: [
      { id: "dm-5", disputeId: "DSP-002", senderName: "CareFirst Agency", senderRole: "agency", message: "Kamal Ahmed abandoned his placement without notice. We incurred ৳15,000 in emergency coverage costs. The patient was at risk.", createdAt: "2026-03-09T07:00:00Z" },
      { id: "dm-6", disputeId: "DSP-002", senderName: "Kamal Ahmed", senderRole: "caregiver", message: "I had a family emergency — my mother was hospitalized. I tried calling the agency number but nobody answered. I'm sorry for the disruption.", createdAt: "2026-03-09T15:00:00Z" },
      { id: "dm-7", disputeId: "DSP-002", senderName: "Mediator: Admin Farhan", senderRole: "admin", message: "Both parties have valid points. Kamal, the contract requires written notice. Agency, your emergency contact line should be 24/7. Proposing mediation session for March 12.", createdAt: "2026-03-10T09:00:00Z" },
    ],
  },
  {
    id: "DSP-003",
    contractId: "CTR-2026-0002",
    filedBy: "Nasreen Begum",
    filedByRole: "guardian",
    againstParty: "HomeCare Plus",
    reason: "Billing discrepancy — overcharged",
    description: "The agreed rate was 9,200 CP/day but I was billed at 10,000 CP/day for the last 7 days. That's an overcharge of 5,600 CarePoints (≈ ৳560).",
    evidence: ["Invoice screenshot", "Contract terms showing 9,200 CP/day"],
    status: "resolved",
    priority: "medium",
    filedAt: "2026-03-05T11:00:00Z",
    resolvedAt: "2026-03-07T16:00:00Z",
    resolution: "Billing error confirmed. HomeCare Plus refunded 5,600 CarePoints to Nasreen's wallet. System billing rate corrected.",
    messages: [
      { id: "dm-8", disputeId: "DSP-003", senderName: "Nasreen Begum", senderRole: "guardian", message: "I've been overcharged. The contract clearly states 9,200 CP/day but billing shows 10,000.", createdAt: "2026-03-05T11:00:00Z" },
      { id: "dm-9", disputeId: "DSP-003", senderName: "HomeCare Plus", senderRole: "agency", message: "This was a billing system error on our end. We sincerely apologize and will issue an immediate refund of 5,600 CarePoints.", createdAt: "2026-03-06T09:00:00Z" },
      { id: "dm-10", disputeId: "DSP-003", senderName: "System", senderRole: "system", message: "Refund of 5,600 CarePoints processed to Nasreen Begum's wallet. Dispute resolved.", createdAt: "2026-03-07T16:00:00Z", isSystemMessage: true },
    ],
  },
];