import { redirect } from 'next/navigation';
import { createClient } from './supabase';
import { User } from '@supabase/supabase-js';

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
 * Get the current authenticated user from Supabase
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Get the current user's authentication status
 */
export async function getAuth() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { userId: user?.id || null };
}

/**
 * Require authentication - redirect to sign-in if not authenticated
 */
export async function requireAuth(): Promise<string> {
  const { userId } = await getAuth();
  
  if (!userId) {
    redirect('/auth/sign-in');
  }
  
  return userId;
}

/**
 * Get or create user profile in Supabase
 */
export async function getUserProfile(authUserId?: string): Promise<UserProfile | null> {
  const supabase = createClient();
  
  // If no authUserId provided, get current user
  let userId = authUserId;
  if (!userId) {
    const user = await getCurrentUser();
    if (!user) return null;
    userId = user.id;
  }
  
  // First, try to get existing user
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', userId)
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
  
  // If user doesn't exist, the trigger should have created them
  // But let's handle the case where it didn't
  console.log('🔄 User profile not found, checking auth user:', userId);
  const authUser = await getCurrentUser();
  if (!authUser) {
    console.error('❌ Could not get auth user data');
    return null;
  }
  
  const { data: newUser, error: createError } = await supabase
    .from('users')
    .insert({
      auth_user_id: userId,
      email: authUser.email || '',
      subscription_tier: 'free',
      usage_count: 0,
      monthly_usage_count: 0,
      monthly_usage_reset_date: new Date().toISOString(),
    })
    .select()
    .single();
  
  if (createError) {
    console.error('❌ Error creating user profile:', createError);
    return null;
  }
  
  if (!newUser) {
    console.error('❌ No user data returned after creation');
    return null;
  }
  
  console.log('✅ Successfully created user profile:', newUser.id);
  
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
export async function updateUserActivity(authUserId?: string) {
  const supabase = createClient();
  
  let userId = authUserId;
  if (!userId) {
    const user = await getCurrentUser();
    if (!user) return;
    userId = user.id;
  }
  
  const { error } = await supabase
    .from('users')
    .update({ updated_at: new Date().toISOString() })
    .eq('auth_user_id', userId);
  
  if (error) {
    console.error('Error updating user activity:', error);
  }
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/');
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