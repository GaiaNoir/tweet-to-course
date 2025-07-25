import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { generateCourseContent, OpenAIError } from '@/lib/openai';
import { processContent, ContentProcessingError, prepareContentForAI } from '@/lib/content-processor';
import { createAdminClient } from '@/lib/supabase';
import { checkMonthlyUsage, incrementMonthlyUsage } from '@/lib/usage-limits';
import { UserService } from '@/lib/database';

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

    // Get user authentication
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    const userId = user?.id;
    console.log('👤 User authentication:', { userId: userId ? 'authenticated' : 'anonymous' });
    
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
      processedContent = await processContent(content);
      console.log('✅ Content processed successfully:', { type: processedContent.type, contentLength: processedContent.content.length });
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
      throw error;
    }

    // Check user subscription and monthly usage limits
    let usageInfo;
    
    let dbUser = null;
    if (userId && user) {
      try {
        // First, ensure user exists in Supabase
        const email = user.email || '';
        // This will create the user if they don't exist
        dbUser = await UserService.getOrCreateUser(userId, email);
        
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
    let courseId = `course-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    
    if (userId && dbUser) {
      try {
        // Start a transaction-like operation
        // First, save the course using the database user ID
        const adminClient = createAdminClient();
        const { data: courseData, error: courseError } = await adminClient
          .from('courses')
          .insert({
            user_id: dbUser.id, // Use database user ID, not Clerk user ID
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

        // Update monthly usage count (only for new generations, not regenerations)
        if (!regenerate) {
          try {
            await incrementMonthlyUsage(userId);
          } catch (error) {
            console.error('Monthly usage update error:', error);
          }

          // Log the usage
          const { error: logError } = await adminClient
            .from('usage_logs')
            .insert({
              user_id: dbUser.id, // Use database user ID, not Clerk user ID
              action: 'generate',
              metadata: {
                content_type: processedContent.type,
                course_id: courseId,
              },
              usage_month: new Date().toISOString().slice(0, 10), // YYYY-MM-DD format
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
          metadata: {
            sourceType: processedContent.type === 'url' ? 'tweet' : 'manual',
            sourceUrl: processedContent.type === 'url' ? content : undefined,
            originalContent: processedContent.content,
            generatedAt: new Date().toISOString(),
            version: 1,
          },
        },
        usageCount: userId && usageInfo ? usageInfo.currentUsage + (regenerate ? 0 : 1) : undefined,
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