'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Mail, CheckCircle, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase';

function ConfirmEmailContent() {
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState('');
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Get plan information from URL
  const plan = searchParams.get('plan');

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleResendEmail = async () => {
    if (!email) {
      setError('Email address is required');
      return;
    }

    setResending(true);
    setError('');

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: plan 
            ? `${window.location.origin}/auth/callback?plan=${plan}`
            : `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        throw error;
      }

      setResent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to resend confirmation email');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
          {/* Header */}
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center space-x-3 group mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                <span className="text-white font-bold text-xl">TC</span>
              </div>
              <span className="text-xl font-bold text-slate-900">TweetToCourse</span>
            </Link>
          </div>

          {/* Icon */}
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-indigo-600" />
          </div>

          {/* Content */}
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Check your email</h1>
          <p className="text-slate-600 mb-6">
            We've sent a confirmation link to{' '}
            <span className="font-medium text-slate-900">{email}</span>
          </p>
          <p className="text-sm text-slate-500 mb-8">
            Click the link in the email to confirm your account and {plan === 'pro' ? 'start your Pro trial' : 'start using TweetToCourse'}.
          </p>
          
          {plan === 'pro' && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-indigo-900 mb-2">🚀 Pro Trial Waiting</h3>
              <p className="text-sm text-indigo-700">
                After confirming your email, you'll be taken to complete your Pro subscription setup.
              </p>
            </div>
          )}

          {/* Resend Section */}
          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {resent && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-green-600 text-sm">Confirmation email sent successfully!</p>
              </div>
            )}

            <div className="text-sm text-slate-600">
              Didn't receive the email?{' '}
              <button
                onClick={handleResendEmail}
                disabled={resending}
                className="text-indigo-600 hover:text-indigo-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center space-x-1"
              >
                {resending && <RefreshCw className="w-4 h-4 animate-spin" />}
                <span>{resending ? 'Sending...' : 'Resend email'}</span>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-sm text-slate-500">
              Need help?{' '}
              <Link href="/help" className="text-indigo-600 hover:text-indigo-500 font-medium">
                Contact support
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Loading...</h1>
            <p className="text-slate-600">Please wait while we load your confirmation page.</p>
          </div>
        </div>
      </div>
    }>
      <ConfirmEmailContent />
    </Suspense>
  );
}