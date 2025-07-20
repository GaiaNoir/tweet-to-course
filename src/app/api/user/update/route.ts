import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { subscriptionTier, usageCount } = body;

    const supabase = createClient();
    
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (subscriptionTier) {
      updateData.subscription_tier = subscriptionTier;
    }

    if (typeof usageCount === 'number') {
      updateData.usage_count = usageCount;
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('clerk_user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: data,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}