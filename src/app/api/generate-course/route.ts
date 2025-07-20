import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateCourseContent, OpenAIError } from '@/lib/openai';
import { processContent, ContentProcessingError, prepareContentForAI } from '@/lib/content-processor';
import { createClient } from '@/lib/database';

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
    generatedAt: string;
  };
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
  usageCount?: number;
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
    // Parse request body
    const body: GenerateCourseRequest = await request.json();
    const { content, regenerate = false } = body;

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

    // Get user authentication
    const { userId } = await auth();
    
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
      processedContent = await processContent(content);
    } catch (error) {
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
      throw error;
    }

    // Check user subscription and usage limits
    let currentUsageCount = 0;
    let userTier = 'free';
    
    if (userId) {
      const supabase = createClient();
      
      // Get user data
      const userQuery = await supabase
        .from('users')
        .select('subscription_tier, usage_count')
        .eq('clerk_user_id', userId)
        .single();
      
      const { data: userData, error: userError } = userQuery;

      if (userError && userError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Database error:', userError);
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DATABASE_ERROR',
              message: 'Failed to check user status',
              retryable: true,
            },
          } as GenerateCourseResponse,
          { status: 500 }
        );
      }

      if (userData) {
        currentUsageCount = userData.usage_count || 0;
        userTier = userData.subscription_tier || 'free';
      }

      // Check usage limits for free users
      if (userTier === 'free' && currentUsageCount >= 1 && !regenerate) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'USAGE_LIMIT_EXCEEDED',
              message: 'Free plan allows 1 course generation. Please upgrade to Pro for unlimited generations.',
              retryable: false,
            },
            usageCount: currentUsageCount,
          } as GenerateCourseResponse,
          { status: 403 }
        );
      }
    }

    // Prepare content for AI processing
    const aiReadyContent = prepareContentForAI(processedContent.content);

    // Generate course using OpenAI
    let generatedCourse;
    try {
      generatedCourse = await generateCourseContent(aiReadyContent, userId || undefined);
    } catch (error) {
      if (error instanceof OpenAIError) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: error.code,
              message: error.message,
              retryable: error.retryable,
            },
          } as GenerateCourseResponse,
          { status: error.retryable ? 503 : 400 }
        );
      }
      throw error;
    }

    // Save course to database and update usage
    let courseId = `course-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    if (userId) {
      const supabase = createClient();
      
      try {
        // Start a transaction-like operation
        // First, save the course
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .insert({
            user_id: userId,
            title: generatedCourse.title,
            original_content: processedContent.content,
            modules: generatedCourse.modules,
          })
          .select('id')
          .single();

        if (courseError) {
          console.error('Course save error:', courseError);
        } else if (courseData) {
          courseId = courseData.id;
        }

        // Update user usage count (only for new generations, not regenerations)
        if (!regenerate) {
          const { error: usageError } = await supabase
            .from('users')
            .upsert({
              clerk_user_id: userId,
              usage_count: currentUsageCount + 1,
              subscription_tier: userTier,
            });

          if (usageError) {
            console.error('Usage update error:', usageError);
          }

          // Log the usage
          const { error: logError } = await supabase
            .from('usage_logs')
            .insert({
              user_id: userId,
              action: 'generate',
              metadata: {
                content_type: processedContent.type,
                course_id: courseId,
              },
            });

          if (logError) {
            console.error('Usage log error:', logError);
          }
        }
      } catch (dbError) {
        console.error('Database operation failed:', dbError);
        // Continue with response even if database operations fail
      }
    }

    // Return successful response
    return NextResponse.json(
      {
        success: true,
        course: {
          id: courseId,
          title: generatedCourse.title,
          modules: generatedCourse.modules,
          generatedAt: new Date().toISOString(),
        },
        usageCount: userId ? currentUsageCount + (regenerate ? 0 : 1) : undefined,
      } as GenerateCourseResponse,
      { status: 200 }
    );

  } catch (error) {
    console.error('Unexpected error in generate-course API:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred. Please try again.',
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