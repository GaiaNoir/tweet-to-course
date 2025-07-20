'use client';

import { useState } from 'react';
import { ClientNavigation } from '@/components/ui/client-navigation';
import { CourseInputForm } from '@/components/ui';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCourseGeneration = async (data: { content: string; type: 'url' | 'text' }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // TODO: This will be implemented in task 5 - OpenAI integration
      // For now, simulate the API call
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Simulate different outcomes for testing
      if (data.content.includes('error')) {
        throw new Error('Failed to generate course. Please try again.');
      }
      
      console.log('Course generation requested:', data);
      // TODO: Redirect to course display or handle success
      
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
                Simply paste a Twitter/X URL or enter your content manually. Our system accepts threads, individual tweets, or any text content you want to transform.
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