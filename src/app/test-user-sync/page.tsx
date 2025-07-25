'use client';

import { useAuth } from '@/hooks/use-auth';
import { useState, useEffect } from 'react';

interface UserProfile {
  id: string;
  email: string;
  subscriptionTier: string;
  usageCount: number;
  monthlyUsageCount: number;
  createdAt: string;
}

export default function TestUserSync() {
  const { user, isLoaded } = useAuth();
  const [supabaseUser, setSupabaseUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkUserSync = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/test-user-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSupabaseUser(data.user);
      } else {
        setError(data.error || 'Failed to sync user');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && user) {
      checkUserSync();
    }
  }, [isLoaded, user]);

  if (!isLoaded) {
    return <div className="p-8">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">User Sync Test</h1>
        <p>Please sign in to test user synchronization.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">User Sync Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Supabase Auth User Info */}
        <div className="bg-blue-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">Supabase Auth User</h2>
          <div className="space-y-2">
            <p><strong>ID:</strong> {user.id}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Created:</strong> {user.created_at ? new Date(user.created_at).toLocaleString() : 'Unknown'}</p>
            <p><strong>Last Sign In:</strong> {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}</p>
          </div>
        </div>

        {/* Supabase User Info */}
        <div className="bg-green-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-green-800">Supabase User</h2>
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <div className="text-red-600">
              <p><strong>Error:</strong> {error}</p>
              <button 
                onClick={checkUserSync}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Retry Sync
              </button>
            </div>
          ) : supabaseUser ? (
            <div className="space-y-2">
              <p><strong>ID:</strong> {supabaseUser.id}</p>
              <p><strong>Email:</strong> {supabaseUser.email}</p>
              <p><strong>Subscription:</strong> {supabaseUser.subscriptionTier}</p>
              <p><strong>Usage Count:</strong> {supabaseUser.usageCount}</p>
              <p><strong>Monthly Usage:</strong> {supabaseUser.monthlyUsageCount}</p>
              <p><strong>Created:</strong> {new Date(supabaseUser.createdAt).toLocaleString()}</p>
            </div>
          ) : (
            <p>No user found in Supabase</p>
          )}
        </div>
      </div>

      <div className="mt-6">
        <button 
          onClick={checkUserSync}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Syncing...' : 'Force Sync User'}
        </button>
      </div>

      <div className="mt-8 bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Sync Status</h3>
        {supabaseUser ? (
          <div className="text-green-600">
            ✅ User is synced between Clerk and Supabase
          </div>
        ) : (
          <div className="text-red-600">
            ❌ User is not synced. This could mean:
            <ul className="list-disc list-inside mt-2 ml-4">
              <li>Webhook is not configured properly</li>
              <li>User was created before webhook was set up</li>
              <li>There's an issue with the sync process</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}