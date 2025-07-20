#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Define your Supabase projects
const PROJECTS = {
  'tweettocourse': {
    url: 'https://rpwjenxdthwgjuwngncb.supabase.co',
    anon_key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwd2plbnhkdGh3Z2p1d25nbmNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NDU0MDAsImV4cCI6MjA2ODQyMTQwMH0.o9O6X0RUMleVtKR9py1rNZpi3Geph0kiz4Wuf1a2i-M',
    service_role_key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwd2plbnhkdGh3Z2p1d25nbmNiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjg0NTQwMCwiZXhwIjoyMDY4NDIxNDAwfQ.3GZ7YtbQdMWa66SUi-Jkv0xBMEuGfq1SU6v6M14-5ko'
  },
  'gaming': {
    url: 'https://cyjxatawvwdqtmdpqyuq.supabase.co',
    anon_key: 'your_gaming_anon_key_here',
    service_role_key: 'your_gaming_service_role_key_here'
  }
};

function switchProject(projectName) {
  if (!PROJECTS[projectName]) {
    console.error(`❌ Project "${projectName}" not found.`);
    console.log('Available projects:', Object.keys(PROJECTS).join(', '));
    process.exit(1);
  }

  const project = PROJECTS[projectName];
  const envPath = path.join(__dirname, '..', '.env.local');

  try {
    // Read current .env.local
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Update Supabase variables
    const updates = {
      'NEXT_PUBLIC_SUPABASE_URL': project.url,
      'NEXT_PUBLIC_SUPABASE_ANON_KEY': project.anon_key,
      'SUPABASE_SERVICE_ROLE_KEY': project.service_role_key
    };

    Object.entries(updates).forEach(([key, value]) => {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (envContent.match(regex)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        envContent += `\n${key}=${value}`;
      }
    });

    // Write updated .env.local
    fs.writeFileSync(envPath, envContent.trim() + '\n');

    console.log(`✅ Switched to Supabase project: ${projectName}`);
    console.log(`📍 URL: ${project.url}`);
    console.log('🔄 Restart your development server to apply changes.');

  } catch (error) {
    console.error('❌ Error switching project:', error.message);
    process.exit(1);
  }
}

// Parse command line arguments
const projectName = process.argv[2];

if (!projectName) {
  console.log('Usage: node switch-supabase-project.js <project-name>');
  console.log('Available projects:', Object.keys(PROJECTS).join(', '));
  process.exit(1);
}

switchProject(projectName);