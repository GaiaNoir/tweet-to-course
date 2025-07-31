import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Verify authorization (service role key)
    const authHeader = request.headers.get('Authorization');
    const expectedAuth = `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`;
    
    if (authHeader !== expectedAuth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();

    // Find jobs that have been processing for more than 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    
    const { data: stuckJobs, error: findError } = await supabase
      .from('course_generation_jobs')
      .select('*')
      .eq('status', 'processing')
      .lt('started_at', tenMinutesAgo);

    if (findError) {
      console.error('Error finding stuck jobs:', findError);
      return NextResponse.json(
        { success: false, error: 'Failed to find stuck jobs' },
        { status: 500 }
      );
    }

    if (!stuckJobs || stuckJobs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No stuck jobs found',
        cleanedCount: 0
      });
    }

    console.log(`Found ${stuckJobs.length} stuck jobs, cleaning up...`);

    // Update stuck jobs to failed status
    const { error: updateError } = await supabase
      .from('course_generation_jobs')
      .update({
        status: 'failed',
        error_message: 'Job timed out and was automatically cleaned up',
        completed_at: new Date().toISOString()
      })
      .in('id', stuckJobs.map(job => job.id));

    if (updateError) {
      console.error('Error updating stuck jobs:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update stuck jobs' },
        { status: 500 }
      );
    }

    console.log(`Successfully cleaned up ${stuckJobs.length} stuck jobs`);

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${stuckJobs.length} stuck jobs`,
      cleanedCount: stuckJobs.length,
      cleanedJobs: stuckJobs.map(job => ({
        id: job.id,
        started_at: job.started_at,
        user_id: job.user_id
      }))
    });

  } catch (error) {
    console.error('Cleanup stuck jobs error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
