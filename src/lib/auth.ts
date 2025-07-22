import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createClient } from './supabase';

export interface UserProfile {
  id: string;
  email: string;
  subscriptionTier: 'free' | 'pro' | 'lifetime';
  usageCount: number;
  monthlyUsageCount: number;
  monthlyUsageResetDate: string;
  createdAt: string;
  lastActive: string;
  customerCode?: string;
  subscriptionCode?: string;
}

/**
 * Get the current authenticated user from Clerk
 */
export async function getCurrentUser() {
  const user = await currentUser();
  return user;
}

/**
 * Get the current user's authentication status
 */
export async function getAuth() {
  return auth();
}

/**
 * Require authentication - redirect to sign-in if not authenticated
 */
export async function requireAuth() {
  const { userId } = auth();
  
  if (!userId) {
    redirect('/sign-in');
  }
  
  return userId;
}

/**
 * Get or create user profile in Supabase
 */
export async function getUserProfile(clerkUserId: string): Promise<UserProfile | null> {
  const supabase = createClient();
  
  // First, try to get existing user
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .single();
  
  if (existingUser && !fetchError) {
    return {
      id: existingUser.id,
      email: existingUser.email,
      subscriptionTier: existingUser.subscription_tier,
      usageCount: existingUser.usage_count,
      monthlyUsageCount: existingUser.monthly_usage_count || 0,
      monthlyUsageResetDate: existingUser.monthly_usage_reset_date,
      createdAt: existingUser.created_at,
      lastActive: existingUser.updated_at,
      customerCode: existingUser.customer_code,
      subscriptionCode: existingUser.subscription_code,
    };
  }
  
  // If user doesn't exist, create them
  const clerkUser = await getCurrentUser();
  if (!clerkUser) return null;
  
  const { data: newUser, error: createError } = await supabase
    .from('users')
    .insert({
      clerk_user_id: clerkUserId,
      email: clerkUser.emailAddresses[0]?.emailAddress || '',
      subscription_tier: 'free',
      usage_count: 0,
    })
    .select()
    .single();
  
  if (createError || !newUser) {
    console.error('Error creating user profile:', createError);
    return null;
  }
  
  return {
    id: newUser.id,
    email: newUser.email,
    subscriptionTier: newUser.subscription_tier,
    usageCount: newUser.usage_count,
    monthlyUsageCount: newUser.monthly_usage_count || 0,
    monthlyUsageResetDate: newUser.monthly_usage_reset_date,
    createdAt: newUser.created_at,
    lastActive: newUser.updated_at,
  };
}

/**
 * Update user's last active timestamp
 */
export async function updateUserActivity(clerkUserId: string) {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('users')
    .update({ updated_at: new Date().toISOString() })
    .eq('clerk_user_id', clerkUserId);
  
  if (error) {
    console.error('Error updating user activity:', error);
  }
}

/**
 * Check if user can perform an action based on their subscription tier
 */
export function canPerformAction(
  userProfile: UserProfile,
  action: 'generate' | 'export_pdf' | 'export_notion' | 'remove_watermark'
): boolean {
  switch (action) {
    case 'generate':
      return userProfile.subscriptionTier === 'free' 
        ? userProfile.monthlyUsageCount < 1 
        : true;
    
    case 'export_pdf':
      return true; // All users can export PDF
    
    case 'export_notion':
      return userProfile.subscriptionTier === 'pro' || userProfile.subscriptionTier === 'lifetime';
    
    case 'remove_watermark':
      return userProfile.subscriptionTier === 'pro' || userProfile.subscriptionTier === 'lifetime';
    
    default:
      return false;
  }
}