/**
 * Minimal database stub for compatibility
 * This is a placeholder to prevent build errors
 */

import { getCurrentUser, incrementUsage } from './auth';

// Stub interfaces for compatibility
export interface DbUser {
  id: string;
  email: string;
  subscription_tier: 'free' | 'pro' | 'lifetime';
  usage_count: number;
  monthly_usage_count: number;
}

// Stub services for compatibility
export class UserService {
  static async getUserByAuthId(authUserId: string): Promise<DbUser | null> {
    const user = getCurrentUser();
    if (!user) return null;
    
    return {
      id: user.id,
      email: user.email,
      subscription_tier: user.subscriptionTier,
      usage_count: user.usageCount,
      monthly_usage_count: user.monthlyUsageCount,
    };
  }

  static async getOrCreateUser(authUserId: string, email: string): Promise<DbUser> {
    const user = getCurrentUser();
    return {
      id: user.id,
      email: user.email,
      subscription_tier: user.subscriptionTier,
      usage_count: user.usageCount,
      monthly_usage_count: user.monthlyUsageCount,
    };
  }
}

export class CourseService {
  static async createCourse(courseData: any): Promise<any> {
    // Stub - courses are not persisted in the simple auth system
    return { id: 'temp-course-id', ...courseData };
  }

  static async getCourseById(courseId: string): Promise<any | null> {
    // Stub - courses are not persisted in the simple auth system
    return null;
  }

  static async getUserCourses(userId: string): Promise<any[]> {
    // Stub - courses are not persisted in the simple auth system
    return [];
  }
}

export class UsageService {
  static async logAction(actionData: any): Promise<void> {
    // Use the simple auth system to increment usage
    incrementUsage();
    console.log('Usage logged:', actionData);
  }

  static async getUserUsage(userId: string): Promise<any> {
    const user = getCurrentUser();
    return {
      total_usage: user?.usageCount || 0,
      monthly_usage: user?.monthlyUsageCount || 0,
    };
  }
}

// Stub function for error handling
export function handleSupabaseError(error: unknown): never {
  console.error('Database error (stub):', error);
  const message = error && typeof error === 'object' && 'message' in error
    ? (error as { message: string }).message
    : 'Database operation failed';
  throw new Error(message);
}