import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

interface ConfirmUserRequest {
  userId: string;
  email: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ConfirmUserRequest = await request.json();
    const { userId, email } = body;

    console.log('🔧 Auto-confirming user:', email);

    // Use admin client to confirm the user's email
    const adminClient = createAdminClient();
    
    const { data: confirmData, error: confirmError } = await adminClient.auth.admin.updateUserById(
      userId,
      { email_confirm: true }
    );

    if (confirmError) {
      console.error('❌ Admin confirm failed:', confirmError.message);
      return NextResponse.json(
        { success: false, error: confirmError.message },
        { status: 500 }
      );
    }

    console.log('✅ User email confirmed via admin');

    // Wait for database trigger to create profile
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get the user profile using admin client
    const { data: userProfile, error: profileError } = await adminClient
      .from('users')
      .select('*')
      .eq('auth_user_id', userId)
      .single();

    if (profileError || !userProfile) {
      console.error('❌ User profile not found after confirmation:', profileError?.message);
      return NextResponse.json(
        { success: false, error: 'User profile not created' },
        { status: 500 }
      );
    }

    console.log('✅ User profile found:', userProfile.email);

    return NextResponse.json({
      success: true,
      confirmed: true,
    });

  } catch (error) {
    console.error('💥 Confirm user API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}