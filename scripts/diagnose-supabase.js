#!/usr/bin/env node

/**
 * Comprehensive Supabase diagnostic script
 */

const { createClient } = require('@supabase/supabase-js');
const https = require('https');
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

async function diagnoseSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('🔍 SUPABASE DIAGNOSTIC REPORT\n');
  console.log('=' .repeat(50));

  // 1. Check environment variables
  console.log('1️⃣ ENVIRONMENT VARIABLES:');
  console.log(`   URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
  console.log(`   Anon Key: ${supabaseAnonKey ? '✅ Set' : '❌ Missing'}`);
  console.log(`   Service Key: ${supabaseServiceKey ? '✅ Set' : '❌ Missing'}`);
  
  if (supabaseUrl) {
    const urlMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
    const projectRef = urlMatch ? urlMatch[1] : 'unknown';
    console.log(`   Project Ref: ${projectRef}`);
  }
  console.log('');

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing required environment variables');
    return;
  }

  // 2. Test basic connectivity
  console.log('2️⃣ CONNECTIVITY TEST:');
  try {
    const url = new URL(supabaseUrl);
    await new Promise((resolve, reject) => {
      const req = https.get(`https://${url.hostname}`, (res) => {
        console.log(`   ✅ Can reach ${url.hostname} (Status: ${res.statusCode})`);
        resolve();
      });
      req.on('error', reject);
      req.setTimeout(5000, () => reject(new Error('Timeout')));
    });
  } catch (error) {
    console.log(`   ❌ Cannot reach Supabase: ${error.message}`);
  }
  console.log('');

  // 3. Test API endpoints
  console.log('3️⃣ API ENDPOINTS TEST:');
  
  // Test health endpoint
  try {
    const healthUrl = `${supabaseUrl}/rest/v1/`;
    await new Promise((resolve, reject) => {
      const req = https.get(healthUrl, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
        }
      }, (res) => {
        console.log(`   ✅ REST API accessible (Status: ${res.statusCode})`);
        resolve();
      });
      req.on('error', reject);
      req.setTimeout(5000, () => reject(new Error('Timeout')));
    });
  } catch (error) {
    console.log(`   ❌ REST API not accessible: ${error.message}`);
  }

  // Test auth endpoint
  try {
    const authUrl = `${supabaseUrl}/auth/v1/settings`;
    await new Promise((resolve, reject) => {
      const req = https.get(authUrl, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const settings = JSON.parse(data);
            console.log(`   ✅ Auth API accessible (Status: ${res.statusCode})`);
            console.log(`   📧 Email signup enabled: ${settings.external?.email ? '✅ Yes' : '❌ No'}`);
            console.log(`   📧 Email confirmations: ${settings.email_confirm ? '✅ Required' : '❌ Disabled'}`);
            if (settings.external) {
              console.log(`   🔑 Available providers: ${Object.keys(settings.external).join(', ')}`);
            }
          } catch (e) {
            console.log(`   ⚠️  Auth API response not JSON: ${data.substring(0, 100)}`);
          }
          resolve();
        });
      });
      req.on('error', reject);
      req.setTimeout(5000, () => reject(new Error('Timeout')));
    });
  } catch (error) {
    console.log(`   ❌ Auth API not accessible: ${error.message}`);
  }
  console.log('');

  // 4. Test database connection
  console.log('4️⃣ DATABASE CONNECTION:');
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Try to query a system table
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(1);
    
    if (error) {
      console.log(`   ❌ Database query failed: ${error.message}`);
    } else {
      console.log(`   ✅ Database accessible`);
    }
  } catch (error) {
    console.log(`   ❌ Database connection failed: ${error.message}`);
  }
  console.log('');

  // 5. Test specific signup issue
  console.log('5️⃣ SIGNUP ISSUE ANALYSIS:');
  
  const testEmails = [
    'test@example.com',
    'user@test.com',
    'demo@localhost.com',
    `test-${Date.now()}@example.com`
  ];

  for (const email of testEmails) {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: 'testpassword123',
      });

      if (error) {
        console.log(`   ❌ ${email}: ${error.message}`);
        
        // Analyze error
        if (error.message.includes('invalid')) {
          console.log(`      → This suggests email validation is rejecting all emails`);
        } else if (error.message.includes('disabled')) {
          console.log(`      → Email signup might be disabled`);
        } else if (error.message.includes('exists')) {
          console.log(`      → Email already exists`);
        }
      } else {
        console.log(`   ✅ ${email}: Signup successful`);
        if (data.user) {
          console.log(`      → User ID: ${data.user.id}`);
          console.log(`      → Confirmation required: ${!data.session}`);
          
          // Clean up
          try {
            await supabase.auth.signOut();
          } catch (e) {
            // Ignore cleanup errors
          }
        }
        break; // Stop on first success
      }
    } catch (error) {
      console.log(`   💥 ${email}: Unexpected error - ${error.message}`);
    }
  }

  console.log('');
  console.log('=' .repeat(50));
  console.log('🎯 RECOMMENDATIONS:');
  console.log('');
  console.log('If all emails are being rejected as "invalid":');
  console.log('1. Check Supabase Dashboard → Authentication → Providers');
  console.log('2. Ensure Email provider is enabled');
  console.log('3. Check for any domain restrictions');
  console.log('4. Try creating a user manually in the dashboard');
  console.log('5. Check if the project is paused or has billing issues');
  console.log('');
  console.log('If the issue persists, this might be a Supabase service issue.');
}

diagnoseSupabase().catch(console.error);