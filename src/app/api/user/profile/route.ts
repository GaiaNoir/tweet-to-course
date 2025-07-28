import { NextRequest, NextResponse } from 'next/server';
import { getUserProfile, updateUserSubscription, initializeUserMetadata } from '@/lib/auth-simple';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('Profile API - Auth user:', { id: user.id, email: user.email });

    // Initialize user metadata if this is their first time
    try {
      await initializeUserMetadata(user.id);
    } catch (error) {
      console.error('Error initializing user metadata:', error);
      // Continue anyway, getUserProfile will handle defaults
    }

    // Get user profile from auth metadata
    const profile = await getUserProfile();
    
    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Failed to load user profile' },
        { status: 500 }
      );
    }

    console.log('Profile API - User profile:', profile);

    // Return user profile (matching the expected format)
    return NextResponse.json({
      success: true,
      id: profile.id,
      email: profile.email,
      subscriptionTier: profile.subscriptionTier,
      usageCount: profile.usageCount,
      monthlyUsageCount: profile.monthlyUsageCount,
      monthlyUsageResetDate: profile.monthlyUsageResetDate,
      createdAt: profile.createdAt,
      lastActive: new Date().toISOString(), // We don't track this in metadata
    });

  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to load user profile',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { subscriptionTier } = body;

    if (!['free', 'pro', 'lifetime'].includes(subscriptionTier)) {
      return NextResponse.json(
        { success: false, error: 'Invalid subscription tier' },
        { status: 400 }
      );
    }

    // Update user subscription tier in auth metadata
    await updateUserSubscription(user.id, subscriptionTier);

    // Get updated profile
    const updatedProfile = await getUserProfile();

    return NextResponse.json({
      success: true,
      user: updatedProfile
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update user profile',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}