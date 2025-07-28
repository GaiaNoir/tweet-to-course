import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, updateUserSubscription, type SubscriptionTier } from '@/lib/auth';

export async function GET() {
  try {
    const user = getCurrentUser();
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        subscriptionTier: user.subscriptionTier,
        usageCount: user.usageCount,
        monthlyUsageCount: user.monthlyUsageCount,
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get user' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscriptionTier } = body;

    if (!['free', 'pro', 'lifetime'].includes(subscriptionTier)) {
      return NextResponse.json(
        { success: false, error: 'Invalid subscription tier' },
        { status: 400 }
      );
    }

    const updatedUser = updateUserSubscription(subscriptionTier as SubscriptionTier);

    return NextResponse.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    );
  }
}