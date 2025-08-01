#!/usr/bin/env node

/**
 * Script to create anonymous user for course generation
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables manually
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

async function createAnonymousUser() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('🚀 Creating anonymous user for course generation...\n');

  try {
    // First, create the user profile in the users table
    const ANONYMOUS_USER_ID = '00000000-0000-0000-0000-000000000000';
    
    console.log('📝 Creating anonymous user profile...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .upsert({
        id: ANONYMOUS_USER_ID,
        email: 'anonymous@tweetcourse.com',
        subscription_tier: 'free',
        usage_count: 0,
        monthly_usage_count: 0,
        monthly_usage_reset_date: new Date().toISOString(),
        clerk_user_id: 'anonymous-user', // For backward compatibility
      }, {
        onConflict: 'id'
      });

    if (userError) {
      console.error('❌ Error creating user profile:', userError.message);
      throw userError;
    }

    console.log('✅ Anonymous user profile created successfully');

    // Test by trying to insert a test course
    console.log('🧪 Testing course insertion...');
    const testCourse = {
      user_id: ANONYMOUS_USER_ID,
      title: 'Test Course',
      original_content: 'Test content',
      modules: [{ id: '1', title: 'Test Module', summary: 'Test', takeaways: [], order: 1 }]
    };

    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .insert(testCourse)
      .select('id')
      .single();

    if (courseError) {
      console.error('❌ Error inserting test course:', courseError.message);
      console.error('Full error:', courseError);
    } else {
      console.log('✅ Test course created successfully with ID:', courseData.id);
      
      // Clean up test course
      await supabase.from('courses').delete().eq('id', courseData.id);
      console.log('🧹 Test course cleaned up');
    }

    console.log('\n🎉 Anonymous user setup completed successfully!');

  } catch (error) {
    console.error('💥 Error:', error.message);
    process.exit(1);
  }
}

createAnonymousUser().catch(console.error);