'use client';

import React from 'react';
import { useAuth } from './AuthProvider';

export function UserProfile() {
  const { user, profile, signOut, loading } = useAuth();

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-500">Not signed in</p>
      </div>
    );
  }

  const getUsageLimit = () => {
    const limits = {
      free: 3,
      pro: 50,
      lifetime: '∞',
    };
    return limits[profile.subscription_status as keyof typeof limits] || 0;
  };

  const getUsageColor = () => {
    const limit = getUsageLimit();
    if (limit === '∞') return 'text-green-600';
    
    const percentage = (profile.monthly_usage_count / (limit as number)) * 100;
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Profile</h3>
        <button
          onClick={handleSignOut}
          className="text-sm text-red-600 hover:text-red-500"
        >
          Sign Out
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <p className="mt-1 text-sm text-gray-900">{user.email}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Subscription</label>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            profile.subscription_status === 'pro' 
              ? 'bg-blue-100 text-blue-800'
              : profile.subscription_status === 'lifetime'
              ? 'bg-purple-100 text-purple-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {profile.subscription_status.charAt(0).toUpperCase() + profile.subscription_status.slice(1)}
          </span>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Monthly Usage</label>
          <p className={`mt-1 text-sm ${getUsageColor()}`}>
            {profile.monthly_usage_count} / {getUsageLimit()} courses generated
          </p>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                getUsageColor().includes('red') 
                  ? 'bg-red-500'
                  : getUsageColor().includes('yellow')
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              style={{
                width: getUsageLimit() === '∞' 
                  ? '100%' 
                  : `${Math.min((profile.monthly_usage_count / (getUsageLimit() as number)) * 100, 100)}%`
              }}
            ></div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Usage Resets</label>
          <p className="mt-1 text-sm text-gray-900">
            {new Date(profile.usage_reset_date).toLocaleDateString()}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Member Since</label>
          <p className="mt-1 text-sm text-gray-900">
            {new Date(profile.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}
