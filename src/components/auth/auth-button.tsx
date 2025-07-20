'use client';

import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import Link from 'next/link';

interface AuthButtonProps {
  showDashboardLink?: boolean;
  className?: string;
}

export function AuthButton({ showDashboardLink = true, className = '' }: AuthButtonProps) {
  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      <SignedOut>
        <SignInButton>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
            Sign In
          </button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        {showDashboardLink && (
          <Link 
            href="/dashboard"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            Dashboard
          </Link>
        )}
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </div>
  );
}