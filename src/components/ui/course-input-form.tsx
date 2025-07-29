'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { LoadingAnimation } from './loading-animation';
import { ErrorDisplay } from './error-display';

interface CourseInputFormProps {
  onSubmit: (data: { content: string; type: 'url' | 'text' }) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  onErrorDismiss?: () => void;
}

interface FormData {
  content: string;
}

export function CourseInputForm({
  onSubmit,
  isLoading = false,
  error = null,
  onErrorDismiss
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
      await onSubmit({ content: trimmedContent, type });
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

  if (isLoading) {
    return (
      <div className="card max-w-3xl mx-auto">
        <LoadingAnimation />
      </div>
    );
  }

  if (!mounted) {
    return (
      <div className="card max-w-3xl mx-auto">
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-12 bg-indigo-200 dark:bg-indigo-800 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="card max-w-3xl mx-auto p-8 lg:p-10">
      {error && (
        <div className="mb-8">
          <ErrorDisplay
            error={error}
            onRetry={handleRetry}
            onDismiss={onErrorDismiss}
            variant="inline"
          />
        </div>
      )}

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        <div>
          <label
            htmlFor="content-input"
            className="block text-left text-lg font-semibold card-title mb-3"
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
              className={`w-full px-6 py-4 text-lg leading-relaxed resize-none transition-all duration-200 ${errors.content
                ? 'border-red-300 bg-red-50 focus:border-red-500'
                : 'border-slate-200 hover:border-slate-300 focus:border-indigo-500'
                }`}
              rows={4}
              style={{ minHeight: '120px' }}
            />
            <div className="absolute bottom-4 right-4 text-xs card-description">
              {contentValue.length}/5000
            </div>
          </div>
          {errors.content && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 flex items-center gap-2">
                <span className="text-red-500">⚠️</span>
                {errors.content.message}
              </p>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary w-full btn-lg text-lg"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Generating Your Course...
            </>
          ) : (
            <>
              <span className="mr-2">✨</span>
              Generate Course
            </>
          )}
        </button>
      </form>

      {/* Features highlight */}
      <div className="mt-8 pt-6 border-t border-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
            <span className="text-green-500">⚡</span>
            <span>Instant Generation</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
            <span className="text-blue-500">🎯</span>
            <span>AI-Structured</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
            <span className="text-purple-500">📄</span>
            <span>Export Ready</span>
          </div>
        </div>
      </div>

      {/* Upgrade prompt */}
      <div className="mt-6 text-center">
        <p className="text-sm text-slate-500">
          Need unlimited generations?
          <button
            onClick={() => window.location.href = '/pricing'}
            className="text-indigo-600 hover:text-indigo-700 ml-1 font-medium underline decoration-2 underline-offset-2"
          >
            Upgrade to Pro
          </button>
        </p>
      </div>

      {/* Content length indicator */}
      {contentValue && (
        <div className="mt-4 flex items-center justify-center">
          <div className={`status-indicator ${
            contentValue.length < 10 ? 'status-error' :
            contentValue.length > 4000 ? 'status-warning' :
            'status-success'
          }`}>
            <span className="w-2 h-2 bg-current rounded-full"></span>
            {contentValue.length} characters
          </div>
        </div>
      )}
    </div>
  );
}