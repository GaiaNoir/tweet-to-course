import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { checkMonthlyUsage, incrementMonthlyUsage, MONTHLY_LIMITS } from '@/lib/usage-limits';
import { supabaseAdmin } from '@/lib/supabase';

// Mock user ID for testing
const TEST_USER_ID = 'test-user-monthly-usage';

describe('Monthly Usage System', () => {
  beforeEach(async () => {
    
    // Clean up any existing test user
    await supabaseAdmin
      .from('users')
      .delete()
      .eq('clerk_user_id', TEST_USER_ID);
    
    // Create a test user
    await supabaseAdmin
      .from('users')
      .insert({
        clerk_user_id: TEST_USER_ID,
        email: 'test@example.com',
        subscription_tier: 'free',
        monthly_usage_count: 0,
        monthly_usage_reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // 30 days from now
      });
  });

  afterEach(async () => {
    // Clean up test user
    await supabaseAdmin
      .from('users')
      .delete()
      .eq('clerk_user_id', TEST_USER_ID);
  });

  describe('checkMonthlyUsage', () => {
    it('should return correct usage info for new user', async () => {
      const usageInfo = await checkMonthlyUsage(TEST_USER_ID);
      
      expect(usageInfo.currentUsage).toBe(0);
      expect(usageInfo.subscriptionTier).toBe('free');
      expect(usageInfo.canGenerate).toBe(true);
      expect(usageInfo.remainingGenerations).toBe(1);
    });

    it('should return correct usage info for user with 1 generation', async () => {
      // Increment usage once
      await incrementMonthlyUsage(TEST_USER_ID);
      
      const usageInfo = await checkMonthlyUsage(TEST_USER_ID);
      
      expect(usageInfo.currentUsage).toBe(1);
      expect(usageInfo.canGenerate).toBe(false);
      expect(usageInfo.remainingGenerations).toBe(0);
    });

    it('should return correct usage info for user at limit', async () => {
      // Increment usage to limit
      await incrementMonthlyUsage(TEST_USER_ID);
      
      const usageInfo = await checkMonthlyUsage(TEST_USER_ID);
      
      expect(usageInfo.currentUsage).toBe(1);
      expect(usageInfo.canGenerate).toBe(false);
      expect(usageInfo.remainingGenerations).toBe(0);
    });

    it('should handle non-existent user gracefully', async () => {
      const usageInfo = await checkMonthlyUsage('non-existent-user');
      
      expect(usageInfo.currentUsage).toBe(0);
      expect(usageInfo.subscriptionTier).toBe('free');
      expect(usageInfo.canGenerate).toBe(true);
      expect(usageInfo.remainingGenerations).toBe(1);
    });
  });

  describe('incrementMonthlyUsage', () => {
    it('should increment usage count correctly', async () => {
      const newCount = await incrementMonthlyUsage(TEST_USER_ID);
      expect(newCount).toBe(1);
      
      const secondCount = await incrementMonthlyUsage(TEST_USER_ID);
      expect(secondCount).toBe(2);
    });

    it('should continue incrementing even past limit', async () => {
      // Increment to limit
      await incrementMonthlyUsage(TEST_USER_ID);
      await incrementMonthlyUsage(TEST_USER_ID);
      
      // Should still increment (API should prevent this, but DB allows it)
      const overLimitCount = await incrementMonthlyUsage(TEST_USER_ID);
      expect(overLimitCount).toBe(3);
    });
  });

  describe('MONTHLY_LIMITS', () => {
    it('should have correct limits for each tier', () => {
      expect(MONTHLY_LIMITS.free).toBe(1);
      expect(MONTHLY_LIMITS.pro).toBe(-1); // Unlimited
      expect(MONTHLY_LIMITS.lifetime).toBe(-1); // Unlimited
    });
  });

  describe('Pro user usage', () => {
    beforeEach(async () => {
      // Update test user to pro tier
      await supabaseAdmin
        .from('users')
        .update({ subscription_tier: 'pro' })
        .eq('clerk_user_id', TEST_USER_ID);
    });

    it('should allow unlimited generations for pro users', async () => {
      const usageInfo = await checkMonthlyUsage(TEST_USER_ID);
      
      expect(usageInfo.subscriptionTier).toBe('pro');
      expect(usageInfo.canGenerate).toBe(true);
      expect(usageInfo.remainingGenerations).toBe(-1); // Unlimited
    });

    it('should still track usage for pro users', async () => {
      await incrementMonthlyUsage(TEST_USER_ID);
      await incrementMonthlyUsage(TEST_USER_ID);
      await incrementMonthlyUsage(TEST_USER_ID);
      
      const usageInfo = await checkMonthlyUsage(TEST_USER_ID);
      
      expect(usageInfo.currentUsage).toBe(3);
      expect(usageInfo.canGenerate).toBe(true); // Still can generate
    });
  });
});