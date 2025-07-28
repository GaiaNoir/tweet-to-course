'use client';

import { useState } from 'react';
import { Navigation } from '@/components/ui/navigation-supabase';
import { CourseInputForm } from '@/components/ui/course-input-form';
import { CourseDisplay } from '@/components/ui/course-display';
import { useAuth } from '@/hooks/use-auth';
import { Course } from '@/types';

export default function Home() {
  const { user, isSignedIn, loading } = useAuth();
  const [generatedCourse, setGeneratedCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCourseGeneration = async (data: { content: string; type: 'url' | 'text' }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/generate-course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate course');
      }

      const result = await response.json();
      setGeneratedCourse(result.course);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleErrorDismiss = () => {
    setError(null);
  };

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
              Turn Your Tweets Into
              <span className="text-blue-600"> Sellable Courses</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Transform Twitter threads and tweets into structured mini-courses with AI. 
              Perfect for content creators, coaches, and solopreneurs.
            </p>
            {!loading && !isSignedIn && (
              <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
                <div className="rounded-md shadow">
                  <a
                    href="/auth/sign-up"
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
                  >
                    Get Started Free
                  </a>
                </div>
                <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                  <a
                    href="/demo"
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
                  >
                    Try Demo
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Course Input Form - Only show when user is logged in */}
          {!loading && isSignedIn && (
            <div className="mt-16">
              <CourseInputForm
                onSubmit={handleCourseGeneration}
                isLoading={isLoading}
                error={error}
                onErrorDismiss={handleErrorDismiss}
              />
            </div>
          )}



          {/* Generated Course Display */}
          {generatedCourse && (
            <div className="mt-16">
              <CourseDisplay
                course={generatedCourse}
                onTitleUpdate={(newTitle) => {
                  setGeneratedCourse(prev => prev ? { ...prev, title: newTitle } : null);
                }}
                onRegenerate={async () => {
                  // Re-generate with same content
                  if (generatedCourse?.metadata?.sourceUrl || generatedCourse?.metadata?.sourceContent) {
                    await handleCourseGeneration({
                      content: generatedCourse.metadata.sourceUrl || generatedCourse.metadata.sourceContent || '',
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
          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-blue-600 text-2xl mb-4">🧵</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Paste Your Thread
                </h3>
                <p className="text-gray-600">
                  Simply paste your Twitter thread URL or text content to get started.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-blue-600 text-2xl mb-4">🤖</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  AI Processing
                </h3>
                <p className="text-gray-600">
                  Our AI analyzes and structures your content into educational modules.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-blue-600 text-2xl mb-4">📚</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Export & Sell
                </h3>
                <p className="text-gray-600">
                  Export as PDF, Notion pages, or slides ready to sell to your audience.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}