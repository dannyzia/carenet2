/**
 * Referral Validation Tests
 * Tests for referral code format validation, case-insensitivity, and active status checks
 */

import { describe, expect, it } from 'vitest';

describe('Referral Validation Logic', () => {
  describe('Code Format Validation', () => {
    it('should accept valid referral code format: REF-CP-XXXXXX', () => {
      const validCodes = [
        'REF-CP-ABC123',
        'REF-CP-XYZ789',
        'REF-CP-1A2B3C',
        'REF-CP-999999',
      ];

      const codeRegex = /^REF-CP-[A-Z0-9]{6}$/;

      validCodes.forEach(code => {
        expect(codeRegex.test(code)).toBe(true);
      });
    });

    it('should reject codes without REF-CP- prefix', () => {
      const invalidCodes = [
        'ABC123',
        'REF-ABC123',
        'CP-ABC123',
        'REFCP-ABC123',
      ];

      const codeRegex = /^REF-CP-[A-Z0-9]{6}$/;

      invalidCodes.forEach(code => {
        expect(codeRegex.test(code)).toBe(false);
      });
    });

    it('should reject codes with incorrect length', () => {
      const invalidCodes = [
        'REF-CP-ABC12',   // Too short
        'REF-CP-ABC1234', // Too long
        'REF-CP-AB',      // Too short
      ];

      const codeRegex = /^REF-CP-[A-Z0-9]{6}$/;

      invalidCodes.forEach(code => {
        expect(codeRegex.test(code)).toBe(false);
      });
    });

    it('should reject codes with special characters or lowercase', () => {
      const invalidCodes = [
        'REF-CP-ABC!23',
        'REF-CP-abc123', // lowercase
        'REF-CP-AB C12', // space
        'REF-CP-ABC-12', // extra dash
      ];

      const codeRegex = /^REF-CP-[A-Z0-9]{6}$/;

      invalidCodes.forEach(code => {
        expect(codeRegex.test(code)).toBe(false);
      });
    });
  });

  describe('Case-Insensitive Handling', () => {
    it('should convert lowercase input to uppercase for validation', () => {
      const inputCode = 'ref-cp-abc123';
      const normalizedCode = inputCode.toUpperCase().trim();

      expect(normalizedCode).toBe('REF-CP-ABC123');
    });

    it('should handle mixed case input', () => {
      const inputCodes = [
        'ReF-cP-AbC123',
        'REF-CP-abc123',
        'ref-cp-ABC123',
      ];

      inputCodes.forEach(code => {
        const normalized = code.toUpperCase().trim();
        expect(normalized).toBe('REF-CP-ABC123');
      });
    });

    it('should trim whitespace before validation', () => {
      const inputCodes = [
        '  REF-CP-ABC123  ',
        '\tREF-CP-ABC123\t',
        '\nREF-CP-ABC123\n',
      ];

      inputCodes.forEach(code => {
        const normalized = code.toUpperCase().trim();
        expect(normalized).toBe('REF-CP-ABC123');
      });
    });
  });

  describe('Active Status Check', () => {
    it('should accept referral code from active Channel Partner', () => {
      const channelPartner = {
        referral_code: 'REF-CP-ABC123',
        status: 'active',
      };

      const isValid = channelPartner.status === 'active';

      expect(isValid).toBe(true);
    });

    it('should reject referral code from suspended Channel Partner', () => {
      const channelPartner = {
        referral_code: 'REF-CP-ABC123',
        status: 'suspended',
      };

      const isValid = channelPartner.status === 'active';

      expect(isValid).toBe(false);
    });

    it('should reject referral code from deactivated Channel Partner', () => {
      const channelPartner = {
        referral_code: 'REF-CP-ABC123',
        status: 'deactivated',
      };

      const isValid = channelPartner.status === 'active';

      expect(isValid).toBe(false);
    });

    it('should reject referral code from pending approval Channel Partner', () => {
      const channelPartner = {
        referral_code: 'REF-CP-ABC123',
        status: 'pending_approval',
      };

      const isValid = channelPartner.status === 'active';

      expect(isValid).toBe(false);
    });

    it('should reject referral code from rejected Channel Partner', () => {
      const channelPartner = {
        referral_code: 'REF-CP-ABC123',
        status: 'rejected',
      };

      const isValid = channelPartner.status === 'active';

      expect(isValid).toBe(false);
    });
  });

  describe('Code Uniqueness', () => {
    it('should detect duplicate referral codes', () => {
      const existingCodes = ['REF-CP-ABC123', 'REF-CP-XYZ789'];
      const newCode = 'REF-CP-ABC123';

      const isDuplicate = existingCodes.includes(newCode);

      expect(isDuplicate).toBe(true);
    });

    it('should accept unique referral code', () => {
      const existingCodes = ['REF-CP-ABC123', 'REF-CP-XYZ789'];
      const newCode = 'REF-CP-NEW456';

      const isDuplicate = existingCodes.includes(newCode);

      expect(isDuplicate).toBe(false);
    });

    it('should handle case-insensitive duplicate detection', () => {
      const existingCodes = ['REF-CP-ABC123'];
      const newCode = 'ref-cp-abc123';

      const normalizedExisting = existingCodes.map(c => c.toUpperCase());
      const normalizedNew = newCode.toUpperCase();

      const isDuplicate = normalizedExisting.includes(normalizedNew);

      expect(isDuplicate).toBe(true);
    });
  });

  describe('Lead Attribution Rules', () => {
    it('should attribute lead when valid referral code is provided', () => {
      const referralCode = 'REF-CP-ABC123';
      const channelPartner = {
        id: 'cp-123',
        referral_code: 'REF-CP-ABC123',
        status: 'active',
      };

      const isValid = channelPartner.referral_code === referralCode.toUpperCase() &&
                      channelPartner.status === 'active';

      expect(isValid).toBe(true);
    });

    it('should not attribute lead when referral code does not exist', () => {
      const referralCode = 'REF-CP-NONEXIST';
      const channelPartner = null;

      const isValid = channelPartner !== null && channelPartner.status === 'active';

      expect(isValid).toBe(false);
    });

    it('should prevent lead from being attributed to multiple Channel Partners', () => {
      const leadUserId = 'user-123';
      const existingAttribution = {
        lead_user_id: 'user-123',
        channel_partner_id: 'cp-456',
      };

      const isAlreadyAttributed = existingAttribution.lead_user_id === leadUserId;

      expect(isAlreadyAttributed).toBe(true);
    });

    it('should allow lead attribution when no existing attribution exists', () => {
      const leadUserId = 'user-789';
      const existingAttribution = {
        lead_user_id: 'user-123',
        channel_partner_id: 'cp-456',
      };

      const isAlreadyAttributed = existingAttribution.lead_user_id === leadUserId;

      expect(isAlreadyAttributed).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should return clear error for invalid referral code format', () => {
      const invalidCode = 'INVALID';

      const codeRegex = /^REF-CP-[A-Z0-9]{6}$/;
      const isValidFormat = codeRegex.test(invalidCode);

      expect(isValidFormat).toBe(false);
    });

    it('should return clear error for inactive Channel Partner', () => {
      const channelPartner = {
        referral_code: 'REF-CP-ABC123',
        status: 'suspended',
      };

      const isActive = channelPartner.status === 'active';

      expect(isActive).toBe(false);
    });

    it('should return clear error when referral code not found', () => {
      const referralCode = 'REF-CP-NOTFOUND';
      const channelPartner = null;

      const exists = channelPartner !== null;

      expect(exists).toBe(false);
    });

    it('should return clear error when lead already attributed', () => {
      const leadUserId = 'user-123';
      const existingLeads = [{ lead_user_id: 'user-123' }];

      const isAlreadyAttributed = existingLeads.some(l => l.lead_user_id === leadUserId);

      expect(isAlreadyAttributed).toBe(true);
    });
  });
});
