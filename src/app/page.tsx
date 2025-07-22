'use client';

import { useState } from 'react';
import { ClientNavigation } from '@/components/ui/client-navigation';
import { CourseInputForm } from '@/components/ui';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedCourse, setGeneratedCourse] = useState<any>(null);

  const handleCourseGeneration = async (data: { content: string; type: 'url' | 'text' }) => {
    setIsLoading(true);
    setError(null);
    
    try {
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

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to generate course');
      }

      // Success! Store the generated course and redirect to full course page
      console.log('Course generated successfully:', result.course);
      
      // Store course in localStorage for the course page to access
      localStorage.setItem(`course-${result.course.id}`, JSON.stringify(result.course));
      
      // Redirect to the full course display page
      window.location.href = `/course/${result.course.id}`;
      
      setError(null); // Clear any previous errors
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleErrorDismiss = () => {
    setError(null);
  };

  const handleExportPDF = async (courseId: string) => {
    try {
      setIsLoading(true);
      
      // For courses that might not be saved to DB, send the course data directly
      const requestBody = courseId.startsWith('course-') 
        ? { courseData: generatedCourse } // Temporary course, send data directly
        : { courseId }; // Saved course, use ID

      const response = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          setError('Please sign in to export courses as PDF. PDF export requires an account.');
          return;
        }
        if (errorData.upgradeRequired) {
          setError('PDF export is only available for Pro subscribers. Please upgrade your plan to export courses as PDF.');
          return;
        }
        throw new Error(errorData.error || 'Failed to export PDF');
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${generatedCourse.title.replace(/[^a-zA-Z0-9]/g, '_')}_course.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export PDF';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportNotion = async (courseId: string) => {
    try {
      setIsLoading(true);
      
      // For courses that might not be saved to DB, send the course data directly
      const requestBody = courseId.startsWith('course-') 
        ? { courseData: generatedCourse, exportType: 'direct' } // Temporary course, send data directly
        : { courseId, exportType: 'direct' }; // Saved course, use ID

      const response = await fetch('/api/export-notion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setError('Please sign in to export courses to Notion. Notion export requires an account.');
          return;
        }
        if (result.upgradeRequired) {
          setError('Notion export is only available for Pro and Lifetime subscribers. Please upgrade your plan to export courses to Notion.');
          return;
        }
        if (result.requiresConnection) {
          setError('Please connect your Notion account first. Go to your dashboard to set up Notion integration.');
          return;
        }
        throw new Error(result.error || 'Failed to export to Notion');
      }

      if (result.success && result.pageUrl) {
        // Success - show success message and optionally open Notion page
        alert(`Course exported to Notion successfully! Opening your Notion page...`);
        window.open(result.pageUrl, '_blank');
      } else {
        throw new Error('Export completed but no page URL returned');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export to Notion';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <ClientNavigation />

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          Turn your threads into{" "}
          <span className="text-indigo-600">sellable courses</span>{" "}
          in seconds
        </h1>
        
        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
          Transform Twitter threads and tweets into structured mini-courses with AI. 
          Perfect for content creators, coaches, and solopreneurs.
        </p>

        {/* Input Form */}
        <CourseInputForm 
          onSubmit={handleCourseGeneration}
          isLoading={isLoading}
          error={error}
          onErrorDismiss={handleErrorDismiss}
        />

        {/* Generated Course Display */}
        {generatedCourse && (
          <div className="mt-12 bg-white rounded-2xl shadow-xl p-8 max-w-4xl mx-auto text-left">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                🎉 Course Generated Successfully!
              </h2>
              <button
                onClick={() => setGeneratedCourse(null)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-indigo-600 mb-2">
                  {generatedCourse.title}
                </h3>
                <p className="text-sm text-gray-500">
                  Generated on {new Date(generatedCourse.generatedAt).toLocaleDateString()}
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Course Modules:</h4>
                {generatedCourse.modules.map((module: any, index: number) => (
                  <div key={module.id} className="border border-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-2">
                      Module {index + 1}: {module.title}
                    </h5>
                    <p className="text-gray-600 text-sm mb-3">
                      {module.summary}
                    </p>
                    {module.takeaways && module.takeaways.length > 0 && (
                      <div>
                        <p className="font-medium text-gray-700 text-sm mb-1">Key Takeaways:</p>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                          {module.takeaways.map((takeaway: string, idx: number) => (
                            <li key={idx}>{takeaway}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                <button 
                  onClick={() => handleExportPDF(generatedCourse.id)}
                  disabled={isLoading}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  📄 Export as PDF
                </button>
                <button 
                  onClick={() => handleExportNotion(generatedCourse.id)}
                  disabled={isLoading}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
                >
                  📝 Export to Notion
                </button>
                <button 
                  onClick={() => setGeneratedCourse(null)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  ✨ Generate Another Course
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Features Preview */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="text-center">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-indigo-600 text-xl">🧠</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">AI-Powered</h3>
            <p className="text-gray-600 text-sm">
              GPT-4 analyzes your content and creates structured 5-module courses
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-indigo-600 text-xl">📄</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Export Ready</h3>
            <p className="text-gray-600 text-sm">
              Download as PDF or export to Notion for immediate use
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-indigo-600 text-xl">⚡</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Lightning Fast</h3>
            <p className="text-gray-600 text-sm">
              Generate professional courses in seconds, not hours
            </p>
          </div>
        </div>
      </main>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How it Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Transform your Twitter content into professional courses in just three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white font-bold text-xl">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Paste Your Content
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Simply paste your tweet text or thread content. Our system accepts threads, individual tweets, or any text content you want to transform into a comprehensive course.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white font-bold text-xl">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                AI Processes Content
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Our advanced AI analyzes your content and automatically structures it into exactly 5 comprehensive modules with summaries and actionable takeaways.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white font-bold text-xl">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Export & Share
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Download your course as a professional PDF or export directly to Notion. Use it as a lead magnet, sell it as a digital product, or share with your audience.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-16">
            <button 
              onClick={() => document.querySelector('#content-input')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Try It Now - It's Free!
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}