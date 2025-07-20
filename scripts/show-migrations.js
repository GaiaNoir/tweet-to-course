#!/usr/bin/env node

/**
 * Migration display script for TweetToCourse database
 * This script shows the SQL migrations that need to be run
 */

const fs = require('fs');
const path = require('path');

function showMigrations() {
  console.log('🗄️  TweetToCourse Database Migrations\n');
  console.log('=' .repeat(60));

  // Get all migration files
  const migrationsDir = path.join(__dirname, '../supabase/migrations');
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  if (migrationFiles.length === 0) {
    console.log('📝 No migration files found.');
    return;
  }

  console.log(`\n📁 Found ${migrationFiles.length} migration file(s):\n`);

  // Display each migration
  migrationFiles.forEach((file, index) => {
    console.log(`\n${index + 1}. ${file}`);
    console.log('-'.repeat(40));
    
    try {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      console.log(sql);
      console.log('\n' + '='.repeat(60));
      
    } catch (err) {
      console.error(`❌ Error reading ${file}: ${err.message}`);
    }
  });

  console.log('\n📋 Instructions:');
  console.log('1. Copy each SQL migration above');
  console.log('2. Go to your Supabase project dashboard');
  console.log('3. Navigate to SQL Editor');
  console.log('4. Paste and run each migration in order');
  console.log('5. Verify the tables were created successfully\n');
}

// Show migrations
showMigrations();