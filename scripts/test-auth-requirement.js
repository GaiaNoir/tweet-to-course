#!/usr/bin/env node

/**
 * Test script to verify authentication is required for course generation
 */

const http = require('http');

function testAuthRequirement() {
  const postData = JSON.stringify({
    content: "Test content for authentication requirement",
    type: "text"
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/generate-course',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  console.log('🧪 Testing authentication requirement...');
  console.log('📤 Sending request without authentication...');

  const req = http.request(options, (res) => {
    console.log('📊 Status Code:', res.statusCode);

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        
        if (res.statusCode === 401 && result.error?.code === 'AUTHENTICATION_REQUIRED') {
          console.log('✅ Authentication requirement working correctly!');
          console.log('📋 Error message:', result.error.message);
          console.log('\n🎉 Test passed: Unauthenticated requests are properly rejected');
        } else {
          console.log('❌ Authentication requirement not working');
          console.log('📊 Response:', JSON.stringify(result, null, 2));
        }
      } catch (error) {
        console.error('❌ Failed to parse response:', error.message);
        console.log('Raw response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('💥 Request failed:', error.message);
    console.log('Make sure the development server is running on http://localhost:3000');
  });

  req.write(postData);
  req.end();
}

// Wait a moment for the server to be ready, then test
setTimeout(testAuthRequirement, 1000);