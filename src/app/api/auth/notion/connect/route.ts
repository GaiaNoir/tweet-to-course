import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('Notion connect endpoint called');
    
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('No authenticated user found');
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('User authenticated:', user.id);

    // Check environment variables
    const clientId = process.env.NOTION_CLIENT_ID;
    const redirectUri = process.env.NOTION_REDIRECT_URI;
    
    console.log('Environment variables:', {
      clientId: clientId ? 'present' : 'missing',
      redirectUri: redirectUri ? 'present' : 'missing',
      redirectUriValue: redirectUri
    });

    if (!clientId || !redirectUri) {
      console.error('Missing required environment variables');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Build Notion OAuth URL
    const authUrl = new URL('https://api.notion.com/v1/oauth/authorize');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('owner', 'user');
    authUrl.searchParams.set('redirect_uri', redirectUri);

    console.log('Generated auth URL:', authUrl.toString());

    return NextResponse.json({
      success: true,
      authUrl: authUrl.toString()
    });

  } catch (error) {
    console.error('Notion connect error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate auth URL' },
      { status: 500 }
    );
  }
}