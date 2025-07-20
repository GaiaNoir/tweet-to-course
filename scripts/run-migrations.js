#!/usr/bin/env node

/**
 * Migration runner script for TweetToCourse database
 * This script runs the SQL migrations programmatically using the Supabase client
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables manually
const envPath = path.join(__dirname, '../.env.local');
console.log('Looking for .env.local at:', envPath);
console.log('File exists:', fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('File content length:', envContent.length);
  const envLines = envContent.split('\n');
  
  envLines.forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=');
        process.env[key] = value;
        console.log('Set env var:', key);
      }
    }
  });
} else {
  console.log('❌ .env.local file not found at expected path');
}

async function runMigrations() {
  // Debug: Log environment variables
  console.log('Environment check:');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');
  
  // Check for required environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rpwjenxdthwgjuwngncb.supabase.co';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwd2plbnhkdGh3Z2p1d25nbmNiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjg0NTQwMCwiZXhwIjoyMDY4NDIxNDAwfQ.3GZ7YtbQdMWa66SUi-Jkv0xBMEuGfq1SU6v6M14-5ko';

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   NEXT_PUBLIC_SUPABASE_URL');
    console.error('   SUPABASE_SERVICE_ROLE_KEY');
    console.error('\nPlease check your .env.local file.');
    process.exit(1);
  }

  // Create Supabase client with service role key
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('🚀 Starting database migrations...\n');

  // Get all migration files
  const migrationsDir = path.join(__dirname, '../supabase/migrations');
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  if (migrationFiles.length === 0) {
    console.log('📝 No migration files found.');
    return;
  }

  console.log(`📁 Found ${migrationFiles.length} migration file(s):`);
  migrationFiles.forEach(file => console.log(`   - ${file}`));
  console.log('');

  // Run each migration
  for (const file of migrationFiles) {
    console.log(`⏳ Running migration: ${file}`);
    
    try {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      // Split SQL into individual statements and execute them
      console.log('   📝 Splitting SQL into statements...');
      const statements = sql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.match(/^\s*$/));
      
      console.log(`   📝 Found ${statements.length} SQL statements to execute`);
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement.trim()) {
          console.log(`   ⏳ Executing statement ${i + 1}/${statements.length}...`);
          
          try {
            // Use the supabase client to execute raw SQL
            const { data, error } = await supabase.rpc('exec', { 
              sql: statement 
            });
            
            if (error) {
              console.error(`   ❌ Error executing statement ${i + 1}: ${error.message}`);
              throw error;
            }
            
            console.log(`   ✅ Statement ${i + 1} executed successfully`);
          } catch (err) {
            console.error(`   ❌ Error executing statement ${i + 1}: ${err.message}`);
            throw err;
          }
        }
      }
      
      console.log(`   ✅ Migration completed: ${file}`);
      
    } catch (err) {
      console.error(`   ❌ Migration failed: ${file}`);
      console.error(`   Error: ${err.message}`);
      
      // Continue with other migrations or exit based on error type
      if (err.message.includes('already exists') || err.message.includes('duplicate')) {
        console.log(`   ⚠️  Skipping - objects already exist`);
        continue;
      } else {
        console.error('\n💥 Migration process stopped due to error.');
        process.exit(1);
      }
    }
  }

  console.log('\n🎉 All migrations completed successfully!');
  
  // Test database connection
  console.log('\n🔍 Testing database connection...');
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count(*)')
      .limit(1);
    
    if (error) {
      console.error(`❌ Database test failed: ${error.message}`);
    } else {
      console.log('✅ Database connection successful!');
    }
  } catch (err) {
    console.error(`❌ Database test error: ${err.message}`);
  }
}

// Run migrations
runMigrations().catch(console.error);