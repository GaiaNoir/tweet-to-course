import { describe, it, expect } from 'vitest';
import { MONTHLY_LIMITS, formatRemainingGenerations, formatResetDate } from '@/lib/usage-limits';

describe('Monthly Usage System - Unit Tests', () => {
  describe('MONTHLY_LIMITS', () => {
    it('should have correct limits for each tier', () => {
      expect(MONTHLY_LIMITS.free).toBe(1);
      expect(MONTHLY_LIMITS.pro).toBe(-1); // Unlimited
      expect(MONTHLY_LIMITS.lifetime).toBe(-1); // Unlimited
    });
  });

  describe('formatRemainingGenerations', () => {
    it('should format unlimited generations correctly', () => {
      expect(formatRemainingGenerations(-1)).toBe('Unlimited');
    });

    it('should format finite generations correctly', () => {
      expect(formatRemainingGenerations(0)).toBe('0');
      expect(formatRemainingGenerations(1)).toBe('1');
      expect(formatRemainingGenerations(2)).toBe('2');
      expect(formatRemainingGenerations(10)).toBe('10');
    });
  });

  describe('formatResetDate', () => {
    it('should format date correctly', () => {
      const testDate = '2024-02-15';
      const formatted = formatResetDate(testDate);
      expect(formatted).toMatch(/February 15, 2024/);
    });
  });

  describe('Usage Logic', () => {
    it('should correctly determine if free user can generate', () => {
      // Free user with 0 usage can generate
      expect(0 < MONTHLY_LIMITS.free).toBe(true);
      
      // Free user with 1 usage cannot generate (at limit)
      expect(1 < MONTHLY_LIMITS.free).toBe(false);
      
      // Free user with 2 usage cannot generate
      expect(2 < MONTHLY_LIMITS.free).toBe(false);
      
      // Free user with 3 usage cannot generate
      expect(3 < MONTHLY_LIMITS.free).toBe(false);
    });

    it('should correctly calculate remaining generations', () => {
      const limit = MONTHLY_LIMITS.free;
      
      expect(Math.max(0, limit - 0)).toBe(1); // 0 used, 1 remaining
      expect(Math.max(0, limit - 1)).toBe(0); // 1 used, 0 remaining
      expect(Math.max(0, limit - 2)).toBe(0); // 2 used, 0 remaining (capped at 0)
      expect(Math.max(0, limit - 3)).toBe(0); // 3 used, 0 remaining (capped at 0)
    });

    it('should handle pro/lifetime users correctly', () => {
      expect(MONTHLY_LIMITS.pro).toBe(-1);
      expect(MONTHLY_LIMITS.lifetime).toBe(-1);
      
      // Pro users can always generate regardless of usage
      expect(MONTHLY_LIMITS.pro === -1).toBe(true);
      expect(MONTHLY_LIMITS.lifetime === -1).toBe(true);
    });
  });
});