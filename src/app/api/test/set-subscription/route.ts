import { NextRequest, NextResponse } from 'next/server';
import { updateUserSubscription } from '@/lib/auth-simple';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
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
        { success: false, error: 'Invalid subscription tier. Must be: free, pro, or lifetime' },
        { status: 400 }
      );
    }

    // Update user subscription tier in auth metadata
    await updateUserSubscription(user.id, subscriptionTier);

    return NextResponse.json({
      success: true,
      message: `Subscription updated to ${subscriptionTier}`,
      userId: user.id,
      subscriptionTier
    });

  } catch (error) {
    console.error('Test subscription update error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update subscription',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Test endpoint to set user subscription tier',
    usage: 'POST with { "subscriptionTier": "free" | "pro" | "lifetime" }',
    example: {
      subscriptionTier: 'pro'
    }
  });
}