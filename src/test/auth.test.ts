import { describe, it, expect, vi, beforeEach } from 'vitest';
import { canPerformAction, getSubscriptionLimits } from '@/lib/auth';
import type { UserProfile } from '@/lib/auth';

describe('Authentication Utilities', () => {
  describe('canPerformAction', () => {
    const freeUser: UserProfile = {
      id: '1',
      email: 'free@example.com',
      subscriptionTier: 'free',
      usageCount: 0,
      createdAt: '2024-01-01',
      lastActive: '2024-01-01',
    };

    const freeUserWithUsage: UserProfile = {
      ...freeUser,
      usageCount: 1,
    };

    const proUser: UserProfile = {
      id: '2',
      email: 'pro@example.com',
      subscriptionTier: 'pro',
      usageCount: 5,
      createdAt: '2024-01-01',
      lastActive: '2024-01-01',
    };

    const lifetimeUser: UserProfile = {
      id: '3',
      email: 'lifetime@example.com',
      subscriptionTier: 'lifetime',
      usageCount: 10,
      createdAt: '2024-01-01',
      lastActive: '2024-01-01',
    };

    it('should allow free users to generate one course', () => {
      expect(canPerformAction(freeUser, 'generate')).toBe(true);
    });

    it('should not allow free users to generate after reaching limit', () => {
      expect(canPerformAction(freeUserWithUsage, 'generate')).toBe(false);
    });

    it('should allow pro users unlimited generations', () => {
      expect(canPerformAction(proUser, 'generate')).toBe(true);
    });

    it('should allow lifetime users unlimited generations', () => {
      expect(canPerformAction(lifetimeUser, 'generate')).toBe(true);
    });

    it('should allow all users to export PDF', () => {
      expect(canPerformAction(freeUser, 'export_pdf')).toBe(true);
      expect(canPerformAction(proUser, 'export_pdf')).toBe(true);
      expect(canPerformAction(lifetimeUser, 'export_pdf')).toBe(true);
    });

    it('should not allow free users to export to Notion', () => {
      expect(canPerformAction(freeUser, 'export_notion')).toBe(false);
    });

    it('should allow pro users to export to Notion', () => {
      expect(canPerformAction(proUser, 'export_notion')).toBe(true);
    });

    it('should allow lifetime users to export to Notion', () => {
      expect(canPerformAction(lifetimeUser, 'export_notion')).toBe(true);
    });

    it('should not allow free users to remove watermark', () => {
      expect(canPerformAction(freeUser, 'remove_watermark')).toBe(false);
    });

    it('should allow pro users to remove watermark', () => {
      expect(canPerformAction(proUser, 'remove_watermark')).toBe(true);
    });

    it('should allow lifetime users to remove watermark', () => {
      expect(canPerformAction(lifetimeUser, 'remove_watermark')).toBe(true);
    });
  });

  describe('getSubscriptionLimits', () => {
    it('should return correct limits for free tier', () => {
      const limits = getSubscriptionLimits('free');
      expect(limits).toEqual({
        monthlyGenerations: 1,
        pdfExports: true,
        notionExports: false,
        customBranding: false,
        watermarkFree: false,
      });
    });

    it('should return correct limits for pro tier', () => {
      const limits = getSubscriptionLimits('pro');
      expect(limits).toEqual({
        monthlyGenerations: -1,
        pdfExports: true,
        notionExports: true,
        customBranding: true,
        watermarkFree: true,
      });
    });

    it('should return correct limits for lifetime tier', () => {
      const limits = getSubscriptionLimits('lifetime');
      expect(limits).toEqual({
        monthlyGenerations: -1,
        pdfExports: true,
        notionExports: true,
        customBranding: true,
        watermarkFree: true,
      });
    });
  });
});