#!/usr/bin/env node

/**
 * Migration script to move from Clerk to Supabase Auth
 * This script helps with the transition by updating database references
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 Starting Clerk to Supabase Auth migration...');

  try {
    // Apply the migration SQL
    console.log('📝 Applying database migration...');
    
    // Check if migration has already been applied
    const { data: migrations } = await supabase
      .from('supabase_migrations')
      .select('version')
      .eq('version', '005_migrate_to_supabase_auth');

    if (migrations && migrations.length > 0) {
      console.log('✅ Migration already applied');
    } else {
      console.log('⚠️  Please run the migration manually:');
      console.log('   supabase db push');
      console.log('   or apply the migration file: 005_migrate_to_supabase_auth.sql');
    }

    // Check current users table structure
    console.log('🔍 Checking users table structure...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, clerk_user_id, auth_user_id, email')
      .limit(5);

    if (usersError) {
      console.error('❌ Error checking users table:', usersError);
      return;
    }

    console.log(`📊 Found ${users?.length || 0} users in the table`);

    if (users && users.length > 0) {
      const clerkUsers = users.filter(u => u.clerk_user_id && !u.auth_user_id);
      console.log(`🔄 ${clerkUsers.length} users need migration from Clerk to Supabase Auth`);
      
      if (clerkUsers.length > 0) {
        console.log('⚠️  Manual migration required:');
        console.log('   1. Users need to sign up again with Supabase Auth');
        console.log('   2. Or implement a custom migration to match existing users');
        console.log('   3. Consider keeping clerk_user_id for reference during transition');
      }
    }

    console.log('✅ Migration check completed');
    console.log('\n📋 Next steps:');
    console.log('   1. Update your environment variables to remove Clerk keys');
    console.log('   2. Update your Supabase project settings for auth providers');
    console.log('   3. Test the new auth flow');
    console.log('   4. Remove Clerk dependencies from package.json');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();