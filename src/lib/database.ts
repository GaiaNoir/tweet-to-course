/**
 * Database service layer for TweetToCourse
 * Handles database operations with proper Supabase integration
 */

import { createClient, createAdminClient } from './supabase';
// Auth removed - UserProfile type removed

// Database interfaces
export interface DbUser extends UserProfile {}

export interface DbCourse {
  id: string;
  user_id: string;
  title: string;
  original_content: string;
  modules: any[];
  created_at: string;
  updated_at: string;
}

export interface DbUsageLog {
  id: string;
  user_id: string;
  action: 'generate' | 'export_pdf' | 'export_notion';
  metadata: any;
  created_at: string;
}

// User Service
export class UserService {
  static async getUserByAuthId(authUserId: string): Promise<DbUser | null> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authUserId)
        .single();

      if (error || !data) {
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error getting user by auth ID:', error);
      return null;
    }
  }

  static async getOrCreateUser(authUserId: string, email: string): Promise<DbUser | null> {
    try {
      // First try to get existing user
      const existingUser = await this.getUserByAuthId(authUserId);
      if (existingUser) {
        return existingUser;
      }

      // Create new user if doesn't exist
      const adminClient = createAdminClient();
      const { data, error } = await adminClient
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

      if (error) {
        console.error('Error creating user:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getOrCreateUser:', error);
      return null;
    }
  }

  static async updateSubscription(authUserId: string, tier: 'free' | 'pro' | 'lifetime'): Promise<DbUser | null> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('users')
        .update({ subscription_tier: tier })
        .eq('auth_user_id', authUserId)
        .select()
        .single();

      if (error) {
        console.error('Error updating subscription:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in updateSubscription:', error);
      return null;
    }
  }
}

// Course Service
export class CourseService {
  static async createCourse(courseData: {
    user_id: string;
    title: string;
    original_content: string;
    modules: any[];
  }): Promise<DbCourse | null> {
    try {
      const adminClient = createAdminClient();
      const { data, error } = await adminClient
        .from('courses')
        .insert(courseData)
        .select()
        .single();

      if (error) {
        console.error('Error creating course:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in createCourse:', error);
      return null;
    }
  }

  static async getCourseById(courseId: string): Promise<DbCourse | null> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (error || !data) {
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error getting course by ID:', error);
      return null;
    }
  }

  static async getUserCourses(userId: string): Promise<DbCourse[]> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting user courses:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserCourses:', error);
      return [];
    }
  }
}

// Usage Service
export class UsageService {
  static async logAction(actionData: {
    user_id: string;
    action: 'generate' | 'export_pdf' | 'export_notion';
    metadata?: any;
  }): Promise<void> {
    try {
      const adminClient = createAdminClient();
      const { error } = await adminClient
        .from('usage_logs')
        .insert(actionData);

      if (error) {
        console.error('Error logging action:', error);
      }
    } catch (error) {
      console.error('Error in logAction:', error);
    }
  }

  static async getUserUsage(userId: string): Promise<{
    total_usage: number;
    monthly_usage: number;
  }> {
    try {
      const supabase = createClient();
      
      // Get total usage count
      const { count: totalCount } = await supabase
        .from('usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Get monthly usage count
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: monthlyCount } = await supabase
        .from('usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', startOfMonth.toISOString());

      return {
        total_usage: totalCount || 0,
        monthly_usage: monthlyCount || 0,
      };
    } catch (error) {
      console.error('Error getting user usage:', error);
      return {
        total_usage: 0,
        monthly_usage: 0,
      };
    }
  }
}

// Error handling utility
export function handleSupabaseError(error: unknown): never {
  console.error('Database error:', error);
  const message = error && typeof error === 'object' && 'message' in error
    ? (error as { message: string }).message
    : 'Database operation failed';
  throw new Error(message);
}