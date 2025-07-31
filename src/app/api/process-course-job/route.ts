import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { generateCourseContent, ClaudeError } from '@/lib/claude';
import { processContent, ContentProcessingError, prepareContentForAI } from '@/lib/content-processor';
import { incrementMonthlyUsage } from '@/lib/usage-limits';

interface ProcessJobRequest {
  jobId: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ProcessJobRequest = await request.json();
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'Job ID is required' },
        { status: 400 }
      );
    }

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

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from('course_generation_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      console.error('Job not found:', jobId, jobError);
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    // Check if job is already being processed or completed
    if (job.status !== 'pending') {
      return NextResponse.json(
        { success: true, message: `Job is already ${job.status}` }
      );
    }

    // Update job status to processing
    await supabase
      .from('course_generation_jobs')
      .update({
        status: 'processing',
        started_at: new Date().toISOString()
      })
      .eq('id', jobId);

    console.log(`🚀 Starting background course generation for job ${jobId}`);

    try {
      // Process content
      const processedContent = await processContent(job.content);
      console.log('✅ Content processed successfully');

      // Prepare content for AI processing
      const aiReadyContent = prepareContentForAI(processedContent.content);

      // Generate course using Claude
      const generatedCourse = await generateCourseContent(aiReadyContent, job.user_id);
      console.log('✅ Claude course generation successful');

      // Create course ID
      const courseId = `course-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

      // Save course to database
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .insert({
          id: courseId,
          user_id: job.user_id,
          title: generatedCourse.title,
          original_content: processedContent.content,
          modules: generatedCourse.modules,
        })
        .select('id')
        .single();

      if (courseError) {
        console.error('Course save error:', courseError);
        throw new Error('Failed to save course');
      }

      // Update monthly usage
      try {
        await incrementMonthlyUsage(job.user_id);
      } catch (error) {
        console.error('Monthly usage update error:', error);
      }

      // Log usage
      await supabase
        .from('usage_logs')
        .insert({
          user_id: job.user_id,
          action: 'generate',
          metadata: {
            content_type: processedContent.type,
            course_id: courseId,
            job_id: jobId
          },
          usage_month: new Date().toISOString().slice(0, 10),
        });

      // Prepare result
      const result = {
        id: courseId,
        title: generatedCourse.title,
        modules: generatedCourse.modules,
        metadata: {
          sourceType: processedContent.type === 'url' ? 'tweet' : 'manual',
          sourceUrl: processedContent.type === 'url' ? job.content : undefined,
          originalContent: processedContent.content,
          generatedAt: new Date().toISOString(),
          version: 1,
        },
      };

      // Update job as completed
      await supabase
        .from('course_generation_jobs')
        .update({
          status: 'completed',
          result: result,
          completed_at: new Date().toISOString()
        })
        .eq('id', jobId);

      console.log(`✅ Job ${jobId} completed successfully`);

      return NextResponse.json({
        success: true,
        message: 'Course generation completed',
        courseId
      });

    } catch (error) {
      console.error(`❌ Job ${jobId} failed:`, error);

      let errorMessage = 'Course generation failed';
      let retryable = true;

      if (error instanceof ClaudeError) {
        errorMessage = error.message;
        retryable = error.retryable;
      } else if (error instanceof ContentProcessingError) {
        errorMessage = error.message;
        retryable = error.retryable;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      // Update job as failed
      await supabase
        .from('course_generation_jobs')
        .update({
          status: 'failed',
          error_message: errorMessage,
          completed_at: new Date().toISOString()
        })
        .eq('id', jobId);

      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage,
          retryable 
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Process job error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
