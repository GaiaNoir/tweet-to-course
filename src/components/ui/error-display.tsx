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
    if (message.includes('🔒') || message.toLowerCase().includes('twitter blocks')) {
      return 'Twitter URL Detected';
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
    if (message.includes('🔒') || message.toLowerCase().includes('twitter blocks')) {
      return message; // Return the full Twitter copy instructions as-is
    }
    return message || 'An unexpected error occurred. Please try again.';
  };

  const renderTwitterInstructions = (message: string) => {
    if (!message.includes('🔒') && !message.toLowerCase().includes('twitter blocks')) {
      return <p className="text-sm opacity-90">{getUserFriendlyMessage(message)}</p>;
    }

    // Extract URL from the message
    const urlMatch = message.match(/(https?:\/\/[^\s]+)/);
    const tweetUrl = urlMatch ? urlMatch[1] : '';

    return (
      <div className="space-y-3">
        <p className="text-sm font-medium">X/Twitter blocks automatic content extraction. Here's how to copy the tweet text:</p>
        <ol className="text-sm space-y-2 ml-4 list-decimal">
          <li>
            {tweetUrl ? (
              <span>
                Open the tweet: <a href={tweetUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline break-all">{tweetUrl}</a>
              </span>
            ) : (
              'Open the tweet in a new tab'
            )}
          </li>
          <li>Copy the tweet text (not the URL)</li>
          <li>Paste it in the text box above</li>
          <li>Click "Generate Course" again</li>
        </ol>
        <p className="text-xs opacity-75 bg-blue-50 text-blue-800 p-2 rounded">
          💡 This actually works better since you can edit the text before generating your course!
        </p>
      </div>
    );
  };

  const baseClasses = "flex items-start space-x-3 p-4 rounded-lg border";
  
  const variantClasses = {
    inline: "bg-red-50 border-red-200 text-red-800",
    modal: "bg-white border-red-300 shadow-lg text-gray-900",
    banner: "bg-red-100 border-red-300 text-red-900"
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
      
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm mb-1">
          {getErrorTitle(errorMessage)}
        </h4>
        {renderTwitterInstructions(errorMessage)}
        
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