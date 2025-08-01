#!/usr/bin/env node

/**
 * Test script to verify the user creation trigger is working
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

async function testUserTrigger() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('🧪 Testing user creation trigger...\n');

  try {
    // Check if trigger function exists
    console.log('1️⃣ Checking if trigger function exists...');
    const { data: functions, error: funcError } = await supabase
      .rpc('exec', { 
        sql: "SELECT proname FROM pg_proc WHERE proname = 'handle_new_user';" 
      });

    if (funcError) {
      console.log('❌ Error checking function:', funcError.message);
    } else {
      console.log('✅ Trigger function exists');
    }

    // Check if trigger exists
    console.log('\n2️⃣ Checking if trigger exists...');
    const { data: triggers, error: trigError } = await supabase
      .rpc('exec', { 
        sql: "SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_created';" 
      });

    if (trigError) {
      console.log('❌ Error checking trigger:', trigError.message);
    } else {
      console.log('✅ Trigger exists');
    }

    // Test signup with a test email
    console.log('\n3️⃣ Testing signup process...');
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'testpassword123';

    console.log('📧 Creating test user:', testEmail);
    
    // Use the anon client for signup (like the frontend would)
    const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    const { data: signupData, error: signupError } = await anonClient.auth.signUp({
      email: testEmail,
      password: testPassword,
    });

    if (signupError) {
      console.log('❌ Signup failed:', signupError.message);
      return;
    }

    if (!signupData.user) {
      console.log('❌ No user returned from signup');
      return;
    }

    console.log('✅ User created in auth.users:', signupData.user.id);
    console.log('📧 Email confirmation required:', !signupData.session);

    // Wait a moment for trigger to fire
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if user profile was created
    console.log('\n4️⃣ Checking if user profile was created...');
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', signupData.user.id)
      .single();

    if (profileError) {
      console.log('❌ User profile not found:', profileError.message);
      console.log('🔧 This suggests the trigger is not working properly');
    } else {
      console.log('✅ User profile created successfully:', userProfile.email);
    }

    // Clean up test user
    console.log('\n5️⃣ Cleaning up test user...');
    await supabase.auth.admin.deleteUser(signupData.user.id);
    console.log('🧹 Test user cleaned up');

    console.log('\n🎉 User trigger test completed!');

  } catch (error) {
    console.error('💥 Test failed:', error.message);
    process.exit(1);
  }
}

testUserTrigger().catch(console.error);