import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { generateCourseContent, ClaudeError } from '@/lib/claude';
import { prepareContentForAI } from '@/lib/content-processor';
import { incrementMonthlyUsage } from '@/lib/usage-limits';

/**
 * Background Job Processor API
 * 
 * This API processes pending jobs in the background, handling the actual
 * course generation with Claude and updating job status accordingly.
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting background job processor...');
    
    const adminClient = createAdminClient();
    
    // Get pending jobs (limit to 1 for now to avoid overwhelming Claude API)
    const { data: pendingJobs, error: fetchError } = await adminClient
      .from('jobs')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(1);
    
    if (fetchError) {
      console.error('Error fetching pending jobs:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch pending jobs' },
        { status: 500 }
      );
    }
    
    if (!pendingJobs || pendingJobs.length === 0) {
      console.log('📭 No pending jobs found');
      return NextResponse.json(
        { success: true, message: 'No pending jobs to process' },
        { status: 200 }
      );
    }
    
    const job = pendingJobs[0];
    console.log('📝 Processing job:', job.id);
    
    try {
      // Update job status to processing
      await adminClient
        .from('jobs')
        .update({ 
          status: 'processing',
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id);
      
      console.log('🔄 Job status updated to processing');
      
      // Prepare content for AI processing
      const aiReadyContent = prepareContentForAI(job.input_content);
      
      // Generate course using Claude
      console.log('🚀 Starting Claude course generation...');
      const generatedCourse = await generateCourseContent(aiReadyContent, job.user_id);
      console.log('✅ Claude course generation successful');
      
      // Save course to database
      const courseId = `course-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      
      const { data: courseData, error: courseError } = await adminClient
        .from('courses')
        .insert({
          user_id: job.user_id,
          title: generatedCourse.title,
          original_content: job.input_content,
          modules: generatedCourse.modules,
          job_id: job.id,
        })
        .select('id')
        .single();
      
      if (courseError) {
        console.error('Course save error:', courseError);
        throw new Error(`Failed to save course: ${courseError.message}`);
      }
      
      const finalCourseId = courseData?.id || courseId;
      console.log('✅ Course saved successfully with ID:', finalCourseId);
      
      // Update monthly usage count
      try {
        await incrementMonthlyUsage(job.user_id);
        console.log('✅ Monthly usage updated');
      } catch (error) {
        console.error('Monthly usage update error:', error);
        // Don't fail the job for usage update errors
      }
      
      // Update job status to completed with result
      await adminClient
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
        .eq('id', job.id);
      
      console.log('✅ Job status updated to completed');
      
      // Log the usage
      const { error: logError } = await adminClient
        .from('usage_logs')
        .insert({
          user_id: job.user_id,
          action: 'generate',
          metadata: {
            content_type: 'text',
            course_id: finalCourseId,
            job_id: job.id,
          },
        });
      
      if (logError) {
        console.error('Usage log error:', logError);
        // Don't fail the job for logging errors
      }
      
      return NextResponse.json(
        { 
          success: true, 
          message: 'Job processed successfully',
          jobId: job.id,
          courseId: finalCourseId
        },
        { status: 200 }
      );
      
    } catch (error) {
      console.error('Job processing failed:', error);
      
      // Update job status to failed
      await adminClient
        .from('jobs')
        .update({ 
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          completed_at: new Date().toISOString()
        })
        .eq('id', job.id);
      
      console.log('❌ Job status updated to failed');
      
      if (error instanceof ClaudeError) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Claude API error: ${error.message}`,
            jobId: job.id,
            retryable: error.retryable
          },
          { status: error.retryable ? 503 : 400 }
        );
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: `Job processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          jobId: job.id
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Unexpected error in job processor:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { success: false, error: 'GET method not supported' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { success: false, error: 'PUT method not supported' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { success: false, error: 'DELETE method not supported' },
    { status: 405 }
  );
}
