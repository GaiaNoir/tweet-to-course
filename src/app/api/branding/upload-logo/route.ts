import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUser } from '@/lib/auth';
import { checkSubscriptionStatus } from '@/lib/subscription-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has Pro subscription
    const subscriptionStatus = await checkSubscriptionStatus(user.id);
    if (!subscriptionStatus.isActive) {
      return NextResponse.json({ 
        error: 'Pro subscription required for custom branding' 
      }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('logo') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file
    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      return NextResponse.json({ error: 'File too large (max 2MB)' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Supabase Storage
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