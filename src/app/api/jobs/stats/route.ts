import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

/**
 * Job Statistics API
 * 
 * This API provides statistics about job processing for monitoring purposes.
 */
export async function GET(request: NextRequest) {
  try {
    const adminClient = createAdminClient();
    
    // Get job statistics
    const { data: jobStats, error: statsError } = await adminClient
      .from('jobs')
      .select('status, created_at')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours
    
    if (statsError) {
      console.error('Error fetching job stats:', statsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch job statistics' },
        { status: 500 }
      );
    }
    
    // Calculate statistics
    const stats = {
      total: jobStats?.length || 0,
      pending: jobStats?.filter(job => job.status === 'pending').length || 0,
      processing: jobStats?.filter(job => job.status === 'processing').length || 0,
      completed: jobStats?.filter(job => job.status === 'completed').length || 0,
      failed: jobStats?.filter(job => job.status === 'failed').length || 0,
    };
    
    // Find potentially stuck jobs (older than 10 minutes and still pending/processing)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const stuckJobs = jobStats?.filter(job => 
      (job.status === 'pending' || job.status === 'processing') &&
      new Date(job.created_at) < tenMinutesAgo
    ) || [];
    
    return NextResponse.json(
      { 
        success: true,
        stats,
        stuckJobs: stuckJobs.length,
        lastUpdated: new Date().toISOString()
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Unexpected error in job stats API:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}