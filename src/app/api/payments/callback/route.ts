import { NextRequest, NextResponse } from 'next/server';
import { redirect } from 'next/navigation';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const reference = searchParams.get('reference');
  const trxref = searchParams.get('trxref');
  
  // Use reference or trxref (Paystack sends both)
  const transactionRef = reference || trxref;

  if (!transactionRef) {
    // Redirect to pricing page with error
    return redirect('/pricing?error=missing_reference');
  }

  try {
    // Verify the transaction with Paystack
    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${transactionRef}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const verifyData = await verifyResponse.json();

    if (!verifyData.status || verifyData.data.status !== 'success') {
      // Payment failed or was not successful
      return redirect('/pricing?error=payment_failed');
    }

    // Extract user information from metadata
    const userId = verifyData.data.metadata?.userId || 
                   verifyData.data.metadata?.custom_fields?.find(
                     (field: { variable_name: string; value: string }) => field.variable_name === 'user_id'
                   )?.value;

    const plan = verifyData.data.metadata?.plan || 
                 verifyData.data.metadata?.custom_fields?.find(
                   (field: { variable_name: string; value: string }) => field.variable_name === 'plan'
                 )?.value;

    if (!userId || !plan) {
      console.error('Missing user ID or plan in payment metadata');
      return redirect('/pricing?error=invalid_metadata');
    }

    // Update user subscription in database
    const updateResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/users/update-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        subscriptionTier: plan,
        paystackCustomerCode: verifyData.data.customer.customer_code,
        subscriptionCode: verifyData.data.plan_object?.subscription_code,
        transactionReference: transactionRef,
      }),
    });

    if (!updateResponse.ok) {
      console.error('Failed to update user subscription');
      return redirect('/pricing?error=update_failed');
    }

    // Redirect to dashboard with success message
    return redirect('/dashboard?success=subscription_activated');

  } catch (error) {
    console.error('Payment callback error:', error);
    return redirect('/pricing?error=callback_error');
  }
}

// Handle POST requests (for webhook-style callbacks)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // This would be used if Paystack sends POST callbacks
    // For now, redirect to GET handler
    const reference = body.reference || body.data?.reference;
    
    if (reference) {
      return redirect(`/api/payments/callback?reference=${reference}`);
    }
    
    return NextResponse.json({ success: false, error: 'No reference provided' });
  } catch (error) {
    console.error('POST callback error:', error);
    return NextResponse.json({ success: false, error: 'Invalid request' });
  }
}