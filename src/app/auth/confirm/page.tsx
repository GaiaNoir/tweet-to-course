'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';

function ConfirmContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      const supabase = createClient();
      
      try {
        // Get the tokens from URL
        const token_hash = searchParams.get('token_hash');
        const type = searchParams.get('type');

        if (token_hash && type) {
          console.log('🔐 Verifying email confirmation...');
          
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as any,
          });

          if (error) {
            console.error('❌ Email confirmation failed:', error.message);
            setStatus('error');
            setMessage(error.message);
            return;
          }

          if (data.user) {
            console.log('✅ Email confirmed successfully');
            setStatus('success');
            setMessage('Email confirmed! Redirecting to dashboard...');
            
            // Refresh the auth context
            await refreshUser();
            
            // Redirect to dashboard after a short delay
            setTimeout(() => {
              router.push('/dashboard');
            }, 2000);
          }
        } else {
          setStatus('error');
          setMessage('Invalid confirmation link');
        }
      } catch (error) {
        console.error('💥 Confirmation process failed:', error);
        setStatus('error');
        setMessage('Failed to confirm email');
      }
    };

    handleEmailConfirmation();
  }, [searchParams, router, refreshUser]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4">
            {status === 'loading' && (
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            )}
            {status === 'success' && (
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            )}
            {status === 'error' && (
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">❌</span>
              </div>
            )}
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {status === 'loading' && 'Confirming your email...'}
            {status === 'success' && 'Email Confirmed!'}
            {status === 'error' && 'Confirmation Failed'}
          </h2>
          
          <p className="text-gray-600">
            {message || 'Please wait while we confirm your email address.'}
          </p>
          
          {status === 'error' && (
            <div className="mt-4">
              <button
                onClick={() => router.push('/auth')}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Back to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    }>
      <ConfirmContent />
    </Suspense>
  );
}