import { auth } from '@clerk/nextjs/server';
import { getUserProfile, updateUserActivity } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Update user activity
    await updateUserActivity(userId);
    
    // Get user profile
    const profile = await getUserProfile(userId);
    
    if (!profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}