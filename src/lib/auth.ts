/**
 * Supabase Authentication System
 * Handles user authentication, registration, and profile management
 */

import { createClient } from '@/lib/supabase';
import { createAdminClient } from '@/lib/supabase';

export type SubscriptionTier = 'free' | 'pro' | 'lifetime';

export interface User {
  id: string; // Supabase auth user ID
  email: string;
  subscriptionTier: SubscriptionTier;
  usageCount: number;
  monthlyUsageCount: number;
  monthlyUsageResetDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string; // Database user profile ID
  auth_user_id: string; // References auth.users.id
  email: string;
  subscription_tier: SubscriptionTier;
  usage_count: number;
  monthly_usage_count: number;
  monthly_usage_reset_date: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get current authenticated user from Supabase
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = createClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      return null;
    }

    // Get user profile from database
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', authUser.id)
      .single();

    if (profileError || !profile) {
      console.error('Failed to get user profile:', profileError);
      return null;
    }

    return {
      id: authUser.id,
      email: profile.email,
      subscriptionTier: profile.subscription_tier,
      usageCount: profile.usage_count,
      monthlyUsageCount: profile.monthly_usage_count,
      monthlyUsageResetDate: profile.monthly_usage_reset_date,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Sign up a new user
 */
export async function signUp(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
  try {
    console.log('🔐 Starting signup process for:', email);
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { user: null, error: 'Please enter a valid email address' };
    }
    
    const supabase = createClient();
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    console.log('📧 Signup response:', { 
      user: data.user ? 'created' : 'null', 
      session: data.session ? 'exists' : 'null',
      error: error?.message 
    });

    if (error) {
      console.error('❌ Signup error:', error.message);
      return { user: null, error: error.message };
    }

    if (!data.user) {
      console.error('❌ No user returned from signup');
      return { user: null, error: 'Failed to create user' };
    }

    // Email confirmation is disabled, so we should have a session immediately
    console.log('✅ User signed up successfully, session:', !!data.session);

    console.log('✅ User signed up successfully');
    
    // If no session was created (email confirmation required), auto-confirm the user
    if (!data.session) {
      console.log('⚠️  No session created, auto-confirming user...');
      
      try {
        // Auto-confirm the user using a server-side API call
        const confirmResponse = await fetch('/api/auth/confirm-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: data.user.id,
            email: email,
            password: password,
          }),
        });

        const confirmResult = await confirmResponse.json();

        if (confirmResult.success) {
          console.log('✅ User auto-confirmed, now signing in...');
          
          // Now try to sign in with the confirmed user
          const { data: signinData, error: signinError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (signinError) {
            console.error('❌ Signin after confirm failed:', signinError.message);
            return { user: null, error: 'Account confirmed but signin failed. Please try signing in manually.' };
          }

          if (signinData.session) {
            console.log('✅ Signin successful after confirmation!');
            
            // Wait a moment then get the current user
            await new Promise(resolve => setTimeout(resolve, 1000));
            const user = await getCurrentUser();
            
            return { user, error: null };
          } else {
            return { user: null, error: 'Account confirmed but no session created.' };
          }
        } else {
          console.error('❌ Auto-confirm failed:', confirmResult.error);
          return { user: null, error: 'Account created but confirmation failed. Please contact support.' };
        }
      } catch (confirmErr) {
        console.error('❌ Auto-confirm attempt failed:', confirmErr);
        return { user: null, error: 'Account created but confirmation failed. Please try again.' };
      }
    }
    
    // Wait for the database trigger to create the user profile
    await new Promise(resolve => setTimeout(resolve, 2000));

    const user = await getCurrentUser();
    console.log('👤 Final user state:', user ? 'authenticated' : 'not authenticated');
    
    return { user, error: null };
  } catch (error) {
    console.error('💥 Signup process failed:', error);
    return { user: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Sign in an existing user
 */
export async function signIn(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { user: null, error: error.message };
    }

    const user = await getCurrentUser();
    return { user, error: null };
  } catch (error) {
    return { user: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<{ error: string | null }> {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Update user subscription tier
 */
export async function updateUserSubscription(tier: SubscriptionTier): Promise<{ user: User | null; error: string | null }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { user: null, error: 'User not authenticated' };
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('users')
      .update({ subscription_tier: tier })
      .eq('auth_user_id', currentUser.id)
      .select()
      .single();

    if (error) {
      return { user: null, error: error.message };
    }

    const updatedUser = await getCurrentUser();
    return { user: updatedUser, error: null };
  } catch (error) {
    return { user: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Increment user usage count
 */
export async function incrementUsage(): Promise<{ user: User | null; error: string | null }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { user: null, error: 'User not authenticated' };
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('users')
      .update({ 
        usage_count: currentUser.usageCount + 1,
        monthly_usage_count: currentUser.monthlyUsageCount + 1,
      })
      .eq('auth_user_id', currentUser.id)
      .select()
      .single();

    if (error) {
      return { user: null, error: error.message };
    }

    const updatedUser = await getCurrentUser();
    return { user: updatedUser, error: null };
  } catch (error) {
    return { user: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Check if user can perform a specific action
 */
export async function canPerformAction(action: 'generate' | 'export_pdf' | 'export_notion'): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user) return false;

    switch (action) {
      case 'generate':
        return user.subscriptionTier === 'free' 
          ? user.monthlyUsageCount < 1 
          : true;
      
      case 'export_pdf':
        return true; // All users can export PDF
      
      case 'export_notion':
        return user.subscriptionTier === 'pro' || user.subscriptionTier === 'lifetime';
      
      default:
        return false;
    }
  } catch (error) {
    console.error('Error checking user permissions:', error);
    return false;
  }
}

/**
 * Get or create user profile (for server-side operations)
 */
export async function getOrCreateUserProfile(authUserId: string, email: string): Promise<UserProfile | null> {
  try {
    const adminClient = createAdminClient();
    
    // First try to get existing profile
    const { data: existingProfile, error: getError } = await adminClient
      .from('users')
      .select('*')
      .eq('auth_user_id', authUserId)
      .single();

    if (existingProfile && !getError) {
      return existingProfile;
    }

    // If profile doesn't exist, create it
    const { data: newProfile, error: createError } = await adminClient
      .from('users')
      .insert({
        auth_user_id: authUserId,
        email,
        subscription_tier: 'free',
        usage_count: 0,
        monthly_usage_count: 0,
        monthly_usage_reset_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error('Failed to create user profile:', createError);
      return null;
    }

    return newProfile;
  } catch (error) {
    console.error('Error in getOrCreateUserProfile:', error);
    return null;
  }
}

/**
 * Reset monthly usage for all users (admin function)
 */
export async function resetMonthlyUsage(): Promise<{ success: boolean; error: string | null }> {
  try {
    const adminClient = createAdminClient();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);

    const { error } = await adminClient
      .from('users')
      .update({
        monthly_usage_count: 0,
        monthly_usage_reset_date: nextMonth.toISOString(),
      })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Don't reset anonymous user

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}