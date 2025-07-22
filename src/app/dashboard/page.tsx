import { requireAuth, getUserProfile } from '@/lib/auth';
import { getSubscriptionLimits } from '@/lib/subscription-utils';
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { NotionConnection } from '@/components/ui/notion-connection';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const userId = await requireAuth();
  const userProfile = await getUserProfile(userId);
  
  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Error loading profile
          </h1>
          <p className="text-gray-600 mb-4">
            We couldn't load your user profile. Please try again.
          </p>
          <Link 
            href="/"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const limits = getSubscriptionLimits(userProfile.subscriptionTier);
  const usagePercentage = limits.monthlyGenerations === -1 
    ? 0 
    : (userProfile.monthlyUsageCount / limits.monthlyGenerations) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-gray-900">
                TweetToCourse
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/"
                className="text-gray-600 hover:text-gray-900"
              >
                Generate Course
              </Link>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Welcome back! Here's your account overview.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Subscription Status Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      userProfile.subscriptionTier === 'free' 
                        ? 'bg-gray-100 text-gray-600' 
                        : 'bg-green-100 text-green-600'
                    }`}>
                      {userProfile.subscriptionTier === 'free' ? '🆓' : '⭐'}
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Subscription Plan
                      </dt>
                      <dd className="text-lg font-medium text-gray-900 capitalize">
                        {userProfile.subscriptionTier}
                        {userProfile.subscriptionTier === 'free' && (
                          <span className="ml-2 text-sm text-blue-600">
                            <Link href="/pricing" className="hover:underline">
                              Upgrade
                            </Link>
                          </span>
                        )}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Usage Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600">📊</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Monthly Courses Generated
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {userProfile.monthlyUsageCount}
                        {limits.monthlyGenerations !== -1 && (
                          <span className="text-sm text-gray-500">
                            {' '}/ {limits.monthlyGenerations}
                          </span>
                        )}
                      </dd>
                      {userProfile.subscriptionTier === 'free' && userProfile.monthlyUsageResetDate && (
                        <dd className="text-xs text-gray-400 mt-1">
                          Resets on {new Date(userProfile.monthlyUsageResetDate).toLocaleDateString()}
                        </dd>
                      )}
                    </dl>
                  </div>
                </div>
                {limits.monthlyGenerations !== -1 && (
                  <div className="mt-3">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Features Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center mb-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600">✨</span>
                    </div>
                  </div>
                  <div className="ml-5">
                    <h3 className="text-sm font-medium text-gray-500">
                      Available Features
                    </h3>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <span className={`mr-2 ${limits.pdfExports ? 'text-green-600' : 'text-gray-400'}`}>
                      {limits.pdfExports ? '✓' : '✗'}
                    </span>
                    <span className={limits.pdfExports ? 'text-gray-900' : 'text-gray-400'}>
                      PDF Export
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className={`mr-2 ${limits.notionExports ? 'text-green-600' : 'text-gray-400'}`}>
                      {limits.notionExports ? '✓' : '✗'}
                    </span>
                    <span className={limits.notionExports ? 'text-gray-900' : 'text-gray-400'}>
                      Notion Export
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className={`mr-2 ${limits.watermarkFree ? 'text-green-600' : 'text-gray-400'}`}>
                      {limits.watermarkFree ? '✓' : '✗'}
                    </span>
                    <span className={limits.watermarkFree ? 'text-gray-900' : 'text-gray-400'}>
                      No Watermark
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Integrations Section */}
          {(userProfile.subscriptionTier === 'pro' || userProfile.subscriptionTier === 'lifetime') && (
            <div className="bg-white shadow rounded-lg p-6 mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Integrations
              </h2>
              <div className="space-y-4">
                <NotionConnection />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Generate New Course
              </Link>
              {userProfile.subscriptionTier === 'free' && (
                <Link
                  href="/pricing"
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  Upgrade to Pro
                </Link>
              )}
              <Link
                href="/courses"
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                View My Courses
              </Link>
              <Link
                href="/billing"
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
              >
                Manage Billing
              </Link>
            </div>
          </div>

          {/* Account Info */}
          <div className="mt-8 bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Account Information
            </h2>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{userProfile.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Member Since</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(userProfile.createdAt).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Active</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(userProfile.lastActive).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">User ID</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono">{userProfile.id}</dd>
              </div>
            </dl>
          </div>
        </div>
      </main>
    </div>
  );
}