import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { plan } = await request.json();

    if (plan !== 'pro') {
      return NextResponse.json(
        { success: false, error: 'Invalid plan' },
        { status: 400 }
      );
    }

    // Get user email from Clerk
    const userResponse = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user data');
    }

    const userData = await userResponse.json();
    const userEmail = userData.email_addresses?.[0]?.email_address;

    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: 'User email not found' },
        { status: 400 }
      );
    }

    // Initialize Paystack transaction
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: userEmail,
        amount: 1900 * 100, // $19.00 in kobo (Paystack uses kobo for NGN, cents for USD)
        currency: 'USD',
        plan: 'PLN_pro_monthly', // This should be created in Paystack dashboard
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/callback`,
        metadata: {
          userId,
          plan: 'pro',
          custom_fields: [
            {
              display_name: 'User ID',
              variable_name: 'user_id',
              value: userId,
            },
            {
              display_name: 'Plan',
              variable_name: 'plan',
              value: 'pro',
            },
          ],
        },
      }),
    });

    const paystackData: PaystackInitializeResponse = await paystackResponse.json();

    if (!paystackData.status) {
      throw new Error(paystackData.message || 'Failed to initialize payment');
    }

    return NextResponse.json({
      success: true,
      authorizationUrl: paystackData.data.authorization_url,
      reference: paystackData.data.reference,
    });

  } catch (error) {
    console.error('Subscription creation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}