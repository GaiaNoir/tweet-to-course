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
      return 'Please enter a Twitter/X URL or paste your content';
    }
    
    const trimmedValue = value.trim();
    const detectedType = detectInputType(trimmedValue);
    
    if (detectedType === 'url') {
      const twitterUrlPattern = /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/\w+\/status\/\d+/i;
      if (!twitterUrlPattern.test(trimmedValue)) {
        return 'Please enter a valid Twitter/X URL (e.g., https://twitter.com/username/status/123456789)';
      }
    } else {
      if (trimmedValue.length < 10) {
        return 'Content must be at least 10 characters long';
      }
      if (trimmedValue.length > 5000) {
        return 'Content must be less than 5000 characters';
      }
    }
    
    return true;
  };

  const onFormSubmit = async (data: FormData) => {
    const trimmedContent = data.content.trim();
    const type = detectInputType(trimmedContent);
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
    return contentValue.trim().startsWith('http') 
      ? 'https://twitter.com/username/status/123456789'
      : 'Paste your Twitter/X URL or enter your content manually...';
  };

  const getInputLabel = () => {
    const detectedType = detectInputType(contentValue);
    return detectedType === 'url' 
      ? 'Twitter/X URL' 
      : 'Content (Twitter/X URL or manual text)';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
        <LoadingAnimation />
      </div>
    );
  }

  if (!mounted) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-12 bg-indigo-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
      {error && (
        <div className="mb-6">
          <ErrorDisplay 
            error={error} 
            onRetry={handleRetry}
            onDismiss={onErrorDismiss}
            variant="inline"
          />
        </div>
      )}
      
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <div>
          <label 
            htmlFor="content-input" 
            className="block text-left text-sm font-medium text-gray-700 mb-2"
          >
            {getInputLabel()}
          </label>
          <textarea
            id="content-input"
            {...register('content', { 
              validate: validateInput,
              onChange: (e) => {
                // Auto-resize textarea based on content
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
              }
            })}
            placeholder={getPlaceholder()}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none transition-colors ${
              errors.content 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            rows={3}
            style={{ minHeight: '80px' }}
          />
          {errors.content && (
            <p className="mt-2 text-sm text-red-600">
              {errors.content.message}
            </p>
          )}
        </div>
        
        <button 
          type="submit"
          disabled={isLoading}
          className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Generating...' : 'Generate Course ✨'}
        </button>
      </form>
      
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-500">
          Free users get 1 generation. 
          <button 
            onClick={() => window.location.href = '/pricing'}
            className="text-indigo-600 hover:text-indigo-700 ml-1 underline"
          >
            Upgrade for unlimited access
          </button>
        </p>
      </div>
      
      {/* Input type indicator */}
      {contentValue && (
        <div className="mt-3 flex items-center justify-center">
          <span className={`text-xs px-2 py-1 rounded-full ${
            detectInputType(contentValue) === 'url' 
              ? 'bg-blue-100 text-blue-700' 
              : 'bg-green-100 text-green-700'
          }`}>
            {detectInputType(contentValue) === 'url' ? '🔗 URL detected' : '📝 Text content'}
          </span>
        </div>
      )}
    </div>
  );
}