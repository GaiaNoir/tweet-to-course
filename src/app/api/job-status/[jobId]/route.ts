import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Get user authentication
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get job status
    const { data: job, error: jobError } = await supabase
      .from('course_generation_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    // Return job status
    const response: any = {
      success: true,
      jobId: job.id,
      status: job.status,
      createdAt: job.created_at,
      updatedAt: job.updated_at
    };

    if (job.started_at) {
      response.startedAt = job.started_at;
    }

    if (job.completed_at) {
      response.completedAt = job.completed_at;
    }

    if (job.status === 'completed' && job.result) {
      response.course = job.result;
    }

    if (job.status === 'failed' && job.error_message) {
      response.error = job.error_message;
    }

    // Calculate estimated completion time for pending/processing jobs
    if (job.status === 'pending' || job.status === 'processing') {
      const createdAt = new Date(job.created_at).getTime();
      const now = Date.now();
      const elapsed = now - createdAt;
      
      // Estimate 60-120 seconds for course generation
      const estimatedTotal = job.status === 'pending' ? 90000 : 60000; // 90s for pending, 60s for processing
      const estimatedRemaining = Math.max(0, estimatedTotal - elapsed);
      
      response.estimatedRemainingMs = estimatedRemaining;
      response.estimatedCompletionAt = new Date(now + estimatedRemaining).toISOString();
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Job status error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
