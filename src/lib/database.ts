import { supabase, supabaseAdmin, handleSupabaseError } from './supabase';
import type { 
  DbUser, 
  DbUserInsert, 
  DbUserUpdate,
  DbCourse,
  DbCourseInsert,
  DbCourseUpdate,
  DbUsageLog,
  DbUsageLogInsert
} from '@/types/database';

// Re-export createClient for compatibility
export { supabase as createClient, supabaseAdmin, handleSupabaseError } from './supabase';

// Export the database instance for backward compatibility
export const database = supabase;

// User operations
export class UserService {
  /**
   * Create a new user in the database
   */
  static async createUser(userData: DbUserInsert): Promise<DbUser> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (error) handleSupabaseError(error);
    return data;
  }

  /**
   * Get user by Clerk user ID
   */
  static async getUserByClerkId(clerkUserId: string): Promise<DbUser | null> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      handleSupabaseError(error);
    }

    return data;
  }

  /**
   * Update user data
   */
  static async updateUser(clerkUserId: string, updates: DbUserUpdate): Promise<DbUser> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('clerk_user_id', clerkUserId)
      .select()
      .single();

    if (error) handleSupabaseError(error);
    return data;
  }

  /**
   * Increment user usage count
   */
  static async incrementUsageCount(clerkUserId: string): Promise<DbUser> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ usage_count: supabaseAdmin.raw('usage_count + 1') })
      .eq('clerk_user_id', clerkUserId)
      .select()
      .single();

    if (error) handleSupabaseError(error);
    return data;
  }

  /**
   * Get or create user (upsert operation)
   */
  static async getOrCreateUser(clerkUserId: string, email: string): Promise<DbUser> {
    let user = await this.getUserByClerkId(clerkUserId);
    
    if (!user) {
      user = await this.createUser({
        clerk_user_id: clerkUserId,
        email,
        subscription_tier: 'free',
        usage_count: 0,
      });
    }

    return user;
  }
}

// Course operations
export class CourseService {
  /**
   * Create a new course
   */
  static async createCourse(courseData: DbCourseInsert): Promise<DbCourse> {
    const { data, error } = await supabaseAdmin
      .from('courses')
      .insert(courseData)
      .select()
      .single();

    if (error) handleSupabaseError(error);
    return data;
  }

  /**
   * Get course by ID
   */
  static async getCourseById(courseId: string): Promise<DbCourse | null> {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (error && error.code !== 'PGRST116') {
      handleSupabaseError(error);
    }

    return data;
  }

  /**
   * Get all courses for a user
   */
  static async getUserCourses(userId: string, limit = 50, offset = 0): Promise<DbCourse[]> {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) handleSupabaseError(error);
    return data || [];
  }

  /**
   * Update course
   */
  static async updateCourse(courseId: string, updates: DbCourseUpdate): Promise<DbCourse> {
    const { data, error } = await supabase
      .from('courses')
      .update(updates)
      .eq('id', courseId)
      .select()
      .single();

    if (error) handleSupabaseError(error);
    return data;
  }

  /**
   * Delete course
   */
  static async deleteCourse(courseId: string): Promise<void> {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);

    if (error) handleSupabaseError(error);
  }

  /**
   * Get user's course count
   */
  static async getUserCourseCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) handleSupabaseError(error);
    return count || 0;
  }
}

// Usage tracking operations
export class UsageService {
  /**
   * Log user action
   */
  static async logAction(logData: DbUsageLogInsert): Promise<DbUsageLog> {
    const { data, error } = await supabaseAdmin
      .from('usage_logs')
      .insert(logData)
      .select()
      .single();

    if (error) handleSupabaseError(error);
    return data;
  }

  /**
   * Get user's usage logs
   */
  static async getUserUsageLogs(
    userId: string, 
    action?: string, 
    limit = 100, 
    offset = 0
  ): Promise<DbUsageLog[]> {
    let query = supabase
      .from('usage_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (action) {
      query = query.eq('action', action);
    }

    const { data, error } = await query;

    if (error) handleSupabaseError(error);
    return data || [];
  }

  /**
   * Get user's monthly usage count for a specific action
   */
  static async getMonthlyUsageCount(
    userId: string, 
    action: 'generate' | 'export_pdf' | 'export_notion'
  ): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count, error } = await supabase
      .from('usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('action', action)
      .gte('created_at', startOfMonth.toISOString());

    if (error) handleSupabaseError(error);
    return count || 0;
  }

  /**
   * Check if user has exceeded their monthly limit
   */
  static async hasExceededLimit(
    userId: string, 
    subscriptionTier: 'free' | 'pro' | 'lifetime',
    action: 'generate' | 'export_pdf' | 'export_notion' = 'generate'
  ): Promise<boolean> {
    // Pro and lifetime users have unlimited generations
    if (subscriptionTier === 'pro' || subscriptionTier === 'lifetime') {
      return false;
    }

    // Free users get 1 generation per month
    if (action === 'generate') {
      const monthlyCount = await this.getMonthlyUsageCount(userId, action);
      return monthlyCount >= 1;
    }

    return false;
  }
}

// Database health check
export class DatabaseService {
  /**
   * Test database connection
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .select('id')
        .limit(1);

      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Get database statistics
   */
  static async getStats(): Promise<{
    totalUsers: number;
    totalCourses: number;
    totalUsageLogs: number;
  }> {
    const [usersResult, coursesResult, logsResult] = await Promise.all([
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('courses').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('usage_logs').select('*', { count: 'exact', head: true }),
    ]);

    return {
      totalUsers: usersResult.count || 0,
      totalCourses: coursesResult.count || 0,
      totalUsageLogs: logsResult.count || 0,
    };
  }
}