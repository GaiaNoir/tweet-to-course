'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { authClient, userProfile } from '@/lib/auth';
import type { User } from '@supabase/supabase-js';
import type { DbUser } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  profile: DbUser | null;
  loading: boolean;
  signUp: (email: string, password: string, options?: { plan?: string; redirectTo?: string }) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<DbUser | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Load user profile data
  const loadProfile = async (userId: string) => {
    try {
      const profileData = await userProfile.getProfile(userId);
      setProfile(profileData);
    } catch (error) {
      console.error('Error loading user profile:', error);
      setProfile(null);
    }
  };

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          await loadProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (session?.user) {
          setUser(session.user);
          await loadProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // Auth methods
  const signUp = async (email: string, password: string, options?: { plan?: string; redirectTo?: string }) => {
    setLoading(true);
    try {
      await authClient.signUp(email, password, options);
      // User and profile will be set by the auth state change listener
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      await authClient.signIn(email, password);
      // User and profile will be set by the auth state change listener
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await authClient.signOut();
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    await authClient.resetPassword(email);
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.id);
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
