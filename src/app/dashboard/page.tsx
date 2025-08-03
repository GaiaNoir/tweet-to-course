'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { ProtectedRoute } from '@/components/ui/protected-route';
import { getSubscriptionLimits } from '@/lib/subscription-utils';
import Link from 'next/link';
import { NotionConnection } from '@/components/ui/notion-connection';
import { Navigation } from '@/components/ui/navigation';
import { BrandingSettings } from '@/components/ui/branding-settings';
import type { DbUser } from '@/lib/auth';

export default function DashboardPage() {
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    // Profile is automatically loaded by AuthProvider
  }, [profile]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }
  return (
    <ProtectedRoute>
      {profile ? <DashboardContent userProfile={profile} /> : null}
    </ProtectedRoute>
  );
}

function DashboardContent({ userProfile }: { userProfile: DbUser }) {
  const limits = getSubscriptionLimits(userProfile.subscription_status);
  const usagePercentage = limits.monthlyGenerations === -1 
    ? 0 
    : (userProfile.monthly_usage_count / limits.monthlyGenerations) * 100;

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Main Content */}
      <main className="max-w-7xl mx-auto container-padding py-8 sm:py-12">
          <div className="mb-8 sm:mb-12">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center">
                <span className="text-white text-lg sm:text-xl font-bold">👋</span>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white">Welcome back!</h1>
                <p className="text-base sm:text-lg lg:text-xl text-slate-600 dark:text-gray-300">
                  Here's your account overview and quick actions.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12">
            {/* Subscription Status Card */}
            <div className="card card-hover p-4 sm:p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-3 sm:mb-4">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-xl sm:text-2xl ${
                  userProfile.subscription_status === 'free' 
                    ? 'bg-slate-100 dark:bg-gray-700' 
                    : 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30'
                }`}>
                  {userProfile.subscription_status === 'free' ? '🆓' : '⭐'}
                </div>
                <div className="ml-3 sm:ml-4">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Current Plan
                  </h3>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white capitalize">
                    {userProfile.subscription_status}
                  </p>
                </div>
              </div>
              {userProfile.subscription_status === 'free' && (
                <Link 
                  href="/pricing" 
                  className="btn btn-primary w-full btn-sm"
                >
                  Upgrade to Pro
                </Link>
              )}
              {userProfile.subscription_status !== 'free' && (
                <div className="status-indicator status-success w-full justify-center">
                  <span className="w-2 h-2 bg-current rounded-full"></span>
                  Pro features active
                </div>
              )}
            </div>

            {/* Usage Stats Card */}
            <div className="card card-hover p-4 sm:p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl flex items-center justify-center text-xl sm:text-2xl">
                  📊
                </div>
                <div className="ml-3 sm:ml-4">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    This Month
                  </h3>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {userProfile.monthly_usage_count} / {limits.monthlyGenerations === -1 ? '∞' : limits.monthlyGenerations}
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
              {userProfile.subscription_status === 'free' && userProfile.usage_reset_date && (
                <p className="text-xs text-slate-500 dark:text-gray-400">
                  Resets {new Date(userProfile.usage_reset_date).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Features Card */}
            <div className="card card-hover p-4 sm:p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-2xl flex items-center justify-center text-xl sm:text-2xl">
                  ✨
                </div>
                <div className="ml-3 sm:ml-4">
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                    Features
                  </h3>
                  <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
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
          {(userProfile.subscription_status === 'pro' || userProfile.subscription_status === 'lifetime') && (
            <>
              {/* Custom Branding Section */}
              <div className="card p-6 sm:p-8 mb-6 sm:mb-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-2xl flex items-center justify-center text-xl sm:text-2xl">
                    🎨
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                      Custom Branding
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 dark:text-gray-300">
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
              <div className="card p-6 sm:p-8 mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center text-xl sm:text-2xl">
                    🔗
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                      Integrations
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600">
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
          <div className="card p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center text-xl sm:text-2xl">
                ⚡
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Quick Actions
                </h2>
                <p className="text-sm sm:text-base text-slate-600">
                  Everything you need to get started
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Link
                href="/generate"
                className="btn btn-primary"
              >
                <span className="mr-2">✨</span>
                Generate Course
              </Link>
              {userProfile.subscription_status === 'free' && (
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

          {/* Custom Branding Section - Only for Pro users */}
          {userProfile.subscription_status !== 'free' && (
            <div className="mt-8 sm:mt-12">
              <BrandingSettings />
            </div>
          )}

          {/* Account Info */}
          <div className="mt-8 sm:mt-12 card p-6 sm:p-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-slate-100 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-2xl flex items-center justify-center text-xl sm:text-2xl">
                👤
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  Account Information
                </h2>
                <p className="text-sm sm:text-base text-slate-600 dark:text-gray-300">
                  Your profile and membership details
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:gap-8 sm:grid-cols-2">
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <dt className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1 sm:mb-2">Email</dt>
                  <dd className="text-base sm:text-lg text-slate-900 dark:text-white font-medium break-all">{userProfile.email}</dd>
                </div>
                <div>
                  <dt className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1 sm:mb-2">Member Since</dt>
                  <dd className="text-base sm:text-lg text-slate-900 dark:text-white font-medium">
                    {new Date(userProfile.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </dd>
                </div>
              </div>
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <dt className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1 sm:mb-2">Last Updated</dt>
                  <dd className="text-base sm:text-lg text-slate-900 dark:text-white font-medium">
                    {new Date(userProfile.updated_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1 sm:mb-2">User ID</dt>
                  <dd className="text-xs sm:text-sm text-slate-600 dark:text-gray-300 font-mono bg-slate-100 dark:bg-gray-700 px-2 sm:px-3 py-1 sm:py-2 rounded-lg break-all">
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
}