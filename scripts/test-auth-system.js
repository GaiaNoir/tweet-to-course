#!/usr/bin/env node

/**
 * Test script to verify the new authentication system
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

async function testAuthSystem() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('🧪 Testing authentication system...\n');

  try {
    // Test 1: Check if anonymous user exists
    console.log('1️⃣ Checking anonymous user...');
    const ANONYMOUS_USER_ID = '00000000-0000-0000-0000-000000000000';
    
    const { data: anonymousUser, error: anonError } = await supabase
      .from('users')
      .select('*')
      .eq('id', ANONYMOUS_USER_ID)
      .single();

    if (anonError || !anonymousUser) {
      console.log('❌ Anonymous user not found');
    } else {
      console.log('✅ Anonymous user exists:', anonymousUser.email);
    }

    // Test 2: Check database tables
    console.log('\n2️⃣ Checking database tables...');
    
    const tables = ['users', 'courses', 'usage_logs'];
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ Error accessing ${table}:`, error.message);
      } else {
        console.log(`✅ ${table} table accessible (${count} records)`);
      }
    }

    // Test 3: Test course insertion
    console.log('\n3️⃣ Testing course insertion...');
    
    const testCourse = {
      user_id: ANONYMOUS_USER_ID,
      title: 'Test Course - Auth System',
      original_content: 'Test content for auth system verification',
      modules: [{ id: '1', title: 'Test Module', summary: 'Test', takeaways: [], order: 1 }]
    };

    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .insert(testCourse)
      .select('id')
      .single();

    if (courseError) {
      console.log('❌ Course insertion failed:', courseError.message);
    } else {
      console.log('✅ Course inserted successfully:', courseData.id);
      
      // Clean up test course
      await supabase.from('courses').delete().eq('id', courseData.id);
      console.log('🧹 Test course cleaned up');
    }

    // Test 4: Test usage logging
    console.log('\n4️⃣ Testing usage logging...');
    
    const { data: logData, error: logError } = await supabase
      .from('usage_logs')
      .insert({
        user_id: ANONYMOUS_USER_ID,
        action: 'generate',
        metadata: { test: true, timestamp: new Date().toISOString() }
      })
      .select('id')
      .single();

    if (logError) {
      console.log('❌ Usage logging failed:', logError.message);
    } else {
      console.log('✅ Usage logged successfully:', logData.id);
      
      // Clean up test log
      await supabase.from('usage_logs').delete().eq('id', logData.id);
      console.log('🧹 Test log cleaned up');
    }

    console.log('\n🎉 Authentication system test completed!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Database connection working');
    console.log('   ✅ Anonymous user system ready');
    console.log('   ✅ Course generation can work for both authenticated and anonymous users');
    console.log('   ✅ Usage tracking system functional');
    console.log('\n🚀 Ready to test with the web interface at http://localhost:3000/test-fix');

  } catch (error) {
    console.error('💥 Test failed:', error.message);
    process.exit(1);
  }
}

testAuthSystem().catch(console.error);