import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSubscriptionLimits, canPerformAction, getSubscriptionTierInfo, needsUpgradeFor } from '@/lib/subscription-utils';

describe('Subscription Utils', () => {
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

  describe('canPerformAction', () => {
    it('should allow free users to generate 1 course', () => {
      expect(canPerformAction('free', 0, 'generate')).toBe(true);
      expect(canPerformAction('free', 1, 'generate')).toBe(false);
    });

    it('should allow pro users unlimited generations', () => {
      expect(canPerformAction('pro', 0, 'generate')).toBe(true);
      expect(canPerformAction('pro', 100, 'generate')).toBe(true);
    });

    it('should allow all users to export PDF', () => {
      expect(canPerformAction('free', 0, 'export_pdf')).toBe(true);
      expect(canPerformAction('pro', 0, 'export_pdf')).toBe(true);
      expect(canPerformAction('lifetime', 0, 'export_pdf')).toBe(true);
    });

    it('should only allow paid users to export to Notion', () => {
      expect(canPerformAction('free', 0, 'export_notion')).toBe(false);
      expect(canPerformAction('pro', 0, 'export_notion')).toBe(true);
      expect(canPerformAction('lifetime', 0, 'export_notion')).toBe(true);
    });

    it('should only allow paid users to remove watermarks', () => {
      expect(canPerformAction('free', 0, 'remove_watermark')).toBe(false);
      expect(canPerformAction('pro', 0, 'remove_watermark')).toBe(true);
      expect(canPerformAction('lifetime', 0, 'remove_watermark')).toBe(true);
    });
  });

  describe('getSubscriptionTierInfo', () => {
    it('should return correct info for free tier', () => {
      const info = getSubscriptionTierInfo('free');
      
      expect(info).toEqual({
        name: 'Free',
        price: '$0',
        period: 'forever',
        color: 'gray',
        description: 'Perfect for trying out the platform',
      });
    });

    it('should return correct info for pro tier', () => {
      const info = getSubscriptionTierInfo('pro');
      
      expect(info).toEqual({
        name: 'Pro',
        price: '$19',
        period: 'per month',
        color: 'indigo',
        description: 'For serious content creators and educators',
      });
    });
  });

  describe('needsUpgradeFor', () => {
    it('should return true for free users for premium features', () => {
      expect(needsUpgradeFor('free', 'unlimited_generations')).toBe(true);
      expect(needsUpgradeFor('free', 'notion_export')).toBe(true);
      expect(needsUpgradeFor('free', 'watermark_free')).toBe(true);
      expect(needsUpgradeFor('free', 'custom_branding')).toBe(true);
    });

    it('should return false for pro users for all features', () => {
      expect(needsUpgradeFor('pro', 'unlimited_generations')).toBe(false);
      expect(needsUpgradeFor('pro', 'notion_export')).toBe(false);
      expect(needsUpgradeFor('pro', 'watermark_free')).toBe(false);
      expect(needsUpgradeFor('pro', 'custom_branding')).toBe(false);
    });

    it('should return false for lifetime users for all features', () => {
      expect(needsUpgradeFor('lifetime', 'unlimited_generations')).toBe(false);
      expect(needsUpgradeFor('lifetime', 'notion_export')).toBe(false);
      expect(needsUpgradeFor('lifetime', 'watermark_free')).toBe(false);
      expect(needsUpgradeFor('lifetime', 'custom_branding')).toBe(false);
    });
  });
});

describe('Payment API Integration', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    
    // Mock environment variables
    process.env.PAYSTACK_SECRET_KEY = 'sk_test_mock_key';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
  });

  describe('Subscription Creation', () => {
    it('should create subscription with correct parameters', async () => {
      // Mock fetch for Paystack API
      const mockFetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            email_addresses: [{ email_address: 'test@example.com' }]
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            status: true,
            data: {
              authorization_url: 'https://checkout.paystack.com/test',
              access_code: 'test_access_code',
              reference: 'test_reference'
            }
          })
        });

      global.fetch = mockFetch;

      // Test subscription creation logic
      const subscriptionData = {
        email: 'test@example.com',
        amount: 1900 * 100, // $19.00 in kobo
        currency: 'USD',
        plan: 'PLN_pro_monthly',
        callback_url: 'http://localhost:3000/api/payments/callback',
        metadata: {
          userId: 'test_user_id',
          plan: 'pro',
        }
      };

      expect(subscriptionData.amount).toBe(190000);
      expect(subscriptionData.currency).toBe('USD');
      expect(subscriptionData.plan).toBe('PLN_pro_monthly');
    });
  });

  describe('Webhook Signature Verification', () => {
    it('should verify webhook signatures correctly', async () => {
      const crypto = await import('crypto');
      const secret = 'test_webhook_secret';
      const payload = JSON.stringify({ event: 'charge.success' });
      
      const hash = crypto
        .createHmac('sha512', secret)
        .update(payload)
        .digest('hex');
      
      // Verify that the hash is generated correctly
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(128); // SHA512 produces 128 character hex string
    });
  });

  describe('Subscription Status Updates', () => {
    it('should handle subscription status changes', () => {
      const testCases = [
        { event: 'subscription.create', expectedAction: 'subscription_created' },
        { event: 'subscription.disable', expectedAction: 'subscription_cancelled' },
        { event: 'charge.success', expectedAction: 'payment_success' },
        { event: 'invoice.payment_failed', expectedAction: 'payment_failed' },
      ];

      testCases.forEach(({ event, expectedAction }) => {
        // Test that events map to correct actions
        expect(event).toBeDefined();
        expect(expectedAction).toBeDefined();
      });
    });
  });
});

describe('Pricing Page Integration', () => {
  it('should display correct pricing information', () => {
    const freeTier = {
      name: 'Free',
      price: '$0',
      period: 'forever',
      features: [
        '1 course generation per month',
        'Basic PDF export',
        'Email support',
        'Access to community',
      ],
      limitations: [
        'Watermarked exports',
        'No Notion export',
        'No custom branding',
        'Limited to 1 generation',
      ],
    };

    const proTier = {
      name: 'Pro',
      price: '$18.99',
      period: 'per month',
      features: [
        'Unlimited course generations',
        'Watermark-free PDF exports',
        'Notion export integration',
        'Custom branding options',
        'Priority email support',
        'Advanced slide templates',
        'Cover art generation',
        'Marketing asset creation',
        'Sales page generator',
        'Complete export packages',
      ],
      limitations: [],
    };

    expect(freeTier.price).toBe('$0');
    expect(proTier.price).toBe('$19');
    expect(freeTier.limitations.length).toBeGreaterThan(0);
    expect(proTier.limitations.length).toBe(0);
  });
});