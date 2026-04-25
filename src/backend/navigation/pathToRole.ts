/**
 * URL-segment-to-Role reverse mapping.
 * Companion to roleAppPaths.ts for extracting Role from pathnames.
 */

import type { Role } from "@/frontend/auth/types";
import { ROLE_ROUTE_PREFIX } from "./roleAppPaths";

/**
 * The inverse of ROLE_ROUTE_PREFIX.
 * Maps URL segments like "cp" → "channel_partner", "caregiver" → "caregiver", etc.
 * Built programmatically from ROLE_ROUTE_PREFIX.
 */
export const ROUTE_PREFIX_TO_ROLE: Record<string, Role> = Object.entries(
  ROLE_ROUTE_PREFIX,
).reduce((acc, [role, prefix]) => {
  // Strip the leading "/" from the prefix
  const segment = prefix.slice(1);
  acc[segment] = role as Role;
  return acc;
}, {} as Record<string, Role>);

/**
 * Extracts the first path segment from `pathname` (after the leading `/`),
 * looks it up in ROUTE_PREFIX_TO_ROLE, and returns the matching Role or null if none matches.
 *
 * Example:
 * - roleFromPath("/cp/dashboard") returns "channel_partner"
 * - roleFromPath("/caregiver/schedule") returns "caregiver"
 * - roleFromPath("/unknown") returns null
 */
export function roleFromPath(pathname: string): Role | null {
  // Remove leading "/" and split to get the first segment
  const segments = pathname.replace(/^\//, "").split("/");
  const firstSegment = segments[0];

  if (!firstSegment) {
    return null;
  }

  return ROUTE_PREFIX_TO_ROLE[firstSegment] ?? null;
}
