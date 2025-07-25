#!/usr/bin/env node

/**
 * Migration script to help users transition from Clerk to Supabase Auth
 * This script will help identify users that need to be migrated
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkMigrationStatus() {
  console.log('🔍 Checking user migration status...\n');
  
  try {
    // Get all users
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, clerk_user_id, auth_user_id, subscription_tier, created_at');
    
    if (error) {
      console.error('❌ Error fetching users:', error);
      return;
    }
    
    console.log(`📊 Total users in database: ${users.length}\n`);
    
    const clerkOnlyUsers = users.filter(u => u.clerk_user_id && !u.auth_user_id);
    const supabaseUsers = users.filter(u => u.auth_user_id);
    const orphanedUsers = users.filter(u => !u.clerk_user_id && !u.auth_user_id);
    
    console.log('📈 Migration Status:');
    console.log(`  ✅ Migrated to Supabase Auth: ${supabaseUsers.length}`);
    console.log(`  🔄 Needs migration (Clerk only): ${clerkOnlyUsers.length}`);
    console.log(`  ⚠️  Orphaned (no auth ID): ${orphanedUsers.length}\n`);
    
    if (clerkOnlyUsers.length > 0) {
      console.log('🔄 Users that need migration:');
      clerkOnlyUsers.forEach(user => {
        console.log(`  - ${user.email} (ID: ${user.id}, Clerk: ${user.clerk_user_id})`);
      });
      console.log('\n💡 These users need to sign up again with Supabase Auth.');
      console.log('   The system will automatically link their existing data when they sign in with the same email.\n');
    }
    
    if (supabaseUsers.length > 0) {
      console.log('✅ Successfully migrated users:');
      supabaseUsers.forEach(user => {
        console.log(`  - ${user.email} (Auth ID: ${user.auth_user_id})`);
      });
      console.log('');
    }
    
    if (orphanedUsers.length > 0) {
      console.log('⚠️  Orphaned users (need manual review):');
      orphanedUsers.forEach(user => {
        console.log(`  - ${user.email} (ID: ${user.id})`);
      });
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function main() {
  console.log('🚀 User Migration Status Check\n');
  await checkMigrationStatus();
  console.log('✅ Migration status check complete!');
}

main().catch(console.error);