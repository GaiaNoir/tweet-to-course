#!/usr/bin/env node

/**
 * Debug script to check signup issue
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

async function debugSignupIssue() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('🔍 DEBUGGING SIGNUP ISSUE\n');

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const adminClient = createClient(supabaseUrl, supabaseServiceKey);

  const testEmail = `debug-${Date.now()}@localhost.com`;
  const testPassword = 'password123';

  try {
    // Step 1: Check auth settings
    console.log('1️⃣ Checking auth settings...');
    const { data: settings, error: settingsError } = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
      }
    }).then(res => res.json());

    if (settings) {
      console.log('   📧 Email confirmation required:', settings.email_confirm || false);
      console.log('   📧 Email signup enabled:', settings.external?.email || false);
    }

    // Step 2: Test signup
    console.log('\n2️⃣ Testing signup...');
    console.log('   Email:', testEmail);
    
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });

    if (signupError) {
      console.log('   ❌ Signup failed:', signupError.message);
      return;
    }

    console.log('   ✅ Signup succeeded');
    console.log('   👤 User ID:', signupData.user?.id);
    console.log('   🔑 Session created:', !!signupData.session);
    console.log('   📧 Email confirmed:', signupData.user?.email_confirmed_at ? 'Yes' : 'No');

    // Step 3: Check if user profile was created by trigger
    console.log('\n3️⃣ Checking user profile creation...');
    
    if (signupData.user) {
      // Wait a moment for trigger
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const { data: userProfile, error: profileError } = await adminClient
        .from('users')
        .select('*')
        .eq('auth_user_id', signupData.user.id)
        .single();

      if (profileError) {
        console.log('   ❌ User profile not created:', profileError.message);
        console.log('   🔧 This suggests the database trigger is not working');
      } else {
        console.log('   ✅ User profile created successfully');
        console.log('   📧 Profile email:', userProfile.email);
        console.log('   🎯 Subscription tier:', userProfile.subscription_tier);
      }
    }

    // Step 4: Test getCurrentUser function
    console.log('\n4️⃣ Testing getCurrentUser function...');
    
    if (signupData.session) {
      // Manually set the session to test getCurrentUser
      await supabase.auth.setSession(signupData.session);
      
      // Test getCurrentUser (simulate what happens in the app)
      const { data: { user: currentAuthUser } } = await supabase.auth.getUser();
      console.log('   👤 Current auth user:', currentAuthUser?.id);
      
      if (currentAuthUser) {
        const { data: currentProfile } = await supabase
          .from('users')
          .select('*')
          .eq('auth_user_id', currentAuthUser.id)
          .single();
        
        console.log('   📋 Current profile found:', !!currentProfile);
      }
    } else {
      console.log('   ❌ No session to test with');
    }

    // Cleanup
    console.log('\n5️⃣ Cleaning up...');
    if (signupData.user) {
      await adminClient.auth.admin.deleteUser(signupData.user.id);
      console.log('   🧹 Test user deleted');
    }

    // Summary
    console.log('\n📋 SUMMARY:');
    if (!signupData.session) {
      console.log('❌ ISSUE: No session created after signup');
      console.log('   → Email confirmation might still be enabled');
      console.log('   → Check Supabase Dashboard → Authentication → Settings');
    } else if (profileError) {
      console.log('❌ ISSUE: Database trigger not working');
      console.log('   → User profile not created automatically');
      console.log('   → Check database trigger function');
    } else {
      console.log('✅ Everything looks good!');
    }

  } catch (error) {
    console.error('💥 Debug failed:', error.message);
  }
}

debugSignupIssue().catch(console.error);