/**
 * CareNet Design Tokens
 * ─────────────────────
 * Central source of truth for all brand colors, role definitions,
 * gradients, and design constants. Every page should reference
 * these tokens instead of hardcoding hex values.
 *
 * CSS Variables are defined in /src/styles/theme.css and automatically
 * support dark mode. Use `var(--cn-*)` in style props or Tailwind
 * classes like `text-cn-pink`, `bg-cn-bg-card`, etc.
 */

/* ─── Role Types ─── */
export type Role = "caregiver" | "guardian" | "admin" | "moderator" | "patient" | "agency" | "shop" | "channel_partner";

/* ─── Role Color Map (uses CSS variables for dark mode support) ─── */
export const roleConfig: Record<Role, {
  label: string;
  cssVar: string;       // CSS variable name (without --)
  gradient: string;     // CSS variable for gradient
  lightBg: string;      // CSS variable for light background
}> = {
  caregiver: {
    label: "Caregiver",
    cssVar: "cn-pink",
    gradient: "var(--cn-gradient-caregiver)",
    lightBg: "var(--cn-pink-bg)",
  },
  guardian: {
    label: "Guardian",
    cssVar: "cn-green",
    gradient: "var(--cn-gradient-guardian)",
    lightBg: "var(--cn-green-bg)",
  },
  admin: {
    label: "Administrator",
    cssVar: "cn-purple",
    gradient: "var(--cn-gradient-admin)",
    lightBg: "var(--cn-purple-bg)",
  },
  moderator: {
    label: "Moderator",
    cssVar: "cn-amber",
    gradient: "var(--cn-gradient-moderator)",
    lightBg: "var(--cn-amber-bg)",
  },
  patient: {
    label: "Patient",
    cssVar: "cn-blue",
    gradient: "var(--cn-gradient-patient)",
    lightBg: "var(--cn-blue-bg)",
  },
  agency: {
    label: "Agency",
    cssVar: "cn-teal",
    gradient: "var(--cn-gradient-agency)",
    lightBg: "var(--cn-teal-bg)",
  },
  shop: {
    label: "Shop Owner",
    cssVar: "cn-orange",
    gradient: "var(--cn-gradient-shop)",
    lightBg: "var(--cn-orange-bg)",
  },
  channel_partner: {
    label: "Channel Partner",
    cssVar: "cn-channel-partner",
    gradient: "var(--cn-gradient-channel-partner)",
    lightBg: "var(--cn-channel-partner-bg)",
  },
};

/* ─── Stat card colors (map label → CSS vars) ─── */
export const statColors = {
  pink: { color: "var(--cn-pink)", bg: "var(--cn-pink-bg)" },
  green: { color: "var(--cn-green)", bg: "var(--cn-green-bg)" },
  purple: { color: "var(--cn-purple)", bg: "var(--cn-purple-bg)" },
  amber: { color: "var(--cn-amber)", bg: "var(--cn-amber-bg)" },
  blue: { color: "var(--cn-blue)", bg: "var(--cn-blue-bg)" },
  teal: { color: "var(--cn-teal)", bg: "var(--cn-teal-bg)" },
  orange: { color: "var(--cn-orange)", bg: "var(--cn-orange-bg)" },
  red: { color: "var(--cn-red)", bg: "rgba(239, 68, 68, 0.125)" },
} as const;

/* ─── Status colors for badges/labels ─── */
export const statusColors = {
  active: { bg: "var(--cn-green-bg)", color: "var(--cn-green)", label: "Active" },
  completed: { bg: "var(--cn-purple-bg)", color: "var(--cn-purple)", label: "Completed" },
  pending: { bg: "var(--cn-amber-bg)", color: "var(--cn-amber)", label: "Pending" },
  cancelled: { bg: "rgba(239, 68, 68, 0.125)", color: "var(--cn-red)", label: "Cancelled" },
  verified: { bg: "var(--cn-green-bg)", color: "var(--cn-green)", label: "Verified" },
  rejected: { bg: "rgba(239, 68, 68, 0.125)", color: "var(--cn-red)", label: "Rejected" },
  inProgress: { bg: "var(--cn-blue-bg)", color: "var(--cn-blue)", label: "In Progress" },
} as const;

/* ─── Semantic color helpers (for inline styles referencing CSS vars) ─── */
export const cn = {
  text: "var(--cn-text)",
  textSecondary: "var(--cn-text-secondary)",
  textHeading: "var(--cn-text-heading)",
  bgPage: "var(--cn-bg-page)",
  bgCard: "var(--cn-bg-card)",
  bgInput: "var(--cn-bg-input)",
  bgSidebar: "var(--cn-bg-sidebar)",
  bgHeader: "var(--cn-bg-header)",
  border: "var(--cn-border)",
  borderLight: "var(--cn-border-light)",
  shadowCard: "var(--cn-shadow-card)",
  shadowCardHover: "var(--cn-shadow-card-hover)",
  shadowSidebar: "var(--cn-shadow-sidebar)",
  shadowHeader: "var(--cn-shadow-header)",
  pink: "var(--cn-pink)",
  pinkLight: "var(--cn-pink-light)",
  pinkBg: "var(--cn-pink-bg)",
  green: "var(--cn-green)",
  greenLight: "var(--cn-green-light)",
  greenBg: "var(--cn-green-bg)",
  purple: "var(--cn-purple)",
  purpleBg: "var(--cn-purple-bg)",
  amber: "var(--cn-amber)",
  amberBg: "var(--cn-amber-bg)",
  blue: "var(--cn-blue)",
  blueBg: "var(--cn-blue-bg)",
  teal: "var(--cn-teal)",
  tealBg: "var(--cn-teal-bg)",
  orange: "var(--cn-orange)",
  orangeBg: "var(--cn-orange-bg)",
  red: "var(--cn-red)",
} as const;

/* ─── Helper to get role colors from CSS vars ─── */
export function getRoleColors(role: Role) {
  const config = roleConfig[role];
  return {
    primary: `var(--${config.cssVar})`,
    light: config.lightBg,
    gradient: config.gradient,
    label: config.label,
  };
}
