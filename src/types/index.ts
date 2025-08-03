// Core application types

export interface CourseModule {
  id: string;
  title: string;
  summary: string;
  takeaways: string[];
  order: number;
  estimatedReadTime?: number;
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  modules: CourseModule[];
  metadata: {
    sourceType: 'tweet' | 'thread' | 'manual';
    sourceUrl?: string;
    originalContent?: string;
    generatedAt: string;
    version: number;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  subscriptionTier: 'free' | 'pro' | 'lifetime';
  usageCount: number;
  createdAt: string;
  lastActive: string;
}

export interface UsageTracking {
  userId: string;
  action: 'generate' | 'export_pdf' | 'export_notion' | 'export_markdown';
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface UserSubscription {
  tier: 'free' | 'pro' | 'lifetime';
  limits: {
    monthlyGenerations: number;
    pdfExports: boolean;
    notionExports: boolean;
    customBranding: boolean;
    watermarkFree: boolean;
  };
  usage: {
    currentMonthGenerations: number;
    totalGenerations: number;
    lastResetDate: string;
  };
}

export interface GenerateCourseRequest {
  content: string;
  type: 'url' | 'text';
  userId?: string;
  regenerate?: boolean;
}

export interface GenerateCourseResponse {
  success: boolean;
  course?: Course;
  error?: string;
  usageCount?: number;
}

export interface ExportRequest {
  courseId: string;
  format: 'pdf' | 'notion';
  options?: {
    includeWatermark?: boolean;
    customBranding?: boolean;
    notionPageId?: string;
  };
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    retryable: boolean;
  };
}

// Re-export database types for convenience
export type { 
  Database, 
  DbUser, 
  DbUserInsert, 
  DbUserUpdate,
  DbCourse,
  DbCourseInsert,
  DbCourseUpdate,
  DbUsageLog,
  DbUsageLogInsert,
  DbUsageLogUpdate,
  CourseModuleData
} from './database';