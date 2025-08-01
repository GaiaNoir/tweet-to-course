#!/usr/bin/env node

/**
 * Simple test for course generation
 */

async function testGeneration() {
  console.log('🧪 Testing course generation...');
  
  const testData = {
    content: "Productivity tip: Focus on one task at a time. Multitasking reduces efficiency by up to 40%. Block distractions, set clear goals, and take breaks every 90 minutes.",
    type: "text"
  };

  try {
    const response = await fetch('http://localhost:3000/api/generate-course', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    console.log('Status:', response.status);
    console.log('Success:', result.success);
    
    if (result.success) {
      console.log('✅ Course generated successfully!');
      console.log('Title:', result.course.title);
      console.log('ID:', result.course.id);
    } else {
      console.log('❌ Generation failed:', result.error?.message);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Use dynamic import for fetch
import('node-fetch').then(({ default: fetch }) => {
  global.fetch = fetch;
  testGeneration();
}).catch(err => {
  console.error('Failed to import fetch:', err);
});