const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config({ path: '.env.local' });

async function testSimpleCourseGeneration() {
  console.log('🧪 Testing simple course generation...');
  
  const claude = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  try {
    // Test with a much simpler prompt similar to what the API uses
    const response = await claude.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000, // Reduced tokens
      temperature: 0.7,
      system: 'You are an expert course creator. Always respond with valid JSON only.',
      messages: [
        {
          role: 'user',
          content: `Create a simple course about "5 productivity tips for entrepreneurs". 

Return JSON in this format:
{
  "title": "Course Title",
  "modules": [
    {
      "title": "Module 1 Title",
      "content": "Module content here",
      "takeaways": ["Takeaway 1", "Takeaway 2"]
    },
    {
      "title": "Module 2 Title", 
      "content": "Module content here",
      "takeaways": ["Takeaway 1", "Takeaway 2"]
    },
    {
      "title": "Module 3 Title",
      "content": "Module content here",
      "takeaways": ["Takeaway 1", "Takeaway 2"]
    }
  ]
}`
        }
      ],
    });

    console.log('✅ Simple course generation successful!');
    console.log('📝 Response length:', response.content[0]?.text?.length);
    
    // Try to parse JSON
    try {
      const parsed = JSON.parse(response.content[0]?.text || '{}');
      console.log('✅ JSON parsing successful');
      console.log('📚 Course title:', parsed.title);
      console.log('📖 Number of modules:', parsed.modules?.length);
      
      if (parsed.modules && parsed.modules.length >= 3) {
        console.log('✅ Module count validation passed');
      } else {
        console.log('❌ Module count validation failed:', parsed.modules?.length);
      }
      
    } catch (parseError) {
      console.log('❌ JSON parsing failed:', parseError.message);
      console.log('📝 Raw response:', response.content[0]?.text?.substring(0, 200));
    }
    
  } catch (error) {
    console.log('❌ Course generation failed:', error.message);
    console.log('📊 Error status:', error.status);
    
    if (error.status === 400 && error.error?.error?.message?.includes('credit balance')) {
      console.log('💳 ISSUE IDENTIFIED: Credit balance too low for full course generation');
      console.log('🔧 SOLUTION: Add more credits to your Anthropic account');
      console.log('🌐 URL: https://console.anthropic.com/settings/billing');
    }
  }
}

testSimpleCourseGeneration();