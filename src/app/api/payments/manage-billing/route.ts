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

    const { customerCode } = await request.json();

    if (!customerCode) {
      return NextResponse.json(
        { success: false, error: 'Customer code is required' },
        { status: 400 }
      );
    }

    // For Paystack, we'll redirect to their customer portal
    // Note: Paystack doesn't have a direct customer portal API like Stripe
    // This is a simplified approach - in production, you might want to:
    // 1. Create a custom billing management page
    // 2. Use Paystack's dashboard links
    // 3. Implement your own billing management interface

    // Get customer details from Paystack
    const customerResponse = await fetch(
      `https://api.paystack.co/customer/${customerCode}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const customerData = await customerResponse.json();

    if (!customerData.status) {
      throw new Error('Failed to fetch customer data');
    }

    // Since Paystack doesn't have a direct customer portal,
    // we'll return a success response and handle this in the frontend
    // by showing billing information or redirecting to a custom billing page
    return NextResponse.json({
      success: true,
      message: 'Billing management access granted',
      managementUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing?customer=${customerCode}`,
      customerData: {
        email: customerData.data.email,
        customerCode: customerData.data.customer_code,
        createdAt: customerData.data.createdAt,
      },
    });

  } catch (error) {
    console.error('Billing management error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}