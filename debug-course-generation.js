const { generateCourseContent } = require('./src/lib/claude.ts');
require('dotenv').config({ path: '.env.local' });

async function debugCourseGeneration() {
  console.log('🔍 Debugging course generation...');
  
  const testContent = "5 productivity tips for entrepreneurs: 1. Time blocking 2. Delegate tasks 3. Use automation tools 4. Set clear priorities 5. Take regular breaks";
  
  try {
    console.log('📝 Testing with content:', testContent);
    console.log('🚀 Calling generateCourseContent...');
    
    const result = await generateCourseContent(testContent, 'test-user-123');
    
    console.log('✅ Course generation successful!');
    console.log('📚 Course title:', result.title);
    console.log('📖 Number of modules:', result.modules.length);
    console.log('🎯 First module:', result.modules[0]?.title);
    
  } catch (error) {
    console.log('❌ Course generation failed');
    console.log('🏷️  Error name:', error.name);
    console.log('📝 Error message:', error.message);
    console.log('🔢 Error code:', error.code);
    console.log('🔄 Retryable:', error.retryable);
    console.log('📊 Full error:', error);
    
    if (error.code === 'CLAUDE_CREDITS_EXHAUSTED') {
      console.log('💳 This explains the 503 error - credits needed!');
    } else if (error.retryable) {
      console.log('🔄 This is a retryable error, hence the 503 status');
    }
  }
}

debugCourseGeneration();