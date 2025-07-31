import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-supabase';
import { createClient } from '@/lib/supabase';

interface AsyncCourseRequest {
  content: string;
  type?: 'url' | 'text';
  regenerate?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: AsyncCourseRequest = await request.json();
    const { content, regenerate = false } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Content is required'
        },
        { status: 400 }
      );
    }

    // Get user authentication using the same approach as working endpoints
    const user = await getCurrentUser();
    
    console.log('Auth debug - User:', user?.id);
    
    if (!user) {
      console.log('No user found in async course generation');
      return NextResponse.json(
        { success: false, error: 'Authentication required. Please sign in and try again.' },
        { status: 401 }
      );
    }

    // Create supabase client for database operations
    const supabase = createClient();

    // Create job record
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    
    const { error: jobError } = await supabase
      .from('course_generation_jobs')
      .insert({
        id: jobId,
        user_id: user.id,
        content,
        status: 'pending'
      });

    if (jobError) {
      console.error('Job creation error:', jobError);
      return NextResponse.json(
        { success: false, error: 'Failed to create generation job' },
        { status: 500 }
      );
    }

    // Trigger background processing
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      await fetch(`${baseUrl}/api/process-course-job`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ jobId })
      });
    } catch (error) {
      console.error('Background job trigger failed:', error);
      // Don't fail the request if background trigger fails - job can be picked up later
    }

    return NextResponse.json({
      success: true,
      jobId,
      message: 'Course generation started. Use the job ID to check status.',
      pollUrl: `/api/job-status/${jobId}`
    });

  } catch (error) {
    console.error('Async course generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
