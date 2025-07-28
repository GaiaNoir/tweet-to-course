import { createServerSupabaseClient, createAdminClient } from './supabase';

/**
 * Simple auth utilities that use Supabase Auth user metadata
 * instead of a separate users table
 */

export interface UserProfile {
  id: string;
  email: string;
  subscriptionTier: 'free' | 'pro' | 'lifetime';
  usageCount: number;
  monthlyUsageCount: number;
  monthlyUsageResetDate: string;
  createdAt: string;
}

/**
 * Get user profile from Supabase Auth metadata
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }

  // Get user metadata (subscription info stored here)
  const appMetadata = user.app_metadata || {};

  // Initialize default values if not set
  const now = new Date();
  const resetDate = appMetadata.monthly_usage_reset_date || now.toISOString();
  
  // Check if we need to reset monthly usage (new month)
  const lastReset = new Date(resetDate);
  const shouldReset = now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear();

  return {
    id: user.id,
    email: user.email || '',
    subscriptionTier: appMetadata.subscription_tier || 'free',
    usageCount: appMetadata.usage_count || 0,
    monthlyUsageCount: shouldReset ? 0 : (appMetadata.monthly_usage_count || 0),
    monthlyUsageResetDate: shouldReset ? now.toISOString() : resetDate,
    createdAt: user.created_at,
  };
}

/**
 * Update user subscription in Supabase Auth metadata
 */
export async function updateUserSubscription(userId: string, subscriptionTier: 'free' | 'pro' | 'lifetime'): Promise<void> {
  const adminClient = createAdminClient();
  
  // Get current user data
  const { data: { user }, error: getUserError } = await adminClient.auth.admin.getUserById(userId);
  
  if (getUserError || !user) {
    throw new Error(`Failed to get user: ${getUserError?.message || 'User not found'}`);
  }

  // Update app metadata (admin only)
  const { error } = await adminClient.auth.admin.updateUserById(userId, {
    app_metadata: {
      ...user.app_metadata,
      subscription_tier: subscriptionTier,
      updated_at: new Date().toISOString()
    }
  });

  if (error) {
    throw new Error(`Failed to update subscription: ${error.message}`);
  }
}

/**
 * Increment user usage count
 */
export async function incrementUsageCount(userId: string): Promise<void> {
  const adminClient = createAdminClient();
  
  // Get current user data
  const { data: { user }, error: getUserError } = await adminClient.auth.admin.getUserById(userId);
  
  if (getUserError || !user) {
    throw new Error(`Failed to get user: ${getUserError?.message || 'User not found'}`);
  }

  const appMetadata = user.app_metadata || {};
  const currentUsage = appMetadata.usage_count || 0;
  const currentMonthlyUsage = appMetadata.monthly_usage_count || 0;
  
  // Check if we need to reset monthly usage
  const now = new Date();
  const resetDate = appMetadata.monthly_usage_reset_date || now.toISOString();
  const lastReset = new Date(resetDate);
  const shouldReset = now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear();
  
  const { error } = await adminClient.auth.admin.updateUserById(userId, {
    app_metadata: {
      ...appMetadata,
      usage_count: currentUsage + 1,
      monthly_usage_count: shouldReset ? 1 : currentMonthlyUsage + 1,
      monthly_usage_reset_date: shouldReset ? now.toISOString() : resetDate,
      updated_at: new Date().toISOString()
    }
  });

  if (error) {
    throw new Error(`Failed to update usage: ${error.message}`);
  }
}

/**
 * Initialize user metadata on first login
 */
export async function initializeUserMetadata(userId: string): Promise<void> {
  const adminClient = createAdminClient();
  
  // Get current user data
  const { data: { user }, error: getUserError } = await adminClient.auth.admin.getUserById(userId);
  
  if (getUserError || !user) {
    throw new Error(`Failed to get user: ${getUserError?.message || 'User not found'}`);
  }

  // Only initialize if not already set
  if (!user.app_metadata?.subscription_tier) {
    const now = new Date().toISOString();
    
    const { error } = await adminClient.auth.admin.updateUserById(userId, {
      app_metadata: {
        ...user.app_metadata,
        subscription_tier: 'free',
        usage_count: 0,
        monthly_usage_count: 0,
        monthly_usage_reset_date: now,
        created_at: now,
        updated_at: now
      }
    });

    if (error) {
      throw new Error(`Failed to initialize user metadata: ${error.message}`);
    }
  }
}

/**
 * Check if user can perform action based on their subscription
 */
export async function canUserPerformAction(action: 'generate' | 'export_pdf' | 'export_notion'): Promise<boolean> {
  const profile = await getUserProfile();
  if (!profile) return false;

  switch (action) {
    case 'generate':
      return profile.subscriptionTier === 'free' 
        ? profile.monthlyUsageCount < 1 
        : true;
    
    case 'export_pdf':
      return true; // All users can export PDF
    
    case 'export_notion':
      return profile.subscriptionTier === 'pro' || profile.subscriptionTier === 'lifetime';
    
    default:
      return false;
  }
}