import { useState, useEffect, useCallback } from 'react';

interface CourseGenerationJob {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  course?: any;
  error?: string;
  estimatedRemainingMs?: number;
  estimatedCompletionAt?: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
}

interface UseAsyncCourseGenerationReturn {
  generateCourse: (content: string, type?: 'url' | 'text') => Promise<string>;
  job: CourseGenerationJob | null;
  isLoading: boolean;
  error: string | null;
  progress: number; // 0-100
  estimatedTimeRemaining: number; // in seconds
  cancelPolling: () => void;
}

export function useAsyncCourseGeneration(): UseAsyncCourseGenerationReturn {
  const [job, setJob] = useState<CourseGenerationJob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Calculate progress based on job status and time elapsed
  const progress = job ? (() => {
    switch (job.status) {
      case 'pending':
        return 10;
      case 'processing':
        if (job.estimatedRemainingMs) {
          const elapsed = Date.now() - new Date(job.startedAt || job.createdAt).getTime();
          const total = elapsed + job.estimatedRemainingMs;
          return Math.min(90, Math.max(20, (elapsed / total) * 90));
        }
        return 50;
      case 'completed':
        return 100;
      case 'failed':
        return 0;
      default:
        return 0;
    }
  })() : 0;

  const estimatedTimeRemaining = job?.estimatedRemainingMs ? Math.ceil(job.estimatedRemainingMs / 1000) : 0;

  // Poll job status
  const pollJobStatus = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`/api/job-status/${jobId}`);
      
      // Handle non-200 responses
      if (!response.ok) {
        if (response.status === 504) {
          console.log('Job status check timed out, will retry...');
          return; // Don't stop polling on timeout, just skip this poll
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Handle JSON parsing errors
      let data;
      try {
        const text = await response.text();
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.log('Response was not valid JSON, will retry...');
        return; // Don't stop polling on parse error, just skip this poll
      }

      if (data.success) {
        setJob(data);
        
        // Stop polling if job is completed or failed
        if (data.status === 'completed' || data.status === 'failed') {
          if (pollingInterval) {
            clearInterval(pollingInterval);
            setPollingInterval(null);
          }
          setIsLoading(false);
          
          if (data.status === 'failed') {
            setError(data.error || 'Course generation failed');
          }
        }
      } else {
        setError(data.error || 'Failed to get job status');
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Error polling job status:', err);
      
      // Don't immediately fail on network errors, retry a few times
      const currentJob = job;
      if (currentJob && (currentJob.status === 'pending' || currentJob.status === 'processing')) {
        console.log('Network error during polling, will retry...');
        return; // Continue polling
      }
      
      setError('Failed to check job status');
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
      setIsLoading(false);
    }
  }, [pollingInterval, job]);

  // Start course generation
  const generateCourse = useCallback(async (content: string, type: 'url' | 'text' = 'text'): Promise<string> => {
    setIsLoading(true);
    setError(null);
    setJob(null);

    try {
      const response = await fetch('/api/generate-course-async', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, type }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error('Server returned invalid response. Please try again.');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to start course generation');
      }

      const jobId = data.jobId;

      // Start polling for job status
      const interval = setInterval(() => {
        pollJobStatus(jobId);
      }, 2000); // Poll every 2 seconds

      setPollingInterval(interval);

      // Initial poll
      pollJobStatus(jobId);

      return jobId;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsLoading(false);
      throw err;
    }
  }, [pollJobStatus]);

  // Cancel polling
  const cancelPolling = useCallback(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    setIsLoading(false);
  }, [pollingInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  return {
    generateCourse,
    job,
    isLoading,
    error,
    progress,
    estimatedTimeRemaining,
    cancelPolling,
  };
}
