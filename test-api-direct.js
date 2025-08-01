#!/usr/bin/env node

/**
 * Direct test of the course generation API
 */

const http = require('http');

function testAPI() {
  const postData = JSON.stringify({
    content: "Productivity tip: Focus on one task at a time. Multitasking reduces efficiency by up to 40%. Block distractions and take breaks.",
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

  console.log('🧪 Testing course generation API...');
  console.log('📤 Sending request to:', `http://${options.hostname}:${options.port}${options.path}`);

  const req = http.request(options, (res) => {
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

        if (result.success) {
          console.log('\n✅ Course generation successful!');
          console.log('📚 Course Title:', result.course?.title);
          console.log('📚 Course ID:', result.course?.id);
          console.log('📚 Number of Modules:', result.course?.modules?.length);
        } else {
          console.log('\n❌ Course generation failed:');
          console.log('Error Code:', result.error?.code);
          console.log('Error Message:', result.error?.message);
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

// Wait a moment for the server to be ready, then test
setTimeout(testAPI, 2000);