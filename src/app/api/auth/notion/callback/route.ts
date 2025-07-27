import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createServerSupabaseClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('Notion callback endpoint called');
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    
    console.log('User ID from callback:', userId);
    
    if (!userId) {
      console.log('No user ID, redirecting to sign-in');
      return NextResponse.redirect(new URL('/auth/sign-in', request.url));
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    
    console.log('OAuth callback params:', { code: code ? 'present' : 'missing', error });

    if (error) {
      console.error('Notion OAuth error:', error);
      return NextResponse.redirect(
        new URL('/dashboard?notion_error=access_denied', request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/dashboard?notion_error=no_code', request.url)
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(
          `${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_CLIENT_SECRET}`
        ).toString('base64')}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.NOTION_REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', errorData);
      return NextResponse.redirect(
        new URL('/dashboard?notion_error=token_exchange_failed', request.url)
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token, workspace_name, workspace_id } = tokenData;
    
    console.log('Token exchange successful:', { 
      workspace_name, 
      workspace_id, 
      access_token: access_token ? 'present' : 'missing' 
    });

    // Get user from database
    const adminClient = createAdminClient();
    const { data: userData, error: userError } = await adminClient
      .from('users')
      .select('id')
      .eq('auth_user_id', userId)
      .single();

    console.log('User lookup result:', { userData, userError });

    if (userError || !userData) {
      console.error('User not found:', userError);
      return NextResponse.redirect(
        new URL('/dashboard?notion_error=user_not_found', request.url)
      );
    }

    // Store the integration
    const integrationData = {
      user_id: userData.id,
      provider: 'notion',
      access_token,
      workspace_id,
      workspace_name,
      updated_at: new Date().toISOString(),
    };
    
    console.log('Storing integration:', integrationData);
    
    const { error: integrationError } = await adminClient
      .from('user_integrations')
      .upsert(integrationData);

    if (integrationError) {
      console.error('Failed to store integration:', integrationError);
      return NextResponse.redirect(
        new URL('/dashboard?notion_error=storage_failed', request.url)
      );
    }
    
    console.log('Integration stored successfully');

    // Success - redirect to dashboard
    return NextResponse.redirect(
      new URL('/dashboard?notion_connected=true', request.url)
    );

  } catch (error) {
    console.error('Notion OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/dashboard?notion_error=unknown', request.url)
    );
  }
}