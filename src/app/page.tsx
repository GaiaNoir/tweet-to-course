'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/ui/navigation';
import { CourseInputForm } from '@/components/ui/course-input-form';
import { CourseDisplay } from '@/components/ui/course-display';
import { useAuth } from '@/contexts/auth-context';
import { useAsyncCourseGeneration } from '@/hooks/useAsyncCourseGeneration';
import { Course } from '@/types';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const isSignedIn = !!user;
  const [generatedCourse, setGeneratedCourse] = useState<Course | null>(null);
  const {
    generateCourse,
    job,
    isLoading,
    error,
    progress,
    estimatedTimeRemaining,
    cancelPolling
  } = useAsyncCourseGeneration();

  const handleCourseGeneration = async (data: { content: string; type: 'url' | 'text' }) => {
    try {
      await generateCourse(data.content, data.type);
    } catch (err) {
      console.error('Course generation failed:', err);
    }
  };

  // Update generated course when job completes
  if (job?.status === 'completed' && job.course && !generatedCourse) {
    setGeneratedCourse(job.course);
  }

  const handleErrorDismiss = () => {
    cancelPolling();
  };

  const handleNewGeneration = () => {
    setGeneratedCourse(null);
    cancelPolling();
  };

  // Redirect unauthenticated users to landing page
  useEffect(() => {
    if (!loading && !user) {
      router.push('/landing');
    }
  }, [user, loading, router]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <div className="animate-pulse">
                <div className="h-12 bg-gray-200 rounded mb-4 max-w-2xl mx-auto"></div>
                <div className="h-6 bg-gray-200 rounded mb-8 max-w-xl mx-auto"></div>
                <div className="h-10 bg-gray-200 rounded max-w-xs mx-auto"></div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-6xl">
              <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl animate-float"></div>
              <div className="absolute top-40 right-10 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
              <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
            </div>
          </div>
          
          <div className="relative max-w-7xl mx-auto container-padding py-16 sm:py-24 lg:py-32">
            <div className="text-center">
              <div className="mb-6 sm:mb-8">
                <span className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-semibold bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border border-indigo-200/50 shadow-sm mb-4 sm:mb-6">
                  <span className="mr-2">✨</span>
                  AI-Powered Course Creation
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-slate-900 leading-tight text-balance px-4 sm:px-0">
                Turn Your Tweets Into
                <span className="block gradient-text mt-1 sm:mt-2">
                  Sellable Courses
                </span>
              </h1>
              <p className="mt-6 sm:mt-8 max-w-3xl mx-auto text-base sm:text-lg lg:text-xl text-slate-600 leading-relaxed text-balance px-4 sm:px-0">
                Transform Twitter threads and tweets into structured mini-courses with AI. 
                Perfect for content creators, coaches, and solopreneurs who want to monetize their knowledge instantly.
              </p>
              {!loading && !isSignedIn && (
                <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4 sm:px-0">
                  <a
                    href="/auth/sign-up"
                    className="btn btn-primary btn-lg group shadow-xl hover:shadow-2xl w-full sm:w-auto"
                  >
                    Get Started Free
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </a>
                  <a
                    href="/demo"
                    className="btn btn-secondary btn-lg w-full sm:w-auto"
                  >
                    <span className="mr-2">🎬</span>
                    Try Demo
                  </a>
                </div>
              )}
              
              {/* Social proof */}
              <div className="mt-12 sm:mt-16 flex flex-col items-center px-4 sm:px-0">
                <p className="text-xs sm:text-sm text-slate-500 mb-3 sm:mb-4">Trusted by content creators worldwide</p>
                <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 lg:gap-8 opacity-60">
                  <div className="flex items-center gap-2">
                    <div className="w-6 sm:w-8 h-6 sm:h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">TC</span>
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-slate-600">TweetToCourse</span>
                  </div>
                  <div className="text-slate-300 hidden sm:block">•</div>
                  <span className="text-xs sm:text-sm text-slate-500">AI-Powered</span>
                  <div className="text-slate-300 hidden sm:block">•</div>
                  <span className="text-xs sm:text-sm text-slate-500">Instant Export</span>
                  <div className="text-slate-300 hidden lg:block">•</div>
                  <span className="text-xs sm:text-sm text-slate-500 hidden lg:inline">Professional Quality</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Course Input Form - Only show when user is logged in */}
        {!loading && isSignedIn && (
          <div className="max-w-7xl mx-auto container-padding mt-16 sm:mt-20">
            <div className="text-center mb-8 sm:mb-12 px-4 sm:px-0">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 sm:mb-4">
                Create Your Course
              </h2>
              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
                Paste your Twitter thread or any educational content below to get started
              </p>
            </div>
            <CourseInputForm
              onSubmitAction={handleCourseGeneration}
              isLoading={isLoading}
              error={error || undefined}
              onErrorDismiss={handleErrorDismiss}
              jobStatus={job?.status}
              progress={progress}
              estimatedTimeRemaining={estimatedTimeRemaining}
              onCancel={cancelPolling}
            />
          </div>
        )}

        {/* Generated Course Display */}
        {generatedCourse && (
          <div className="max-w-7xl mx-auto container-padding mt-16 sm:mt-20">
            <CourseDisplay
              course={generatedCourse}
              onTitleUpdate={(newTitle) => {
                setGeneratedCourse(prev => prev ? { ...prev, title: newTitle } : null);
              }}
              onRegenerate={async () => {
                // Re-generate with same content
                if (generatedCourse?.metadata?.sourceUrl || generatedCourse?.metadata?.originalContent) {
                  await handleCourseGeneration({
                    content: generatedCourse.metadata.sourceUrl || generatedCourse.metadata.originalContent || '',
                    type: generatedCourse.metadata.sourceUrl ? 'url' : 'text'
                  });
                }
              }}
              onExportPDF={async () => {
                try {
                  const response = await fetch('/api/export-pdf', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ courseData: generatedCourse }),
                  });
                  
                  if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${generatedCourse.title.replace(/[^a-zA-Z0-9]/g, '_')}_course.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                  }
                } catch (error) {
                  console.error('PDF export failed:', error);
                }
              }}

              isRegenerating={isLoading}
              isExporting={false}
              isNotionConnected={false}
              onNotionConnectionRequired={() => {
                alert('Please sign up for a Pro account to connect Notion');
              }}
            />
          </div>
        )}

        {/* Feature Overview */}
        <div className="max-w-7xl mx-auto container-padding mt-24 sm:mt-32">
          <div className="text-center mb-16 sm:mb-20 px-4 sm:px-0">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 sm:mb-6 text-balance">
              How It Works
            </h2>
            <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto text-balance">
              Transform your content in three simple steps and start monetizing your knowledge today
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:gap-12 sm:grid-cols-2 lg:grid-cols-3">
            <div className="card card-hover group relative p-6 sm:p-8 text-center">
              <div className="absolute -top-4 sm:-top-6 left-1/2 -translate-x-1/2">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-lg">
                  1
                </div>
              </div>
              <div className="text-4xl sm:text-6xl mb-6 sm:mb-8 animate-float">🧵</div>
              <h3 className="text-xl sm:text-2xl font-bold card-title mb-3 sm:mb-4">
                Paste Your Content
              </h3>
              <p className="card-description leading-relaxed text-base sm:text-lg">
                Simply paste your Twitter thread or any educational content. Our AI works with any knowledge you've shared.
              </p>
              <div className="mt-4 sm:mt-6 flex justify-center">
                <div className="status-indicator status-info">
                  <span className="w-2 h-2 bg-current rounded-full"></span>
                  Supports all formats
                </div>
              </div>
            </div>

            <div className="card card-hover group relative p-6 sm:p-8 text-center">
              <div className="absolute -top-4 sm:-top-6 left-1/2 -translate-x-1/2">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-lg">
                  2
                </div>
              </div>
              <div className="text-4xl sm:text-6xl mb-6 sm:mb-8 animate-float" style={{animationDelay: '0.5s'}}>🤖</div>
              <h3 className="text-xl sm:text-2xl font-bold card-title mb-3 sm:mb-4">
                AI Magic
              </h3>
              <p className="card-description leading-relaxed text-base sm:text-lg">
                Our advanced AI analyzes your content and structures it into professional educational modules with clear learning objectives.
              </p>
              <div className="mt-4 sm:mt-6 flex justify-center">
                <div className="status-indicator status-success">
                  <span className="w-2 h-2 bg-current rounded-full animate-pulse"></span>
                  AI-Powered
                </div>
              </div>
            </div>

            <div className="card card-hover group relative p-6 sm:p-8 text-center sm:col-span-2 lg:col-span-1">
              <div className="absolute -top-4 sm:-top-6 left-1/2 -translate-x-1/2">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-lg">
                  3
                </div>
              </div>
              <div className="text-4xl sm:text-6xl mb-6 sm:mb-8 animate-float" style={{animationDelay: '1s'}}>📚</div>
              <h3 className="text-xl sm:text-2xl font-bold card-title mb-3 sm:mb-4">
                Export & Monetize
              </h3>
              <p className="card-description leading-relaxed text-base sm:text-lg">
                Export as beautiful PDFs, Notion pages, or presentation slides. Ready to sell to your audience immediately.
              </p>
              <div className="mt-4 sm:mt-6 flex justify-center">
                <div className="status-indicator status-warning">
                  <span className="w-2 h-2 bg-current rounded-full"></span>
                  Multiple formats
                </div>
              </div>
            </div>
          </div>
          
          {/* Call to action */}
          {!loading && !isSignedIn && (
            <div className="text-center mt-12 sm:mt-16 px-4 sm:px-0">
              <a
                href="/auth/sign-up"
                className="btn btn-primary btn-lg w-full sm:w-auto"
              >
                Start Creating Courses
                <span className="ml-2">→</span>
              </a>
              <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-slate-500">
                No credit card required • Free forever plan available
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}