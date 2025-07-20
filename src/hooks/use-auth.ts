'use client';

import { useUser, useAuth as useClerkAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { UserProfile } from '@/lib/auth';

export function useAuth() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useClerkAuth();
  
  return {
    isLoaded,
    isSignedIn,
    user,
    getToken,
  };
}

export function useUserProfile() {
  const { user, isSignedIn } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      if (!isSignedIn || !user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/user/profile');
        if (!response.ok) {
          throw new Error('Failed to fetch user profile');
        }
        
        const data = await response.json();
        setProfile(data.profile);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [isSignedIn, user]);

  const refreshProfile = async () => {
    if (!isSignedIn || !user) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/user/profile');
      if (!response.ok) {
        throw new Error('Failed to refresh user profile');
      }
      
      const data = await response.json();
      setProfile(data.profile);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return {
    profile,
    loading,
    error,
    refreshProfile,
  };
}