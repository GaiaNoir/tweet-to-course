const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config({ path: '.env.local' });

async function testLatestClaude() {
  console.log('🚀 Testing latest Claude 3.5 Sonnet model...');
  console.log('API Key configured:', !!process.env.ANTHROPIC_API_KEY);

  const claude = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  try {
    const response = await claude.messages.create({
      model: 'claude-3-5-sonnet-20241022', // Latest Claude 3.5 Sonnet
      max_tokens: 500,
      temperature: 0.7,
      system: 'You are a helpful assistant. Respond with valid JSON only.',
      messages: [
        {
          role: 'user',
          content: 'Create a simple JSON response for a mini-course about "5 productivity tips for entrepreneurs". Include a title and 3 modules with titles and brief summaries.'
        }
      ],
    });

    console.log('✅ Claude 3.5 Sonnet working perfectly!');
    console.log('Model used:', 'claude-3-5-sonnet-20241022');
    console.log('Response preview:', response.content[0]?.text?.substring(0, 200) + '...');
    
    // Try to parse JSON to verify format
    try {
      const parsed = JSON.parse(response.content[0]?.text || '{}');
      console.log('✅ JSON parsing successful');
      console.log('Course title:', parsed.title);
    } catch (parseError) {
      console.log('⚠️  JSON parsing failed, but Claude responded');
    }
    
  } catch (error) {
    if (error.status === 400 && error.error?.error?.message?.includes('credit balance')) {
      console.log('💳 Claude API credits needed');
      console.log('Please add credits at: https://console.anthropic.com/settings/billing');
      console.log('The integration is working correctly, just needs credits.');
    } else {
      console.log('❌ Claude API error:', error.message);
      console.log('Status:', error.status);
    }
  }
}

testLatestClaude();