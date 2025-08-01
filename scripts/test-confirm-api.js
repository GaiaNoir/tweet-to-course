#!/usr/bin/env node

/**
 * Test the confirm-user API endpoint directly
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

async function testConfirmAPI() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('🧪 TESTING CONFIRM-USER API\n');

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const testEmail = `api-test-${Date.now()}@localhost.com`;
  const testPassword = 'password123';

  try {
    // Step 1: Create a user first
    console.log('1️⃣ Creating test user...');
    
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

    // Step 2: Test the confirm API
    console.log('\n2️⃣ Testing confirm-user API...');
    
    const response = await fetch('http://localhost:3000/api/auth/confirm-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: signupData.user.id,
        email: testEmail,
        password: testPassword,
      }),
    });

    console.log('   📊 Status:', response.status);
    
    const result = await response.json();
    console.log('   📊 Response:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('   ✅ API worked successfully!');
      console.log('   👤 User returned:', result.user?.email);
    } else {
      console.log('   ❌ API failed:', result.error);
    }

    // Cleanup
    console.log('\n3️⃣ Cleaning up...');
    const adminClient = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);
    await adminClient.auth.admin.deleteUser(signupData.user.id);
    console.log('   🧹 Test user deleted');

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

testConfirmAPI().catch(console.error);