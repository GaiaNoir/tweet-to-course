'use client';

import React, { useState } from 'react';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        <SignedOut>
          <SignInButton>
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
              Sign In
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
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
            <SignedOut>
              <SignInButton>
                <button 
                  className="w-full text-left bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <div className="pt-2">
                <UserButton />
              </div>
            </SignedIn>
          </div>
        </div>
      )}
    </nav>
  );
}