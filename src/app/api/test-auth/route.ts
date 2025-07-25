import { NextResponse } from 'next/server';
import { getCurrentUser, getUserProfile } from '@/lib/auth-supabase';

export async function GET() {
  try {
    console.log('🔍 Testing authentication...');
    
    // Test getting current user
    const user = await getCurrentUser();
    console.log('Current user:', user ? { id: user.id, email: user.email } : null);
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'No authenticated user',
        user: null,
        profile: null
      });
    }
    
    // Test getting user profile
    const profile = await getUserProfile(user.id);
    console.log('User profile:', profile ? { id: profile.id, email: profile.email } : null);
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      profile: profile ? {
        id: profile.id,
        email: profile.email,
        subscriptionTier: profile.subscriptionTier,
        monthlyUsageCount: profile.monthlyUsageCount
      } : null
    });
    
  } catch (error) {
    console.error('Auth test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      user: null,
      profile: null
    }, { status: 500 });
  }
}