'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { LoadingAnimation } from './loading-animation';
import { ErrorDisplay } from './error-display';
import { CourseGenerationProgress } from './course-generation-progress';

interface CourseInputFormProps {
  onSubmitAction: (data: { content: string; type: 'url' | 'text' }) => Promise<void>;
  isLoading?: boolean;
  error?: string | undefined;
  onErrorDismiss?: () => void;
  // Async progress props
  jobStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  estimatedTimeRemaining?: number;
  onCancel?: () => void;
}

interface FormData {
  content: string;
}

export function CourseInputForm({
  onSubmitAction,
  isLoading = false,
  error,
  onErrorDismiss,
  jobStatus,
  progress = 0,
  estimatedTimeRemaining = 0,
  onCancel
}: CourseInputFormProps) {
  const [inputType, setInputType] = useState<'url' | 'text'>('url');
  const [mounted, setMounted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset
  } = useForm<FormData>();

  const contentValue = watch('content', '');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-detect input type based on content
  const detectInputType = (value: string): 'url' | 'text' => {
    const twitterUrlPattern = /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/\w+\/status\/\d+/i;
    return twitterUrlPattern.test(value.trim()) ? 'url' : 'text';
  };

  const validateInput = (value: string) => {
    if (!value || value.trim().length === 0) {
      return 'Please paste your content to generate a course';
    }

    const trimmedValue = value.trim();

    if (trimmedValue.length < 10) {
      return 'Content must be at least 10 characters long';
    }
    if (trimmedValue.length > 5000) {
      return 'Content must be less than 5000 characters';
    }

    return true;
  };

  const onFormSubmit = async (data: FormData) => {
    const trimmedContent = data.content.trim();
    // Always treat input as text content
    const type = 'text';
    setInputType(type);

    try {
      await onSubmitAction({ content: trimmedContent, type });
    } catch (err) {
      // Error handling is managed by parent component
      console.error('Form submission error:', err);
    }
  };

  const handleRetry = () => {
    if (onErrorDismiss) {
      onErrorDismiss();
    }
  };

  const getPlaceholder = () => {
    return 'Paste your tweet text or thread content here to generate a course...';
  };

  const getInputLabel = () => {
    return 'Course Content';
  };

  if (isLoading && jobStatus) {
    return (
      <CourseGenerationProgress
        status={jobStatus}
        progress={progress}
        estimatedTimeRemaining={estimatedTimeRemaining}
        error={error}
        onCancel={onCancel}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="card max-w-3xl mx-auto">
        <LoadingAnimation />
      </div>
    );
  }

  if (!mounted) {
    return (
      <div className="card max-w-3xl mx-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-12 bg-indigo-200 dark:bg-indigo-800 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="card max-w-3xl mx-auto p-6 sm:p-8 lg:p-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      {error && (
        <div className="mb-6 sm:mb-8">
          <ErrorDisplay
            error={error}
            onRetry={handleRetry}
            onDismiss={onErrorDismiss}
            variant="inline"
          />
        </div>
      )}

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 sm:space-y-6">
        <div>
          <label
            htmlFor="content-input"
            className="block text-left text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3"
          >
            {getInputLabel()}
          </label>
          <div className="relative">
            <textarea
              id="content-input"
              {...register('content', {
                validate: validateInput,
                onChange: (e) => {
                  // Auto-resize textarea based on content
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${Math.min(target.scrollHeight, 300)}px`;
                }
              })}
              placeholder={getPlaceholder()}
              className={`w-full px-4 sm:px-6 py-3 sm:py-4 text-base sm:text-lg leading-relaxed resize-none transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg ${errors.content
                ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20 focus:border-red-500 dark:focus:border-red-400'
                : 'border-slate-200 dark:border-gray-600 hover:border-slate-300 dark:hover:border-gray-500 focus:border-indigo-500 dark:focus:border-indigo-400'
                }`}
              rows={4}
              style={{ minHeight: '120px' }}
            />
            <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 text-xs text-gray-500 dark:text-gray-400">
              {contentValue.length}/5000
            </div>
          </div>
          {errors.content && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
                <span className="text-red-500 dark:text-red-400">⚠️</span>
                {errors.content.message}
              </p>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary w-full btn-lg text-base sm:text-lg"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span className="hidden sm:inline">Generating Your Course...</span>
              <span className="sm:hidden">Generating...</span>
            </>
          ) : (
            <>
              <span className="mr-2">✨</span>
              <span className="hidden sm:inline">Generate Course</span>
              <span className="sm:hidden">Generate</span>
            </>
          )}
        </button>
      </form>

      {/* Features highlight */}
      <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-200 dark:border-gray-700">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-center">
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-gray-400">
            <span className="text-green-500 dark:text-green-400">⚡</span>
            <span>Instant Generation</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-gray-400">
            <span className="text-blue-500 dark:text-blue-400">🎯</span>
            <span>AI-Structured</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-gray-400">
            <span className="text-purple-500 dark:text-purple-400">📄</span>
            <span>Export Ready</span>
          </div>
        </div>
      </div>

      {/* Upgrade prompt */}
      <div className="mt-4 sm:mt-6 text-center">
        <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400">
          Need unlimited generations?
          <button
            onClick={() => window.location.href = '/pricing'}
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 ml-1 font-medium underline decoration-2 underline-offset-2"
          >
            Upgrade to Pro
          </button>
        </p>
      </div>

      {/* Content length indicator */}
      {contentValue && (
        <div className="mt-4 flex items-center justify-center">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
            contentValue.length < 10 ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400' :
            contentValue.length > 4000 ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400' :
            'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
          }`}>
            <span className="w-2 h-2 bg-current rounded-full"></span>
            {contentValue.length} characters
          </div>
        </div>
      )}
    </div>
  );
}