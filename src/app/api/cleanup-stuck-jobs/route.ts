import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

/**
 * Cleanup Stuck Jobs API
 * 
 * This API cleans up jobs that have been stuck in 'pending' or 'processing' 
 * status for too long, preventing the UI from hanging indefinitely.
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Starting stuck job cleanup...');
    
    const adminClient = createAdminClient();
    
    // Define timeout thresholds
    const PENDING_TIMEOUT_MINUTES = 10; // Jobs stuck in pending for more than 10 minutes
    const PROCESSING_TIMEOUT_MINUTES = 30; // Jobs stuck in processing for more than 30 minutes
    
    const now = new Date();
    const pendingCutoff = new Date(now.getTime() - PENDING_TIMEOUT_MINUTES * 60 * 1000);
    const processingCutoff = new Date(now.getTime() - PROCESSING_TIMEOUT_MINUTES * 60 * 1000);
    
    // Find stuck pending jobs
    const { data: stuckPendingJobs, error: pendingError } = await adminClient
      .from('jobs')
      .select('id, created_at, user_id')
      .eq('status', 'pending')
      .lt('created_at', pendingCutoff.toISOString());
    
    if (pendingError) {
      console.error('Error fetching stuck pending jobs:', pendingError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch stuck pending jobs' },
        { status: 500 }
      );
    }
    
    // Find stuck processing jobs
    const { data: stuckProcessingJobs, error: processingError } = await adminClient
      .from('jobs')
      .select('id, created_at, user_id')
      .eq('status', 'processing')
      .lt('created_at', processingCutoff.toISOString());
    
    if (processingError) {
      console.error('Error fetching stuck processing jobs:', processingError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch stuck processing jobs' },
        { status: 500 }
      );
    }
    
    const allStuckJobs = [...(stuckPendingJobs || []), ...(stuckProcessingJobs || [])];
    
    if (allStuckJobs.length === 0) {
      console.log('✅ No stuck jobs found');
      return NextResponse.json(
        { success: true, message: 'No stuck jobs found', cleanedCount: 0 },
        { status: 200 }
      );
    }
    
    console.log(`🔧 Found ${allStuckJobs.length} stuck job(s), cleaning up...`);
    
    // Update all stuck jobs to failed status
    const stuckJobIds = allStuckJobs.map(job => job.id);
    
    const { error: updateError } = await adminClient
      .from('jobs')
      .update({
        status: 'failed',
        error_message: 'Job timed out - stuck in processing for too long',
        completed_at: new Date().toISOString()
      })
      .in('id', stuckJobIds);
    
    if (updateError) {
      console.error('Error updating stuck jobs:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update stuck jobs' },
        { status: 500 }
      );
    }
    
    console.log(`✅ Successfully cleaned up ${allStuckJobs.length} stuck job(s)`);
    
    return NextResponse.json(
      { 
        success: true, 
        message: `Successfully cleaned up ${allStuckJobs.length} stuck job(s)`,
        cleanedCount: allStuckJobs.length,
        cleanedJobs: stuckJobIds
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Unexpected error in stuck job cleanup:', error);
    
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
    { success: false, error: 'GET method not supported. Use POST to trigger cleanup.' },
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