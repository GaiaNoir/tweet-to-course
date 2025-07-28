'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

export interface UserProfile {
  id: string;
  email: string;
  subscriptionTier: 'free' | 'pro' | 'lifetime';
  usageCount: number;
  monthlyUsageCount: number;
  monthlyUsageResetDate: string;
  createdAt: string;
  lastActive: string;
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        setLoading(true);
        setError(null);

        const supabase = createClient();
        
        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          if (mounted) {
            setProfile(null);
            setLoading(false);
          }
          return;
        }

        // Fetch user profile from API
        const response = await fetch('/api/user/profile');
        
        if (!response.ok) {
          throw new Error('Failed to load user profile');
        }

        const profileData = await response.json();
        
        if (mounted) {
          setProfile(profileData);
        }
      } catch (err) {
        console.error('Error loading user profile:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load profile');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    // Listen for auth changes
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        loadProfile();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const canExportNotion = profile?.subscriptionTier === 'pro' || profile?.subscriptionTier === 'lifetime';
  const canGenerateUnlimited = profile?.subscriptionTier === 'pro' || profile?.subscriptionTier === 'lifetime';
  const isFreeTier = profile?.subscriptionTier === 'free' || !profile?.subscriptionTier;

  return {
    profile,
    loading,
    error,
    canExportNotion,
    canGenerateUnlimited,
    isFreeTier,
    refetch: () => {
      setLoading(true);
      // Trigger re-fetch by changing a dependency
    }
  };
}