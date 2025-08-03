import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { processContent, ContentProcessingError } from '@/lib/content-processor';
import { createAdminClient } from '@/lib/supabase';
import { checkMonthlyUsage } from '@/lib/usage-limits';
import { getOrCreateUserProfile } from '@/lib/auth';

/**
 * Truly asynchronous job processing function
 * This runs independently of the API response and handles all job processing
 */
async function processJobAsync(jobId: string, userId: string, inputContent: string, adminSupabase: any): Promise<void> {
  try {
    console.log('🔄 Starting async job processing for job:', jobId);
    
    // Update job status to processing
    await adminSupabase
      .from('jobs')
      .update({ 
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);
    
    console.log('🔄 Job status updated to processing');
    
    // Import required modules dynamically to avoid circular dependencies
    const { generateCourseContent } = await import('@/lib/claude');
    const { prepareContentForAI } = await import('@/lib/content-processor');
    const { incrementMonthlyUsage } = await import('@/lib/usage-limits');
    
    // Prepare content for AI processing
    const aiReadyContent = prepareContentForAI(inputContent);
    
    console.log('🤖 Starting Claude course generation...');
    // Generate course using Claude
    const generatedCourse = await generateCourseContent(aiReadyContent, userId);
    console.log('✅ Claude course generation completed successfully');
    
    // Save course to database
    const { data: courseData, error: courseError } = await adminSupabase
      .from('courses')
      .insert({
        user_id: userId,
        title: generatedCourse.title,
        original_content: inputContent,
        modules: generatedCourse.modules,
        job_id: jobId,
      })
      .select('id')
      .single();
    
    if (courseError) {
      console.error('❌ Course save error:', courseError);
      throw new Error(`Failed to save course: ${courseError.message}`);
    }
    
    const finalCourseId = courseData?.id;
    console.log('✅ Course saved successfully with ID:', finalCourseId);
    
    // Update monthly usage count
    try {
      await incrementMonthlyUsage(userId);
      console.log('✅ Monthly usage updated');
    } catch (error) {
      console.error('⚠️ Monthly usage update error:', error);
      // Don't fail the job for usage update errors
    }
    
    // Update job status to completed with result
    await adminSupabase
      .from('jobs')
      .update({ 
        status: 'completed',
        result: {
          course_id: finalCourseId,
          title: generatedCourse.title,
          modules_count: generatedCourse.modules.length
        },
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId);
    
    console.log('✅ Job completed successfully:', jobId);
    
    // Log the usage
    const { error: logError } = await adminSupabase
      .from('usage_logs')
      .insert({
        user_id: userId,
        action: 'generate',
        metadata: {
          content_type: 'text',
          course_id: finalCourseId,
          job_id: jobId,
        },
      });
    
    if (logError) {
      console.error('⚠️ Usage log error:', logError);
      // Don't fail the job for logging errors
    }
    
  } catch (error) {
    console.error('❌ Async job processing failed:', error);
    throw error; // Re-throw to be handled by the caller
  }
}

// Types for the API
interface GenerateCourseRequest {
  content: string;
  type?: 'url' | 'text';
  regenerate?: boolean;
}

interface GenerateCourseResponse {
  success: boolean;
  jobId?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  message?: string;
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

/**
 * Asynchronous Course Generation API
 * 
 * This API creates a job for course generation and returns immediately,
 * avoiding timeout issues on serverless platforms. The actual course
 * generation happens asynchronously via a background worker.
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting async course generation API...');
    
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

    // Process content quickly (this should be fast)
    let processedContent;
    try {
      console.log('🔄 Processing content...');
      processedContent = await processContent(content);
      console.log('✅ Content processing successful:', {
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

    // Create a job in the database for async processing
    const adminSupabase = createAdminClient();
    
    try {
      console.log('💾 Creating job in database...');
      
      const { data: job, error: jobError } = await adminSupabase
        .from('jobs')
        .insert({
          user_id: userId,
          status: 'pending',
          input_content: processedContent.content,
        })
        .select()
        .single();

      if (jobError || !job) {
        console.error('Failed to create job:', jobError);
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'JOB_CREATION_FAILED',
              message: 'Failed to create course generation job',
              retryable: true,
            },
          } as GenerateCourseResponse,
          { status: 500 }
        );
      }

      console.log('✅ Job created successfully:', { jobId: job.id });

      // TRULY ASYNCHRONOUS PROCESSING: Trigger background processing without blocking the response
      console.log('🚀 Triggering asynchronous job processing for job:', job.id);
      
      // Trigger the background job processor asynchronously
      // This doesn't block the API response and handles the job processing properly
      processJobAsync(job.id, userId, processedContent.content, adminSupabase)
        .catch(error => {
          console.error('❌ Async job processing failed:', error);
          // Update job status to failed if async processing fails
          adminSupabase
            .from('jobs')
            .update({ 
              status: 'failed',
              error_message: error instanceof Error ? error.message : 'Unknown error during async processing',
              completed_at: new Date().toISOString()
            })
            .eq('id', job.id)
            .then(() => console.log('❌ Job marked as failed:', job.id))
            .catch(updateError => console.error('❌ Failed to update job status:', updateError));
        });

      // FALLBACK: Also trigger the background job processor API as a backup
      // This ensures jobs get processed even if the async function above fails
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        fetch(`${baseUrl}/api/process-jobs`, { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }).catch(error => {
          console.warn('⚠️ Background job processor trigger failed (this is expected in development):', error.message);
        });
      } catch (error) {
        console.warn('⚠️ Could not trigger background job processor:', error);
      }

      // Return immediately with job ID - the actual processing happens asynchronously
      return NextResponse.json(
        {
          success: true,
          jobId: job.id,
          status: 'pending',
          message: 'Course generation job created successfully. Processing will begin shortly.',
          usageCount: usageInfo?.currentUsage || 0,
        } as GenerateCourseResponse,
        { status: 202 } // 202 Accepted - request accepted for processing
      );

    } catch (error) {
      console.error('Error creating job:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred while creating the job',
            retryable: true,
          },
        } as GenerateCourseResponse,
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Unexpected error in course generation API:', error);
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