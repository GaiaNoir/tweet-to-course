import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    console.log('Webhook payload received:', payload.substring(0, 200) + '...');
    
    const event = JSON.parse(payload);
    
    console.log('Paystack webhook event:', event.event);
    console.log('Event data:', JSON.stringify(event.data, null, 2));

    switch (event.event) {
      case 'charge.success':
        await handleChargeSuccess(event.data);
        break;
        
      case 'subscription.create':
        await handleSubscriptionCreate(event.data);
        break;
        
      case 'subscription.disable':
        await handleSubscriptionDisable(event.data);
        break;
        
      case 'subscription.enable':
        await handleSubscriptionEnable(event.data);
        break;
        
      case 'invoice.create':
        await handleInvoiceCreate(event.data);
        break;
        
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data);
        break;
        
      default:
        console.log(`Unhandled webhook event: ${event.event}`);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleChargeSuccess(data: {
  metadata?: {
    userId?: string;
    plan?: string;
    custom_fields?: Array<{ variable_name: string; value: string }>;
  };
  amount: number;
  reference: string;
  customer: { customer_code: string };
}) {
  try {
    console.log('Processing charge success for:', data.reference);
    console.log('Metadata received:', JSON.stringify(data.metadata, null, 2));

    const userId = data.metadata?.userId || 
                   data.metadata?.custom_fields?.find(
                     (field: { variable_name: string; value: string }) => field.variable_name === 'user_id'
                   )?.value;

    const plan = data.metadata?.plan || 
                 data.metadata?.custom_fields?.find(
                   (field: { variable_name: string; value: string }) => field.variable_name === 'plan'
                 )?.value;

    if (!userId) {
      console.error('No user ID found in charge success webhook');
      console.error('Available metadata:', data.metadata);
      return;
    }

    console.log(`Updating user ${userId} to ${plan || 'pro'} subscription`);

    // First check if user exists
    const adminClient = createAdminClient();
    const { data: existingUser, error: fetchError } = await adminClient
      .from('users')
      .select('*')
      .eq('clerk_user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching user:', fetchError);
      return;
    }

    if (!existingUser) {
      console.log('User not found, creating new user record');
      // Create user if doesn't exist
      const { error: createError } = await adminClient
        .from('users')
        .insert({
          clerk_user_id: userId,
          email: '', // Will be updated by Clerk webhook
          subscription_tier: plan || 'pro',
          customer_code: data.customer.customer_code,
          usage_count: 0,
          monthly_usage_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (createError) {
        console.error('Error creating user:', createError);
        return;
      }
    } else {
      // Update existing user
      const { error: updateError } = await adminClient
        .from('users')
        .update({
          subscription_tier: plan || 'pro',
          customer_code: data.customer.customer_code,
          updated_at: new Date().toISOString(),
        })
        .eq('clerk_user_id', userId);

      if (updateError) {
        console.error('Error updating user subscription:', updateError);
        return;
      }
    }

    console.log(`Successfully updated user ${userId} subscription to ${plan || 'pro'}`);

    // Log the successful payment
    await adminClient
      .from('usage_logs')
      .insert({
        user_id: userId,
        action: 'payment_success',
        metadata: {
          amount: data.amount,
          reference: data.reference,
          customer_code: data.customer.customer_code,
          plan: plan || 'pro',
        },
      });

    console.log('Payment success logged for user:', userId);

  } catch (error) {
    console.error('Error handling charge success:', error);
  }
}

async function handleSubscriptionCreate(data: {
  metadata?: { userId?: string };
  subscription_code: string;
  customer: { customer_code: string };
}) {
  try {
    const userId = data.metadata?.userId;
    
    if (!userId) {
      console.error('No user ID found in subscription create webhook');
      return;
    }

    // Update user with subscription details
    const adminClient = createAdminClient();
    const { error } = await adminClient
      .from('users')
      .update({
        subscription_tier: 'pro',
        subscription_code: data.subscription_code,
        customer_code: data.customer.customer_code,
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_user_id', userId);

    if (error) {
      console.error('Error updating user subscription:', error);
    }

  } catch (error) {
    console.error('Error handling subscription create:', error);
  }
}

async function handleSubscriptionDisable(data: { subscription_code: string }) {
  try {
    // Find user by subscription code
    const adminClient = createAdminClient();
    const { data: userData, error: userError } = await adminClient
      .from('users')
      .select('*')
      .eq('subscription_code', data.subscription_code)
      .single();

    if (userError || !userData) {
      console.error('User not found for subscription disable:', userError);
      return;
    }

    // Downgrade user to free tier
    const { error } = await adminClient
      .from('users')
      .update({
        subscription_tier: 'free',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userData.id);

    if (error) {
      console.error('Error downgrading user subscription:', error);
    }

    // Log the subscription cancellation
    await adminClient
      .from('usage_logs')
      .insert({
        user_id: userData.clerk_user_id,
        action: 'subscription_cancelled',
        metadata: {
          subscription_code: data.subscription_code,
          reason: 'subscription_disabled',
        },
      });

  } catch (error) {
    console.error('Error handling subscription disable:', error);
  }
}

async function handleSubscriptionEnable(data: { subscription_code: string }) {
  try {
    // Find user by subscription code
    const adminClient = createAdminClient();
    const { data: userData, error: userError } = await adminClient
      .from('users')
      .select('*')
      .eq('subscription_code', data.subscription_code)
      .single();

    if (userError || !userData) {
      console.error('User not found for subscription enable:', userError);
      return;
    }

    // Upgrade user to pro tier
    const { error } = await adminClient
      .from('users')
      .update({
        subscription_tier: 'pro',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userData.id);

    if (error) {
      console.error('Error upgrading user subscription:', error);
    }

  } catch (error) {
    console.error('Error handling subscription enable:', error);
  }
}

async function handleInvoiceCreate(data: {
  customer: { customer_code: string };
  invoice_code: string;
  amount: number;
  due_date: string;
}) {
  try {
    // Log invoice creation for record keeping
    const adminClient = createAdminClient();
    const { data: userData } = await adminClient
      .from('users')
      .select('clerk_user_id')
      .eq('customer_code', data.customer.customer_code)
      .single();

    if (userData) {
      await adminClient
        .from('usage_logs')
        .insert({
          user_id: userData.clerk_user_id,
          action: 'invoice_created',
          metadata: {
            invoice_code: data.invoice_code,
            amount: data.amount,
            due_date: data.due_date,
          },
        });
    }

  } catch (error) {
    console.error('Error handling invoice create:', error);
  }
}

async function handleInvoicePaymentFailed(data: {
  customer: { customer_code: string };
  invoice_code: string;
  amount: number;
  failure_reason: string;
}) {
  try {
    // Log payment failure and potentially notify user
    const adminClient = createAdminClient();
    const { data: userData } = await adminClient
      .from('users')
      .select('clerk_user_id')
      .eq('customer_code', data.customer.customer_code)
      .single();

    if (userData) {
      await adminClient
        .from('usage_logs')
        .insert({
          user_id: userData.clerk_user_id,
          action: 'payment_failed',
          metadata: {
            invoice_code: data.invoice_code,
            amount: data.amount,
            failure_reason: data.failure_reason,
          },
        });

      // TODO: Send email notification to user about payment failure
      // TODO: Implement grace period before downgrading subscription
    }

  } catch (error) {
    console.error('Error handling invoice payment failed:', error);
  }
}