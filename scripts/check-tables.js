#!/usr/bin/env node

/**
 * Direct table check for TweetToCourse project
 */

const { createClient } = require('@supabase/supabase-js');

async function checkTables() {
  // TweetToCourse project credentials
  const supabaseUrl = 'https://rpwjenxdthwgjuwngncb.supabase.co';
  const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwd2plbnhkdGh3Z2p1d25nbmNiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjg0NTQwMCwiZXhwIjoyMDY4NDIxNDAwfQ.3GZ7YtbQdMWa66SUi-Jkv0xBMEuGfq1SU6v6M14-5ko';

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('🔍 Checking TweetToCourse project tables...');
  console.log('📍 Project:', supabaseUrl);
  console.log('');

  try {
    // Try to list all tables in public schema
    console.log('⏳ Attempting to list all tables...');
    
    // Method 1: Try direct table query
    try {
      const { data: tables1, error: error1 } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
      
      if (!error1 && tables1) {
        console.log('✅ Found tables (method 1):', tables1.map(t => t.table_name));
      } else {
        console.log('❌ Method 1 failed:', error1?.message);
      }
    } catch (e) {
      console.log('❌ Method 1 exception:', e.message);
    }

    // Method 2: Try RPC call
    try {
      const { data: tables2, error: error2 } = await supabase.rpc('exec', {
        sql: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
      });
      
      if (!error2 && tables2) {
        console.log('✅ Found tables (method 2):', tables2);
      } else {
        console.log('❌ Method 2 failed:', error2?.message);
      }
    } catch (e) {
      console.log('❌ Method 2 exception:', e.message);
    }

    // Method 3: Try to access specific tables
    console.log('');
    console.log('⏳ Checking specific TweetToCourse tables...');
    
    const tablesToCheck = ['tweet_users', 'courses', 'usage_logs'];
    
    for (const tableName of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (!error) {
          console.log(`✅ Table '${tableName}' exists and is accessible`);
        } else {
          console.log(`❌ Table '${tableName}' error:`, error.message);
        }
      } catch (e) {
        console.log(`❌ Table '${tableName}' exception:`, e.message);
      }
    }

    // Method 4: Test connection
    console.log('');
    console.log('⏳ Testing basic connection...');
    try {
      const { data: authData, error: authError } = await supabase.auth.getSession();
      console.log('✅ Connection test successful');
    } catch (e) {
      console.log('❌ Connection test failed:', e.message);
    }

  } catch (error) {
    console.error('❌ Overall check failed:', error.message);
  }
}

// Check tables
checkTables().catch(console.error);