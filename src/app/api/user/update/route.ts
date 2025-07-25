import { createClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { subscriptionTier, usageCount } = body;
    
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
      .eq('auth_user_id', user.id)
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