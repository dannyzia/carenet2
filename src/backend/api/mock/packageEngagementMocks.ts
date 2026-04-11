import type {
  PackageCaregiverEngagement,
  PackageCaregiverEngagementEvent,
  PackageClientEngagement,
  PackageClientEngagementEvent,
} from "@/backend/models/packageEngagement.model";

export const MOCK_PACKAGE_CLIENT_ENGAGEMENTS: PackageClientEngagement[] = [];
export const MOCK_PACKAGE_CLIENT_ENGAGEMENT_EVENTS: PackageClientEngagementEvent[] = [];
export const MOCK_PACKAGE_CAREGIVER_ENGAGEMENTS: PackageCaregiverEngagement[] = [];
export const MOCK_PACKAGE_CAREGIVER_ENGAGEMENT_EVENTS: PackageCaregiverEngagementEvent[] = [];

export function resetPackageEngagementMocks() {
  MOCK_PACKAGE_CLIENT_ENGAGEMENTS.length = 0;
  MOCK_PACKAGE_CLIENT_ENGAGEMENT_EVENTS.length = 0;
  MOCK_PACKAGE_CAREGIVER_ENGAGEMENTS.length = 0;
  MOCK_PACKAGE_CAREGIVER_ENGAGEMENT_EVENTS.length = 0;
}
