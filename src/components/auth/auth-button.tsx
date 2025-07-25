'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { signOut } from '@/lib/auth';
import { User, LogOut } from 'lucide-react';
import { useState } from 'react';

interface AuthButtonProps {
  showDashboardLink?: boolean;
  className?: string;
}

export function AuthButton({ showDashboardLink = true, className = '' }: AuthButtonProps) {
  const { user, isSignedIn } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      {!isSignedIn ? (
        <Link 
          href="/auth/sign-in"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Sign In
        </Link>
      ) : (
        <>
          {showDashboardLink && (
            <Link 
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Dashboard
            </Link>
          )}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <User className="w-5 h-5" />
              <span>{user?.email?.split('@')[0] || 'User'}</span>
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}