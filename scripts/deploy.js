#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting deployment process...\n');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ Error: package.json not found. Please run this script from the project root.');
  process.exit(1);
}

// Check if Vercel CLI is installed
try {
  execSync('vercel --version', { stdio: 'ignore' });
} catch (error) {
  console.log('📦 Installing Vercel CLI...');
  try {
    execSync('npm install -g vercel', { stdio: 'inherit' });
  } catch (installError) {
    console.error('❌ Failed to install Vercel CLI. Please install it manually: npm install -g vercel');
    process.exit(1);
  }
}

// Check if .env.local exists
if (!fs.existsSync('.env.local')) {
  console.log('⚠️  Warning: .env.local not found. Make sure to set up environment variables in Vercel dashboard.');
}

// Run build to check for errors
console.log('🔨 Running build check...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build successful!\n');
} catch (error) {
  console.error('❌ Build failed. Please fix the errors before deploying.');
  process.exit(1);
}

// Ask user for deployment type
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Deploy to production? (y/N): ', (answer) => {
  const isProduction = answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
  
  console.log(`\n🚀 Deploying to ${isProduction ? 'production' : 'preview'}...`);
  
  try {
    const command = isProduction ? 'vercel --prod' : 'vercel';
    execSync(command, { stdio: 'inherit' });
    
    console.log('\n✅ Deployment successful!');
    console.log('\n📋 Post-deployment checklist:');
    console.log('1. Update Clerk allowed origins with your new domain');
    console.log('2. Update Notion redirect URI with your new domain');
    console.log('3. Update Paystack webhook URLs');
    console.log('4. Test authentication and payment flows');
    console.log('5. Check all environment variables are set correctly');
    
  } catch (error) {
    console.error('❌ Deployment failed. Check the error messages above.');
    process.exit(1);
  }
  
  rl.close();
});