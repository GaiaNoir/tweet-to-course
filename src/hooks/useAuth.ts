'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser, updateUserSubscription, canPerformAction, type User, type SubscriptionTier } from '@/lib/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get user on mount
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  const updateSubscription = (tier: SubscriptionTier) => {
    const updatedUser = updateUserSubscription(tier);
    setUser(updatedUser);
  };

  const canExportNotion = user ? canPerformAction('export_notion') : false;
  const canGenerateUnlimited = user ? (user.subscriptionTier === 'pro' || user.subscriptionTier === 'lifetime') : false;
  const isFreeTier = user ? user.subscriptionTier === 'free' : true;

  return {
    user,
    loading,
    canExportNotion,
    canGenerateUnlimited,
    isFreeTier,
    updateSubscription,
  };
}