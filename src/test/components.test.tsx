import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoadingAnimation } from '@/components/ui/loading-animation';
import { ErrorDisplay } from '@/components/ui/error-display';
import { CourseInputForm } from '@/components/ui/course-input-form';

// Mock react-hook-form
vi.mock('react-hook-form', () => ({
  useForm: () => ({
    register: vi.fn(() => ({})),
    handleSubmit: vi.fn((fn) => (e) => {
      e.preventDefault();
      fn({ content: 'test content' });
    }),
    formState: { errors: {} },
    watch: vi.fn(() => ''),
    setValue: vi.fn(),
    reset: vi.fn()
  })
}));

describe('UI Components', () => {
  describe('LoadingAnimation', () => {
    it('renders with default message', () => {
      render(<LoadingAnimation />);
      expect(screen.getByText("We're alchemizing your thread...")).toBeInTheDocument();
    });

    it('renders with custom message', () => {
      render(<LoadingAnimation message="Custom loading message" />);
      expect(screen.getByText('Custom loading message')).toBeInTheDocument();
    });
  });

  describe('ErrorDisplay', () => {
    it('renders error message', () => {
      render(<ErrorDisplay error="Test error message" />);
      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    it('calls onRetry when retry button is clicked', () => {
      const onRetry = vi.fn();
      render(<ErrorDisplay error="Test error" onRetry={onRetry} />);
      
      const retryButton = screen.getByText('Try Again');
      fireEvent.click(retryButton);
      
      expect(onRetry).toHaveBeenCalled();
    });

    it('calls onDismiss when dismiss button is clicked', () => {
      const onDismiss = vi.fn();
      render(<ErrorDisplay error="Test error" onDismiss={onDismiss} />);
      
      const dismissButton = screen.getByText('Dismiss');
      fireEvent.click(dismissButton);
      
      expect(onDismiss).toHaveBeenCalled();
    });
  });

  describe('CourseInputForm', () => {
    it('renders form elements', () => {
      const onSubmit = vi.fn();
      render(<CourseInputForm onSubmit={onSubmit} />);
      
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /generate course/i })).toBeInTheDocument();
    });

    it('shows loading state', () => {
      const onSubmit = vi.fn();
      render(<CourseInputForm onSubmit={onSubmit} isLoading={true} />);
      
      expect(screen.getByText("We're alchemizing your thread...")).toBeInTheDocument();
    });

    it('shows error when provided', () => {
      const onSubmit = vi.fn();
      render(<CourseInputForm onSubmit={onSubmit} error="Test error" />);
      
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });
  });
});