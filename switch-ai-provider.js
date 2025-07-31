#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROUTE_FILE = 'src/app/api/generate-course/route.ts';

function switchToOpenAI() {
  console.log('🔄 Switching to OpenAI...');
  
  let content = fs.readFileSync(ROUTE_FILE, 'utf8');
  
  // Replace imports
  content = content.replace(
    /import { generateCourseContent, ClaudeError } from '@\/lib\/claude';/g,
    "import { generateCourseContent, OpenAIError } from '@/lib/openai';"
  );
  
  // Replace error handling
  content = content.replace(/ClaudeError/g, 'OpenAIError');
  
  // Replace comments
  content = content.replace(
    /\/\/ Generate course using Claude/g,
    '// Generate course using OpenAI'
  );
  
  fs.writeFileSync(ROUTE_FILE, content);
  console.log('✅ Switched to OpenAI successfully!');
}

function switchToClaude() {
  console.log('🔄 Switching to Claude...');
  
  let content = fs.readFileSync(ROUTE_FILE, 'utf8');
  
  // Replace imports
  content = content.replace(
    /import { generateCourseContent, OpenAIError } from '@\/lib\/openai';/g,
    "import { generateCourseContent, ClaudeError } from '@/lib/claude';"
  );
  
  // Replace error handling
  content = content.replace(/OpenAIError/g, 'ClaudeError');
  
  // Replace comments
  content = content.replace(
    /\/\/ Generate course using OpenAI/g,
    '// Generate course using Claude'
  );
  
  fs.writeFileSync(ROUTE_FILE, content);
  console.log('✅ Switched to Claude successfully!');
}

const provider = process.argv[2];

if (provider === 'openai') {
  switchToOpenAI();
} else if (provider === 'claude') {
  switchToClaude();
} else {
  console.log('Usage: node switch-ai-provider.js [openai|claude]');
  console.log('');
  console.log('Examples:');
  console.log('  node switch-ai-provider.js openai   # Switch to OpenAI');
  console.log('  node switch-ai-provider.js claude   # Switch to Claude');
}