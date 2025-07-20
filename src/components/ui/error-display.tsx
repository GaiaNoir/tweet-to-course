'use client';

import React from 'react';
import { AlertCircle, RefreshCw, X } from 'lucide-react';

interface ErrorDisplayProps {
  error: string | Error;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  variant?: 'inline' | 'modal' | 'banner';
}

export function ErrorDisplay({ 
  error, 
  onRetry, 
  onDismiss, 
  className = "",
  variant = 'inline'
}: ErrorDisplayProps) {
  const errorMessage = typeof error === 'string' ? error : error.message;
  
  const getErrorTitle = (message: string) => {
    if (message.toLowerCase().includes('network') || message.toLowerCase().includes('fetch')) {
      return 'Connection Error';
    }
    if (message.toLowerCase().includes('invalid') || message.toLowerCase().includes('url')) {
      return 'Invalid Input';
    }
    if (message.toLowerCase().includes('rate limit') || message.toLowerCase().includes('quota')) {
      return 'Rate Limit Exceeded';
    }
    return 'Something went wrong';
  };

  const getUserFriendlyMessage = (message: string) => {
    if (message.toLowerCase().includes('network') || message.toLowerCase().includes('fetch')) {
      return 'Please check your internet connection and try again.';
    }
    if (message.toLowerCase().includes('invalid url')) {
      return 'Please enter a valid Twitter/X URL or paste your content directly.';
    }
    if (message.toLowerCase().includes('rate limit')) {
      return 'You\'ve reached your usage limit. Please upgrade your plan or try again later.';
    }
    if (message.toLowerCase().includes('quota') || message.toLowerCase().includes('usage')) {
      return 'You\'ve used all your free generations. Upgrade to Pro for unlimited access.';
    }
    return message || 'An unexpected error occurred. Please try again.';
  };

  const baseClasses = "flex items-start space-x-3 p-4 rounded-lg border";
  
  const variantClasses = {
    inline: "bg-red-50 border-red-200 text-red-800",
    modal: "bg-white border-red-300 shadow-lg",
    banner: "bg-red-100 border-red-300 text-red-900"
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
      
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm mb-1">
          {getErrorTitle(errorMessage)}
        </h4>
        <p className="text-sm opacity-90">
          {getUserFriendlyMessage(errorMessage)}
        </p>
        
        {(onRetry || onDismiss) && (
          <div className="flex items-center space-x-3 mt-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center space-x-1 text-sm font-medium text-red-700 hover:text-red-800 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
              >
                Dismiss
              </button>
            )}
          </div>
        )}
      </div>
      
      {onDismiss && variant === 'modal' && (
        <button
          onClick={onDismiss}
          className="text-red-400 hover:text-red-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}