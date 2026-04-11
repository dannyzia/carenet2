export * from "./supabase";
export * from "./_sb";
export * from "./realtime";
export * from "./contractService";
export * from "./walletService";

// Domain services (async, framework-agnostic)
export { caregiverService } from "./caregiver.service";
export { guardianService } from "./guardian.service";
export { agencyService } from "./agency.service";
export { patientService } from "./patient.service";
export { notificationService } from "./notification.service";
export { shopService } from "./shop.service";
export { searchService } from "./search.service";
export type { GlobalSearchResults } from "./search.service";
export { marketplaceService } from "./marketplace.service";
export { packageEngagementService } from "./packageEngagement.service";
export { caregivingJobService } from "./caregivingJob.service";
export type {
  AgencyConvergenceContractRow,
  CaregivingAssignmentRow,
  CaregivingJobListRow,
} from "./caregivingJob.service";
export { communityService } from "./community.service";
export { messageService } from "./message.service";
export { adminService } from "./admin.service";
export { moderatorService } from "./moderator.service";
export { supportService } from "./support.service";
export { billingService } from "./billing.service";
export { uploadService } from "./upload.service";
export { scheduleService } from "./schedule.service";
export { backupService } from "./backup.service";
export { section15Service } from "./section15.service";