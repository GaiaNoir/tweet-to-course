import { createClient, createServerSupabaseClient } from './supabase';
import type { User } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export type AuthUser = User;
export type DbUser = Database['public']['Tables']['users']['Row'];

// Client-side auth functions
export const authClient = {
  // Sign up with email and password (with email confirmation)
  async signUp(email: string, password: string) {
    const supabase = createClient();
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  // Sign in with email and password
  async signIn(email: string, password: string) {
    const supabase = createClient();
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  // Sign out
  async signOut() {
    const supabase = createClient();
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw new Error(error.message);
    }
  },

  // Reset password
  async resetPassword(email: string) {
    const supabase = createClient();
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      throw new Error(error.message);
    }
  },

  // Update password
  async updatePassword(password: string) {
    const supabase = createClient();
    
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      throw new Error(error.message);
    }
  },

  // Get current user
  async getUser() {
    const supabase = createClient();
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      throw new Error(error.message);
    }

    return user;
  },

  // Get current session
  async getSession() {
    const supabase = createClient();
    
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      throw new Error(error.message);
    }

    return session;
  },

  // Listen to auth state changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    const supabase = createClient();
    
    return supabase.auth.onAuthStateChange(callback);
  },
};

// Server-side auth functions
export const authServer = {
  // Get user from server-side
  async getUser() {
    const supabase = await createServerSupabaseClient();
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Server auth error:', error);
      return null;
    }

    return user;
  },

  // Get session from server-side
  async getSession() {
    const supabase = await createServerSupabaseClient();
    
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Server session error:', error);
      return null;
    }

    return session;
  },

  // Server-side require authentication (throws if not authenticated)
  async requireAuth(): Promise<AuthUser> {
    const supabase = await createServerSupabaseClient();
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      throw new Error('Authentication required');
    }

    return user;
  },
};

// User profile functions
export const userProfile = {
  // Get user profile data
  async getProfile(userId: string): Promise<DbUser | null> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  },

  // Create user profile (called automatically by trigger)
  async createProfile(userId: string, email: string): Promise<DbUser> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: userId,
        email,
        subscription_status: 'free',
        monthly_usage_count: 0,
        usage_reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user profile: ${error.message}`);
    }

    return data;
  },

  // Update user profile
  async updateProfile(userId: string, updates: Partial<DbUser>): Promise<DbUser> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user profile: ${error.message}`);
    }

    return data;
  },

  // Increment usage count
  async incrementUsage(userId: string): Promise<void> {
    const supabase = createClient();
    
    const { error } = await supabase.rpc('increment_usage', {
      user_id: userId,
    });

    if (error) {
      // Fallback to manual increment if RPC doesn't exist
      const profile = await this.getProfile(userId);
      if (profile) {
        await this.updateProfile(userId, {
          monthly_usage_count: profile.monthly_usage_count + 1,
        });
      }
    }
  },

  // Check if user has usage remaining
  async hasUsageRemaining(userId: string): Promise<boolean> {
    const profile = await this.getProfile(userId);
    if (!profile) return false;

    // Check if usage needs to be reset
    const now = new Date();
    const resetDate = new Date(profile.usage_reset_date);
    
    if (now > resetDate) {
      // Reset usage count
      await this.updateProfile(userId, {
        monthly_usage_count: 0,
        usage_reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
      return true;
    }

    // Check limits based on subscription
    const limits = {
      free: 3,
      pro: 50,
      lifetime: Infinity,
    };

    const limit = limits[profile.subscription_status as keyof typeof limits] || 0;
    return profile.monthly_usage_count < limit;
  },
};

// Utility functions
export const authUtils = {
  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      const user = await authClient.getUser();
      return !!user;
    } catch {
      return false;
    }
  },

  // Get user ID safely
  async getUserId(): Promise<string | null> {
    try {
      const user = await authClient.getUser();
      return user?.id || null;
    } catch {
      return null;
    }
  },

  // Require authentication (throws if not authenticated)
  async requireAuth(): Promise<AuthUser> {
    const user = await authClient.getUser();
    if (!user) {
      throw new Error('Authentication required');
    }
    return user;
  },

  // Get user with profile data
  async getUserWithProfile(): Promise<{ user: AuthUser; profile: DbUser } | null> {
    try {
      const user = await authClient.getUser();
      if (!user) return null;

      const profile = await userProfile.getProfile(user.id);
      if (!profile) return null;

      return { user, profile };
    } catch {
      return null;
    }
  },
};

// Legacy function for backward compatibility with existing API
// This function is designed to be used server-side with admin privileges
export async function getOrCreateUserProfile(userId: string, email: string) {
  try {
    // Import admin client here to avoid circular dependencies
    const { createAdminClient } = await import('./supabase');
    const adminClient = createAdminClient();
    
    // First try to get existing profile using admin client
    const { data: profile, error: getError } = await adminClient
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profile && !getError) {
      return profile;
    }
    
    // If no profile exists, create one using admin client (bypasses RLS)
    const { data: newProfile, error: createError } = await adminClient
      .from('users')
      .insert({
        id: userId,
        email,
        subscription_status: 'free',
        monthly_usage_count: 0,
        usage_reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();
    
    if (createError) {
      console.error('Error creating user profile:', createError);
      return null;
    }
    
    return newProfile;
  } catch (error) {
    console.error('Error in getOrCreateUserProfile:', error);
    return null;
  }
}

// Additional legacy functions for backward compatibility
export async function getCurrentUser() {
  return await authServer.getUser();
}

export async function incrementUsage(userId?: string) {
  const user = userId ? { id: userId } : await authServer.getUser();
  if (user?.id) {
    return await userProfile.incrementUsage(user.id);
  }
}

export async function canPerformAction(action: string, userId?: string) {
  const user = userId ? { id: userId } : await authServer.getUser();
  if (!user?.id) return false;
  
  const profile = await userProfile.getProfile(user.id);
  if (!profile) return false;
  
  // Check subscription-based permissions
  const permissions = {
    'export_notion': ['pro', 'lifetime'],
    'export_pdf': ['free', 'pro', 'lifetime'],
    'generate': ['free', 'pro', 'lifetime'],
    'export_marketing_pdf': ['pro', 'lifetime']
  };
  
  const allowedTiers = permissions[action as keyof typeof permissions] || [];
  return allowedTiers.includes(profile.subscription_status);
}

export async function updateUserSubscription(userId: string, subscriptionTier: string) {
  return await userProfile.updateProfile(userId, {
    subscription_status: subscriptionTier as any
  });
}

export type SubscriptionTier = 'free' | 'pro' | 'lifetime';
