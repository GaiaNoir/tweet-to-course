import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userId, plan = 'pro' } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log(`Testing payment update for user: ${userId} to plan: ${plan}`);

    // First check if user exists
    const adminClient = createAdminClient();
    const { data: existingUser, error: fetchError } = await adminClient
      .from('users')
      .select('*')
      .eq('clerk_user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching user:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Database fetch error', details: fetchError },
        { status: 500 }
      );
    }

    if (!existingUser) {
      console.log('User not found, creating new user record');
      // Create user if doesn't exist
      const { error: createError } = await adminClient
        .from('users')
        .insert({
          clerk_user_id: userId,
          email: 'test@example.com',
          subscription_tier: plan,
          customer_code: 'test_customer_code',
          usage_count: 0,
          monthly_usage_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (createError) {
        console.error('Error creating user:', createError);
        return NextResponse.json(
          { success: false, error: 'User creation failed', details: createError },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'User created successfully',
        action: 'created',
        userId,
        plan
      });
    } else {
      // Update existing user
      const { error: updateError } = await adminClient
        .from('users')
        .update({
          subscription_tier: plan,
          updated_at: new Date().toISOString(),
        })
        .eq('clerk_user_id', userId);

      if (updateError) {
        console.error('Error updating user subscription:', updateError);
        return NextResponse.json(
          { success: false, error: 'Subscription update failed', details: updateError },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'User subscription updated successfully',
        action: 'updated',
        userId,
        plan,
        previousTier: existingUser.subscription_tier
      });
    }

  } catch (error) {
    console.error('Test payment webhook error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'User ID is required' },
      { status: 400 }
    );
  }

  try {
    // Check current user status
    const adminClient = createAdminClient();
    const { data: user, error } = await adminClient
      .from('users')
      .select('*')
      .eq('clerk_user_id', userId)
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: 'User not found', details: error },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        clerk_user_id: user.clerk_user_id,
        email: user.email,
        subscription_tier: user.subscription_tier,
        customer_code: user.customer_code,
        subscription_code: user.subscription_code,
        usage_count: user.usage_count,
        monthly_usage_count: user.monthly_usage_count,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}