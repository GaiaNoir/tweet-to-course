#!/usr/bin/env node

/**
 * Apply the email confirmation fix directly
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

async function applyEmailFix() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('🔧 APPLYING EMAIL CONFIRMATION FIX\n');

  const adminClient = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Create the auto-confirm function
    console.log('1️⃣ Creating auto-confirm function...');
    
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION auto_confirm_user()
      RETURNS TRIGGER AS $
      BEGIN
        -- Auto-confirm the user's email
        UPDATE auth.users 
        SET email_confirmed_at = NOW()
        WHERE id = NEW.id 
        AND email_confirmed_at IS NULL;
        
        RETURN NEW;
      END;
      $ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    const { error: functionError } = await adminClient.rpc('exec', { sql: createFunctionSQL });
    
    if (functionError) {
      console.log('   ❌ Function creation failed:', functionError.message);
    } else {
      console.log('   ✅ Auto-confirm function created');
    }

    // Create the trigger
    console.log('\n2️⃣ Creating auto-confirm trigger...');
    
    const createTriggerSQL = `
      DROP TRIGGER IF EXISTS auto_confirm_user_trigger ON auth.users;
      CREATE TRIGGER auto_confirm_user_trigger
        AFTER INSERT ON auth.users
        FOR EACH ROW 
        EXECUTE FUNCTION auto_confirm_user();
    `;

    const { error: triggerError } = await adminClient.rpc('exec', { sql: createTriggerSQL });
    
    if (triggerError) {
      console.log('   ❌ Trigger creation failed:', triggerError.message);
    } else {
      console.log('   ✅ Auto-confirm trigger created');
    }

    // Test the fix
    console.log('\n3️⃣ Testing the fix...');
    
    const testEmail = `autoconfirm-test-${Date.now()}@localhost.com`;
    const testPassword = 'password123';

    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });

    if (signupError) {
      console.log('   ❌ Test signup failed:', signupError.message);
    } else {
      console.log('   ✅ Test signup successful');
      console.log('   🔑 Session created:', !!signupData.session);
      console.log('   📧 Email confirmed:', signupData.user?.email_confirmed_at ? 'Yes' : 'No');
      
      // Clean up
      if (signupData.user) {
        await adminClient.auth.admin.deleteUser(signupData.user.id);
        console.log('   🧹 Test user cleaned up');
      }
    }

    console.log('\n🎉 Email confirmation fix applied!');
    console.log('Now try signing up again - you should get a session immediately.');

  } catch (error) {
    console.error('💥 Fix failed:', error.message);
  }
}

applyEmailFix().catch(console.error);