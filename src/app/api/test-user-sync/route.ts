import { NextResponse } from 'next/server';
import { getOrCreateUserProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create user profile (this will sync the user if they don't exist)
    const userProfile = await getOrCreateUserProfile(user.id, user.email || '');

    if (!userProfile) {
      return NextResponse.json({ error: 'Failed to sync user' }, { status: 500 });
    }

    return NextResponse.json({ 
      user: userProfile,
      message: 'User synced successfully' 
    });

  } catch (error) {
    console.error('Error in test-user-sync:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}