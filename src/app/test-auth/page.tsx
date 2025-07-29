'use client';

import { useAuth } from '@/hooks/useAuth';
import { NotionConnectionManager } from '@/components/ui/notion-connection-manager';

export default function TestAuthPage() {
  const { user, loading, canExportNotion, isFreeTier, updateSubscription } = useAuth();

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Auth Test Page</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Current User</h2>
        <div className="space-y-2">
          <p><strong>ID:</strong> {user?.id}</p>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Subscription:</strong> 
            <span className={`ml-2 px-2 py-1 rounded text-sm ${
              user?.subscriptionTier === 'pro' ? 'bg-green-100 text-green-800' :
              user?.subscriptionTier === 'lifetime' ? 'bg-purple-100 text-purple-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {user?.subscriptionTier?.toUpperCase()}
            </span>
          </p>
          <p><strong>Usage Count:</strong> {user?.usageCount}</p>
          <p><strong>Monthly Usage:</strong> {user?.monthlyUsageCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Permissions</h2>
        <div className="space-y-2">
          <p><strong>Can Export to Notion:</strong> 
            <span className={`ml-2 ${canExportNotion ? 'text-green-600' : 'text-red-600'}`}>
              {canExportNotion ? '✅ Yes' : '❌ No'}
            </span>
          </p>
          <p><strong>Is Free Tier:</strong> 
            <span className={`ml-2 ${isFreeTier ? 'text-orange-600' : 'text-green-600'}`}>
              {isFreeTier ? '⚠️ Yes' : '✅ No'}
            </span>
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Change Subscription</h2>
        <div className="flex gap-2">
          <button
            onClick={() => updateSubscription('free')}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Set Free
          </button>
          <button
            onClick={() => updateSubscription('pro')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Set Pro
          </button>
          <button
            onClick={() => updateSubscription('lifetime')}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Set Lifetime
          </button>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Notion Integration</h2>
        <NotionConnectionManager />
      </div>

      <div className="mt-6">
        <a 
          href="/"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          ← Back to Main App
        </a>
      </div>
    </div>
  );
}