import { NextRequest, NextResponse } from 'next/server';
import { authServer } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

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
    const user = await authServer.getUser();
    
    console.log('Auth debug - User:', user?.id);
    
    if (!user) {
      console.log('No user found in async course generation');
      return NextResponse.json(
        { success: false, error: 'Authentication required. Please sign in and try again.' },
        { status: 401 }
      );
    }

    // Create admin client for database operations (bypasses RLS)
    const supabase = createAdminClient();

    // Ensure user exists in the custom users table
    console.log('🔍 Checking if user exists in users table...');
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (userCheckError && userCheckError.code !== 'PGRST116') {
      console.error('Error checking user existence:', userCheckError);
      return NextResponse.json(
        { success: false, error: 'Database error checking user' },
        { status: 500 }
      );
    }

    if (!existingUser) {
      console.log('👤 User not found in users table, creating user record...');
      // Create user record in custom users table
      const { error: createUserError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          clerk_user_id: user.id, // Use Supabase user ID as clerk_user_id for compatibility
          email: user.email || 'unknown@example.com',
          subscription_tier: 'free',
          usage_count: 0
        });

      if (createUserError) {
        console.error('Error creating user:', createUserError);
        return NextResponse.json(
          { success: false, error: 'Failed to create user record' },
          { status: 500 }
        );
      }
      console.log('✅ User created successfully');
    } else {
      console.log('✅ User already exists in users table');
    }

    // Create job record
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    
    console.log('Creating job with:', { jobId, userId: user.id, contentLength: content.length });
    
    const { error: jobError } = await supabase
      .from('course_generation_jobs')
      .insert({
        id: jobId,
        user_id: user.id,
        content,
        status: 'pending'
      });

    if (jobError) {
      console.error('Job creation error details:', {
        error: jobError,
        message: jobError.message,
        details: jobError.details,
        hint: jobError.hint,
        code: jobError.code
      });
      return NextResponse.json(
        { 
          success: false, 
          error: `Failed to create generation job: ${jobError.message}`,
          details: jobError.details
        },
        { status: 500 }
      );
    }
    
    console.log('Job created successfully:', jobId);

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
