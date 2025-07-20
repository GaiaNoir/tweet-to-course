import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const {
      userId,
      subscriptionTier,
      paystackCustomerCode,
      subscriptionCode,
      transactionReference,
    } = await request.json();

    if (!userId || !subscriptionTier) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // First, ensure user exists in database
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('clerk_user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching user:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Database error' },
        { status: 500 }
      );
    }

    // Update or insert user record
    const updateData = {
      subscription_tier: subscriptionTier,
      customer_code: paystackCustomerCode,
      subscription_code: subscriptionCode,
      updated_at: new Date().toISOString(),
    };

    let result;
    if (existingUser) {
      // Update existing user
      result = await supabaseAdmin
        .from('users')
        .update(updateData)
        .eq('clerk_user_id', userId);
    } else {
      // Create new user record
      result = await supabaseAdmin
        .from('users')
        .insert({
          clerk_user_id: userId,
          email: '', // Will be updated by Clerk webhook
          ...updateData,
        });
    }

    if (result.error) {
      console.error('Error updating user subscription:', result.error);
      return NextResponse.json(
        { success: false, error: 'Failed to update subscription' },
        { status: 500 }
      );
    }

    // Log the subscription update
    await supabaseAdmin
      .from('usage_logs')
      .insert({
        user_id: userId,
        action: 'subscription_updated',
        metadata: {
          new_tier: subscriptionTier,
          transaction_reference: transactionReference,
          customer_code: paystackCustomerCode,
          subscription_code: subscriptionCode,
        },
      });

    return NextResponse.json({
      success: true,
      message: 'Subscription updated successfully',
    });

  } catch (error) {
    console.error('Subscription update error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}