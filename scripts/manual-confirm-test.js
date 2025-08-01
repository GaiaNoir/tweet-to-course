#!/usr/bin/env node

/**
 * Manually confirm a user to test if that fixes the session issue
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

async function manualConfirmTest() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('🧪 MANUAL CONFIRM TEST\n');

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const adminClient = createClient(supabaseUrl, supabaseServiceKey);

  const testEmail = `manual-confirm-${Date.now()}@localhost.com`;
  const testPassword = 'password123';

  try {
    // Step 1: Sign up user (will not have session)
    console.log('1️⃣ Signing up user...');
    
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });

    if (signupError) {
      console.log('   ❌ Signup failed:', signupError.message);
      return;
    }

    console.log('   ✅ User created:', signupData.user?.id);
    console.log('   🔑 Session created:', !!signupData.session);

    // Step 2: Manually confirm the user using admin client
    console.log('\n2️⃣ Manually confirming user...');
    
    const { data: confirmData, error: confirmError } = await adminClient.auth.admin.updateUserById(
      signupData.user.id,
      { email_confirm: true }
    );

    if (confirmError) {
      console.log('   ❌ Manual confirmation failed:', confirmError.message);
    } else {
      console.log('   ✅ User manually confirmed');
    }

    // Step 3: Try to sign in now that user is confirmed
    console.log('\n3️⃣ Testing signin after confirmation...');
    
    const { data: signinData, error: signinError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (signinError) {
      console.log('   ❌ Signin failed:', signinError.message);
    } else {
      console.log('   ✅ Signin successful!');
      console.log('   🔑 Session created:', !!signinData.session);
      console.log('   👤 User ID:', signinData.user?.id);
    }

    // Step 4: Test getCurrentUser equivalent
    if (signinData.session) {
      console.log('\n4️⃣ Testing profile access...');
      
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', signinData.user.id)
        .single();

      if (profileError) {
        console.log('   ❌ Profile access failed:', profileError.message);
      } else {
        console.log('   ✅ Profile access successful!');
        console.log('   📧 Profile email:', profile.email);
      }
    }

    // Cleanup
    console.log('\n5️⃣ Cleaning up...');
    await adminClient.auth.admin.deleteUser(signupData.user.id);
    console.log('   🧹 Test user deleted');

    // Summary
    console.log('\n📋 CONCLUSION:');
    if (signinData.session && !profileError) {
      console.log('✅ CONFIRMED: Email confirmation is the issue!');
      console.log('   → Once email is confirmed, everything works perfectly');
      console.log('   → You need to disable email confirmation in Supabase Dashboard');
      console.log('   → Or implement email confirmation flow in your app');
    } else {
      console.log('❌ There are other issues beyond email confirmation');
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

manualConfirmTest().catch(console.error);