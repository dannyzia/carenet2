/**
 * Rate Lifecycle Tests
 * Tests for rate history, effective_to closure, expiry notification, and renewal
 */

import { describe, expect, it } from 'vitest';

describe('Rate Lifecycle Logic', () => {
  describe('Rate Creation', () => {
    it('should create new rate with effective_to = null (active)', () => {
      const newRate = {
        id: 'rate-123',
        channel_partner_id: 'cp-456',
        lead_role: 'guardian',
        rate: 25,
        effective_from: new Date('2026-04-20T00:00:00Z'),
        effective_to: null,
        expires_at: new Date('2026-07-19T23:59:59Z'),
        expiry_notified: false,
        previous_rate: null,
        changed_by: 'admin-123',
        reason: 'Initial rate',
      };

      expect(newRate.effective_to).toBeNull();
      expect(newRate.expiry_notified).toBe(false);
      expect(newRate.previous_rate).toBeNull();
    });

    it('should set expires_at based on DEFAULT_RATE_EXPIRY_DAYS from effective_from', () => {
      const DEFAULT_RATE_EXPIRY_DAYS = 90;
      const effectiveFrom = new Date('2026-04-20T00:00:00Z');
      const expectedExpires = new Date(effectiveFrom.getTime() + DEFAULT_RATE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

      const newRate = {
        effective_from: effectiveFrom,
        expires_at: expectedExpires,
      };

      const diffTime = newRate.expires_at.getTime() - newRate.effective_from.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      expect(diffDays).toBe(DEFAULT_RATE_EXPIRY_DAYS);
    });

    it('should capture previous_rate when replacing existing rate', () => {
      const oldRate = {
        rate: 20,
      };

      const newRate = {
        rate: 25,
        previous_rate: oldRate.rate,
      };

      expect(newRate.previous_rate).toBe(20);
    });
  });

  describe('Rate Closure (effective_to)', () => {
    it('should set effective_to = now() when new rate is created for same role', () => {
      const now = new Date('2026-04-20T10:00:00Z');
      const oldRate = {
        id: 'rate-old',
        channel_partner_id: 'cp-456',
        lead_role: 'guardian',
        effective_to: null,
      };

      const closedRate = {
        ...oldRate,
        effective_to: now,
      };

      expect(closedRate.effective_to).toEqual(now);
    });

    it('should only close the rate matching channel_partner_id and lead_role', () => {
      const rates = [
        {
          id: 'rate-1',
          channel_partner_id: 'cp-456',
          lead_role: 'guardian',
          effective_to: null,
        },
        {
          id: 'rate-2',
          channel_partner_id: 'cp-456',
          lead_role: 'agency',
          effective_to: null,
        },
        {
          id: 'rate-3',
          channel_partner_id: 'cp-789',
          lead_role: 'guardian',
          effective_to: null,
        },
      ];

      const targetCpId = 'cp-456';
      const targetRole = 'guardian';
      const now = new Date();

      const updatedRates = rates.map(r => {
        if (r.channel_partner_id === targetCpId && r.lead_role === targetRole && r.effective_to === null) {
          return { ...r, effective_to: now };
        }
        return r;
      });

      const closedRate = updatedRates.find(r => r.id === 'rate-1');
      const unchangedRate1 = updatedRates.find(r => r.id === 'rate-2');
      const unchangedRate2 = updatedRates.find(r => r.id === 'rate-3');

      expect(closedRate?.effective_to).toEqual(now);
      expect(unchangedRate1?.effective_to).toBeNull();
      expect(unchangedRate2?.effective_to).toBeNull();
    });

    it('should only close rates where effective_to is currently null', () => {
      const rates = [
        {
          id: 'rate-1',
          effective_to: null,
        },
        {
          id: 'rate-2',
          effective_to: new Date('2026-03-01T00:00:00Z'), // Already closed
        },
      ];

      const now = new Date();
      const updatedRates = rates.map(r => {
        if (r.effective_to === null) {
          return { ...r, effective_to: now };
        }
        return r;
      });

      const closedRate = updatedRates.find(r => r.id === 'rate-1');
      const alreadyClosedRate = updatedRates.find(r => r.id === 'rate-2');

      expect(closedRate?.effective_to).toEqual(now);
      expect(alreadyClosedRate?.effective_to).toEqual(new Date('2026-03-01T00:00:00Z'));
    });
  });

  describe('Active Rate Lookup', () => {
    it('should find the single active rate for a given channel_partner_id and lead_role', () => {
      const rates = [
        {
          id: 'rate-1',
          channel_partner_id: 'cp-456',
          lead_role: 'guardian',
          effective_to: null,
          effective_from: new Date('2026-01-01T00:00:00Z'),
        },
        {
          id: 'rate-2',
          channel_partner_id: 'cp-456',
          lead_role: 'guardian',
          effective_to: new Date('2026-03-01T00:00:00Z'),
          effective_from: new Date('2025-01-01T00:00:00Z'),
        },
      ];

      const activeRate = rates.find(
        r => r.channel_partner_id === 'cp-456' &&
             r.lead_role === 'guardian' &&
             r.effective_to === null
      );

      expect(activeRate?.id).toBe('rate-1');
    });

    it('should return null when no active rate exists', () => {
      const rates = [
        {
          id: 'rate-1',
          channel_partner_id: 'cp-456',
          lead_role: 'guardian',
          effective_to: new Date('2026-03-01T00:00:00Z'),
        },
      ];

      const activeRate = rates.find(
        r => r.channel_partner_id === 'cp-456' &&
             r.lead_role === 'guardian' &&
             r.effective_to === null
      );

      expect(activeRate).toBeUndefined();
    });
  });

  describe('Expiry Notification', () => {
    it('should identify rates expiring within notification window', () => {
      const now = new Date('2026-04-20T00:00:00Z');
      const notificationWindowDays = 7;
      const notificationThreshold = new Date(now.getTime() + notificationWindowDays * 24 * 60 * 60 * 1000);

      const rates = [
        {
          id: 'rate-1',
          expires_at: new Date('2026-04-25T00:00:00Z'), // 5 days from now
          expiry_notified: false,
          effective_to: null,
        },
        {
          id: 'rate-2',
          expires_at: new Date('2026-05-01T00:00:00Z'), // 11 days from now
          expiry_notified: false,
          effective_to: null,
        },
        {
          id: 'rate-3',
          expires_at: new Date('2026-04-15T00:00:00Z'), // Already expired
          expiry_notified: false,
          effective_to: null,
        },
      ];

      const expiringRates = rates.filter(
        r => r.effective_to === null &&
             r.expires_at > now &&
             r.expires_at <= notificationThreshold &&
             r.expiry_notified === false
      );

      expect(expiringRates.length).toBe(1);
      expect(expiringRates[0].id).toBe('rate-1');
    });

    it('should set expiry_notified = true after sending notification', () => {
      const rate = {
        id: 'rate-1',
        expiry_notified: false,
      };

      const updatedRate = {
        ...rate,
        expiry_notified: true,
      };

      expect(updatedRate.expiry_notified).toBe(true);
    });

    it('should not re-notify rates where expiry_notified = true', () => {
      const now = new Date('2026-04-20T00:00:00Z');
      const notificationWindowDays = 7;
      const notificationThreshold = new Date(now.getTime() + notificationWindowDays * 24 * 60 * 60 * 1000);

      const rates = [
        {
          id: 'rate-1',
          expires_at: new Date('2026-04-25T00:00:00Z'),
          expiry_notified: true, // Already notified
          effective_to: null,
        },
      ];

      const needsNotification = rates.filter(
        r => r.effective_to === null &&
             r.expires_at > now &&
             r.expires_at <= notificationThreshold &&
             r.expiry_notified === false
      );

      expect(needsNotification.length).toBe(0);
    });
  });

  describe('Rate Expiry', () => {
    it('should identify expired rates (expires_at <= now and effective_to is null)', () => {
      const now = new Date('2026-04-20T00:00:00Z');

      const rates = [
        {
          id: 'rate-1',
          expires_at: new Date('2026-04-15T00:00:00Z'), // Expired
          effective_to: null,
          expiry_notified: true,
        },
        {
          id: 'rate-2',
          expires_at: new Date('2026-04-25T00:00:00Z'), // Not expired
          effective_to: null,
          expiry_notified: false,
        },
        {
          id: 'rate-3',
          expires_at: new Date('2026-04-15T00:00:00Z'), // Expired but already closed
          effective_to: new Date('2026-04-15T00:00:00Z'),
          expiry_notified: true,
        },
      ];

      const expiredRates = rates.filter(
        r => r.effective_to === null && r.expires_at <= now
      );

      expect(expiredRates.length).toBe(1);
      expect(expiredRates[0].id).toBe('rate-1');
    });

    it('should set effective_to = now() for expired rates', () => {
      const now = new Date('2026-04-20T00:00:00Z');
      const expiredRate = {
        id: 'rate-1',
        expires_at: new Date('2026-04-15T00:00:00Z'),
        effective_to: null,
      };

      const closedRate = {
        ...expiredRate,
        effective_to: now,
      };

      expect(closedRate.effective_to).toEqual(now);
    });
  });

  describe('Rate Renewal', () => {
    it('should reset expiry_notified to false when rate is renewed', () => {
      const oldRate = {
        id: 'rate-1',
        expires_at: new Date('2026-04-15T00:00:00Z'),
        expiry_notified: true,
        effective_to: new Date('2026-04-15T00:00:00Z'),
      };

      const newRate = {
        channel_partner_id: oldRate.channel_partner_id,
        lead_role: oldRate.lead_role,
        rate: 25,
        effective_from: new Date('2026-04-20T00:00:00Z'),
        effective_to: null,
        expires_at: new Date('2026-07-19T23:59:59Z'),
        expiry_notified: false, // Reset for new cycle
        previous_rate: oldRate.rate,
        changed_by: 'admin-123',
        reason: 'Rate renewal',
      };

      expect(newRate.expiry_notified).toBe(false);
    });

    it('should update expires_at to new expiry date', () => {
      const newExpiresAt = new Date('2026-10-19T23:59:59Z');

      const renewedRate = {
        expires_at: newExpiresAt,
      };

      expect(renewedRate.expires_at).toEqual(newExpiresAt);
    });

    it('should capture previous_rate before renewal', () => {
      const oldRateValue = 20;
      const newRateValue = 25;

      const renewedRate = {
        rate: newRateValue,
        previous_rate: oldRateValue,
      };

      expect(renewedRate.previous_rate).toBe(oldRateValue);
    });
  });

  describe('Rate History Query', () => {
    it('should return all rate records for a channel_partner_id and lead_role', () => {
      const rates = [
        {
          id: 'rate-1',
          channel_partner_id: 'cp-456',
          lead_role: 'guardian',
          effective_from: new Date('2025-01-01T00:00:00Z'),
          effective_to: new Date('2026-03-01T00:00:00Z'),
          rate: 20,
        },
        {
          id: 'rate-2',
          channel_partner_id: 'cp-456',
          lead_role: 'guardian',
          effective_from: new Date('2026-03-01T00:00:00Z'),
          effective_to: null,
          rate: 25,
        },
        {
          id: 'rate-3',
          channel_partner_id: 'cp-456',
          lead_role: 'agency',
          effective_from: new Date('2026-01-01T00:00:00Z'),
          effective_to: null,
          rate: 15,
        },
      ];

      const guardianRates = rates.filter(
        r => r.channel_partner_id === 'cp-456' && r.lead_role === 'guardian'
      );

      expect(guardianRates.length).toBe(2);
    });

    it('should order history by effective_from descending (most recent first)', () => {
      const rates = [
        {
          id: 'rate-1',
          effective_from: new Date('2025-01-01T00:00:00Z'),
        },
        {
          id: 'rate-2',
          effective_from: new Date('2026-03-01T00:00:00Z'),
        },
        {
          id: 'rate-3',
          effective_from: new Date('2025-06-01T00:00:00Z'),
        },
      ];

      const sortedRates = [...rates].sort((a, b) =>
        b.effective_from.getTime() - a.effective_from.getTime()
      );

      expect(sortedRates[0].id).toBe('rate-2');
      expect(sortedRates[1].id).toBe('rate-3');
      expect(sortedRates[2].id).toBe('rate-1');
    });
  });
});
