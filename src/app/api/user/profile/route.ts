import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getUserProfile } from '@/lib/auth-supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('User profile API called');
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log('Auth result:', { user: user ? 'authenticated' : 'not authenticated', authError });
    
    if (!user) {
      console.log('No user found, returning 401');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('Fetching user profile for user ID:', user.id);
    const userProfile = await getUserProfile(user.id);
    console.log('User profile result:', userProfile);
    
    if (!userProfile) {
      console.log('No user profile found, returning 404');
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    console.log('Returning user profile successfully');
    return NextResponse.json(userProfile);

  } catch (error) {
    console.error('User profile API error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Failed to fetch user profile', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}