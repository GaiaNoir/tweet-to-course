'use client';

import { useState } from 'react';
import { signIn, signUp } from '@/lib/auth';
import { Button } from './button';
import { Card } from './card';

interface AuthFormProps {
  mode: 'signin' | 'signup';
  onSuccess?: () => void;
  onModeChange?: (mode: 'signin' | 'signup') => void;
}

export function AuthForm({ mode, onSuccess, onModeChange }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = mode === 'signin' 
        ? await signIn(email, password)
        : await signUp(email, password);

      if (result.error) {
        // Provide more helpful error messages
        let errorMessage = result.error;
        
        if (result.error.includes('invalid')) {
          errorMessage = `Email not supported. Try: demo@localhost.com, test@yourcompany.com, or user@outlook.com`;
        } else if (result.error.includes('already') || result.error.includes('exists')) {
          errorMessage = `An account with this email already exists. Try signing in instead.`;
        } else if (result.error.includes('weak') || result.error.includes('password')) {
          errorMessage = `Password is too weak. Please use at least 6 characters with a mix of letters and numbers.`;
        }
        
        setError(errorMessage);
      } else if (result.user) {
        onSuccess?.();
      } else {
        setError('Something went wrong. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto p-6">
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold">
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </h2>
          <p className="text-gray-600 mt-2">
            {mode === 'signin' 
              ? 'Welcome back! Please sign in to your account.' 
              : 'Create your account to start generating courses.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your password"
            />
            {mode === 'signup' && (
              <p className="text-xs text-gray-500 mt-1">
                Password must be at least 6 characters long
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Please wait...' : (mode === 'signin' ? 'Sign In' : 'Create Account')}
          </Button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => onModeChange?.(mode === 'signin' ? 'signup' : 'signin')}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            {mode === 'signin' 
              ? "Don't have an account? Sign up" 
              : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </Card>
  );
}