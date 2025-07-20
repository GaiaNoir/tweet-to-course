'use client';

import React, { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { CreditCard, AlertCircle, CheckCircle } from 'lucide-react';

interface SubscriptionManagementProps {
  currentTier: string;
  customerCode?: string;
  subscriptionCode?: string;
}

export function SubscriptionManagement({ 
  currentTier, 
  customerCode, 
  subscriptionCode 
}: SubscriptionManagementProps) {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const handleUpgrade = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/payments/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: 'pro',
          userId: user.id,
        }),
      });

      const data = await response.json();
      
      if (data.success && data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      } else {
        throw new Error(data.error || 'Failed to create subscription');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Failed to start upgrade process. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscriptionCode) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/payments/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionCode,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Subscription cancelled successfully. You will retain Pro features until the end of your current billing period.');
        window.location.reload();
      } else {
        throw new Error(data.error || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Cancellation error:', error);
      alert('Failed to cancel subscription. Please contact support.');
    } finally {
      setIsLoading(false);
      setShowCancelConfirm(false);
    }
  };

  const handleManageBilling = async () => {
    if (!customerCode) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/payments/manage-billing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerCode,
        }),
      });

      const data = await response.json();
      
      if (data.success && data.managementUrl) {
        window.open(data.managementUrl, '_blank');
      } else {
        throw new Error(data.error || 'Failed to access billing management');
      }
    } catch (error) {
      console.error('Billing management error:', error);
      alert('Failed to access billing management. Please contact support.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center mb-4">
        <CreditCard className="w-5 h-5 text-gray-400 mr-2" />
        <h2 className="text-lg font-medium text-gray-900">
          Subscription Management
        </h2>
      </div>

      <div className="space-y-4">
        {/* Current Plan Status */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h3 className="font-medium text-gray-900 capitalize">
              {currentTier} Plan
            </h3>
            <p className="text-sm text-gray-600">
              {currentTier === 'free' 
                ? 'Limited features with watermarks'
                : 'Full access to all features'
              }
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            currentTier === 'free'
              ? 'bg-gray-200 text-gray-800'
              : 'bg-green-100 text-green-800'
          }`}>
            {currentTier === 'free' ? 'Free' : 'Pro'}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {currentTier === 'free' ? (
            <button
              onClick={handleUpgrade}
              disabled={isLoading}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Processing...' : 'Upgrade to Pro'}
            </button>
          ) : (
            <>
              {customerCode && (
                <button
                  onClick={handleManageBilling}
                  disabled={isLoading}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Loading...' : 'Manage Billing'}
                </button>
              )}
              
              {subscriptionCode && (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  disabled={isLoading}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel Subscription
                </button>
              )}
            </>
          )}
        </div>

        {/* Plan Comparison */}
        {currentTier === 'free' && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">
              Upgrade to Pro for:
            </h4>
            <ul className="space-y-1 text-sm text-blue-800">
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                Unlimited course generations
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                Watermark-free exports
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                Notion integration
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                Priority support
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                Advanced export options
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">
                Cancel Subscription
              </h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel your Pro subscription? You&apos;ll lose access to Pro features at the end of your current billing period.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}