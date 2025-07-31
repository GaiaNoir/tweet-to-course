import React from 'react';

interface CourseGenerationProgressProps {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  estimatedTimeRemaining: number; // in seconds
  error?: string;
  onCancel?: () => void;
}

export function CourseGenerationProgress({
  status,
  progress,
  estimatedTimeRemaining,
  error,
  onCancel
}: CourseGenerationProgressProps) {
  const getStatusMessage = () => {
    switch (status) {
      case 'pending':
        return 'Preparing your course generation...';
      case 'processing':
        return 'AI is creating your course content...';
      case 'completed':
        return 'Course generated successfully!';
      case 'failed':
        return error || 'Course generation failed';
      default:
        return 'Processing...';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'processing':
        return '🤖';
      case 'completed':
        return '✅';
      case 'failed':
        return '❌';
      default:
        return '⏳';
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">{getStatusIcon()}</div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            {getStatusMessage()}
          </h3>
          {status === 'processing' && estimatedTimeRemaining > 0 && (
            <p className="text-sm text-slate-600">
              Estimated time remaining: {formatTime(estimatedTimeRemaining)}
            </p>
          )}
        </div>

        {/* Progress Bar */}
        {status !== 'failed' && (
          <div className="mb-6">
            <div className="flex justify-between text-sm text-slate-600 mb-2">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ease-out ${
                  status === 'completed'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Status Details */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Status</span>
            <span className={`font-medium capitalize ${
              status === 'completed' ? 'text-green-600' :
              status === 'failed' ? 'text-red-600' :
              'text-indigo-600'
            }`}>
              {status}
            </span>
          </div>
          
          {status === 'processing' && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">AI Model</span>
              <span className="text-slate-900 font-medium">Claude 3.5 Sonnet</span>
            </div>
          )}
        </div>

        {/* Error Message */}
        {status === 'failed' && error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="text-red-400 mr-3 mt-0.5">⚠️</div>
              <div>
                <h4 className="text-sm font-medium text-red-800 mb-1">
                  Generation Failed
                </h4>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center space-x-3">
          {(status === 'pending' || status === 'processing') && onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
          )}
          
          {status === 'failed' && (
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              Try Again
            </button>
          )}
        </div>

        {/* Loading Animation */}
        {(status === 'pending' || status === 'processing') && (
          <div className="mt-6 flex justify-center">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
