'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { AuthForm } from '@/components/ui/auth-form';

export default function TestFixPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const { user, signOut } = useAuth();

  const testCourseGeneration = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/generate-course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: "Productivity tip: Focus on one task at a time. Multitasking reduces efficiency by up to 40%. Block distractions, set clear goals, and take breaks every 90 minutes.",
          type: "text"
        })
      });

      const data = await response.json();
      setResult(data);

      if (!response.ok) {
        setError(`HTTP ${response.status}: ${data.error?.message || 'Unknown error'}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Authentication & Course Generation Test</h1>
      
      {/* Authentication Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded">
        <h2 className="text-xl font-semibold mb-2">Authentication Status</h2>
        {user ? (
          <div className="space-y-2">
            <p><strong>Status:</strong> <span className="text-green-600">Authenticated</span></p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Subscription:</strong> {user.subscriptionTier}</p>
            <p><strong>Monthly Usage:</strong> {user.monthlyUsageCount}</p>
            <button
              onClick={() => signOut()}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <p><strong>Status:</strong> <span className="text-orange-600">Anonymous</span></p>
            <button
              onClick={() => setShowAuth(!showAuth)}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm"
            >
              {showAuth ? 'Hide Auth' : 'Show Auth Form'}
            </button>
          </div>
        )}
      </div>

      {/* Authentication Form */}
      {showAuth && !user && (
        <div className="mb-6">
          <AuthForm
            mode="signup"
            onSuccess={() => {
              setShowAuth(false);
              window.location.reload();
            }}
            onModeChange={() => {}}
          />
        </div>
      )}
      
      {/* Course Generation Test */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Course Generation Test</h2>
        <button
          onClick={testCourseGeneration}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Course Generation'}
        </button>
        <p className="text-sm text-gray-600 mt-2">
          This will test course generation with your current authentication status
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Result:</h2>
          <pre className="whitespace-pre-wrap text-sm overflow-auto max-h-96">
            {JSON.stringify(result, null, 2)}
          </pre>
          
          {result.success && (
            <div className="mt-4 p-4 bg-green-100 rounded">
              <h3 className="font-semibold text-green-800">✅ Success!</h3>
              <p><strong>Course Title:</strong> {result.course?.title}</p>
              <p><strong>Course ID:</strong> {result.course?.id}</p>
              <p><strong>Modules:</strong> {result.course?.modules?.length}</p>
              <p><strong>User Mode:</strong> {user ? 'Authenticated' : 'Anonymous'}</p>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 p-4 bg-blue-50 rounded">
        <h3 className="font-semibold text-blue-800 mb-2">Full Authentication Flow Test:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
          <li><strong>Without Account:</strong> Try course generation (should fail with auth required message)</li>
          <li><strong>Create Account:</strong> Use the auth form above to sign up</li>
          <li><strong>With Account:</strong> Test course generation (should work with user tracking)</li>
          <li><strong>Usage Limits:</strong> Check that free tier limits are enforced (1 course/month)</li>
          <li><strong>Dashboard:</strong> Visit /dashboard to see your profile and courses</li>
        </ol>
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Anonymous course generation has been disabled. 
            All users must create an account to generate courses.
          </p>
        </div>
      </div>
    </div>
  );
}