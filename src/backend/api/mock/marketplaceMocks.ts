import type { Job } from "@/backend/models";

/** Marketplace job listings (public-facing) */
export const MOCK_MARKETPLACE_JOBS: Job[] = [
  {
    id: "1", title: "Full-Time Senior Caregiver", location: "Dhanmondi, Dhaka",
    description: "Looking for experienced caregiver for elderly patient with diabetes and mobility issues.",
    salary: "৳35,000 - ৳45,000/month", experience: "3+ years",
    skills: ["Diabetes Care", "Mobility Assistance", "Medication Management"],
    agency: { name: "Green Care Agency", rating: 4.8, verified: true }, posted: "2 days ago",
  },
  {
    id: "2", title: "Night Nurse – Post Surgery", location: "Gulshan, Dhaka",
    description: "Certified nurse needed for post-operative care during night shifts.",
    salary: "৳1,500/night", experience: "2+ years",
    skills: ["Post-Op Care", "Wound Dressing", "IV Management"],
    agency: { name: "HealthCare Pro BD", rating: 4.9, verified: true }, posted: "5 hours ago",
  },
  {
    id: "3", title: "Child Caregiver – Special Needs", location: "Uttara, Dhaka",
    description: "Experienced caregiver for a 6-year-old with cerebral palsy. Physiotherapy experience preferred.",
    salary: "৳25,000 - ৳30,000/month", experience: "2+ years",
    skills: ["Pediatric Care", "Special Needs", "Physiotherapy Basics"],
    agency: { name: "CareFirst BD", rating: 4.7, verified: true }, posted: "1 day ago",
  },
  {
    id: "4", title: "Live-In Elderly Companion", location: "Banani, Dhaka",
    description: "Companion care for 80-year-old gentleman. Light mobility assistance, medication reminders, companionship.",
    salary: "৳20,000 - ৳28,000/month", experience: "1+ year",
    skills: ["Companionship", "Medication Reminders", "Light Mobility"],
    agency: { name: "Harmony Home Care", rating: 4.6, verified: true },
    posted: "3 days ago",
  },
];
