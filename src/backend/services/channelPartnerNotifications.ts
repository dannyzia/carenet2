import { notificationService } from './notification.service';
import { CP_NOTIFICATION_EVENTS } from '@/backend/utils/channelPartnerConstants';

async function sendCpNotification(payload: {
  type: string;
  title: string;
  body: string;
  receiverId: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await notificationService.triggerNotification({
      type: payload.type,
      title: payload.title,
      body: payload.body,
      receiverId: payload.receiverId,
      actionUrl: payload.actionUrl,
      metadata: payload.metadata,
    });
  } catch (error) {
    console.error('[channelPartnerNotifications] Failed to send notification:', error);
  }
}

export const channelPartnerNotifications = {
  notifyCpApproved: async (receiverId: string): Promise<void> => {
    await sendCpNotification({
      type: CP_NOTIFICATION_EVENTS.CP_APPROVED,
      title: 'Channel Partner Approved',
      body: 'Your application has been approved and your referral code is now active.',
      receiverId,
      actionUrl: '/cp/dashboard',
      metadata: { category: 'cp' },
    });
  },

  notifyCpRejected: async (receiverId: string, reason: string): Promise<void> => {
    await sendCpNotification({
      type: CP_NOTIFICATION_EVENTS.CP_REJECTED,
      title: 'Channel Partner Application Rejected',
      body: `Your application was rejected. Reason: ${reason}`,
      receiverId,
      actionUrl: '/cp',
      metadata: { category: 'cp', reason },
    });
  },

  notifyCpSuspended: async (receiverId: string, reason: string): Promise<void> => {
    await sendCpNotification({
      type: CP_NOTIFICATION_EVENTS.CP_SUSPENDED,
      title: 'Channel Partner Suspended',
      body: `Your account has been suspended. Reason: ${reason}`,
      receiverId,
      actionUrl: '/cp',
      metadata: { category: 'cp', reason },
    });
  },

  notifyCpDeactivated: async (receiverId: string, reason: string): Promise<void> => {
    await sendCpNotification({
      type: CP_NOTIFICATION_EVENTS.CP_DEACTIVATED,
      title: 'Channel Partner Deactivated',
      body: `Your account has been deactivated. Reason: ${reason}`,
      receiverId,
      actionUrl: '/cp',
      metadata: { category: 'cp', reason },
    });
  },

  notifyCpLeadJoined: async (receiverId: string, leadName: string): Promise<void> => {
    await sendCpNotification({
      type: CP_NOTIFICATION_EVENTS.CP_LEAD_JOINED,
      title: 'New Lead Attributed',
      body: `A new lead (${leadName}) has been attributed to you.`,
      receiverId,
      actionUrl: '/cp/leads',
      metadata: { category: 'cp', leadName },
    });
  },

  notifyCpLeadActivated: async (receiverId: string, leadName: string): Promise<void> => {
    await sendCpNotification({
      type: CP_NOTIFICATION_EVENTS.CP_LEAD_ACTIVATED,
      title: 'Lead Activated',
      body: `Your referred lead (${leadName}) has completed registration.`,
      receiverId,
      actionUrl: '/cp/leads',
      metadata: { category: 'cp', leadName },
    });
  },

  notifyCpCommissionCredited: async (
    receiverId: string,
    amount: number,
    invoiceId: string,
  ): Promise<void> => {
    await sendCpNotification({
      type: CP_NOTIFICATION_EVENTS.CP_COMMISSION_CREDITED,
      title: 'Commission Credited',
      body: `Your commission of ৳${amount.toLocaleString()} for invoice ${invoiceId} has been credited.`,
      receiverId,
      actionUrl: '/cp/commissions',
      metadata: { category: 'cp', invoiceId, amount },
    });
  },

  notifyCpRateExpiring: async (
    receiverId: string,
    expiresAt: string,
  ): Promise<void> => {
    await sendCpNotification({
      type: CP_NOTIFICATION_EVENTS.CP_RATE_EXPIRING,
      title: 'Commission Rate Expiring Soon',
      body: `A commission rate will expire on ${expiresAt}. Please review it soon.`,
      receiverId,
      actionUrl: '/cp/rates',
      metadata: { category: 'cp', expiresAt },
    });
  },

  notifyCpRateExpired: async (receiverId: string): Promise<void> => {
    await sendCpNotification({
      type: CP_NOTIFICATION_EVENTS.CP_RATE_EXPIRED,
      title: 'Commission Rate Expired',
      body: 'A commission rate has expired. Please update your rate information.',
      receiverId,
      actionUrl: '/cp/rates',
      metadata: { category: 'cp' },
    });
  },

  notifyAdminCpApplicationPending: async (
    receiverId: string,
    cpName: string,
  ): Promise<void> => {
    await sendCpNotification({
      type: CP_NOTIFICATION_EVENTS.CP_APPLICATION_PENDING,
      title: 'New Channel Partner Application Pending',
      body: `A new Channel Partner application is awaiting review: ${cpName}.`,
      receiverId,
      actionUrl: '/admin/channel-partners',
      metadata: { category: 'admin', cpName },
    });
  },

  notifyAdminRateExpiring: async (receiverId: string, cpName: string): Promise<void> => {
    await sendCpNotification({
      type: CP_NOTIFICATION_EVENTS.CP_RATE_EXPIRING_ADMIN,
      title: 'Channel Partner Rate Expiring',
      body: `A Channel Partner rate for ${cpName} is expiring soon.`,
      receiverId,
      actionUrl: '/admin/channel-partners',
      metadata: { category: 'admin', cpName },
    });
  },

  notifyAdminCommissionReversed: async (
    receiverId: string,
    cpName: string,
    invoiceId: string,
  ): Promise<void> => {
    await sendCpNotification({
      type: CP_NOTIFICATION_EVENTS.CP_COMMISSION_REVERSED_ADMIN,
      title: 'Channel Partner Commission Reversed',
      body: `A commission for ${cpName} on invoice ${invoiceId} was reversed.`,
      receiverId,
      actionUrl: '/admin/channel-partners',
      metadata: { category: 'admin', cpName, invoiceId },
    });
  },
};
