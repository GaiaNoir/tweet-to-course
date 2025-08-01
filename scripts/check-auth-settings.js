#!/usr/bin/env node

/**
 * Check the actual auth settings from Supabase API
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

async function checkAuthSettings() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('🔍 CHECKING ACTUAL AUTH SETTINGS FROM SUPABASE\n');

  const url = new URL(supabaseUrl + '/auth/v1/settings');
  
  const options = {
    hostname: url.hostname,
    port: 443,
    path: url.pathname,
    method: 'GET',
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
    }
  };

  const req = https.request(options, (res) => {
    console.log('📊 Status Code:', res.statusCode);

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const settings = JSON.parse(data);
        console.log('📋 FULL AUTH SETTINGS:');
        console.log(JSON.stringify(settings, null, 2));
        
        console.log('\n🔍 KEY SETTINGS:');
        console.log('   📧 Email confirmation required:', settings.email_confirm);
        console.log('   📧 Email signup enabled:', settings.external?.email);
        console.log('   🔐 Auto confirm enabled:', settings.auto_confirm);
        console.log('   ⏰ Session timeout:', settings.jwt_exp);
        console.log('   🔑 JWT secret set:', !!settings.jwt_secret);
        
        if (settings.external) {
          console.log('   🌐 Available providers:', Object.keys(settings.external));
        }

        console.log('\n💡 ANALYSIS:');
        if (settings.email_confirm === false) {
          console.log('✅ Email confirmation is correctly DISABLED');
          console.log('❓ The issue might be something else...');
          
          if (settings.auto_confirm === true) {
            console.log('✅ Auto confirm is enabled - this should work');
          } else {
            console.log('❌ Auto confirm is disabled - this might be the issue!');
          }
        } else {
          console.log('❌ Email confirmation is ENABLED despite dashboard showing disabled');
          console.log('   This suggests a configuration sync issue');
        }

      } catch (error) {
        console.error('❌ Failed to parse settings:', error.message);
        console.log('Raw response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('💥 Request failed:', error.message);
  });

  req.end();
}

checkAuthSettings();