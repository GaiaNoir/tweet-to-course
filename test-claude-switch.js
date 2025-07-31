// Simple test to verify Claude integration works
const { generateCourseContent } = require('./src/lib/claude.ts');

async function testClaudeSwitch() {
  try {
    console.log('Testing Claude integration...');
    
    // This should fail gracefully without an API key
    const result = await generateCourseContent('This is a test tweet about productivity tips for entrepreneurs');
    
    console.log('✅ Claude integration successful!');
    console.log('Generated course:', result.title);
    
  } catch (error) {
    if (error.code === 'CLAUDE_AUTH_ERROR') {
      console.log('✅ Claude integration working - API key needed');
      console.log('Add your ANTHROPIC_API_KEY to .env.local to complete setup');
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

testClaudeSwitch();