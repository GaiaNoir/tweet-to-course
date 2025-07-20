import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';

function verifyPaystackSignature(payload: string, signature: string): boolean {
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET!)
    .update(payload)
    .digest('hex');
  
  return hash === signature;
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-paystack-signature');
    
    if (!signature) {
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      );
    }

    const payload = await request.text();
    
    // Verify webhook signature
    if (!verifyPaystackSignature(payload, signature)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const event = JSON.parse(payload);
    
    console.log('Paystack webhook event:', event.event);

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
    custom_fields?: Array<{ variable_name: string; value: string }>;
  };
  amount: number;
  reference: string;
  customer: { customer_code: string };
}) {
  try {
    const userId = data.metadata?.userId || 
                   data.metadata?.custom_fields?.find(
                     (field: { variable_name: string; value: string }) => field.variable_name === 'user_id'
                   )?.value;

    if (!userId) {
      console.error('No user ID found in charge success webhook');
      return;
    }

    // Update user subscription status
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        subscription_tier: 'pro',
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_user_id', userId);

    if (error) {
      console.error('Error updating user subscription:', error);
    }

    // Log the successful payment
    await supabaseAdmin
      .from('usage_logs')
      .insert({
        user_id: userId,
        action: 'payment_success',
        metadata: {
          amount: data.amount,
          reference: data.reference,
          customer_code: data.customer.customer_code,
        },
      });

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
    const { error } = await supabaseAdmin
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
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('subscription_code', data.subscription_code)
      .single();

    if (userError || !userData) {
      console.error('User not found for subscription disable:', userError);
      return;
    }

    // Downgrade user to free tier
    const { error } = await supabaseAdmin
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
    await supabaseAdmin
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
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('subscription_code', data.subscription_code)
      .single();

    if (userError || !userData) {
      console.error('User not found for subscription enable:', userError);
      return;
    }

    // Upgrade user to pro tier
    const { error } = await supabaseAdmin
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
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('clerk_user_id')
      .eq('customer_code', data.customer.customer_code)
      .single();

    if (userData) {
      await supabaseAdmin
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
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('clerk_user_id')
      .eq('customer_code', data.customer.customer_code)
      .single();

    if (userData) {
      await supabaseAdmin
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