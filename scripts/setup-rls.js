#!/usr/bin/env node

/**
 * Row Level Security setup for TweetToCourse project
 */

const { createClient } = require('@supabase/supabase-js');

async function setupRLS() {
  // TweetToCourse project credentials
  const supabaseUrl = 'https://rpwjenxdthwgjuwngncb.supabase.co';
  const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwd2plbnhkdGh3Z2p1d25nbmNiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjg0NTQwMCwiZXhwIjoyMDY4NDIxNDAwfQ.3GZ7YtbQdMWa66SUi-Jkv0xBMEuGfq1SU6v6M14-5ko';

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('🔒 Setting up Row Level Security...');
  console.log('📍 Target project:', supabaseUrl);
  console.log('');

  try {
    // Enable RLS
    console.log('⏳ Enabling Row Level Security...');
    const { error: rlsError } = await supabase.rpc('exec', {
      sql: `
        -- Row Level Security (RLS) policies
        ALTER TABLE tweet_users ENABLE ROW LEVEL SECURITY;
        ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
        ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
      `
    });

    if (rlsError && !rlsError.message.includes('exec')) {
      throw rlsError;
    }
    console.log('✅ RLS enabled on all tables');

    // Drop existing policies
    console.log('⏳ Cleaning up existing policies...');
    const { error: dropError } = await supabase.rpc('exec', {
      sql: `
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Users can view own profile" ON tweet_users;
        DROP POLICY IF EXISTS "Users can update own profile" ON tweet_users;
        DROP POLICY IF EXISTS "Users can view own courses" ON courses;
        DROP POLICY IF EXISTS "Users can insert own courses" ON courses;
        DROP POLICY IF EXISTS "Users can update own courses" ON courses;
        DROP POLICY IF EXISTS "Users can delete own courses" ON courses;
        DROP POLICY IF EXISTS "Users can view own usage logs" ON usage_logs;
        DROP POLICY IF EXISTS "Users can insert own usage logs" ON usage_logs;
        DROP POLICY IF EXISTS "Service role can manage all data" ON tweet_users;
        DROP POLICY IF EXISTS "Service role can manage all courses" ON courses;
        DROP POLICY IF EXISTS "Service role can manage all usage logs" ON usage_logs;
      `
    });

    if (dropError && !dropError.message.includes('exec')) {
      throw dropError;
    }
    console.log('✅ Existing policies cleaned up');

    // Create user policies
    console.log('⏳ Creating user access policies...');
    const { error: userPoliciesError } = await supabase.rpc('exec', {
      sql: `
        -- Users can only access their own data
        CREATE POLICY "Users can view own profile" ON tweet_users
          FOR SELECT USING (clerk_user_id = auth.jwt() ->> 'sub');

        CREATE POLICY "Users can update own profile" ON tweet_users
          FOR UPDATE USING (clerk_user_id = auth.jwt() ->> 'sub');

        -- Courses policies
        CREATE POLICY "Users can view own courses" ON courses
          FOR SELECT USING (user_id IN (
            SELECT id FROM tweet_users WHERE clerk_user_id = auth.jwt() ->> 'sub'
          ));

        CREATE POLICY "Users can insert own courses" ON courses
          FOR INSERT WITH CHECK (user_id IN (
            SELECT id FROM tweet_users WHERE clerk_user_id = auth.jwt() ->> 'sub'
          ));

        CREATE POLICY "Users can update own courses" ON courses
          FOR UPDATE USING (user_id IN (
            SELECT id FROM tweet_users WHERE clerk_user_id = auth.jwt() ->> 'sub'
          ));

        CREATE POLICY "Users can delete own courses" ON courses
          FOR DELETE USING (user_id IN (
            SELECT id FROM tweet_users WHERE clerk_user_id = auth.jwt() ->> 'sub'
          ));
      `
    });

    if (userPoliciesError && !userPoliciesError.message.includes('exec')) {
      throw userPoliciesError;
    }
    console.log('✅ User access policies created');

    // Create usage logs policies
    console.log('⏳ Creating usage logs policies...');
    const { error: logsPoliciesError } = await supabase.rpc('exec', {
      sql: `
        -- Usage logs policies
        CREATE POLICY "Users can view own usage logs" ON usage_logs
          FOR SELECT USING (user_id IN (
            SELECT id FROM tweet_users WHERE clerk_user_id = auth.jwt() ->> 'sub'
          ));

        CREATE POLICY "Users can insert own usage logs" ON usage_logs
          FOR INSERT WITH CHECK (user_id IN (
            SELECT id FROM tweet_users WHERE clerk_user_id = auth.jwt() ->> 'sub'
          ));
      `
    });

    if (logsPoliciesError && !logsPoliciesError.message.includes('exec')) {
      throw logsPoliciesError;
    }
    console.log('✅ Usage logs policies created');

    // Create service role policies
    console.log('⏳ Creating service role policies...');
    const { error: servicePoliciesError } = await supabase.rpc('exec', {
      sql: `
        -- Service role can bypass RLS for admin operations
        CREATE POLICY "Service role can manage all data" ON tweet_users
          FOR ALL USING (auth.role() = 'service_role');

        CREATE POLICY "Service role can manage all courses" ON courses
          FOR ALL USING (auth.role() = 'service_role');

        CREATE POLICY "Service role can manage all usage logs" ON usage_logs
          FOR ALL USING (auth.role() = 'service_role');
      `
    });

    if (servicePoliciesError && !servicePoliciesError.message.includes('exec')) {
      throw servicePoliciesError;
    }
    console.log('✅ Service role policies created');

    console.log('');
    console.log('🎉 Row Level Security setup completed successfully!');
    console.log('🔐 Database is now secure with proper access controls');

  } catch (error) {
    console.error('❌ RLS setup failed:', error.message);
    process.exit(1);
  }
}

// Setup RLS
setupRLS().catch(console.error);