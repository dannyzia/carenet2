/**
 * Backup Caregiver & Shift Reassignment Mock Data (Phase 6)
 */
import type { BackupAssignment, ShiftReassignment, StandbySlot } from "@/backend/models";

export const MOCK_BACKUP_ASSIGNMENTS: BackupAssignment[] = [
  {
    id: "ba-1", placementId: "pl-1", shiftId: "sp-1", primaryCaregiverId: "cg-1", primaryCaregiverName: "Fatema Akter",
    backupCaregivers: [
      { caregiverId: "cg-2", caregiverName: "Karim Uddin", priority: 1, available: true, distance: "2.3 km", rating: 4.8 },
      { caregiverId: "cg-4", caregiverName: "Nazmul Hasan", priority: 2, available: true, distance: "5.1 km", rating: 4.7 },
      { caregiverId: "cg-5", caregiverName: "Sumaiya Akter", priority: 3, available: false, distance: "3.8 km", rating: 4.6 },
    ],
    status: "active",
  },
  {
    id: "ba-2", placementId: "pl-2", primaryCaregiverId: "cg-2", primaryCaregiverName: "Karim Uddin",
    backupCaregivers: [
      { caregiverId: "cg-1", caregiverName: "Fatema Akter", priority: 1, available: true, distance: "2.3 km", rating: 4.9 },
      { caregiverId: "cg-3", caregiverName: "Dr. Rahat Khan", priority: 2, available: true, distance: "4.0 km", rating: 4.9 },
    ],
    status: "active",
  },
];

export const MOCK_SHIFT_REASSIGNMENTS: ShiftReassignment[] = [
  { id: "sr-1", shiftId: "sh-10", fromCaregiverId: "cg-3", fromCaregiverName: "Rashida Parvin", toCaregiverId: "cg-1", toCaregiverName: "Fatema Akter", reason: "Illness", reassignedBy: "Agency Admin", reassignedAt: "2026-03-16T06:00:00Z", billingAdjustment: "+৳200 emergency premium", status: "completed" },
  { id: "sr-2", shiftId: "sh-11", fromCaregiverId: "cg-1", fromCaregiverName: "Fatema Akter", toCaregiverId: "cg-2", toCaregiverName: "Karim Uddin", reason: "Family emergency", reassignedBy: "Agency Admin", reassignedAt: "2026-03-17T14:30:00Z", status: "accepted" },
  { id: "sr-3", shiftId: "sh-12", fromCaregiverId: "cg-4", fromCaregiverName: "Nazmul Hasan", toCaregiverId: "cg-5", toCaregiverName: "Sumaiya Akter", reason: "Schedule conflict", reassignedBy: "System", reassignedAt: "2026-03-17T18:00:00Z", status: "pending" },
];

export const MOCK_STANDBY_POOL: StandbySlot[] = [
  { caregiverId: "cg-10", name: "Tahmina Khatun", specialty: "Elderly Care", available: true, distance: "1.5 km", rating: 4.5, lastShift: "2026-03-15" },
  { caregiverId: "cg-11", name: "Mizanur Rahman", specialty: "Post-Op Care", available: true, distance: "3.2 km", rating: 4.8, lastShift: "2026-03-16" },
  { caregiverId: "cg-12", name: "Sharmin Akter", specialty: "Pediatric Care", available: false, distance: "4.7 km", rating: 4.3 },
  { caregiverId: "cg-13", name: "Rafiq Ahmed", specialty: "Physiotherapy", available: true, distance: "2.0 km", rating: 4.6, lastShift: "2026-03-14" },
];
