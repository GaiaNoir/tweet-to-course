const fetch = require('node-fetch');

async function testAPI() {
  console.log('🔍 Testing API directly...');
  
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
    console.log('📝 Response status text:', response.statusText);
    
    const data = await response.json();
    console.log('📄 Response data:', JSON.stringify(data, null, 2));
    
    if (response.status === 503) {
      console.log('🔍 503 Error Analysis:');
      console.log('- This is a "Service Unavailable" error');
      console.log('- Usually means the error is marked as retryable');
      console.log('- Check the error code and message above');
    }
    
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }
}

testAPI();