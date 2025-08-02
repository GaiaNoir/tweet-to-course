import { createClient, createAdminClient } from './supabase';
import type { Database } from '@/types/database';

export type Course = Database['public']['Tables']['courses']['Row'];
export type CourseInsert = Database['public']['Tables']['courses']['Insert'];
export type CourseUpdate = Database['public']['Tables']['courses']['Update'];

export interface CourseWithJob extends Course {
  job?: {
    id: string;
    status: string;
    created_at: string;
  };
}

export interface CourseMetadata {
  sourceType: 'tweet' | 'thread' | 'manual';
  sourceUrl?: string;
  generationModel?: string;
  processingTime?: number;
  version?: number;
  [key: string]: any;
}

export const courseService = {
  /**
   * Create a new course when a job completes successfully
   */
  async createCourseFromJob(
    userId: string,
    jobId: string,
    title: string,
    originalContent: string,
    modules: any[],
    metadata: CourseMetadata = { sourceType: 'manual' }
  ): Promise<Course> {
    const adminClient = createAdminClient();
    
    const courseData: CourseInsert = {
      user_id: userId,
      job_id: jobId,
      title,
      original_content: originalContent,
      modules,
      metadata,
      status: 'active',
    };

    const { data, error } = await adminClient
      .from('courses')
      .insert(courseData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create course: ${error.message}`);
    }

    return data;
  },

  /**
   * Get all courses for a user
   */
  async getUserCourses(userId: string): Promise<CourseWithJob[]> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        job:jobs(id, status, created_at)
      `)
      .eq('user_id', userId)
      .neq('status', 'deleted')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch courses: ${error.message}`);
    }

    return data || [];
  },

  /**
   * Get a specific course by ID
   */
  async getCourse(courseId: string, userId?: string): Promise<Course | null> {
    const supabase = createClient();
    
    let query = supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .neq('status', 'deleted')
      .single();

    // If userId is provided, ensure the user owns the course
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Course not found
      }
      throw new Error(`Failed to fetch course: ${error.message}`);
    }

    return data;
  },

  /**
   * Update a course
   */
  async updateCourse(
    courseId: string,
    userId: string,
    updates: Partial<CourseUpdate>
  ): Promise<Course> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('courses')
      .update(updates)
      .eq('id', courseId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update course: ${error.message}`);
    }

    return data;
  },

  /**
   * Archive a course (soft delete)
   */
  async archiveCourse(courseId: string, userId: string): Promise<void> {
    await this.updateCourse(courseId, userId, { status: 'archived' });
  },

  /**
   * Delete a course (soft delete)
   */
  async deleteCourse(courseId: string, userId: string): Promise<void> {
    await this.updateCourse(courseId, userId, { status: 'deleted' });
  },

  /**
   * Restore an archived course
   */
  async restoreCourse(courseId: string, userId: string): Promise<void> {
    await this.updateCourse(courseId, userId, { status: 'active' });
  },

  /**
   * Get course statistics for a user
   */
  async getUserCourseStats(userId: string): Promise<{
    totalCourses: number;
    activeCourses: number;
    archivedCourses: number;
    firstCourseCreated: string | null;
    lastCourseCreated: string | null;
  }> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('course_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // If no stats found, return default values
      return {
        totalCourses: 0,
        activeCourses: 0,
        archivedCourses: 0,
        firstCourseCreated: null,
        lastCourseCreated: null,
      };
    }

    return {
      totalCourses: data.total_courses || 0,
      activeCourses: data.active_courses || 0,
      archivedCourses: data.archived_courses || 0,
      firstCourseCreated: data.first_course_created,
      lastCourseCreated: data.last_course_created,
    };
  },

  /**
   * Search courses by title or content
   */
  async searchUserCourses(
    userId: string,
    searchTerm: string
  ): Promise<Course[]> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('user_id', userId)
      .neq('status', 'deleted')
      .or(`title.ilike.%${searchTerm}%,original_content.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to search courses: ${error.message}`);
    }

    return data || [];
  },

  /**
   * Get courses with detailed job information using the database function
   */
  async getUserCoursesWithJobs(userId: string): Promise<any[]> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .rpc('get_user_courses_with_jobs', { user_uuid: userId });

    if (error) {
      throw new Error(`Failed to fetch courses with jobs: ${error.message}`);
    }

    return data || [];
  },

  /**
   * Link an existing course to a job (for retroactive linking)
   */
  async linkCourseToJob(
    courseId: string,
    jobId: string,
    userId: string
  ): Promise<void> {
    await this.updateCourse(courseId, userId, { job_id: jobId });
  },
};
