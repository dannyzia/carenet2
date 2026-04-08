import type {
  VitalsReading, MedicationReminder, ChatMessage,
  HealthReportDataPoint, ScheduleEvent, UpcomingEvent,
  PatientDashboardVital, PatientDashboardMedication, PatientAppointment,
  MedicalRecord, PatientCondition, CareHistoryEntry,
  PatientProfile, EmergencyData, PrivacyData,
} from "@/backend/models";

/** Patient vitals time-series for charts */
export const MOCK_VITALS_DATA: VitalsReading[] = [
  { time: "08:00 AM", bp: 120, heartRate: 72, sugar: 95 },
  { time: "12:00 PM", bp: 125, heartRate: 78, sugar: 110 },
  { time: "04:00 PM", bp: 118, heartRate: 75, sugar: 105 },
  { time: "08:00 PM", bp: 122, heartRate: 74, sugar: 98 },
  { time: "11:00 PM", bp: 119, heartRate: 70, sugar: 92 },
];

/** Patient medication reminders */
export const MOCK_MEDICATION_REMINDERS: MedicationReminder[] = [
  { id: 1, name: "Metformin", dosage: "500mg", timing: "09:00 AM", instructed: "After meal", taken: true, refill: "5 days left" },
  { id: 2, name: "Amlodipine", dosage: "5mg", timing: "10:00 AM", instructed: "With water", taken: true, refill: "12 days left" },
  { id: 3, name: "Calcium Supplement", dosage: "600mg", timing: "01:00 PM", instructed: "After lunch", taken: false, refill: "20 days left" },
  { id: 4, name: "Atorvastatin", dosage: "10mg", timing: "09:00 PM", instructed: "Before sleep", taken: false, refill: "8 days left" },
];

/** Patient messages with caregiver */
export const MOCK_PATIENT_MESSAGES: ChatMessage[] = [
  { id: "m1", sender: "other", senderName: "Karim Uddin", text: "Assalamu Alaikum, Mr. Rahman. This is Karim.", time: "6:25 PM", read: true },
  { id: "m2", sender: "other", senderName: "Karim Uddin", text: "I'll be arriving at 8 PM sharp tonight for your care shift.", time: "6:26 PM", read: true },
  { id: "m3", sender: "self", text: "Wa Alaikum Assalam Karim. Thank you for letting me know.", time: "6:30 PM", read: true },
  { id: "m4", sender: "self", text: "Please bring the blood pressure monitor. I think the battery needs replacement.", time: "6:31 PM", read: true },
  { id: "m5", sender: "other", senderName: "Karim Uddin", text: "Of course! I'll bring a fresh set of batteries.", time: "6:35 PM", read: true },
];

// ─── Patient Health Report Chart Data ───
export const MOCK_HEALTH_REPORT_DATA: HealthReportDataPoint[] = [
  { day: "Mar 01", bp: 120, sugar: 5.6 }, { day: "Mar 05", bp: 125, sugar: 5.8 },
  { day: "Mar 10", bp: 118, sugar: 5.4 }, { day: "Mar 15", bp: 122, sugar: 5.7 },
];

// ─── Patient Schedule Events ───
export const MOCK_TODAY_EVENTS: ScheduleEvent[] = [
  { id: "e1", title: "Morning Medication", time: "8:00 AM", duration: "15 min", caregiver: "Karim Uddin", type: "medication", notes: "Amlodipine 5mg + Metformin 500mg" },
  { id: "e2", title: "Blood Pressure Check", time: "9:00 AM", duration: "10 min", caregiver: "Karim Uddin", type: "vitals" },
  { id: "e3", title: "Light Exercise", time: "10:00 AM", duration: "30 min", caregiver: "Karim Uddin", type: "therapy", notes: "Gentle walking + stretching" },
  { id: "e4", title: "Lunch & Medication", time: "12:30 PM", duration: "30 min", caregiver: "Karim Uddin", type: "meal", notes: "Diabetic-friendly lunch + Metformin" },
  { id: "e5", title: "Doctor Visit", time: "3:00 PM", duration: "1 hour", caregiver: "Karim Uddin", type: "appointment", location: "Lab Aid Hospital, Dhanmondi", notes: "Quarterly diabetes review" },
  { id: "e6", title: "Evening Medication", time: "7:00 PM", duration: "15 min", caregiver: "Karim Uddin (Night)", type: "medication", notes: "Metformin 500mg" },
];
export const MOCK_UPCOMING_EVENTS: UpcomingEvent[] = [
  { date: "Mar 17", title: "Physiotherapy Session", time: "10:00 AM", type: "therapy" },
  { date: "Mar 18", title: "Blood Test \u2014 Fasting", time: "7:30 AM", type: "appointment" },
  { date: "Mar 20", title: "Dr. Rashida Follow-up", time: "2:00 PM", type: "appointment" },
];

// ─── Patient Dashboard Data ───
export const MOCK_PATIENT_DASHBOARD_VITALS: PatientDashboardVital[] = [
  { vitalKey: "bloodPressure", label: "Blood Pressure", value: "130/85", unit: "mmHg", color: "#DB869A", status: "Slightly High", trend: "\u25B2" },
  { vitalKey: "bloodGlucose", label: "Blood Glucose", value: "142", unit: "mg/dL", color: "#E8A838", status: "Borderline", trend: "\u2192" },
  { vitalKey: "pulseRate", label: "Pulse Rate", value: "72", unit: "bpm", color: "#5FB865", status: "Normal", trend: "\u2192" },
];
export const MOCK_PATIENT_DASHBOARD_MEDICATIONS: PatientDashboardMedication[] = [
  { name: "Metformin 500mg", time: "8:00 AM", taken: true },
  { name: "Amlodipine 5mg", time: "8:00 AM", taken: true },
  { name: "Aspirin 75mg", time: "2:00 PM", taken: false },
  { name: "Metformin 500mg", time: "9:00 PM", taken: false },
];
export const MOCK_PATIENT_APPOINTMENTS: PatientAppointment[] = [
  { doctor: "Dr. Karim", type: "Follow-up", date: "Mar 20", time: "10:30 AM", location: "Dhaka Medical" },
  { doctor: "Dr. Nasreen", type: "Lab Test", date: "Mar 25", time: "9:00 AM", location: "Popular Diagnostics" },
];

// ─── Patient Medical Records ───
export const MOCK_MEDICAL_RECORDS: MedicalRecord[] = [
  { id: "r1", type: "Lab Report", title: "Complete Blood Count (CBC)", date: "Mar 10, 2026", doctor: "Dr. Karim Ahmed", facility: "Popular Diagnostics", status: "Normal" },
  { id: "r2", type: "Prescription", title: "Monthly Medication Review", date: "Mar 5, 2026", doctor: "Dr. Nasreen Sultana", facility: "Dhaka Medical College", status: "Active" },
  { id: "r3", type: "Imaging", title: "Chest X-Ray", date: "Feb 28, 2026", doctor: "Dr. Rafiq Hasan", facility: "Ibn Sina Hospital", status: "Clear" },
  { id: "r4", type: "Lab Report", title: "HbA1c Diabetes Test", date: "Feb 20, 2026", doctor: "Dr. Karim Ahmed", facility: "Popular Diagnostics", status: "Borderline" },
];
export const MOCK_PATIENT_CONDITIONS: PatientCondition[] = [
  { name: "Type 2 Diabetes", since: "2020", severity: "Moderate", color: "#E8A838" },
  { name: "Hypertension", since: "2019", severity: "Controlled", color: "#DB869A" },
  { name: "Osteoarthritis", since: "2022", severity: "Mild", color: "#5FB865" },
];
export const MOCK_PATIENT_ALLERGIES: string[] = [
  "Penicillin", "Sulfa drugs", "Dust mites",
];

// ─── Patient Care History ───
export const MOCK_CARE_HISTORY: CareHistoryEntry[] = [
  { id: "ch1", date: "Mar 15, 2026", caregiver: "Karim Uddin", type: "Daily Care", duration: "8 hours", rating: 4.8, tasks: ["Medication administered", "Meals prepared", "Light exercise assisted", "Vitals recorded"], notes: "Patient was in good spirits today. BP slightly elevated." },
  { id: "ch2", date: "Mar 14, 2026", caregiver: "Fatema Akter", type: "Night Shift", duration: "10 hours", rating: 4.9, tasks: ["Overnight monitoring", "Medication at 11 PM", "Assisted to bathroom", "Morning vitals"], notes: "Calm night. Patient slept well." },
  { id: "ch3", date: "Mar 13, 2026", caregiver: "Karim Uddin", type: "Daily Care", duration: "8 hours", rating: 4.7, tasks: ["Physiotherapy exercises", "Wound dressing change", "Meals and hydration"], notes: "Wound healing well. Mobility improving." },
  { id: "ch4", date: "Mar 12, 2026", caregiver: "Nasrin Begum", type: "Respite Care", duration: "6 hours", rating: 5.0, tasks: ["Companion care", "Garden walk", "Reading session", "Lunch prepared"], notes: "Very pleasant session. Patient enjoyed outdoor time." },
];

// ─── Patient Profile ───
export const MOCK_PATIENT_PROFILE: PatientProfile = {
  name: "Abdul Rahman", age: 68, gender: "Male", phone: "+880 1712-345678",
  email: "abdulrahman@email.com", address: "Dhanmondi, Dhaka", bloodType: "B+",
  emergencyContact: { name: "Fatima Rahman", relation: "Daughter", phone: "+880 1812-456789" },
  guardian: { name: "Fatima Rahman", role: "Guardian", since: "Jan 2025" },
};

export const MOCK_EMERGENCY_DATA: EmergencyData = {
  contacts: [
    { name: "Primary Caregiver", role: "Dr. Rahat Khan", phone: "017XX-XXXXXX", color: "bg-blue-50 text-blue-600" },
    { name: "Family Member (Son)", role: "Zubayer Ahmed", phone: "018XX-XXXXXX", color: "bg-green-50 text-green-600" },
    { name: "National Hotline", role: "Police/Health", phone: "999", color: "bg-red-50 text-red-600" },
    { name: "Ambulance", role: "CareNet Fast", phone: "09612XXXXX", color: "bg-orange-50 text-orange-600" },
  ],
  medical: { bloodGroup: "B+ (Positive)", allergies: "Penicillin, Peanuts", chronic: "Type 2 Diabetes, Hypertension" },
  location: "House 12, Road 5, Sector 4, Uttara, Dhaka",
};

export const MOCK_PRIVACY_DATA: PrivacyData = {
  authorized: [
    { name: "Dr. Rahat Khan", role: "Caregiver", level: "Full Clinical", expires: "Active Shift" },
    { name: "Dhaka Care Agency", role: "Managed Agency", level: "Basic Health", expires: "Permanent" },
    { name: "Zubayer Ahmed", role: "Guardian", level: "Admin Access", expires: "Permanent" },
  ],
  accessLogs: [
    { user: "Dr. Rahat K.", action: "Viewed Vitals", time: "12m ago" },
    { user: "Guardian Z.", action: "Downloaded Summary", time: "2h ago" },
    { user: "Agency App", action: "Updated Care Plan", time: "1d ago" },
  ],
};