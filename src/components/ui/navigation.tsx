'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X, User, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { signOut } from '@/lib/auth';

export function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, isSignedIn } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto">
      {/* Logo */}
      <Link href="/" className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">TC</span>
        </div>
        <span className="text-xl font-bold text-gray-900">TweetToCourse</span>
      </Link>
      
      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center space-x-8">
        <Link 
          href="/pricing" 
          className="text-gray-600 hover:text-gray-900 transition-colors"
        >
          Pricing
        </Link>
        <Link 
          href="/demo" 
          className="text-gray-600 hover:text-gray-900 transition-colors"
        >
          Demo
        </Link>
        {!isSignedIn ? (
          <Link 
            href="/auth/sign-in"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Sign In
          </Link>
        ) : (
          <>
            <Link 
              href="/dashboard" 
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Dashboard
            </Link>
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

      {/* Mobile Menu Button */}
      <div className="md:hidden">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-gray-600 hover:text-gray-900 transition-colors"
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="absolute top-20 left-0 right-0 bg-white shadow-lg border-t md:hidden z-50">
          <div className="px-6 py-4 space-y-4">
            <Link 
              href="/pricing" 
              className="block text-gray-600 hover:text-gray-900 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link 
              href="/demo" 
              className="block text-gray-600 hover:text-gray-900 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Demo
            </Link>
            {!isSignedIn ? (
              <Link 
                href="/auth/sign-in"
                className="block w-full text-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sign In
              </Link>
            ) : (
              <>
                <Link 
                  href="/dashboard" 
                  className="block text-gray-600 hover:text-gray-900 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    handleSignOut();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}