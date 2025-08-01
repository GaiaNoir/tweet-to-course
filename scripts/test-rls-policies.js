#!/usr/bin/env node

/**
 * Test RLS policies to see if they're blocking user access
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  
  envLines.forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=');
        process.env[key] = value;
      }
    }
  });
}

async function testRLSPolicies() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('🔍 TESTING RLS POLICIES\n');

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const adminClient = createClient(supabaseUrl, supabaseServiceKey);

  const testEmail = `rls-test-${Date.now()}@localhost.com`;
  const testPassword = 'password123';

  try {
    // Step 1: Create a user with admin client (bypasses RLS)
    console.log('1️⃣ Creating test user with admin client...');
    
    const { data: signupData, error: signupError } = await adminClient.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true, // Force confirm the email
    });

    if (signupError) {
      console.log('   ❌ Admin user creation failed:', signupError.message);
      return;
    }

    console.log('   ✅ User created:', signupData.user.id);

    // Wait for trigger to create profile
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 2: Check if profile was created (using admin client)
    console.log('\n2️⃣ Checking if profile was created...');
    
    const { data: adminProfile, error: adminProfileError } = await adminClient
      .from('users')
      .select('*')
      .eq('auth_user_id', signupData.user.id)
      .single();

    if (adminProfileError) {
      console.log('   ❌ Profile not found with admin client:', adminProfileError.message);
    } else {
      console.log('   ✅ Profile found with admin client:', adminProfile.email);
    }

    // Step 3: Try to sign in with regular client
    console.log('\n3️⃣ Testing signin with regular client...');
    
    const { data: signinData, error: signinError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (signinError) {
      console.log('   ❌ Signin failed:', signinError.message);
    } else {
      console.log('   ✅ Signin successful');
      console.log('   🔑 Session created:', !!signinData.session);
      console.log('   👤 User ID:', signinData.user?.id);
    }

    // Step 4: Test profile access with session
    if (signinData.session) {
      console.log('\n4️⃣ Testing profile access with session...');
      
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', signinData.user.id)
        .single();

      if (profileError) {
        console.log('   ❌ Profile access failed with session:', profileError.message);
        console.log('   🔧 This confirms RLS policy is blocking access');
      } else {
        console.log('   ✅ Profile access successful with session');
      }
    }

    // Step 5: Test auth.uid() function
    console.log('\n5️⃣ Testing auth.uid() function...');
    
    if (signinData.session) {
      const { data: authUidTest, error: authUidError } = await supabase
        .rpc('auth_uid_test')
        .single();

      if (authUidError && authUidError.message.includes('function')) {
        console.log('   ⚠️  auth.uid() test function not available (expected)');
      } else {
        console.log('   🔍 auth.uid() result:', authUidTest);
      }
    }

    // Cleanup
    console.log('\n6️⃣ Cleaning up...');
    await adminClient.auth.admin.deleteUser(signupData.user.id);
    console.log('   🧹 Test user deleted');

    // Summary
    console.log('\n📋 DIAGNOSIS:');
    if (signinError) {
      console.log('❌ ISSUE: Cannot sign in even with confirmed email');
      console.log('   → Email confirmation might still be required');
    } else if (profileError) {
      console.log('❌ ISSUE: RLS policies are blocking profile access');
      console.log('   → auth.uid() might not be working correctly');
      console.log('   → Need to check RLS policy configuration');
    } else {
      console.log('✅ RLS policies are working correctly');
      console.log('   → The issue is likely with email confirmation');
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

testRLSPolicies().catch(console.error);