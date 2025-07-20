import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

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

    // Get user from database
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .single();

    if (userError || !userData) {
      console.error('User not found:', userError);
      return NextResponse.redirect(
        new URL('/dashboard?notion_error=user_not_found', request.url)
      );
    }

    // Store the integration
    const { error: integrationError } = await supabaseAdmin
      .from('user_integrations')
      .upsert({
        user_id: userData.id,
        provider: 'notion',
        access_token,
        workspace_id,
        workspace_name,
        updated_at: new Date().toISOString(),
      });

    if (integrationError) {
      console.error('Failed to store integration:', integrationError);
      return NextResponse.redirect(
        new URL('/dashboard?notion_error=storage_failed', request.url)
      );
    }

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