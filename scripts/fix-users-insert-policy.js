#!/usr/bin/env node

/**
 * Fix RLS policy for users table to allow service role to insert new users
 * This fixes the webhook issue where user.created events fail
 */

const { createClient } = require('@supabase/supabase-js');

async function fixUsersInsertPolicy() {
  // TweetToCourse project credentials
  const supabaseUrl = 'https://rpwjenxdthwgjuwngncb.supabase.co';
  const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwd2plbnhkdGh3Z2p1d25nbmNiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjg0NTQwMCwiZXhwIjoyMDY4NDIxNDAwfQ.3GZ7YtbQdMWa66SUi-Jkv0xBMEuGfq1SU6v6M14-5ko';

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('🔧 Fixing users table INSERT policy...');
  console.log('📍 Target project:', supabaseUrl);
  console.log('');

  try {
    // Drop the existing service role policy and recreate with explicit permissions
    console.log('⏳ Dropping existing service role policy...');
    const { error: dropError } = await supabase.rpc('exec', {
      sql: `
        -- Drop the existing service role policy
        DROP POLICY IF EXISTS "Service role can manage all data" ON users;
      `
    });

    if (dropError && !dropError.message.includes('exec')) {
      throw dropError;
    }
    console.log('✅ Existing service role policy dropped');

    // Create separate policies for service role with explicit permissions
    console.log('⏳ Creating explicit service role policies...');
    const { error: createError } = await supabase.rpc('exec', {
      sql: `
        -- Create separate policies for service role with explicit permissions
        CREATE POLICY "Service role can insert users" ON users
          FOR INSERT 
          WITH CHECK (auth.role() = 'service_role');

        CREATE POLICY "Service role can select all users" ON users
          FOR SELECT 
          USING (auth.role() = 'service_role');

        CREATE POLICY "Service role can update all users" ON users
          FOR UPDATE 
          USING (auth.role() = 'service_role');

        CREATE POLICY "Service role can delete all users" ON users
          FOR DELETE 
          USING (auth.role() = 'service_role');
      `
    });

    if (createError && !createError.message.includes('exec')) {
      throw createError;
    }
    console.log('✅ Service role policies created with explicit permissions');

    // Verify the policies were created
    console.log('⏳ Verifying policies...');
    const { data: policies, error: verifyError } = await supabase
      .from('pg_policies')
      .select('policyname, cmd')
      .eq('tablename', 'users')
      .like('policyname', '%Service role%');

    if (verifyError) {
      console.warn('⚠️  Could not verify policies:', verifyError.message);
    } else {
      console.log('📋 Current service role policies:');
      policies.forEach(policy => {
        console.log(`   - ${policy.policyname} (${policy.cmd})`);
      });
    }

    console.log('');
    console.log('🎉 Users table INSERT policy fixed successfully!');
    console.log('🔐 Service role can now insert users via webhooks');
    console.log('');
    console.log('Next steps:');
    console.log('1. Test the webhook by creating a new user in Clerk');
    console.log('2. Check your Vercel logs for webhook success messages');
    console.log('3. Visit /test-user-sync to verify user synchronization');

  } catch (error) {
    console.error('❌ Policy fix failed:', error.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Verify your Supabase service role key is correct');
    console.error('2. Check if you have the right permissions');
    console.error('3. Ensure you\'re connected to the correct project');
    process.exit(1);
  }
}

// Fix the policy
fixUsersInsertPolicy().catch(console.error);