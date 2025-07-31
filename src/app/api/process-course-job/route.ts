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
      // Set a timeout to prevent jobs from being stuck indefinitely
      const PROCESSING_TIMEOUT = 240000; // 4 minutes
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Processing timeout - job took too long')), PROCESSING_TIMEOUT);
      });

      // Wrap the processing in a timeout
      await Promise.race([processJob(), timeoutPromise]);

      async function processJob() {
      // Process content
      const processedContent = await processContent(job.content);
      console.log('✅ Content processed successfully');

      // Prepare content for AI processing
      const aiReadyContent = prepareContentForAI(processedContent.content);

      // Generate course using Claude
      const generatedCourse = await generateCourseContent(aiReadyContent, job.user_id);
      console.log('✅ Claude course generation successful');

      // Let database auto-generate UUID for course ID
      // const courseId = `course-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`; // This was causing UUID format error

      // Save course to database
      console.log('📝 Saving course to database...');
      console.log('Course data:', {
        user_id: job.user_id,
        title: generatedCourse.title,
        original_content_length: processedContent.content.length,
        modules_count: generatedCourse.modules?.length || 0,
        modules_structure: generatedCourse.modules?.map(m => ({ id: m.id, title: m.title })) || []
      });

      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .insert({
          user_id: job.user_id,
          title: generatedCourse.title,
          original_content: processedContent.content,
          modules: generatedCourse.modules,
        })
        .select('id')
        .single();

      if (courseError) {
        console.error('❌ Course save error details:', {
          error: courseError,
          message: courseError.message,
          details: courseError.details,
          hint: courseError.hint,
          code: courseError.code
        });
        throw new Error(`Failed to save course: ${courseError.message || 'Unknown database error'}`);
      }

      console.log('✅ Course saved successfully:', courseData);
      const courseId = courseData.id; // Get the auto-generated UUID from database

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
      } // End of processJob function

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
        if (error.message.includes('timeout')) {
          errorMessage = 'Course generation timed out. Please try again with shorter content.';
          retryable = true;
        }
      }

      // Update job as failed
      try {
        await supabase
          .from('course_generation_jobs')
          .update({
            status: 'failed',
            error_message: errorMessage,
            completed_at: new Date().toISOString()
          })
          .eq('id', jobId);
      } catch (dbError) {
        console.error('Failed to update job status to failed:', dbError);
      }

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
