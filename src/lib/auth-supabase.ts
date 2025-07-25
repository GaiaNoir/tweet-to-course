import { createServerSupabaseClient, createAdminClient } from './supabase';
import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

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
 * Get the current authenticated user from Supabase Auth
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Get the current user's authentication status
 */
export async function getAuth() {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
}

/**
 * Require authentication - redirect to sign-in if not authenticated
 */
export async function requireAuth(): Promise<User> {
  console.log('🔐 Checking authentication...');
  const user = await getCurrentUser();
  
  if (!user) {
    console.log('❌ No authenticated user found, redirecting to sign-in');
    redirect('/auth/sign-in');
  }
  
  console.log('✅ User authenticated:', user.id);
  return user;
}

/**
 * Get or create user profile in Supabase
 */
export async function getUserProfile(authUserId: string): Promise<UserProfile | null> {
  console.log('🔍 Looking for user profile with auth_user_id:', authUserId);
  const supabase = createAdminClient();
  
  // First, try to get existing user by auth_user_id
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', authUserId)
    .single();
  
  console.log('🔍 Existing user lookup result:', { existingUser, fetchError });
  
  if (existingUser && !fetchError) {
    console.log('✅ Found existing user profile:', existingUser.id);
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
  
  // Get current user data for email
  const currentUser = await getCurrentUser();
  if (!currentUser || !currentUser.email) {
    console.error('❌ Could not get current user data or email');
    return null;
  }
  
  // Check if there's an existing user with the same email (from Clerk migration)
  console.log('🔍 Checking for existing user with email:', currentUser.email);
  const { data: emailUser, error: emailError } = await supabase
    .from('users')
    .select('*')
    .eq('email', currentUser.email)
    .is('auth_user_id', null)
    .single();
  
  if (emailUser && !emailError) {
    console.log('🔄 Found existing user from Clerk migration, updating with auth_user_id');
    
    // Update the existing user with the new auth_user_id
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ auth_user_id: authUserId })
      .eq('id', emailUser.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Error updating user with auth_user_id:', updateError);
      return null;
    }
    
    console.log('✅ Successfully updated user profile with auth_user_id:', updatedUser.id);
    
    return {
      id: updatedUser.id,
      email: updatedUser.email,
      subscriptionTier: updatedUser.subscription_tier,
      usageCount: updatedUser.usage_count,
      monthlyUsageCount: updatedUser.monthly_usage_count || 0,
      monthlyUsageResetDate: updatedUser.monthly_usage_reset_date,
      createdAt: updatedUser.created_at,
      lastActive: updatedUser.updated_at,
      customerCode: updatedUser.customer_code,
      subscriptionCode: updatedUser.subscription_code,
    };
  }
  
  // If no existing user found, create a new one
  console.log('🔄 Creating new user profile for Auth ID:', authUserId);
  
  const { data: newUser, error: createError } = await supabase
    .from('users')
    .insert({
      auth_user_id: authUserId,
      email: currentUser.email,
      subscription_tier: 'free',
      usage_count: 0,
      monthly_usage_count: 0,
      monthly_usage_reset_date: new Date().toISOString(),
    })
    .select()
    .single();
  
  if (createError) {
    console.error('❌ Error creating user profile:', createError);
    console.error('❌ Error details:', {
      code: createError.code,
      message: createError.message,
      details: createError.details,
      hint: createError.hint
    });
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
export async function updateUserActivity(authUserId: string) {
  const supabase = createAdminClient();
  
  const { error } = await supabase
    .from('users')
    .update({ updated_at: new Date().toISOString() })
    .eq('auth_user_id', authUserId);
  
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

/**
 * Sign out the current user
 */
export async function signOut() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect('/');
}