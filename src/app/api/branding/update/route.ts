import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCurrentUser, getUserProfile } from '@/lib/auth-supabase';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userProfile = await getUserProfile(user.id);
    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Check if user has Pro subscription
    if (userProfile.subscriptionTier !== 'pro' && userProfile.subscriptionTier !== 'lifetime') {
      return NextResponse.json({ 
        error: 'Pro subscription required for custom branding' 
      }, { status: 403 });
    }

    const { settings } = await request.json();

    // Validate settings
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Invalid settings' }, { status: 400 });
    }

    const { error } = await supabase
      .from('users')
      .update({ branding_settings: settings })
      .eq('id', userProfile.id);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to update branding settings' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update branding settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}