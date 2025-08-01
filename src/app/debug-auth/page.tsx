'use client';

import { useState } from 'react';
import { signUp, signIn, getCurrentUser } from '@/lib/auth';
import { useAuth } from '@/contexts/auth-context';

export default function DebugAuthPage() {
  const [email, setEmail] = useState('demo@localhost.com');
  const [password, setPassword] = useState('password123');
  
  const testEmails = [
    'demo@localhost.com',
    'test@localhost.com',
    'user@localhost.com',
    'admin@localhost.com'
  ];
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { user, refreshUser } = useAuth();

  const testSignUp = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log('🧪 Testing signup...');
      const result = await signUp(email, password);
      setResult({ type: 'signup', ...result });
      
      // Refresh auth context
      await refreshUser();
    } catch (error) {
      setResult({ type: 'signup', error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const testSignIn = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log('🧪 Testing signin...');
      const result = await signIn(email, password);
      setResult({ type: 'signin', ...result });
      
      // Refresh auth context
      await refreshUser();
    } catch (error) {
      setResult({ type: 'signin', error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const testGetCurrentUser = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log('🧪 Testing getCurrentUser...');
      const currentUser = await getCurrentUser();
      setResult({ type: 'getCurrentUser', user: currentUser });
    } catch (error) {
      setResult({ type: 'getCurrentUser', error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Authentication Debug</h1>
      
      {/* Auth Context Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded">
        <h2 className="text-xl font-semibold mb-2">Auth Context Status</h2>
        {user ? (
          <div className="space-y-1">
            <p><strong>Status:</strong> <span className="text-green-600">Authenticated</span></p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>ID:</strong> {user.id}</p>
            <p><strong>Subscription:</strong> {user.subscriptionTier}</p>
          </div>
        ) : (
          <p><strong>Status:</strong> <span className="text-red-600">Not Authenticated</span></p>
        )}
      </div>

      {/* Test Form */}
      <div className="mb-6 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-4">Test Credentials</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              placeholder="Enter email or use a test email below"
            />
            <div className="mt-2">
              <p className="text-xs text-gray-600 mb-1">Quick test emails:</p>
              <div className="flex flex-wrap gap-1">
                {testEmails.map((testEmail, index) => (
                  <button
                    key={index}
                    onClick={() => setEmail(testEmail)}
                    className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                  >
                    {testEmail}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
        </div>
      </div>

      {/* Test Buttons */}
      <div className="mb-6 space-x-4">
        <button
          onClick={testSignUp}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Sign Up'}
        </button>
        <button
          onClick={testSignIn}
          disabled={loading}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Sign In'}
        </button>
        <button
          onClick={testGetCurrentUser}
          disabled={loading}
          className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Get Current User'}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Test Result ({result.type}):</h2>
          <pre className="whitespace-pre-wrap text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 p-4 bg-blue-50 rounded">
        <h3 className="font-semibold text-blue-800 mb-2">Debug Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
          <li>Check the browser console for detailed logs</li>
          <li>Try signing up with a new email address</li>
          <li>Check if email confirmation is required</li>
          <li>Test signing in with existing credentials</li>
          <li>Verify that the auth context updates properly</li>
        </ol>
      </div>
    </div>
  );
}