#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Running pre-deployment checks...\n');

const checks = [];

// Check if required files exist
const requiredFiles = [
  'package.json',
  'next.config.ts',
  'vercel.json',
  '.env.local.example',
  'src/app/layout.tsx',
  'src/app/page.tsx'
];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    checks.push({ name: `✅ ${file} exists`, status: 'pass' });
  } else {
    checks.push({ name: `❌ ${file} missing`, status: 'fail' });
  }
});

// Check package.json scripts
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredScripts = ['build', 'start', 'dev'];
  
  requiredScripts.forEach(script => {
    if (packageJson.scripts && packageJson.scripts[script]) {
      checks.push({ name: `✅ Script "${script}" defined`, status: 'pass' });
    } else {
      checks.push({ name: `❌ Script "${script}" missing`, status: 'fail' });
    }
  });
} catch (error) {
  checks.push({ name: '❌ Failed to read package.json', status: 'fail' });
}

// Check environment variables example
try {
  const envExample = fs.readFileSync('.env.local.example', 'utf8');
  const requiredEnvVars = [
    'OPENAI_API_KEY',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];
  
  requiredEnvVars.forEach(envVar => {
    if (envExample.includes(envVar)) {
      checks.push({ name: `✅ ${envVar} in example`, status: 'pass' });
    } else {
      checks.push({ name: `❌ ${envVar} missing from example`, status: 'fail' });
    }
  });
} catch (error) {
  checks.push({ name: '❌ Failed to read .env.local.example', status: 'fail' });
}

// Check if .env.local exists (optional but recommended for local testing)
if (fs.existsSync('.env.local')) {
  checks.push({ name: '✅ .env.local exists (good for local testing)', status: 'pass' });
} else {
  checks.push({ name: '⚠️  .env.local not found (set up env vars in Vercel)', status: 'warning' });
}

// Display results
console.log('📋 Pre-deployment Check Results:\n');
checks.forEach(check => {
  console.log(check.name);
});

const failures = checks.filter(check => check.status === 'fail');
const warnings = checks.filter(check => check.status === 'warning');

console.log('\n📊 Summary:');
console.log(`✅ Passed: ${checks.filter(c => c.status === 'pass').length}`);
console.log(`⚠️  Warnings: ${warnings.length}`);
console.log(`❌ Failed: ${failures.length}`);

if (failures.length > 0) {
  console.log('\n❌ Deployment not recommended. Please fix the failed checks above.');
  process.exit(1);
} else if (warnings.length > 0) {
  console.log('\n⚠️  Deployment possible but please review warnings.');
  console.log('\n🚀 Ready to deploy! Run: npm run deploy');
} else {
  console.log('\n🎉 All checks passed! Ready to deploy!');
  console.log('\n🚀 Run: npm run deploy');
}

console.log('\n📝 Remember to:');
console.log('1. Set up environment variables in Vercel dashboard');
console.log('2. Update Clerk, Notion, and Paystack configurations with your new domain');
console.log('3. Test all functionality after deployment');