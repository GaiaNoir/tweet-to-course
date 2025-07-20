'use client';

import React from 'react';

interface LoadingAnimationProps {
  message?: string;
  className?: string;
}

export function LoadingAnimation({ 
  message = "We're alchemizing your thread...", 
  className = "" 
}: LoadingAnimationProps) {
  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      {/* Animated spinner */}
      <div className="relative">
        <div className="w-16 h-16 border-4 border-indigo-200 rounded-full animate-spin">
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
        {/* Sparkle effect */}
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-300"></div>
      </div>
      
      {/* Loading message */}
      <div className="text-center">
        <p className="text-lg font-medium text-gray-700 mb-2">
          {message}
        </p>
        <div className="flex items-center justify-center space-x-1">
          <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce delay-100"></div>
          <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce delay-200"></div>
        </div>
      </div>
    </div>
  );
}