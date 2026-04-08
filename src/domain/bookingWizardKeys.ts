/**
 * Stable keys for i18n and selection state — no user-facing strings.
 */

export const BOOKING_SERVICE_TYPE_KEYS = [
  "fullDay",
  "postOp",
  "dailyCheckIn",
  "medicalSupport",
] as const;

export type BookingServiceTypeKey = (typeof BOOKING_SERVICE_TYPE_KEYS)[number];

export const BOOKING_TIME_SLOT_KEYS = ["t09", "t11", "t14", "t17"] as const;

export type BookingTimeSlotKey = (typeof BOOKING_TIME_SLOT_KEYS)[number];

/** Map package category → service-type translation key suffix (see `bookingWizard.serviceTypes.*`). */
export const CATEGORY_TO_SERVICE_TYPE_KEY: Record<string, BookingServiceTypeKey> = {
  elderly: "fullDay",
  chronic: "fullDay",
  post_surgery: "postOp",
  baby: "dailyCheckIn",
  critical: "medicalSupport",
  disability: "fullDay",
};

export const DEFAULT_SERVICE_TYPE_KEY: BookingServiceTypeKey = "fullDay";

/** When a package schedule omits hours_per_day, use this numeric default (not user-facing). */
export const DEFAULT_SCHEDULE_HOURS_PER_DAY = 8;
