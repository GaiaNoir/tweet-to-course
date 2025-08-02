import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { createAdminClient } from '@/lib/supabase';

interface JobStatusResponse {
  success: boolean;
  job?: {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    created_at: string;
    completed_at?: string;
    error_message?: string;
    result?: {
      course_id: string;
      title: string;
      modules_count: number;
    };
  };
  course?: {
    id: string;
    title: string;
    modules: any[];
    metadata: {
      sourceType: 'tweet' | 'thread' | 'manual';
      originalContent: string;
      generatedAt: string;
      version: number;
      jobId: string;
    };
  };
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
}

/**
 * Job Status API
 * 
 * GET /api/job-status?jobId=xxx
 * Returns the current status of a job and the associated course if completed.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    
    if (!jobId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_JOB_ID',
            message: 'Job ID is required',
            retryable: false,
          },
        } as JobStatusResponse,
        { status: 400 }
      );
    }
    
    // Get user authentication
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    const userId = user?.id;
    
    if (!userId || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'You must be signed in to check job status.',
            retryable: false,
          },
        } as JobStatusResponse,
        { status: 401 }
      );
    }
    
    const adminClient = createAdminClient();
    
    // Get job details (ensure user owns this job)
    const { data: job, error: jobError } = await adminClient
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', userId)
      .single();
    
    if (jobError) {
      if (jobError.code === 'PGRST116') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'JOB_NOT_FOUND',
              message: 'Job not found or you do not have permission to access it.',
              retryable: false,
            },
          } as JobStatusResponse,
          { status: 404 }
        );
      }
      
      console.error('Error fetching job:', jobError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch job status',
            retryable: true,
          },
        } as JobStatusResponse,
        { status: 500 }
      );
    }
    
    const response: JobStatusResponse = {
      success: true,
      job: {
        id: job.id,
        status: job.status,
        created_at: job.created_at,
        completed_at: job.completed_at,
        error_message: job.error_message,
        result: job.result,
      },
    };
    
    // If job is completed, also fetch the associated course
    if (job.status === 'completed' && job.result?.course_id) {
      const { data: course, error: courseError } = await adminClient
        .from('courses')
        .select('*')
        .eq('id', job.result.course_id)
        .eq('user_id', userId)
        .single();
      
      if (!courseError && course) {
        response.course = {
          id: course.id,
          title: course.title,
          modules: course.modules,
          metadata: {
            sourceType: 'manual',
            originalContent: course.original_content,
            generatedAt: course.created_at,
            version: 1,
            jobId: job.id,
          },
        };
      }
    }
    
    return NextResponse.json(response, { status: 200 });
    
  } catch (error) {
    console.error('Unexpected error in job status API:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
          retryable: true,
        },
      } as JobStatusResponse,
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'POST method not supported',
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
