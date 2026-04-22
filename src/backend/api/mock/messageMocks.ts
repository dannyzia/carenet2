import type { ChatMessage, ConversationItem } from "@/backend/models";

// ═══════════════════════════════════════════════════════════════
// Unified conversation lists per role (all use ConversationItem)
// ═══════════════════════════════════════════════════════════════

export const MOCK_AGENCY_CONVERSATIONS: ConversationItem[] = [
  { id: "c1", name: "Rashed Hossain", role: "guardian", avatar: "RH", lastMessage: "Thank you for the updated care plan.", lastTime: "5:30 PM", unread: 2, online: true, pinned: true },
  { id: "c2", name: "Fatima Khatun", role: "guardian", avatar: "FK", lastMessage: "Can we discuss Arif's therapy schedule?", lastTime: "4:15 PM", unread: 1, online: true, pinned: false },
  { id: "c3", name: "Karim Uddin", role: "caregiver", avatar: "KU", lastMessage: "Shift handover notes submitted.", lastTime: "8:30 AM", unread: 0, online: false, pinned: true },
  { id: "c4", name: "CareNet Support", role: "admin", avatar: "CN", lastMessage: "Your verification renewal is due in 30 days.", lastTime: "Mar 14", unread: 0, online: false, pinned: false },
  { id: "c5", name: "Operations Team", role: "internal", avatar: "OT", lastMessage: "Staff meeting scheduled for Friday.", lastTime: "Mar 14", unread: 0, online: false, pinned: false },
];

export const MOCK_CAREGIVER_CONVERSATIONS_UNIFIED: ConversationItem[] = [
  { id: "cg1", name: "Mr. Rahim Ahmed", role: "patient", avatar: "RA", lastMessage: "What time will you arrive tomorrow?", lastTime: "2m ago", unread: 2, online: true, participantId: "patient1", jobId: "job1" },
  { id: "cg2", name: "Mrs. Fatema Begum", role: "guardian", avatar: "FB", lastMessage: "Thank you for the update \u{1F64F}", lastTime: "1h ago", unread: 0, online: false, participantId: "guardian1", jobId: "job1" },
  { id: "cg3", name: "CareNet Support", role: "admin", avatar: "CN", lastMessage: "Your verification is complete!", lastTime: "3h ago", unread: 1, online: true, participantId: "agency2" },
  { id: "cg4", name: "Rahman Family", role: "guardian", avatar: "RF", lastMessage: "Can you cover next Sunday?", lastTime: "Yesterday", unread: 0, online: false, participantId: "guardian3", jobId: "job2" },
  { id: "cg5", name: "Dr. Nasrin Akter", role: "doctor", avatar: "NA", lastMessage: "Please send the care log.", lastTime: "2d ago", unread: 0, online: false, participantId: "doctor1", jobId: "job3" },
];

export const MOCK_GUARDIAN_CONVERSATIONS_UNIFIED: ConversationItem[] = [
  { id: "gd1", name: "Karim Uddin", role: "caregiver", avatar: "KU", lastMessage: "Mr. Rahman took his medication \u2713", lastTime: "5m ago", unread: 1, online: true },
  { id: "gd2", name: "Fatema Akter", role: "caregiver", avatar: "FA", lastMessage: "Good evening! Mrs. Begum is sleeping.", lastTime: "30m ago", unread: 0, online: true },
  { id: "gd3", name: "Dr. Arif Hossain", role: "doctor", avatar: "AH", lastMessage: "Please bring the blood reports tomorrow.", lastTime: "2h ago", unread: 0, online: false },
  { id: "gd4", name: "CareNet Support", role: "admin", avatar: "CN", lastMessage: "Your payment was processed successfully!", lastTime: "Yesterday", unread: 0, online: true },
  { id: "gd5", name: "HealthCare Pro BD", role: "agency", avatar: "HP", lastMessage: "We've reviewed your care requirement and will send a proposal shortly.", lastTime: "Mar 15", unread: 0, online: false },
];

export const MOCK_PATIENT_CONVERSATIONS: ConversationItem[] = [
  { id: "pt1", name: "Karim Uddin", role: "caregiver", avatar: "KU", lastMessage: "Good evening! I'll be arriving at 8 PM.", lastTime: "6:30 PM", unread: 1, online: true },
  { id: "pt2", name: "Rashed Hossain", role: "guardian", avatar: "RH", lastMessage: "Baba, how are you feeling today?", lastTime: "2:15 PM", unread: 0, online: true },
  { id: "pt3", name: "Dr. Kamal Hossain", role: "doctor", avatar: "DK", lastMessage: "Your blood test results look stable.", lastTime: "Yesterday", unread: 0, online: false },
  { id: "pt4", name: "HealthCare Pro BD", role: "agency", avatar: "HP", lastMessage: "Your care plan has been updated.", lastTime: "Mar 14", unread: 0, online: false },
];

export const MOCK_MODERATOR_CONVERSATIONS: ConversationItem[] = [
  { id: "mod1", name: "Flagged User Support", role: "admin", avatar: "FS", lastMessage: "Review case #1042 has been escalated.", lastTime: "10m ago", unread: 3, online: true },
  { id: "mod2", name: "CareNet Admin", role: "admin", avatar: "CA", lastMessage: "Policy update: new content guidelines effective March 20.", lastTime: "1h ago", unread: 0, online: true },
];

export const MOCK_ADMIN_CONVERSATIONS: ConversationItem[] = [
  { id: "ad1", name: "System Alerts", role: "admin", avatar: "SA", lastMessage: "Server load nominal. No incidents.", lastTime: "15m ago", unread: 0, online: true },
  { id: "ad2", name: "Moderator Team", role: "moderator", avatar: "MT", lastMessage: "3 pending reviews need attention.", lastTime: "45m ago", unread: 2, online: true },
];

// ═══════════════════════════════════════════════════════════════
// Per-conversation message histories (unified ChatMessage type)
// ═══════════════════════════════════════════════════════════════

export const MOCK_MESSAGES_BY_CONVO: Record<string, ChatMessage[]> = {
  // ─── Agency conversations ───
  c1: [
    { id: "m1", sender: "other", senderName: "Rashed Hossain", text: "Assalamu Alaikum. I wanted to discuss my father's recent care log entries.", time: "5:10 PM", read: true },
    { id: "m2", sender: "self", senderName: "Agency Manager", text: "Walaikum Assalam, Mr. Hossain. Of course! Is there anything specific?", time: "5:15 PM", read: true },
    { id: "m3", sender: "other", senderName: "Rashed Hossain", text: "I noticed the incident report about the near-fall. Has the care plan been updated?", time: "5:20 PM", read: true },
    { id: "m4", sender: "self", senderName: "Agency Manager", text: "Absolutely. We've already updated the night care protocol.", time: "5:25 PM", read: true },
    { id: "m5", sender: "other", senderName: "Rashed Hossain", text: "Thank you for the updated care plan.", time: "5:30 PM", read: false },
  ],
  c2: [
    { id: "m1", sender: "other", senderName: "Fatima Khatun", text: "Hello, I'd like to discuss Arif's therapy schedule.", time: "4:00 PM", read: true },
    { id: "m2", sender: "self", text: "Sure! The current schedule is Mon/Wed/Fri at 10 AM.", time: "4:05 PM", read: true },
    { id: "m3", sender: "other", senderName: "Fatima Khatun", text: "Can we discuss Arif's therapy schedule?", time: "4:15 PM", read: false },
  ],
  c3: [
    { id: "m1", sender: "other", senderName: "Karim Uddin", text: "Shift handover notes submitted. Everything went smoothly today.", time: "8:30 AM", read: true },
  ],

  // ─── Caregiver conversations ───
  cg1: [
    { id: "m1", sender: "other", senderName: "Mr. Rahim Ahmed", text: "Good morning! How are you feeling today?", time: "9:02 AM", read: true },
    { id: "m2", sender: "self", text: "Good morning! I had a good night. Vitals are normal and I ate breakfast well \u{1F60A}", time: "9:15 AM", read: true },
    { id: "m3", sender: "other", senderName: "Mr. Rahim Ahmed", text: "Did you take your morning medication?", time: "9:18 AM", read: true },
    { id: "m4", sender: "self", text: "Yes, all medications taken on time. Also did the morning physiotherapy exercises.", time: "9:25 AM", read: true },
    { id: "m5", sender: "other", senderName: "Mr. Rahim Ahmed", text: "What time will you arrive tomorrow?", time: "10:30 AM", read: false },
  ],
  cg2: [
    { id: "m1", sender: "other", senderName: "Mrs. Fatema Begum", text: "How is my mother doing today?", time: "3:00 PM", read: true },
    { id: "m2", sender: "self", text: "She's doing well! Had lunch and is resting now.", time: "3:10 PM", read: true },
    { id: "m3", sender: "other", senderName: "Mrs. Fatema Begum", text: "Thank you for the update \u{1F64F}", time: "3:15 PM", read: true },
  ],
  cg3: [
    { id: "m1", sender: "other", senderName: "CareNet Support", text: "Your verification is complete! You can now accept assignments.", time: "11:00 AM", read: false },
  ],

  // ─── Guardian conversations ───
  gd1: [
    { id: "m1", sender: "other", senderName: "Karim Uddin", text: "Good morning! Mr. Rahman woke up at 7 AM and had breakfast well.", time: "7:32 AM", read: true },
    { id: "m2", sender: "self", text: "Thank you Karim! Did he take his morning medication?", time: "7:35 AM", read: true },
    { id: "m3", sender: "other", senderName: "Karim Uddin", text: "Yes, all 3 tablets taken at 8:00 AM as prescribed. Vitals: BP 130/85, pulse 72.", time: "8:05 AM", read: true },
    { id: "m4", sender: "self", text: "Great! Please make sure he does his physiotherapy exercises today.", time: "8:10 AM", read: true },
    { id: "m5", sender: "other", senderName: "Karim Uddin", text: "Mr. Rahman took his medication \u2713", time: "12:30 PM", read: false },
  ],
  gd2: [
    { id: "m1", sender: "other", senderName: "Fatema Akter", text: "Good evening! Mrs. Begum had dinner and is getting ready for bed.", time: "8:00 PM", read: true },
    { id: "m2", sender: "self", text: "Thank you Fatema. Please make sure she takes her night medication.", time: "8:05 PM", read: true },
    { id: "m3", sender: "other", senderName: "Fatema Akter", text: "Good evening! Mrs. Begum is sleeping.", time: "9:30 PM", read: true },
  ],
  gd3: [
    { id: "m1", sender: "other", senderName: "Dr. Arif Hossain", text: "The latest blood work shows improvement. Please continue current medication.", time: "10:00 AM", read: true },
    { id: "m2", sender: "self", text: "That's great news! Should we schedule a follow-up?", time: "10:15 AM", read: true },
    { id: "m3", sender: "other", senderName: "Dr. Arif Hossain", text: "Please bring the blood reports tomorrow.", time: "10:20 AM", read: true },
  ],
  gd5: [
    { id: "m1", sender: "other", senderName: "HealthCare Pro BD", text: "We've reviewed your care requirement and will send a proposal shortly.", time: "Mar 15, 2:30 PM", read: true },
  ],

  // ─── Patient conversations ───
  pt1: [
    { id: "m1", sender: "other", senderName: "Karim Uddin", text: "Good evening! I'll be arriving at 8 PM as scheduled.", time: "6:00 PM", read: true },
    { id: "m2", sender: "self", text: "Okay, I'll be ready. Please bring the new blood pressure monitor.", time: "6:15 PM", read: true },
    { id: "m3", sender: "other", senderName: "Karim Uddin", text: "Good evening! I'll be arriving at 8 PM.", time: "6:30 PM", read: false },
  ],
  pt2: [
    { id: "m1", sender: "other", senderName: "Rashed Hossain", text: "Baba, how are you feeling today?", time: "2:00 PM", read: true },
    { id: "m2", sender: "self", text: "I'm feeling much better today, alhamdulillah.", time: "2:10 PM", read: true },
    { id: "m3", sender: "other", senderName: "Rashed Hossain", text: "That's wonderful! I'll visit you this evening.", time: "2:15 PM", read: true },
  ],
  pt3: [
    { id: "m1", sender: "other", senderName: "Dr. Kamal Hossain", text: "Your blood test results look stable. Continue the current dosage.", time: "Yesterday", read: true },
  ],

  // ─── Moderator conversations ───
  mod1: [
    { id: "m1", sender: "other", senderName: "System", text: "Review case #1042 has been escalated to you.", time: "10m ago", read: false },
  ],

  // ─── Admin conversations ───
  ad2: [
    { id: "m1", sender: "other", senderName: "Moderator Team", text: "3 pending reviews need attention.", time: "45m ago", read: false },
  ],
};

// Legacy export kept for AgencyMessagesPage backward compat (Phase 3 will remove)
export const MOCK_AGENCY_MESSAGES = MOCK_MESSAGES_BY_CONVO["c1"]!.map((m) => ({
  id: m.id,
  sender: m.sender === "self" ? ("me" as const) : ("other" as const),
  senderName: m.senderName || "",
  text: m.text,
  time: m.time,
  read: m.read,
}));
