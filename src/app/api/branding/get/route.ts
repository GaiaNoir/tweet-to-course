import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUser } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('users')
      .select('branding_settings')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch branding settings' }, { status: 500 });
    }

    return NextResponse.json({ 
      settings: data?.branding_settings || {
        logo_url: null,
        primary_color: '#4F46E5',
        accent_color: '#06B6D4',
        footer_text: null
      }
    });
  } catch (error) {
    console.error('Get branding settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}