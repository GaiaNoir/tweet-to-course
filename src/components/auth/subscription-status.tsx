'use client';

import { useUserProfile } from '@/hooks/use-auth';
import { getSubscriptionLimits } from '@/lib/subscription-utils';
import Link from 'next/link';

interface SubscriptionStatusProps {
  showUpgradePrompt?: boolean;
  className?: string;
}

export function SubscriptionStatus({ 
  showUpgradePrompt = true, 
  className = '' 
}: SubscriptionStatusProps) {
  const { profile, loading, error } = useUserProfile();

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className={`text-red-600 text-sm ${className}`}>
        Error loading subscription status
      </div>
    );
  }

  const limits = getSubscriptionLimits(profile.subscriptionTier);
  const canGenerate = limits.monthlyGenerations === -1 || profile.usageCount < limits.monthlyGenerations;

  return (
    <div className={className}>
      <div className="flex items-center space-x-2">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          profile.subscriptionTier === 'free' 
            ? 'bg-gray-100 text-gray-800' 
            : 'bg-green-100 text-green-800'
        }`}>
          {profile.subscriptionTier.charAt(0).toUpperCase() + profile.subscriptionTier.slice(1)}
        </span>
        
        {limits.monthlyGenerations !== -1 && (
          <span className="text-sm text-gray-600">
            {profile.usageCount}/{limits.monthlyGenerations} used
          </span>
        )}
      </div>

      {!canGenerate && showUpgradePrompt && (
        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            You've reached your generation limit.{' '}
            <Link 
              href="/pricing" 
              className="font-medium underline hover:no-underline"
            >
              Upgrade to continue
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}