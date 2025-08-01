#!/usr/bin/env node

/**
 * Test script to verify Supabase works without TypeScript types
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

async function testRawSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
  }

  // Create client WITHOUT TypeScript types
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  console.log('🧪 Testing raw Supabase client (no TypeScript types)...\n');

  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'testpassword123';

  try {
    console.log('📧 Testing signup with:', testEmail);
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });

    if (error) {
      console.log('❌ Raw Supabase signup failed:', error.message);
      console.log('   This suggests the issue is NOT with TypeScript types');
    } else {
      console.log('✅ Raw Supabase signup succeeded!');
      console.log('   User ID:', data.user?.id);
      console.log('   Email confirmed:', !!data.session);
      console.log('   This means the issue WAS with TypeScript types');
      
      // Clean up
      if (data.user) {
        await supabase.auth.signOut();
      }
    }

    // Test with the problematic email
    console.log('\n📧 Testing with problematic email: rula@gmail.com');
    
    const { data: data2, error: error2 } = await supabase.auth.signUp({
      email: 'rula@gmail.com',
      password: testPassword,
    });

    if (error2) {
      console.log('❌ Problematic email still fails:', error2.message);
      console.log('   This suggests the email itself has an issue');
    } else {
      console.log('✅ Problematic email now works!');
      console.log('   The issue was definitely TypeScript types');
      
      // Clean up
      if (data2.user) {
        await supabase.auth.signOut();
      }
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

testRawSupabase().catch(console.error);