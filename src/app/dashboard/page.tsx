import { requireAuth, getUserProfile } from '@/lib/auth-supabase';
import { getSubscriptionLimits } from '@/lib/subscription-utils';
import Link from 'next/link';
import { NotionConnection } from '@/components/ui/notion-connection';
import { Navigation } from '@/components/ui/navigation-supabase';
import { RetryButton } from '@/components/ui/retry-button';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  try {
    const user = await requireAuth();
    const userProfile = await getUserProfile(user.id);
    
    if (!userProfile) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Account Migration Required
            </h1>
            <p className="text-gray-600 mb-4">
              We've upgraded our authentication system. Please sign in again to continue.
            </p>
            <div className="flex flex-col space-y-4">
              <Link 
                href="/auth/migration-notice"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Learn More & Sign In
              </Link>
              <Link 
                href="/"
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Go to Home
              </Link>
            </div>
          </div>
        </div>
      );
    }

    const limits = getSubscriptionLimits(userProfile.subscriptionTier);
  const usagePercentage = limits.monthlyGenerations === -1 
    ? 0 
    : (userProfile.monthlyUsageCount / limits.monthlyGenerations) * 100;

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        {/* Main Content */}
      <main className="max-w-7xl mx-auto container-padding py-12">
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center">
                <span className="text-white text-xl font-bold">👋</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-slate-900">Welcome back!</h1>
                <p className="text-xl text-slate-600">
                  Here's your account overview and quick actions.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {/* Subscription Status Card */}
            <div className="card card-hover p-6">
              <div className="flex items-center mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${
                  userProfile.subscriptionTier === 'free' 
                    ? 'bg-slate-100' 
                    : 'bg-gradient-to-r from-green-100 to-emerald-100'
                }`}>
                  {userProfile.subscriptionTier === 'free' ? '🆓' : '⭐'}
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                    Current Plan
                  </h3>
                  <p className="text-2xl font-bold text-slate-900 capitalize">
                    {userProfile.subscriptionTier}
                  </p>
                </div>
              </div>
              {userProfile.subscriptionTier === 'free' && (
                <Link 
                  href="/pricing" 
                  className="btn btn-primary w-full btn-sm"
                >
                  Upgrade to Pro
                </Link>
              )}
              {userProfile.subscriptionTier !== 'free' && (
                <div className="status-indicator status-success w-full justify-center">
                  <span className="w-2 h-2 bg-current rounded-full"></span>
                  Pro features active
                </div>
              )}
            </div>

            {/* Usage Card */}
            <div className="card card-hover p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center text-2xl">
                  📊
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                    Monthly Usage
                  </h3>
                  <p className="text-2xl font-bold text-slate-900">
                    {userProfile.monthlyUsageCount}
                    {limits.monthlyGenerations !== -1 && (
                      <span className="text-lg text-slate-500 font-normal">
                        {' '}/ {limits.monthlyGenerations}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              {limits.monthlyGenerations !== -1 && (
                <div className="mb-3">
                  <div className="bg-slate-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                    />
                  </div>
                </div>
              )}
              {userProfile.subscriptionTier === 'free' && userProfile.monthlyUsageResetDate && (
                <p className="text-xs text-slate-500">
                  Resets {new Date(userProfile.monthlyUsageResetDate).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Features Card */}
            <div className="card card-hover p-6">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center text-2xl">
                  ✨
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                    Features
                  </h3>
                  <p className="text-lg font-bold text-slate-900">
                    Available Now
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                    limits.pdfExports ? 'bg-green-100' : 'bg-slate-100'
                  }`}>
                    <span className={`text-sm ${limits.pdfExports ? 'text-green-600' : 'text-slate-400'}`}>
                      {limits.pdfExports ? '✓' : '✗'}
                    </span>
                  </div>
                  <span className={`text-sm ${limits.pdfExports ? 'text-slate-900' : 'text-slate-400'}`}>
                    PDF Export
                  </span>
                </div>
                <div className="flex items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                    limits.notionExports ? 'bg-green-100' : 'bg-slate-100'
                  }`}>
                    <span className={`text-sm ${limits.notionExports ? 'text-green-600' : 'text-slate-400'}`}>
                      {limits.notionExports ? '✓' : '✗'}
                    </span>
                  </div>
                  <span className={`text-sm ${limits.notionExports ? 'text-slate-900' : 'text-slate-400'}`}>
                    Notion Export
                  </span>
                </div>
                <div className="flex items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                    limits.watermarkFree ? 'bg-green-100' : 'bg-slate-100'
                  }`}>
                    <span className={`text-sm ${limits.watermarkFree ? 'text-green-600' : 'text-slate-400'}`}>
                      {limits.watermarkFree ? '✓' : '✗'}
                    </span>
                  </div>
                  <span className={`text-sm ${limits.watermarkFree ? 'text-slate-900' : 'text-slate-400'}`}>
                    No Watermark
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Pro Features Section */}
          {(userProfile.subscriptionTier === 'pro' || userProfile.subscriptionTier === 'lifetime') && (
            <>
              {/* Custom Branding Section */}
              <div className="card p-8 mb-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center text-2xl">
                    🎨
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      Custom Branding
                    </h2>
                    <p className="text-slate-600">
                      Make your courses truly yours with custom styling
                    </p>
                  </div>
                </div>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  Customize your course exports with your own logo, colors, and branding. 
                  Create professional-looking materials that match your brand identity.
                </p>
                <Link
                  href="/dashboard/branding"
                  className="btn btn-primary"
                >
                  <span className="mr-2">⚙️</span>
                  Manage Branding
                </Link>
              </div>

              {/* Integrations Section */}
              <div className="card p-8 mb-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center text-2xl">
                    🔗
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      Integrations
                    </h2>
                    <p className="text-slate-600">
                      Connect your favorite tools and platforms
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <NotionConnection />
                </div>
              </div>
            </>
          )}

          {/* Quick Actions */}
          <div className="card p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center text-2xl">
                ⚡
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Quick Actions
                </h2>
                <p className="text-slate-600">
                  Everything you need to get started
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/"
                className="btn btn-primary"
              >
                <span className="mr-2">✨</span>
                Generate Course
              </Link>
              {userProfile.subscriptionTier === 'free' && (
                <Link
                  href="/pricing"
                  className="btn btn-success"
                >
                  <span className="mr-2">⭐</span>
                  Upgrade to Pro
                </Link>
              )}
              <Link
                href="/courses"
                className="btn btn-secondary"
              >
                <span className="mr-2">📚</span>
                My Courses
              </Link>
              <Link
                href="/billing"
                className="btn btn-outline"
              >
                <span className="mr-2">💳</span>
                Billing
              </Link>
            </div>
          </div>

          {/* Account Info */}
          <div className="mt-12 card p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-gradient-to-r from-slate-100 to-gray-100 rounded-2xl flex items-center justify-center text-2xl">
                👤
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Account Information
                </h2>
                <p className="text-slate-600">
                  Your profile and membership details
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              <div className="space-y-6">
                <div>
                  <dt className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Email</dt>
                  <dd className="text-lg text-slate-900 font-medium">{userProfile.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Member Since</dt>
                  <dd className="text-lg text-slate-900 font-medium">
                    {new Date(userProfile.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </dd>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <dt className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Last Active</dt>
                  <dd className="text-lg text-slate-900 font-medium">
                    {new Date(userProfile.lastActive).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">User ID</dt>
                  <dd className="text-sm text-slate-600 font-mono bg-slate-100 px-3 py-2 rounded-lg">
                    {userProfile.id}
                  </dd>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
  } catch (error) {
    console.error('Dashboard error:', error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Something went wrong
          </h1>
          <p className="text-gray-600 mb-4">
            We encountered an error loading your dashboard. Please try again.
          </p>
          <div className="flex flex-col space-y-4">
            <Link 
              href="/"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Go to Home
            </Link>
            <RetryButton className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700">
              Retry
            </RetryButton>
          </div>
        </div>
      </div>
    );
  }
}