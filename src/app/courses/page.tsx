import { requireAuth } from '@/lib/auth-supabase';
import { Navigation } from '@/components/ui/navigation-supabase';
import Link from 'next/link';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

export default async function CoursesPage() {
  await requireAuth();

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50">
        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
              <p className="mt-2 text-gray-600">
                View and manage your generated courses.
              </p>
            </div>

            {/* Coming Soon Message */}
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-indigo-600 text-2xl">📚</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Course History Coming Soon
              </h2>
              <p className="text-gray-600 mb-6">
                We're working on a feature to save and manage your generated courses. 
                For now, make sure to download your courses after generation.
              </p>
              <Link
                href="/"
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Generate New Course
              </Link>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}