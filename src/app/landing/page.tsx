'use client';

import Link from 'next/link';
import { Navigation } from '@/components/ui/navigation';

export default function LandingPage() {
  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        {/* Hero Section */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl">
                <span className="text-white font-bold text-3xl">TC</span>
              </div>
            </div>
            
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-slate-900 mb-6">
              Turn your{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                threads
              </span>
              {' '}into{' '}
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                courses
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-slate-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Transform Twitter threads and tweets into structured mini-courses with AI. 
              Perfect for content creators, coaches, and solopreneurs.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link
                href="/auth"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                Get Started Free
              </Link>
              <Link
                href="/demo"
                className="border-2 border-slate-300 text-slate-700 px-8 py-4 rounded-2xl font-semibold text-lg hover:border-slate-400 transition-all duration-300"
              >
                View Demo
              </Link>
            </div>
            
            <div className="text-sm text-slate-500">
              ✨ No credit card required • 🚀 Start generating in seconds
            </div>
          </div>

          {/* Features Section */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Lightning Fast</h3>
              <p className="text-slate-600">
                Generate structured courses from your content in seconds, not hours.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">AI-Powered</h3>
              <p className="text-slate-600">
                Advanced AI extracts key insights and structures them into engaging modules.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📚</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Export Ready</h3>
              <p className="text-slate-600">
                Export to PDF, Notion, or other formats. Ready to share or sell.
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-20 text-center">
            <div className="bg-white rounded-3xl shadow-xl p-8 sm:p-12 max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Ready to transform your content?
              </h2>
              <p className="text-slate-600 mb-6">
                Join thousands of creators who are already turning their knowledge into courses.
              </p>
              <Link
                href="/auth"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:shadow-xl transition-all duration-300 hover:scale-105 inline-block"
              >
                Start Creating Now
              </Link>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}