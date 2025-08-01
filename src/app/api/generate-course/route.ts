import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { generateCourseContent, ClaudeError } from '@/lib/claude';
import { processContent, ContentProcessingError, prepareContentForAI } from '@/lib/content-processor';
import { createAdminClient } from '@/lib/supabase';
import { checkMonthlyUsage, incrementMonthlyUsage } from '@/lib/usage-limits';
import { getOrCreateUserProfile } from '@/lib/auth';

// Types for the API
interface GenerateCourseRequest {
  content: string;
  type?: 'url' | 'text';
  regenerate?: boolean;
}

interface GenerateCourseResponse {
  success: boolean;
  course?: {
    id: string;
    title: string;
    modules: Array<{
      id: string;
      title: string;
      summary: string;
      takeaways: string[];
      order: number;
    }>;
    metadata: {
      sourceType: 'tweet' | 'thread' | 'manual';
      sourceUrl?: string;
      originalContent?: string;
      generatedAt: string;
      version: number;
    };
  };
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
  usageCount?: number;
}
const TIMEOUT_MS = 60_000; // adjust based on your hosting platform's limits

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('TimeoutError')), timeoutMs)
    ),
  ]);
}

// Rate limiting per user
const userRateLimit = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 5; // 5 requests per minute per user

function checkUserRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = userRateLimit.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    userRateLimit.set(userId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT_MAX) {
    return false;
  }

  userLimit.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting course generation API...');
    
    // Parse request body
    const body: GenerateCourseRequest = await request.json();
    const { content, regenerate = false } = body;
    console.log('📝 Request body parsed:', { contentLength: content?.length, regenerate });

    // Validate required fields
    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_CONTENT',
            message: 'Content is required',
            retryable: false,
          },
        } as GenerateCourseResponse,
        { status: 400 }
      );
    }

    // Get user authentication from Supabase Auth - REQUIRED
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    const userId = user?.id;
    
    console.log('👤 User authentication:', { 
      userId: userId ? 'authenticated' : 'not authenticated',
      email: user?.email 
    });

    // Require authentication for course generation
    if (!userId || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'You must be signed in to generate courses. Please create an account or sign in.',
            retryable: false,
          },
        } as GenerateCourseResponse,
        { status: 401 }
      );
    }
    
    // Check user rate limiting
    if (userId && !checkUserRateLimit(userId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again in a minute.',
            retryable: true,
          },
        } as GenerateCourseResponse,
        { status: 429 }
      );
    }

    // Process content
    let processedContent;
    try {
      console.log('🔄 Processing content...');
    
      processedContent = await withTimeout(processContent(content), TIMEOUT_MS);
    
      console.log('✅ Content processed successfully:', {
        type: processedContent.type,
        contentLength: processedContent.content.length,
      });
    } catch (error) {
      console.log('❌ Content processing failed:', error);
    
      if (error instanceof ContentProcessingError) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: error.code,
              message: error.message,
              retryable: error.retryable,
            },
          } as GenerateCourseResponse,
          { status: 400 }
        );
      }
    
      // Handle timeout error explicitly
      if (error instanceof Error && error.message === 'TimeoutError') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'TIMEOUT',
              message: 'The operation took too long. Please try again.',
              retryable: true,
            },
          } as GenerateCourseResponse,
          { status: 504 }
        );
      }
    
      throw error;
    }
    

    // Check user subscription and monthly usage limits
    let usageInfo;
    let dbUser = null;
    
    try {
      // Get or create user profile in database
      const email = user.email || '';
      dbUser = await getOrCreateUserProfile(userId, email);
      
      if (!dbUser) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'USER_PROFILE_ERROR',
              message: 'Failed to create or retrieve user profile',
              retryable: true,
            },
          } as GenerateCourseResponse,
          { status: 500 }
        );
      }
      
      usageInfo = await checkMonthlyUsage(userId);
      
      // Check if user can generate a course (skip check for regenerations)
      if (!regenerate && !usageInfo.canGenerate) {
        const resetDate = new Date(usageInfo.resetDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'MONTHLY_LIMIT_EXCEEDED',
              message: `Free plan allows 1 course generation per month. Your limit resets on ${resetDate}. Please upgrade to Pro for unlimited generations.`,
              retryable: false,
            },
            usageCount: usageInfo.currentUsage,
          } as GenerateCourseResponse,
          { status: 403 }
        );
      }
    } catch (error) {
      console.error('Error checking monthly usage:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to check usage limits',
            retryable: true,
          },
        } as GenerateCourseResponse,
        { status: 500 }
      );
    }

    // Prepare content for AI processing
    const aiReadyContent = prepareContentForAI(processedContent.content);

    // Generate course using Claude
    let generatedCourse;
    try {
      console.log('🚀 Starting Claude course generation...');
      generatedCourse = await generateCourseContent(aiReadyContent, userId || undefined);
      console.log('✅ Claude course generation successful');
    } catch (error) {
      console.log('❌ Claude course generation failed:', error);
      if (error instanceof ClaudeError) {
        console.log('🏷️  Claude error details:', {
          code: error.code,
          message: error.message,
          retryable: error.retryable
        });
        
        // For debugging, let's return more detailed error info
        const errorResponse = {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            retryable: error.retryable,
            debug: process.env.NODE_ENV === 'development' ? {
              timestamp: new Date().toISOString(),
              userId: userId || 'anonymous'
            } : undefined
          },
        } as GenerateCourseResponse;
        
        return NextResponse.json(
          errorResponse,
          { status: error.retryable ? 503 : 400 }
        );
      }
      console.log('❌ Non-Claude error:', error);
      throw error;
    }

    // Save course to database for authenticated user
    let courseId = `course-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const saveUserId = dbUser.id;
    
    try {
      // Save the course using the appropriate user ID
      const adminClient = createAdminClient();
      const { data: courseData, error: courseError } = await adminClient
        .from('courses')
        .insert({
          user_id: saveUserId,
          title: generatedCourse.title,
          original_content: processedContent.content,
          modules: generatedCourse.modules,
        })
        .select('id')
        .single();

      if (courseError) {
        console.error('Course save error:', courseError);
        throw new Error(`Failed to save course: ${courseError.message}`);
      } else if (courseData) {
        courseId = courseData.id;
        console.log('✅ Course saved successfully with ID:', courseId);
      }

      // Update monthly usage count (only for new generations, not regenerations)
      if (!regenerate) {
        try {
          await incrementMonthlyUsage(userId);
        } catch (error) {
          console.error('Monthly usage update error:', error);
        }
      }

      // Log the usage
      const { error: logError } = await adminClient
        .from('usage_logs')
        .insert({
          user_id: saveUserId,
          action: 'generate',
          metadata: {
            content_type: processedContent.type,
            course_id: courseId,
            user_email: user.email,
          },
        });

      if (logError) {
        console.error('Usage log error:', logError);
        // Don't fail the request for logging errors
      }
    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: `Failed to save course: ${dbError instanceof Error ? dbError.message : 'Unknown database error'}`,
            retryable: true,
          },
        } as GenerateCourseResponse,
        { status: 500 }
      );
    }

    // Return successful response
    return NextResponse.json(
      {
        success: true,
        course: {
          id: courseId,
          title: generatedCourse.title,
          modules: generatedCourse.modules,
          metadata: {
            sourceType: processedContent.type === 'url' ? 'tweet' : 'manual',
            sourceUrl: processedContent.type === 'url' ? content : undefined,
            originalContent: processedContent.content,
            generatedAt: new Date().toISOString(),
            version: 1,
          },
        },
        usageCount: usageInfo ? usageInfo.currentUsage + (regenerate ? 0 : 1) : undefined,
      } as GenerateCourseResponse,
      { status: 200 }
    );

  } catch (error) {
    console.error('Unexpected error in generate-course API:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
          retryable: true,
        },
      } as GenerateCourseResponse,
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'GET method not supported',
        retryable: false,
      },
    },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'PUT method not supported',
        retryable: false,
      },
    },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'DELETE method not supported',
        retryable: false,
      },
    },
    { status: 405 }
  );
}