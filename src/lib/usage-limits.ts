import { createAdminClient } from '@/lib/supabase';

export interface UsageInfo {
  currentUsage: number;
  resetDate: string;
  subscriptionTier: string;
  canGenerate: boolean;
  remainingGenerations: number;
}

export interface UsageLimits {
  free: number;
  pro: number;
  lifetime: number;
}

// Monthly limits for each subscription tier
export const MONTHLY_LIMITS: UsageLimits = {
  free: 1,
  pro: -1, // Unlimited
  lifetime: -1, // Unlimited
};

/**
 * Check if user can generate a course based on their monthly usage
 */
export async function checkMonthlyUsage(authUserId: string): Promise<UsageInfo> {
  
  try {
    // Get user data directly from the users table
    const adminClient = createAdminClient();
    const { data: userData, error } = await adminClient
      .from('users')
      .select('monthly_usage_count, monthly_usage_reset_date, subscription_tier')
      .eq('auth_user_id', authUserId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error checking monthly usage:', error);
      throw new Error('Failed to check usage limits');
    }
    
    // Handle case where user doesn't exist yet
    if (!userData) {
      return {
        currentUsage: 0,
        resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        subscriptionTier: 'free',
        canGenerate: true,
        remainingGenerations: MONTHLY_LIMITS.free,
      };
    }
    
    const tier = userData.subscription_tier as keyof UsageLimits;
    const limit = MONTHLY_LIMITS[tier];
    const currentUsage = userData.monthly_usage_count || 0;
    
    // Check if we need to reset the monthly usage
    const resetDate = new Date(userData.monthly_usage_reset_date);
    const now = new Date();
    
    let actualCurrentUsage = currentUsage;
    let actualResetDate = resetDate.toISOString();
    
    // If reset date has passed, reset the usage count
    if (now > resetDate) {
      const nextResetDate = new Date(now);
      nextResetDate.setMonth(nextResetDate.getMonth() + 1);
      
      await adminClient
        .from('users')
        .update({
          monthly_usage_count: 0,
          monthly_usage_reset_date: nextResetDate.toISOString(),
        })
        .eq('auth_user_id', authUserId);
      
      actualCurrentUsage = 0;
      actualResetDate = nextResetDate.toISOString();
    }
    
    // Unlimited tiers can always generate
    const canGenerate = limit === -1 || actualCurrentUsage < limit;
    const remainingGenerations = limit === -1 ? -1 : Math.max(0, limit - actualCurrentUsage);
    
    return {
      currentUsage: actualCurrentUsage,
      resetDate: actualResetDate,
      subscriptionTier: tier,
      canGenerate,
      remainingGenerations,
    };
  } catch (error) {
    console.error('Error in checkMonthlyUsage:', error);
    throw error;
  }
}

/**
 * Increment user's monthly usage count
 */
export async function incrementMonthlyUsage(authUserId: string): Promise<number> {
  try {
    const adminClient = createAdminClient();
    
    // Get current usage count
    const { data: userData, error: fetchError } = await adminClient
      .from('users')
      .select('monthly_usage_count')
      .eq('auth_user_id', authUserId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching user for usage increment:', fetchError);
      throw new Error('Failed to fetch user data');
    }
    
    const newUsageCount = (userData.monthly_usage_count || 0) + 1;
    
    // Update the usage count
    const { error: updateError } = await adminClient
      .from('users')
      .update({ monthly_usage_count: newUsageCount })
      .eq('auth_user_id', authUserId);
    
    if (updateError) {
      console.error('Error incrementing monthly usage:', updateError);
      throw new Error('Failed to update usage count');
    }
    
    return newUsageCount;
  } catch (error) {
    console.error('Error in incrementMonthlyUsage:', error);
    throw error;
  }
}

/**
 * Get usage limit for a subscription tier
 */
export function getUsageLimit(tier: keyof UsageLimits): number {
  return MONTHLY_LIMITS[tier];
}

/**
 * Format remaining generations for display
 */
export function formatRemainingGenerations(remaining: number): string {
  if (remaining === -1) {
    return 'Unlimited';
  }
  return remaining.toString();
}

/**
 * Get next reset date as a formatted string
 */
export function formatResetDate(resetDate: string): string {
  const date = new Date(resetDate);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}