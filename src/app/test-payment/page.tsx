'use client';

import { useState } from 'react';
// Auth removed - useAuth hook removed

export default function TestPaymentPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testPaymentUpdate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-payment-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'test-user-id',
          plan: 'pro'
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ success: false, error: 'Request failed' });
    } finally {
      setLoading(false);
    }
  };

  const checkUserStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/test-payment-webhook?userId=test-user-id`);
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ success: false, error: 'Request failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Payment System Test
        </h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">User Information</h2>
          <p>Authentication handled by server-side components</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
          <div className="space-y-4">
            <button
              onClick={checkUserStatus}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 mr-4"
            >
              {loading ? 'Loading...' : 'Check User Status'}
            </button>
            
            <button
              onClick={testPaymentUpdate}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Test Payment Update'}
            </button>
          </div>
        </div>

        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Result</h2>
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">
            How to Test Payment Flow
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>First, check your current user status using "Check User Status"</li>
            <li>Test the payment update logic using "Test Payment Update"</li>
            <li>Go to the pricing page and try a real payment</li>
            <li>Check the Vercel logs for webhook events</li>
            <li>Verify the user status changed in the dashboard</li>
          </ol>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mt-6">
          <h2 className="text-lg font-semibold text-red-900 mb-2">
            Common Issues & Solutions
          </h2>
          <ul className="list-disc list-inside space-y-2 text-red-800">
            <li><strong>Webhook not receiving events:</strong> Check Paystack dashboard webhook settings</li>
            <li><strong>Invalid signature:</strong> Verify webhook secret matches in Paystack and environment variables</li>
            <li><strong>User not found:</strong> Ensure user is signed in and exists in database</li>
            <li><strong>Database errors:</strong> Check Supabase connection and table structure</li>
          </ul>
        </div>
      </div>
    </div>
  );
}