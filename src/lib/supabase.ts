import { createBrowserClient, createServerClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

// Build-safe environment variable access
const getSupabaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }
  return url;
};

const getSupabaseAnonKey = () => {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
  }
  return key;
};

const getSupabaseServiceKey = () => {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key && typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
    console.warn('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }
  return key || '';
};

// Client for browser/client-side operations with auth
export const createClient = () => {
  return createBrowserClient<Database>(
    getSupabaseUrl(),
    getSupabaseAnonKey()
  );
};

// Server client for server-side operations with auth
export const createServerSupabaseClient = async () => {
  const { cookies } = await import('next/headers');
  const cookieStore = cookies();
  
  return createServerClient<Database>(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
};

// Admin client for server-side operations with elevated privileges (no auth context)
export const createAdminClient = () => {
  // Only allow admin client creation on server side
  if (typeof window !== 'undefined') {
    throw new Error('Admin client can only be used on server side');
  }
  
  const serviceKey = getSupabaseServiceKey();
  if (!serviceKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }
  
  return createBrowserClient<Database>(
    getSupabaseUrl(),
    serviceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};

// Legacy exports for backward compatibility
export const supabase = createClient();

// Helper function to handle Supabase errors
export function handleSupabaseError(error: unknown): never {
  console.error('Supabase error:', error);
  const message = error && typeof error === 'object' && 'message' in error
    ? (error as { message: string }).message
    : 'Database operation failed';
  throw new Error(message);
}