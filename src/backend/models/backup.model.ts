/**
 * Backup / Standby Caregiver & Shift Reassignment Models
 */

export interface BackupAssignment {
  id: string;
  placementId: string;
  /** When set, agency can trigger reassignment for this shift from the backup UI */
  shiftId?: string;
  primaryCaregiverId: string;
  primaryCaregiverName: string;
  backupCaregivers: Array<{
    caregiverId: string;
    caregiverName: string;
    priority: number;
    available: boolean;
    distance?: string;
    rating: number;
  }>;
  status: "active" | "inactive";
}

export interface ShiftReassignment {
  id: string;
  shiftId: string;
  fromCaregiverId: string;
  fromCaregiverName: string;
  toCaregiverId: string;
  toCaregiverName: string;
  reason: string;
  reassignedBy: string;
  reassignedAt: string;
  billingAdjustment?: string;
  status: "pending" | "accepted" | "rejected" | "completed";
}

export interface StandbySlot {
  caregiverId: string;
  name: string;
  specialty: string;
  available: boolean;
  distance?: string;
  rating: number;
  lastShift?: string;
}
