import { supabaseAdmin } from '@/lib/supabase';

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
export async function checkMonthlyUsage(clerkUserId: string): Promise<UsageInfo> {
  
  try {
    // Use the database function to get current monthly usage
    const { data, error } = await supabaseAdmin
      .rpc('get_monthly_usage', { user_clerk_id: clerkUserId });
    
    if (error) {
      console.error('Error checking monthly usage:', error);
      throw new Error('Failed to check usage limits');
    }
    
    // Handle case where user doesn't exist yet
    if (!data || data.length === 0) {
      return {
        currentUsage: 0,
        resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        subscriptionTier: 'free',
        canGenerate: true,
        remainingGenerations: MONTHLY_LIMITS.free,
      };
    }
    
    const usageData = data[0];
    const tier = usageData.subscription_tier as keyof UsageLimits;
    const limit = MONTHLY_LIMITS[tier];
    const currentUsage = usageData.current_usage || 0;
    
    // Unlimited tiers can always generate
    const canGenerate = limit === -1 || currentUsage < limit;
    const remainingGenerations = limit === -1 ? -1 : Math.max(0, limit - currentUsage);
    
    return {
      currentUsage,
      resetDate: usageData.reset_date,
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
export async function incrementMonthlyUsage(clerkUserId: string): Promise<number> {
  try {
    const { data, error } = await supabaseAdmin
      .rpc('increment_monthly_usage', { user_clerk_id: clerkUserId });
    
    if (error) {
      console.error('Error incrementing monthly usage:', error);
      throw new Error('Failed to update usage count');
    }
    
    return data || 0;
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