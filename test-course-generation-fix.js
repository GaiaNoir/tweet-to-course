#!/usr/bin/env node

/**
 * Test script to verify course generation works after the fix
 */

const fetch = require('node-fetch');

async function testCourseGeneration() {
  console.log('🧪 Testing course generation API...\n');

  const testContent = `
    Here's a simple test tweet about productivity:
    
    "The key to productivity isn't working harder, it's working smarter. 
    Focus on the 20% of tasks that give you 80% of the results. 
    Eliminate distractions, batch similar tasks, and take regular breaks. 
    Your future self will thank you! #productivity #timemanagement"
  `;

  try {
    const response = await fetch('http://localhost:3000/api/generate-course', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: testContent,
        type: 'text'
      })
    });

    const result = await response.json();

    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Headers:', Object.fromEntries(response.headers.entries()));
    console.log('📊 Response Body:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('\n✅ Course generation successful!');
      console.log('📚 Course Title:', result.course.title);
      console.log('📚 Course ID:', result.course.id);
      console.log('📚 Number of Modules:', result.course.modules.length);
    } else {
      console.log('\n❌ Course generation failed:');
      console.log('Error Code:', result.error?.code);
      console.log('Error Message:', result.error?.message);
    }

  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
  }
}

testCourseGeneration().catch(console.error);