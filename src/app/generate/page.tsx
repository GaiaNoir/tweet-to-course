'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { ProtectedRoute } from '@/components/ui/protected-route';
import { Navigation } from '@/components/ui/navigation';
import { CourseInputForm } from '@/components/ui/course-input-form';
import { CourseDisplay } from '@/components/ui/course-display';
import { getSubscriptionLimits } from '@/lib/subscription-utils';
import type { Course } from '@/types';

export default function GenerateCoursePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedCourse, setGeneratedCourse] = useState<Course | null>(null);
  const [jobStatus, setJobStatus] = useState<'pending' | 'processing' | 'completed' | 'failed' | null>(null);
  const [progress, setProgress] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(0);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (user) {
      setUserProfile(user);
    }
  }, [user]);

  // Function to poll job status
  const pollJobStatus = async (jobId: string) => {
    try {
      const response = await fetch(`/api/job-status?jobId=${jobId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to check job status');
      }
      
      const result = await response.json();
      
      if (result.success && result.job) {
        setJobStatus(result.job.status);
        
        // Update progress based on status
        switch (result.job.status) {
          case 'pending':
            setProgress(10);
            break;
          case 'processing':
            setProgress(50);
            break;
          case 'completed':
            setProgress(100);
            setIsGenerating(false);
            if (result.course) {
              setGeneratedCourse(result.course);
            }
            // Clear polling interval
            if (pollingInterval) {
              clearInterval(pollingInterval);
              setPollingInterval(null);
            }
            // Trigger background job processing
            fetch('/api/process-jobs', { method: 'POST' }).catch(console.error);
            break;
          case 'failed':
            setProgress(0);
            setIsGenerating(false);
            setError(result.job.error_message || 'Course generation failed');
            // Clear polling interval
            if (pollingInterval) {
              clearInterval(pollingInterval);
              setPollingInterval(null);
            }
            break;
        }
      }
    } catch (err) {
      console.error('Job status polling error:', err);
      setError(err instanceof Error ? err.message : 'Failed to check job status');
      setIsGenerating(false);
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    }
  };

  const handleSubmit = async (data: { content: string; type: 'url' | 'text' }) => {
    if (!userProfile) return;

    // Check usage limits
    const limits = getSubscriptionLimits(userProfile.subscriptionTier);
    if (limits.monthlyGenerations !== -1 && userProfile.monthlyUsageCount >= limits.monthlyGenerations) {
      setError('You have reached your monthly generation limit. Please upgrade to continue.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedCourse(null);
    setJobStatus('pending');
    setProgress(0);
    setCurrentJobId(null);

    try {
      // Create job via the async API
      const response = await fetch('/api/generate-course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: data.content,
          type: data.type,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error?.message || errorData.message || 'Failed to create course generation job';
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      if (result.success && result.jobId) {
        setCurrentJobId(result.jobId);
        setJobStatus(result.status || 'pending');
        
        // Trigger background job processing immediately
        fetch('/api/process-jobs', { method: 'POST' }).catch(console.error);
        
        // Set up polling interval to check job status every 2 seconds
        const jobPollingInterval = setInterval(() => {
          pollJobStatus(result.jobId);
        }, 2000);
        setPollingInterval(jobPollingInterval);
        
        // Initial poll
        pollJobStatus(result.jobId);
      } else {
        throw new Error('Failed to create course generation job');
      }
    } catch (err) {
      console.error('Course generation error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setJobStatus('failed');
      setIsGenerating(false);
    }
  };

  const handleErrorDismiss = () => {
    setError(null);
    setJobStatus(null);
  };

  const handleCancel = () => {
    // Clear polling interval if active
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    setIsGenerating(false);
    setJobStatus(null);
    setProgress(0);
    setCurrentJobId(null);
  };

  const handleStartOver = () => {
    // Clear polling interval if active
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    setGeneratedCourse(null);
    setError(null);
    setJobStatus(null);
    setProgress(0);
    setCurrentJobId(null);
  };

  // Cleanup polling interval on component unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl flex items-center justify-center shadow-xl">
                <span className="text-white font-bold text-2xl">✨</span>
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Generate Your Course
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto">
              Transform your Twitter threads and content into structured mini-courses with AI
            </p>
            
            {userProfile && (
              <div className="mt-6 flex justify-center">
                <div className="bg-white rounded-2xl px-6 py-3 shadow-sm border border-slate-200">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">Plan:</span>
                      <span className="font-semibold text-slate-900 capitalize">
                        {userProfile.subscriptionTier}
                      </span>
                    </div>
                    <div className="w-px h-4 bg-slate-300"></div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">Usage:</span>
                      <span className="font-semibold text-slate-900">
                        {userProfile.monthlyUsageCount}
                        {getSubscriptionLimits(userProfile.subscriptionTier).monthlyGenerations !== -1 
                          ? `/${getSubscriptionLimits(userProfile.subscriptionTier).monthlyGenerations}` 
                          : ' (Unlimited)'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Course Generation Form or Display */}
          {generatedCourse ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Your Generated Course</h2>
                <button
                  onClick={handleStartOver}
                  className="btn btn-secondary"
                >
                  Generate Another Course
                </button>
              </div>
              <CourseDisplay course={generatedCourse} />
            </div>
          ) : (
            <CourseInputForm
              onSubmitAction={handleSubmit}
              isLoading={isGenerating}
              error={error || undefined}
              onErrorDismiss={handleErrorDismiss}
              onCancel={handleCancel}
              jobStatus={jobStatus || undefined}
              progress={progress}
              estimatedTimeRemaining={estimatedTimeRemaining}
            />
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
