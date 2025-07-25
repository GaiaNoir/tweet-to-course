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

    // Update user subscription in database directly
    try {
      console.log(`Updating user ${userId} subscription to ${plan} via callback`);
      
      // Use supabaseAdmin directly instead of making HTTP request
      const { supabaseAdmin } = await import('@/lib/supabase');
      
      // First check if user exists
      const { data: existingUser, error: fetchError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('clerk_user_id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching user:', fetchError);
        return redirect('/pricing?error=database_error');
      }

      if (!existingUser) {
        // Create user if doesn't exist
        const { error: createError } = await supabaseAdmin
          .from('users')
          .insert({
            clerk_user_id: userId,
            email: '', // Will be updated by Clerk webhook
            subscription_tier: plan,
            customer_code: verifyData.data.customer.customer_code,
            subscription_code: verifyData.data.plan_object?.subscription_code,
            usage_count: 0,
            monthly_usage_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (createError) {
          console.error('Error creating user:', createError);
          return redirect('/pricing?error=user_creation_failed');
        }
      } else {
        // Update existing user
        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update({
            subscription_tier: plan,
            customer_code: verifyData.data.customer.customer_code,
            subscription_code: verifyData.data.plan_object?.subscription_code,
            updated_at: new Date().toISOString(),
          })
          .eq('clerk_user_id', userId);

        if (updateError) {
          console.error('Error updating user subscription:', updateError);
          return redirect('/pricing?error=subscription_update_failed');
        }
      }

      // Log the successful payment
      await supabaseAdmin
        .from('usage_logs')
        .insert({
          user_id: userId,
          action: 'payment_callback_success',
          metadata: {
            amount: verifyData.data.amount,
            reference: transactionRef,
            customer_code: verifyData.data.customer.customer_code,
            plan: plan,
            source: 'callback',
          },
        });

      console.log(`Successfully updated user ${userId} subscription to ${plan} via callback`);
      
    } catch (dbError) {
      console.error('Database update error:', dbError);
      return redirect('/pricing?error=database_update_failed');
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