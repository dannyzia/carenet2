/** Notification channel categories */
export type NotificationChannel =
  | "care-safety"
  | "shift-reminders"
  | "messages"
  | "payments"
  | "care-updates"
  | "ratings"
  | "platform"
  | "system"
  | "booking"
  | "document"
  | "billing"
  | "commission"
  | "cp_commission"
  | "cp_rate"
  | "admin_cp";

/** A single notification entry */
export interface AppNotification {
  id: string;
  channel: NotificationChannel;
  titleEn: string;
  titleBn: string;
  messageEn: string;
  messageBn: string;
  time: string;
  read: boolean;
  actionUrl?: string;
}