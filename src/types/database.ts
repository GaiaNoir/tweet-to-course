// Database types for Supabase integration

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          subscription_status: 'free' | 'pro' | 'lifetime';
          monthly_usage_count: number;
          usage_reset_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          subscription_status?: 'free' | 'pro' | 'lifetime';
          monthly_usage_count?: number;
          usage_reset_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          subscription_status?: 'free' | 'pro' | 'lifetime';
          monthly_usage_count?: number;
          usage_reset_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      courses: {
        Row: {
          id: string;
          user_id: string;
          job_id?: string;
          title: string;
          original_content: string;
          modules: CourseModuleData[];
          metadata?: Record<string, any>;
          status: 'active' | 'archived' | 'deleted';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          job_id?: string;
          title: string;
          original_content: string;
          modules: CourseModuleData[];
          metadata?: Record<string, any>;
          status?: 'active' | 'archived' | 'deleted';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          job_id?: string;
          title?: string;
          original_content?: string;
          modules?: CourseModuleData[];
          metadata?: Record<string, any>;
          status?: 'active' | 'archived' | 'deleted';
          created_at?: string;
          updated_at?: string;
        };
      };
      usage_logs: {
        Row: {
          id: string;
          user_id: string;
          action: 'generate' | 'export_pdf' | 'export_notion';
          metadata: Record<string, any> | null;
          usage_month: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action: 'generate' | 'export_pdf' | 'export_notion';
          metadata?: Record<string, any> | null;
          usage_month?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          action?: 'generate' | 'export_pdf' | 'export_notion';
          metadata?: Record<string, any> | null;
          usage_month?: string;
          created_at?: string;
        };
      };
    };
  };
}

// Course module data structure for JSON storage
export interface CourseModuleData {
  id: string;
  title: string;
  summary: string;
  takeaways: string[];
  order: number;
  estimatedReadTime?: number;
}

// Type aliases for easier use
export type DbUser = Database['public']['Tables']['users']['Row'];
export type DbUserInsert = Database['public']['Tables']['users']['Insert'];
export type DbUserUpdate = Database['public']['Tables']['users']['Update'];

export type DbCourse = Database['public']['Tables']['courses']['Row'];
export type DbCourseInsert = Database['public']['Tables']['courses']['Insert'];
export type DbCourseUpdate = Database['public']['Tables']['courses']['Update'];

export type DbUsageLog = Database['public']['Tables']['usage_logs']['Row'];
export type DbUsageLogInsert = Database['public']['Tables']['usage_logs']['Insert'];
export type DbUsageLogUpdate = Database['public']['Tables']['usage_logs']['Update'];