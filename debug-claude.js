const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config({ path: '.env.local' });

async function testClaude() {
  console.log('Testing Claude integration...');
  console.log('API Key present:', !!process.env.ANTHROPIC_API_KEY);
  console.log('API Key starts with:', process.env.ANTHROPIC_API_KEY?.substring(0, 10));

  const claude = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  try {
    const response = await claude.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 100,
      temperature: 0.7,
      system: 'You are a helpful assistant. Respond with valid JSON only.',
      messages: [
        {
          role: 'user',
          content: 'Generate a simple JSON response with a title and description for a test course about productivity.'
        }
      ],
    });

    console.log('✅ Claude API working!');
    console.log('Response:', response.content[0]?.text);
    
  } catch (error) {
    console.log('❌ Claude API error:', error.message);
    console.log('Error details:', error);
  }
}

testClaude();