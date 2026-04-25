/**
 * Central role-to-URL-prefix mapping.
 * Single source of truth for mapping any Role to its route prefix and canonical dashboard path.
 */

import type { Role } from "@/frontend/auth/types";

/**
 * Complete mapping from every Role to its URL prefix.
 * Uses `as const` so TypeScript enforces completeness — if a new role is added to the union,
 * this object must be updated or the build fails.
 */
export const ROLE_ROUTE_PREFIX = {
  caregiver: "/caregiver",
  guardian: "/guardian",
  patient: "/patient",
  agency: "/agency",
  admin: "/admin",
  moderator: "/moderator",
  shop: "/shop",
  channel_partner: "/cp",
} as const satisfies Record<Role, string>;

/**
 * Returns the full dashboard URL for a role.
 * Example: roleDashboardPath("channel_partner") returns "/cp/dashboard"
 */
export function roleDashboardPath(role: Role): string {
  return `${ROLE_ROUTE_PREFIX[role]}/dashboard`;
}

/**
 * Returns the messages path for a role.
 * Example: roleMessagesPath("channel_partner") returns "/cp/messages"
 */
export function roleMessagesPath(role: Role): string {
  return `${ROLE_ROUTE_PREFIX[role]}/messages`;
}

/**
 * Returns the marketplace-hub path for care-seeker roles (guardian, patient, caregiver).
 * For roles without a marketplace hub, returns the dashboard path.
 */
export function roleMarketplaceHubPath(role: Role): string {
  const careSeekerRoles: Role[] = ["guardian", "patient", "caregiver"];
  if (careSeekerRoles.includes(role)) {
    return `${ROLE_ROUTE_PREFIX[role]}/marketplace-hub`;
  }
  return roleDashboardPath(role);
}

/**
 * Generic path builder.
 * Returns `${ROLE_ROUTE_PREFIX[role]}/${suffix}` (suffix should NOT start with `/`)
 * This covers any future path construction need.
 */
export function rolePath(role: Role, suffix: string): string {
  return `${ROLE_ROUTE_PREFIX[role]}/${suffix}`;
}
