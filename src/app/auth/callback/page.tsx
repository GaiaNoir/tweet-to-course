'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

function AuthCallbackContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error) {
          setStatus('error');
          setMessage(errorDescription || error);
          return;
        }

        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            setStatus('error');
            setMessage(exchangeError.message);
            return;
          }

          if (data.user) {
            setStatus('success');
            setMessage('Email confirmed successfully! Redirecting...');
            
            // Check if there's a redirect URL or plan parameter
            const redirectTo = searchParams.get('redirectTo') || '/dashboard';
            const plan = searchParams.get('plan');
            
            // If user was trying to access a pro plan, redirect to pricing or billing
            let finalRedirect = redirectTo;
            if (plan === 'pro') {
              finalRedirect = '/billing'; // Take them to billing to complete pro subscription
            } else if (redirectTo === '/dashboard' || redirectTo === '/') {
              finalRedirect = '/dashboard';
            }
            
            // Redirect after a short delay
            setTimeout(() => {
              router.push(finalRedirect);
            }, 1500);
          }
        } else {
          setStatus('error');
          setMessage('No confirmation code found');
        }
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'An unexpected error occurred');
      }
    };

    handleAuthCallback();
  }, [searchParams, supabase.auth, router]);

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

          {/* Status Icon */}
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            {status === 'loading' && (
              <div className="bg-indigo-100">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              </div>
            )}
            {status === 'success' && (
              <div className="bg-green-100">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            )}
            {status === 'error' && (
              <div className="bg-red-100">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="space-y-4">
            {status === 'loading' && (
              <>
                <h1 className="text-2xl font-bold text-slate-900">Confirming your email</h1>
                <p className="text-slate-600">Please wait while we verify your account...</p>
              </>
            )}

            {status === 'success' && (
              <>
                <h1 className="text-2xl font-bold text-slate-900">Email confirmed!</h1>
                <p className="text-slate-600">{message}</p>
                <div className="pt-4">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
                  >
                    Go to Dashboard
                  </Link>
                </div>
              </>
            )}

            {status === 'error' && (
              <>
                <h1 className="text-2xl font-bold text-slate-900">Confirmation failed</h1>
                <p className="text-slate-600">{message}</p>
                <div className="pt-4 space-y-3">
                  <Link
                    href="/auth/sign-up"
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
                  >
                    Try Again
                  </Link>
                  <div>
                    <Link
                      href="/help"
                      className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                    >
                      Contact Support
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Loading...</h1>
            <p className="text-slate-600">Please wait while we process your request.</p>
          </div>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}