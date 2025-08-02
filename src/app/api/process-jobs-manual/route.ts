import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

/**
 * Manual Job Processing Trigger
 * 
 * This endpoint allows manual triggering of job processing for debugging
 * and fixing stuck jobs.
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Manual job processing trigger activated');
    
    const adminClient = createAdminClient();
    
    // Get all pending and stuck processing jobs
    const { data: stuckJobs, error: fetchError } = await adminClient
      .from('jobs')
      .select('*')
      .in('status', ['pending', 'processing'])
      .order('created_at', { ascending: true });
    
    if (fetchError) {
      console.error('Error fetching stuck jobs:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch stuck jobs' },
        { status: 500 }
      );
    }
    
    if (!stuckJobs || stuckJobs.length === 0) {
      console.log('📭 No stuck jobs found');
      return NextResponse.json(
        { success: true, message: 'No stuck jobs to process', jobsFound: 0 },
        { status: 200 }
      );
    }
    
    console.log(`🔄 Found ${stuckJobs.length} stuck jobs, triggering processing...`);
    
    // Reset any jobs that have been "processing" for more than 5 minutes back to pending
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: resetJobs, error: resetError } = await adminClient
      .from('jobs')
      .update({ 
        status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('status', 'processing')
      .lt('updated_at', fiveMinutesAgo)
      .select('id');
    
    if (resetError) {
      console.error('Error resetting stuck processing jobs:', resetError);
    } else if (resetJobs && resetJobs.length > 0) {
      console.log(`🔄 Reset ${resetJobs.length} stuck processing jobs back to pending`);
    }
    
    // Trigger the regular job processor
    const processJobsUrl = process.env.NEXT_PUBLIC_APP_URL 
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/process-jobs`
      : 'http://localhost:3000/api/process-jobs';
    
    let processedCount = 0;
    const results = [];
    
    // Process each job individually to avoid overwhelming the system
    for (const job of stuckJobs) {
      try {
        console.log(`🔄 Processing job ${job.id}...`);
        
        const response = await fetch(processJobsUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'User-Agent': 'TweetToCourse-ManualProcessor/1.0'
          },
          signal: AbortSignal.timeout(60000) // 60 second timeout per job
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log(`✅ Job ${job.id} processed successfully`);
          processedCount++;
          results.push({ jobId: job.id, status: 'success', result });
        } else {
          const errorText = await response.text();
          console.error(`❌ Job ${job.id} processing failed:`, response.status, errorText);
          results.push({ jobId: job.id, status: 'failed', error: errorText });
        }
        
        // Small delay between jobs to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Failed to process job ${job.id}:`, error);
        results.push({ 
          jobId: job.id, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Manual job processing completed`,
      totalJobs: stuckJobs.length,
      processedSuccessfully: processedCount,
      results: results
    });
    
  } catch (error) {
    console.error('Unexpected error in manual job processor:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      success: true, 
      message: 'Manual job processor endpoint. Use POST to trigger processing.',
      usage: 'POST /api/process-jobs-manual to process all stuck jobs'
    },
    { status: 200 }
  );
}
