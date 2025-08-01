#!/usr/bin/env node

/**
 * Script to check if an email already exists in Supabase
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

async function checkExistingEmail() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const emailToCheck = 'rula@gmail.com';

  console.log('🔍 Checking if email exists in database...\n');

  try {
    // Check in auth.users table
    console.log('1️⃣ Checking auth.users table...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('❌ Error checking auth users:', authError.message);
    } else {
      const existingAuthUser = authUsers.users.find(user => user.email === emailToCheck);
      if (existingAuthUser) {
        console.log('✅ Found in auth.users:');
        console.log(`   ID: ${existingAuthUser.id}`);
        console.log(`   Email: ${existingAuthUser.email}`);
        console.log(`   Created: ${existingAuthUser.created_at}`);
        console.log(`   Confirmed: ${existingAuthUser.email_confirmed_at ? 'Yes' : 'No'}`);
        console.log(`   Last Sign In: ${existingAuthUser.last_sign_in_at || 'Never'}`);
      } else {
        console.log('❌ Not found in auth.users');
      }
    }

    // Check in public.users table
    console.log('\n2️⃣ Checking public.users table...');
    const { data: publicUsers, error: publicError } = await supabase
      .from('users')
      .select('*')
      .eq('email', emailToCheck);

    if (publicError) {
      console.log('❌ Error checking public users:', publicError.message);
    } else if (publicUsers && publicUsers.length > 0) {
      console.log('✅ Found in public.users:');
      publicUsers.forEach(user => {
        console.log(`   ID: ${user.id}`);
        console.log(`   Auth User ID: ${user.auth_user_id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Subscription: ${user.subscription_tier}`);
        console.log(`   Created: ${user.created_at}`);
      });
    } else {
      console.log('❌ Not found in public.users');
    }

    // If user exists, offer to delete
    if (authUsers.users.find(user => user.email === emailToCheck)) {
      console.log('\n🔧 SOLUTION: The email already exists in your database.');
      console.log('You can either:');
      console.log('1. Try signing IN with this email instead of signing up');
      console.log('2. Use a different email address');
      console.log('3. Delete the existing user (run the delete script)');
      
      console.log('\nTo delete the existing user, run:');
      console.log('node scripts/delete-existing-user.js rula@gmail.com');
    } else {
      console.log('\n🤔 Email not found in database, but Supabase is still rejecting it.');
      console.log('This might be due to:');
      console.log('- Domain restrictions in Supabase settings');
      console.log('- Email validation rules');
      console.log('- Temporary Supabase issues');
      console.log('\nTry using a different email domain (like @example.com or @test.com)');
    }

  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

checkExistingEmail().catch(console.error);