import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { subscriptionCode } = await request.json();

    if (!subscriptionCode) {
      return NextResponse.json(
        { success: false, error: 'Subscription code is required' },
        { status: 400 }
      );
    }

    // Cancel subscription with Paystack
    const paystackResponse = await fetch(
      `https://api.paystack.co/subscription/disable`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: subscriptionCode,
          token: subscriptionCode, // Some Paystack endpoints use 'token' instead of 'code'
        }),
      }
    );

    const paystackData = await paystackResponse.json();

    if (!paystackData.status) {
      throw new Error(paystackData.message || 'Failed to cancel subscription');
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully',
    });

  } catch (error) {
    console.error('Subscription cancellation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}