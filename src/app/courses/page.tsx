import { authServer } from '@/lib/auth';
import { Navigation } from '@/components/ui/navigation';
import Link from 'next/link';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

export default async function CoursesPage() {
  await authServer.requireAuth();

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        {/* Main Content */}
        <main className="max-w-7xl mx-auto container-padding py-8 sm:py-12">
            <div className="mb-8 sm:mb-12">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center">
                  <span className="text-white text-lg sm:text-xl font-bold">📚</span>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900">My Courses</h1>
                  <p className="text-base sm:text-lg lg:text-xl text-slate-600">
                    View and manage your generated courses
                  </p>
                </div>
              </div>
            </div>

            {/* Coming Soon Message */}
            <div className="card text-center p-6 sm:p-8 lg:p-12 max-w-2xl mx-auto">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8">
                <span className="text-3xl sm:text-4xl">🚧</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 sm:mb-4">
                Course History Coming Soon
              </h2>
              <p className="text-base sm:text-lg text-slate-600 mb-6 sm:mb-8 leading-relaxed">
                We're building an amazing feature to save and manage all your generated courses. 
                For now, make sure to download your courses immediately after generation.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Link
                  href="/"
                  className="btn btn-primary btn-lg w-full sm:w-auto"
                >
                  <span className="mr-2">✨</span>
                  Generate New Course
                </Link>
                <Link
                  href="/dashboard"
                  className="btn btn-secondary btn-lg w-full sm:w-auto"
                >
                  <span className="mr-2">📊</span>
                  View Dashboard
                </Link>
              </div>
              
              {/* Feature preview */}
              <div className="mt-8 sm:mt-12 p-4 sm:p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200/50">
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2 sm:mb-3">
                  Coming Features:
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    Course history & search
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    Bulk export options
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    Course templates
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    Collaboration tools
                  </div>
                </div>
              </div>
            </div>
        </main>
      </div>
    </>
  );
}