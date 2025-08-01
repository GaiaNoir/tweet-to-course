#!/usr/bin/env node

/**
 * Test script to debug email validation issues
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

async function testEmailValidation() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  console.log('🧪 Testing email validation...\n');

  const testEmails = [
    'test@example.com',
    'user@gmail.com',
    'rula@gmail.com',
    `test-${Date.now()}@example.com`,
    `user-${Date.now()}@gmail.com`,
    'valid.email@domain.com',
    'test.user@test.com'
  ];

  for (const email of testEmails) {
    console.log(`📧 Testing email: ${email}`);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: 'testpassword123',
      });

      if (error) {
        console.log(`❌ Error: ${error.message}`);
        
        // Check if it's a "user already exists" error
        if (error.message.includes('already') || error.message.includes('exists')) {
          console.log('ℹ️  This email might already be registered');
          
          // Try signing in instead
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: email,
            password: 'testpassword123',
          });
          
          if (!signInError) {
            console.log('✅ Email exists and can sign in');
            await supabase.auth.signOut();
          }
        }
      } else {
        console.log('✅ Email accepted');
        if (data.user) {
          console.log(`   User ID: ${data.user.id}`);
          console.log(`   Confirmation required: ${!data.session}`);
          
          // Clean up - delete the test user
          try {
            await supabase.auth.signOut();
          } catch (cleanupError) {
            // Ignore cleanup errors
          }
        }
      }
    } catch (err) {
      console.log(`💥 Unexpected error: ${err.message}`);
    }
    
    console.log(''); // Empty line for readability
  }

  console.log('🎉 Email validation test completed!');
}

testEmailValidation().catch(console.error);