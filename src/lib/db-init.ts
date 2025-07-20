import { supabaseAdmin } from './supabase';
import { UserService } from './database';

/**
 * Initialize database connection and verify setup
 */
export async function initializeDatabase(): Promise<boolean> {
  try {
    // Test basic connection
    const { error } = await supabaseAdmin
      .from('users')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Database connection failed:', error.message);
      return false;
    }

    console.log('Database connection established successfully');
    return true;
  } catch (error) {
    console.error('Database initialization error:', error);
    return false;
  }
}

/**
 * Sync user data from Clerk to Supabase
 * This function should be called when a user signs in/up
 */
export async function syncUserFromClerk(
  clerkUserId: string,
  email: string
): Promise<void> {
  try {
    await UserService.getOrCreateUser(clerkUserId, email);
    console.log(`User synced successfully: ${email}`);
  } catch (error) {
    console.error('Failed to sync user from Clerk:', error);
    throw error;
  }
}

/**
 * Cleanup old usage logs (optional maintenance function)
 */
export async function cleanupOldUsageLogs(daysToKeep = 90): Promise<void> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const { error } = await supabaseAdmin
      .from('usage_logs')
      .delete()
      .lt('created_at', cutoffDate.toISOString());

    if (error) {
      console.error('Failed to cleanup old usage logs:', error);
      throw error;
    }

    console.log(`Cleaned up usage logs older than ${daysToKeep} days`);
  } catch (error) {
    console.error('Cleanup operation failed:', error);
    throw error;
  }
}

/**
 * Get database health status and basic metrics
 */
export async function getDatabaseHealth(): Promise<{
  isHealthy: boolean;
  metrics?: {
    totalUsers: number;
    totalCourses: number;
    totalUsageLogs: number;
    recentActivity: number; // courses created in last 24h
  };
  error?: string;
}> {
  try {
    // Check basic connectivity
    const { error: connectionError } = await supabaseAdmin
      .from('users')
      .select('id')
      .limit(1);

    if (connectionError) {
      return {
        isHealthy: false,
        error: connectionError.message,
      };
    }

    // Get metrics
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const [usersResult, coursesResult, logsResult, recentCoursesResult] = await Promise.all([
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('courses').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('usage_logs').select('*', { count: 'exact', head: true }),
      supabaseAdmin
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', yesterday.toISOString()),
    ]);

    return {
      isHealthy: true,
      metrics: {
        totalUsers: usersResult.count || 0,
        totalCourses: coursesResult.count || 0,
        totalUsageLogs: logsResult.count || 0,
        recentActivity: recentCoursesResult.count || 0,
      },
    };
  } catch (error) {
    return {
      isHealthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}