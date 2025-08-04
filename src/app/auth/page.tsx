'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { UserPlus, LogIn, Zap, Gift, Loader2 } from 'lucide-react';

function AuthContent() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';
  const plan = searchParams.get('plan'); // 'free' or 'pro'

  const getPlanInfo = () => {
    if (plan === 'pro') {
      return {
        title: 'Start Your Pro Trial',
        description: 'Get unlimited course generations and premium features',
        icon: <Zap className="w-8 h-8 text-indigo-600" />,
        color: 'from-indigo-600 to-purple-600'
      };
    }
    return {
      title: 'Get Started Free',
      description: 'Create your first course and explore the platform',
      icon: <Gift className="w-8 h-8 text-green-600" />,
      color: 'from-green-600 to-blue-600'
    };
  };

  const planInfo = getPlanInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center space-x-3 group mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                <span className="text-white font-bold text-xl">TC</span>
              </div>
              <span className="text-xl font-bold text-slate-900">TweetToCourse</span>
            </Link>
            
            {plan && (
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  {planInfo.icon}
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">{planInfo.title}</h1>
                <p className="text-slate-600">{planInfo.description}</p>
              </div>
            )}
            
            {!plan && (
              <>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Welcome to TweetToCourse</h1>
                <p className="text-slate-600">Choose how you'd like to continue</p>
              </>
            )}
          </div>

          {/* Auth Options */}
          <div className="space-y-4">
            <Link
              href={`/auth/sign-up${redirectTo !== '/dashboard' ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-6 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center space-x-3 group"
            >
              <UserPlus className="w-5 h-5" />
              <span>Create New Account</span>
              <span className="opacity-75 group-hover:opacity-100 transition-opacity">→</span>
            </Link>

            <Link
              href={`/auth/sign-in${redirectTo !== '/dashboard' ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`}
              className="w-full bg-white border-2 border-slate-300 text-slate-700 py-4 px-6 rounded-lg font-medium hover:border-slate-400 hover:bg-slate-50 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center space-x-3 group"
            >
              <LogIn className="w-5 h-5" />
              <span>Sign In to Existing Account</span>
              <span className="opacity-75 group-hover:opacity-100 transition-opacity">→</span>
            </Link>
          </div>

          {/* Benefits */}
          {plan && (
            <div className="mt-8 p-4 bg-slate-50 rounded-lg">
              <h3 className="font-semibold text-slate-900 mb-3 text-sm">
                {plan === 'pro' ? 'Pro Plan Benefits:' : 'Free Plan Includes:'}
              </h3>
              <ul className="text-sm text-slate-600 space-y-1">
                {plan === 'pro' ? (
                  <>
                    <li>• Unlimited course generations</li>
                    <li>• Watermark-free exports</li>
                    <li>• Custom branding & colors</li>
                    <li>• Priority support</li>
                  </>
                ) : (
                  <>
                    <li>• 1 course generation per month</li>
                    <li>• Basic PDF export</li>
                    <li>• Email support</li>
                    <li>• No credit card required</li>
                  </>
                )}
              </ul>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-slate-500">
              By continuing, you agree to our{' '}
              <Link href="/terms" className="text-indigo-600 hover:text-indigo-500">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-indigo-600 hover:text-indigo-500">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Loading...</h1>
            <p className="text-slate-600">Please wait while we load the authentication page.</p>
          </div>
        </div>
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}