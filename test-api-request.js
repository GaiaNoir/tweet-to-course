const fetch = require('node-fetch');

async function testAPIRequest() {
  console.log('🧪 Testing API request to /api/generate-course...');
  
  try {
    const response = await fetch('http://localhost:3000/api/generate-course', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: '5 productivity tips for entrepreneurs: time blocking, delegation, automation, priorities, breaks'
      })
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📝 Response body:', responseText);
    
    if (response.status === 503) {
      console.log('🔍 503 Service Unavailable - This indicates a retryable error from Claude');
      try {
        const errorData = JSON.parse(responseText);
        console.log('❌ Error details:', errorData.error);
      } catch (e) {
        console.log('❌ Could not parse error response as JSON');
      }
    }
    
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }
}

testAPIRequest();