#!/usr/bin/env node

/**
 * Script to delete an existing user from Supabase
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

async function deleteExistingUser() {
  const emailToDelete = process.argv[2];
  
  if (!emailToDelete) {
    console.error('❌ Please provide an email address to delete');
    console.log('Usage: node scripts/delete-existing-user.js email@example.com');
    process.exit(1);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log(`🗑️  Deleting user: ${emailToDelete}\n`);

  try {
    // Find the user in auth.users
    console.log('1️⃣ Finding user in auth.users...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('❌ Error listing auth users:', authError.message);
      return;
    }

    const existingAuthUser = authUsers.users.find(user => user.email === emailToDelete);
    
    if (!existingAuthUser) {
      console.log('❌ User not found in auth.users');
      return;
    }

    console.log('✅ Found user:', existingAuthUser.id);

    // Delete from public.users first (due to foreign key constraints)
    console.log('\n2️⃣ Deleting from public.users...');
    const { error: publicDeleteError } = await supabase
      .from('users')
      .delete()
      .eq('auth_user_id', existingAuthUser.id);

    if (publicDeleteError) {
      console.log('⚠️  Error deleting from public.users:', publicDeleteError.message);
    } else {
      console.log('✅ Deleted from public.users');
    }

    // Delete from auth.users
    console.log('\n3️⃣ Deleting from auth.users...');
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(existingAuthUser.id);

    if (authDeleteError) {
      console.log('❌ Error deleting from auth.users:', authDeleteError.message);
    } else {
      console.log('✅ Deleted from auth.users');
    }

    console.log('\n🎉 User deletion completed!');
    console.log(`You can now try signing up with ${emailToDelete} again.`);

  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

deleteExistingUser().catch(console.error);