import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCurrentUser, userProfile } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  console.log('🎨 Logo upload request received');
  
  try {
    const user = await getCurrentUser();
    console.log('👤 Current user:', user?.id);
    
    if (!user) {
      console.log('❌ No authenticated user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await userProfile.getProfile(user.id);
    console.log('👤 User profile:', profile?.id, profile?.subscription_status);
    
    if (!profile) {
      console.log('❌ No user profile found');
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Check if user has Pro subscription
    if (profile.subscription_status !== 'pro' && profile.subscription_status !== 'lifetime') {
      console.log('❌ User not Pro:', profile.subscription_status);
      return NextResponse.json({ 
        error: 'Pro subscription required for custom branding' 
      }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('logo') as File;
    console.log('📁 File received:', file?.name, file?.size, file?.type);

    if (!file) {
      console.log('❌ No file in form data');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file
    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      console.log('❌ File too large:', file.size);
      return NextResponse.json({ error: 'File too large (max 2MB)' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      console.log('❌ Invalid file type:', file.type);
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Supabase Storage - use auth user ID for folder structure
    const fileName = `${user.id}/logo-${Date.now()}.${file.name.split('.').pop()}`;
    
    const { data, error } = await supabase.storage
      .from('user-assets')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true
      });

    if (error) {
      console.error('Storage error:', error);
      return NextResponse.json({ error: 'Failed to upload logo' }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('user-assets')
      .getPublicUrl(fileName);

    return NextResponse.json({ logo_url: publicUrl });
  } catch (error) {
    console.error('Logo upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}