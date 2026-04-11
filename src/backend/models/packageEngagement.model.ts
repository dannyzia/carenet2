/** Client (guardian/patient user) ↔ agency negotiation on a published package */
export type PackageClientEngagementStatus =
  | "draft"
  | "interested"
  | "negotiating"
  | "accepted"
  | "declined"
  | "withdrawn"
  | "expired";

/** Caregiver ↔ agency negotiation on a published package */
export type PackageCaregiverEngagementStatus =
  | "draft"
  | "applied"
  | "negotiating"
  | "accepted"
  | "declined"
  | "withdrawn"
  | "expired";

export type PackageEngagementEventKind =
  | "created"
  | "message"
  | "counter_offer"
  | "accept"
  | "withdraw"
  | "decline";

export interface PackageEngagementEventPayload {
  message?: string;
  proposed_pricing?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface PackageClientEngagement {
  id: string;
  package_contract_id: string;
  client_user_id: string;
  agency_user_id: string;
  status: PackageClientEngagementStatus;
  created_at: string;
  updated_at: string;
}

export interface PackageClientEngagementEvent {
  id: string;
  engagement_id: string;
  author_user_id: string;
  author_role: "client" | "agency";
  event_kind: PackageEngagementEventKind;
  payload: PackageEngagementEventPayload;
  created_at: string;
}

export interface PackageCaregiverEngagement {
  id: string;
  package_contract_id: string;
  caregiver_user_id: string;
  agency_user_id: string;
  status: PackageCaregiverEngagementStatus;
  created_at: string;
  updated_at: string;
}

export interface PackageCaregiverEngagementEvent {
  id: string;
  engagement_id: string;
  author_user_id: string;
  author_role: "caregiver" | "agency";
  event_kind: PackageEngagementEventKind;
  payload: PackageEngagementEventPayload;
  created_at: string;
}
