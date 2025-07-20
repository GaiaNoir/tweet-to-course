'use client';

import { useAuth } from '@/hooks/use-auth';
import { SignIn } from '@clerk/nextjs';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isSignedIn) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Sign in required
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Please sign in to access this page
            </p>
          </div>
          <SignIn />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}