import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Build-safe environment variable access
const getSupabaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url && typeof window !== 'undefined') {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }
  return url || 'https://placeholder.supabase.co';
};

const getSupabaseAnonKey = () => {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key && typeof window !== 'undefined') {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
  }
  return key || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxMjU2MDAsImV4cCI6MTk2MDcwMTYwMH0.placeholder';
};

const getSupabaseServiceKey = () => {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key && typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
    console.warn('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }
  return key || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY0NTEyNTYwMCwiZXhwIjoxOTYwNzAxNjAwfQ.placeholder';
};

// Lazy initialization to avoid build-time errors
let _supabase: ReturnType<typeof createSupabaseClient<Database>> | null = null;
let _supabaseAdmin: ReturnType<typeof createSupabaseClient<Database>> | null = null;

// Client for browser/client-side operations
export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient<Database>>, {
  get(target, prop) {
    if (!_supabase) {
      _supabase = createSupabaseClient<Database>(getSupabaseUrl(), getSupabaseAnonKey());
    }
    return _supabase[prop as keyof typeof _supabase];
  }
});

// Admin client for server-side operations with elevated privileges
export const supabaseAdmin = new Proxy({} as ReturnType<typeof createSupabaseClient<Database>>, {
  get(target, prop) {
    if (!_supabaseAdmin) {
      _supabaseAdmin = createSupabaseClient<Database>(
        getSupabaseUrl(),
        getSupabaseServiceKey(),
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );
    }
    return _supabaseAdmin[prop as keyof typeof _supabaseAdmin];
  }
});

// Export createClient function for compatibility
export const createClient = () => {
  if (!_supabase) {
    _supabase = createSupabaseClient<Database>(getSupabaseUrl(), getSupabaseAnonKey());
  }
  return _supabase;
};

// Helper function to handle Supabase errors
export function handleSupabaseError(error: unknown): never {
  console.error('Supabase error:', error);
  const message = error && typeof error === 'object' && 'message' in error 
    ? (error as { message: string }).message 
    : 'Database operation failed';
  throw new Error(message);
}