/**
 * Channel Partner System Constants
 * Configurable values for easy adjustment
 */

export const CP_CONFIG = {
  REFERRAL_CODE_PREFIX: 'REF-CP-',
  REFERRAL_CODE_LENGTH: 6,
  ACTIVATION_LINK_TTL_HOURS: 24,
  ACTIVATION_LINK_RESEND_WINDOW_HOURS: 72,
  DEFAULT_RATE_EXPIRY_DAYS: 90,
  RATE_EXPIRY_NOTIFICATION_WINDOW_DAYS: 7,
  RATE_EXPIRY_DASHBOARD_VISIBILITY_DAYS: 30,
  PLATFORM_COMMISSION_PERCENTAGE: 25, // Default, matches existing
} as const;

/** Channel Partner status values */
export const CP_STATUS = {
  PENDING_APPROVAL: 'pending_approval',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  DEACTIVATED: 'deactivated',
  REJECTED: 'rejected',
} as const;

/** Lead roles that can generate commissions */
export const CP_LEAD_ROLES = ['guardian', 'agency', 'caregiver', 'shop'] as const;
export type CpLeadRole = typeof CP_LEAD_ROLES[number];

/** Commission status values */
export const CP_COMMISSION_STATUS = {
  PENDING: 'pending',
  CREDITED: 'credited',
  PAID: 'paid',
  REVERSED: 'reversed',
} as const;

/** Attribution methods for leads */
export const CP_ATTRIBUTION_METHODS = {
  REFERRAL_CODE: 'referral_code',
  CP_CREATED: 'cp_created',
  ADMIN_ASSIGNMENT: 'admin_assignment',
} as const;

/** Audit action types for Channel Partner events */
export const CP_AUDIT_ACTIONS = {
  // Registration & Status (per spec section 4.10)
  CP_REGISTRATION: 'CP_REGISTRATION',
  CP_APPROVED: 'CP_APPROVED',
  CP_REJECTED: 'CP_REJECTED',
  CP_REAPPLICATION: 'CP_REAPPLICATION',
  CP_LOGIN: 'CP_LOGIN',
  CP_STATUS_CHANGED: 'CP_STATUS_CHANGED',

  // Leads (per spec)
  CP_LEAD_CREATED: 'CP_LEAD_CREATED',
  CP_LEAD_ATTRIBUTED: 'CP_LEAD_ATTRIBUTED',
  CP_LEAD_ACTIVATED: 'CP_LEAD_ACTIVATED',
  CP_LEAD_REASSIGNED: 'CP_LEAD_REASSIGNED',

  // Rates (per spec)
  CP_RATE_SET: 'CP_RATE_SET',
  CP_RATE_CHANGED: 'CP_RATE_CHANGED',
  CP_RATE_RENEWED: 'CP_RATE_RENEWED',
  CP_RATE_EXPIRING: 'CP_RATE_EXPIRING',

  // Commissions (per spec)
  CP_COMMISSION_CALCULATED: 'CP_COMMISSION_CALCULATED',
  CP_COMMISSION_CREDITED: 'CP_COMMISSION_CREDITED',
  CP_COMMISSION_REVERSED: 'CP_COMMISSION_REVERSED',
  CP_COMMISSION_SKIPPED_NO_RATE: 'CP_COMMISSION_SKIPPED_NO_RATE',
  CP_COMMISSION_SKIPPED_CP_INACTIVE: 'CP_COMMISSION_SKIPPED_CP_INACTIVE',

  // Payouts (per spec)
  CP_PAYOUT_REQUESTED: 'CP_PAYOUT_REQUESTED',
  CP_PAYOUT_PROCESSED: 'CP_PAYOUT_PROCESSED',
  CP_PAYOUT_CONFIRMED: 'CP_PAYOUT_CONFIRMED',

  // Profile (per spec)
  CP_PROFILE_VIEWED: 'CP_PROFILE_VIEWED',

  // Additional implementation-specific actions
  CP_SUSPENDED: 'CP_SUSPENDED',
  CP_DEACTIVATED: 'CP_DEACTIVATED',
  CP_REACTIVATED: 'CP_REACTIVATED',
  CP_LEAD_DEACTIVATED: 'CP_LEAD_DEACTIVATED',
  CP_RATE_EXPIRED: 'CP_RATE_EXPIRED',
  CP_COMMISSION_PAID: 'CP_COMMISSION_PAID',
  CP_ACTIVATION_LINK_SENT: 'CP_ACTIVATION_LINK_SENT',
  CP_ACTIVATION_LINK_RESENT: 'CP_ACTIVATION_LINK_RESENT',
} as const;

/** Notification events for Channel Partners */
export const CP_NOTIFICATION_EVENTS = {
  // To Channel Partner
  CP_APPROVED: 'cp_approved',
  CP_REJECTED: 'cp_rejected',
  CP_SUSPENDED: 'cp_suspended',
  CP_LEAD_JOINED: 'cp_lead_joined',
  CP_LEAD_ACTIVATED: 'cp_lead_activated',
  CP_COMMISSION_CREDITED: 'cp_commission_credited',
  CP_RATE_EXPIRING: 'cp_rate_expiring',
  CP_RATE_EXPIRED: 'cp_rate_expired',
  CP_DEACTIVATED: 'cp_deactivated',

  // To Admin/Mod
  CP_APPLICATION_PENDING: 'cp_application_pending',
  CP_RATE_EXPIRING_ADMIN: 'cp_rate_expiring_admin',
  CP_COMMISSION_REVERSED_ADMIN: 'cp_commission_reversed_admin',
} as const;

/** Type guard for lead roles */
export function isValidLeadRole(role: string): role is CpLeadRole {
  return CP_LEAD_ROLES.includes(role as CpLeadRole);
}
