import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/database';
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

    // Get or create user in database
    let dbUser;
    try {
      dbUser = await UserService.getUserByAuthId(user.id);
      
      // If user doesn't exist, create them
      if (!dbUser && user.email) {
        console.log('Creating new user in database');
        dbUser = await UserService.getOrCreateUser(user.id, user.email);
      }
    } catch (error) {
      console.error('Error fetching/creating user:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to load user profile' },
        { status: 500 }
      );
    }

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('Profile API - DB user:', dbUser);

    // Return user profile
    return NextResponse.json({
      success: true,
      id: dbUser.id,
      email: dbUser.email,
      subscriptionTier: dbUser.subscription_tier,
      usageCount: dbUser.usage_count,
      monthlyUsageCount: dbUser.monthly_usage_count || 0,
      monthlyUsageResetDate: dbUser.monthly_usage_reset_date || new Date().toISOString(),
      createdAt: dbUser.created_at,
      lastActive: dbUser.last_active,
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

    // Update user subscription tier
    const updatedUser = await UserService.updateUserSubscription(user.id, subscriptionTier);

    return NextResponse.json({
      success: true,
      user: updatedUser
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