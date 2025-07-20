import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user from database
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check for Notion integration
    const { data: integration, error: integrationError } = await supabaseAdmin
      .from('user_integrations')
      .select('workspace_name, created_at')
      .eq('user_id', userData.id)
      .eq('provider', 'notion')
      .single();

    if (integrationError && integrationError.code !== 'PGRST116') {
      console.error('Integration check error:', integrationError);
      return NextResponse.json(
        { success: false, error: 'Failed to check integration status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      connected: !!integration,
      workspace_name: integration?.workspace_name || null,
      connected_at: integration?.created_at || null
    });

  } catch (error) {
    console.error('Notion status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check status' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user from database
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Remove Notion integration
    const { error: deleteError } = await supabaseAdmin
      .from('user_integrations')
      .delete()
      .eq('user_id', userData.id)
      .eq('provider', 'notion');

    if (deleteError) {
      console.error('Failed to disconnect Notion:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to disconnect' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notion disconnected successfully'
    });

  } catch (error) {
    console.error('Notion disconnect error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to disconnect' },
      { status: 500 }
    );
  }
}