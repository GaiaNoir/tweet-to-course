'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

// Dynamically import Navigation to prevent SSR hydration issues
const Navigation = dynamic(() => import('./navigation').then(mod => ({ default: mod.Navigation })), {
  ssr: false,
  loading: () => (
    <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto">
      {/* Logo - always visible */}
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">TC</span>
        </div>
        <span className="text-xl font-bold text-gray-900">TweetToCourse</span>
      </div>

      {/* Placeholder for auth buttons */}
      <div className="hidden md:flex items-center space-x-8">
        <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="w-12 h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="w-20 h-8 bg-indigo-200 rounded animate-pulse"></div>
      </div>
    </nav>
  )
});

export function ClientNavigation() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto">
        {/* Logo - always visible */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">TC</span>
          </div>
          <span className="text-xl font-bold text-gray-900">TweetToCourse</span>
        </div>

        {/* Placeholder for auth buttons */}
        <div className="hidden md:flex items-center space-x-8">
          <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-12 h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-20 h-8 bg-indigo-200 rounded animate-pulse"></div>
        </div>
      </nav>
    );
  }

  return <Navigation />;
}