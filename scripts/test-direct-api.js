#!/usr/bin/env node

/**
 * Test script to directly call Supabase API without the client library
 */

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

async function testDirectAPI() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
  }

  console.log('🧪 Testing direct Supabase API call...\n');
  console.log('🔗 URL:', supabaseUrl);
  console.log('🔑 Key:', supabaseAnonKey.substring(0, 20) + '...');

  const testEmail = 'test@example.com';
  const testPassword = 'testpassword123';

  const postData = JSON.stringify({
    email: testEmail,
    password: testPassword,
  });

  const url = new URL(supabaseUrl + '/auth/v1/signup');
  
  const options = {
    hostname: url.hostname,
    port: 443,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
    }
  };

  console.log('📤 Making direct API call...');
  console.log('   Email:', testEmail);
  console.log('   Endpoint:', url.toString());

  const req = https.request(options, (res) => {
    console.log('📊 Status Code:', res.statusCode);
    console.log('📊 Headers:', res.headers);

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        console.log('📊 Response:', JSON.stringify(result, null, 2));

        if (res.statusCode === 200) {
          console.log('✅ Direct API call succeeded!');
          console.log('   This means the issue is with the Supabase client library');
        } else {
          console.log('❌ Direct API call failed');
          console.log('   This confirms the issue is with Supabase configuration');
        }
      } catch (error) {
        console.error('❌ Failed to parse response:', error.message);
        console.log('Raw response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('💥 Request failed:', error.message);
  });

  req.write(postData);
  req.end();
}

testDirectAPI().catch(console.error);