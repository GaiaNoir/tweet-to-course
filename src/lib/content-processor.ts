// Content processing utilities for tweet URLs and manual text

export interface ProcessedContent {
  content: string;
  type: 'url' | 'text';
  metadata?: {
    tweetId?: string;
    username?: string;
    originalUrl?: string;
  };
}

export class ContentProcessingError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'ContentProcessingError';
  }
}

// Validate and extract tweet ID from URL
export function extractTweetId(url: string): string | null {
  const tweetUrlPatterns = [
    /twitter\.com\/\w+\/status\/(\d+)/,
    /x\.com\/\w+\/status\/(\d+)/,
    /mobile\.twitter\.com\/\w+\/status\/(\d+)/,
    /twitter\.com\/i\/web\/status\/(\d+)/,
  ];

  for (const pattern of tweetUrlPatterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

// Validate tweet URL format
export function isValidTweetUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const validDomains = ['twitter.com', 'x.com', 'mobile.twitter.com'];
    
    if (!validDomains.includes(urlObj.hostname)) {
      return false;
    }

    return extractTweetId(url) !== null;
  } catch {
    return false;
  }
}

// Extract username from tweet URL
export function extractUsername(url: string): string | null {
  const usernamePatterns = [
    /twitter\.com\/(\w+)\/status\/\d+/,
    /x\.com\/(\w+)\/status\/\d+/,
    /mobile\.twitter\.com\/(\w+)\/status\/\d+/,
  ];

  for (const pattern of usernamePatterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

// Process tweet URL - provide helpful guidance since X/Twitter blocks scraping
async function processTweetUrl(url: string): Promise<ProcessedContent> {
  if (!isValidTweetUrl(url)) {
    throw new ContentProcessingError(
      'Invalid Twitter/X URL format',
      'INVALID_URL',
      false
    );
  }

  const tweetId = extractTweetId(url);
  const username = extractUsername(url);

  if (!tweetId) {
    throw new ContentProcessingError(
      'Could not extract tweet ID from URL',
      'INVALID_TWEET_ID',
      false
    );
  }

  // X/Twitter now blocks most scraping attempts, so provide helpful guidance
  throw new ContentProcessingError(
    `🔒 X/Twitter blocks automatic content extraction. Here's how to get the tweet text:

1. Open the tweet: ${url}
2. Copy the tweet text (not the URL)
3. Paste it in the text box above
4. Click "Generate Course" again

This works better anyway since you can edit the text before generating your course!`,
    'TWITTER_REQUIRES_MANUAL_COPY',
    false
  );
}

// Process manual text input
function processManualText(text: string): ProcessedContent {
  const trimmedText = text.trim();

  if (!trimmedText) {
    throw new ContentProcessingError(
      'Content cannot be empty',
      'EMPTY_CONTENT',
      false
    );
  }

  if (trimmedText.length < 10) {
    throw new ContentProcessingError(
      'Content is too short. Please provide at least 10 characters.',
      'CONTENT_TOO_SHORT',
      false
    );
  }

  if (trimmedText.length > 10000) {
    throw new ContentProcessingError(
      'Content is too long. Please limit to 10,000 characters.',
      'CONTENT_TOO_LONG',
      false
    );
  }

  return {
    content: trimmedText,
    type: 'text',
  };
}

// Main content processing function
export async function processContent(input: string): Promise<ProcessedContent> {
  const trimmedInput = input.trim();

  if (!trimmedInput) {
    throw new ContentProcessingError(
      'Input cannot be empty',
      'EMPTY_INPUT',
      false
    );
  }

  // Check if input looks like a URL
  if (isValidTweetUrl(trimmedInput)) {
    return await processTweetUrl(trimmedInput);
  }

  // Check if input contains a URL (mixed content)
  const urlMatch = trimmedInput.match(/(https?:\/\/[^\s]+)/);
  if (urlMatch && isValidTweetUrl(urlMatch[1])) {
    throw new ContentProcessingError(
      'Please provide either a tweet URL only, or paste the tweet content as text.',
      'MIXED_CONTENT_TYPE',
      false
    );
  }

  // Process as manual text
  return processManualText(trimmedInput);
}

// Validate content before processing
export function validateContentInput(input: string): {
  isValid: boolean;
  error?: string;
  type?: 'url' | 'text';
} {
  try {
    const trimmedInput = input.trim();

    if (!trimmedInput) {
      return {
        isValid: false,
        error: 'Input cannot be empty',
      };
    }

    if (isValidTweetUrl(trimmedInput)) {
      return {
        isValid: true,
        type: 'url',
      };
    }

    if (trimmedInput.length < 10) {
      return {
        isValid: false,
        error: 'Content is too short. Please provide at least 10 characters.',
      };
    }

    if (trimmedInput.length > 10000) {
      return {
        isValid: false,
        error: 'Content is too long. Please limit to 10,000 characters.',
      };
    }

    return {
      isValid: true,
      type: 'text',
    };
  } catch {
    return {
      isValid: false,
      error: 'Invalid input format',
    };
  }
}

// Clean and prepare content for AI processing
export function prepareContentForAI(content: string): string {
  return content
    .trim()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\w\s.,!?;:()\-"']/g, '') // Remove special characters except common punctuation
    .substring(0, 8000); // Limit length for AI processing
}

// Export contentProcessor object for backward compatibility
export const contentProcessor = {
  processContent,
  validateContentInput,
  prepareContentForAI,
  analyzeContent,
  extractTweetId,
  isValidTweetUrl,
  extractUsername,
};

// Enhanced content analysis for better course generation
export interface ContentAnalysis {
  coreTheme: string;
  targetAudience: string;
  toneStyle: 'professional' | 'casual' | 'educational' | 'motivational' | 'technical';
  keyTopics: string[];
  learningObjectives: string[];
  estimatedDuration: number; // in minutes
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  contentStructure: {
    hasIntroduction: boolean;
    hasConclusion: boolean;
    hasActionItems: boolean;
    hasExamples: boolean;
  };
}

// Analyze content structure and extract key insights
export function analyzeContent(content: string): ContentAnalysis {
  const words = content.toLowerCase().split(/\s+/);
  const wordCount = words.length;
  
  // Estimate reading time (average 200 words per minute)
  const estimatedDuration = Math.max(5, Math.ceil(wordCount / 200));
  
  // Detect tone and style
  const toneStyle = detectToneStyle(content);
  
  // Extract key topics (simple keyword extraction)
  const keyTopics = extractKeyTopics(content);
  
  // Determine target audience
  const targetAudience = determineTargetAudience(content, keyTopics);
  
  // Identify core theme
  const coreTheme = identifyCoreTheme(content, keyTopics);
  
  // Determine difficulty level
  const difficultyLevel = determineDifficultyLevel(content);
  
  // Analyze content structure
  const contentStructure = analyzeContentStructure(content);
  
  // Generate learning objectives
  const learningObjectives = generateLearningObjectives(keyTopics, toneStyle);
  
  return {
    coreTheme,
    targetAudience,
    toneStyle,
    keyTopics,
    learningObjectives,
    estimatedDuration,
    difficultyLevel,
    contentStructure
  };
}

function detectToneStyle(content: string): ContentAnalysis['toneStyle'] {
  const lowerContent = content.toLowerCase();
  
  // Professional indicators
  const professionalWords = ['strategy', 'business', 'professional', 'corporate', 'industry', 'market', 'revenue', 'growth'];
  const professionalCount = professionalWords.filter(word => lowerContent.includes(word)).length;
  
  // Technical indicators
  const technicalWords = ['code', 'api', 'algorithm', 'data', 'system', 'technical', 'development', 'programming'];
  const technicalCount = technicalWords.filter(word => lowerContent.includes(word)).length;
  
  // Educational indicators
  const educationalWords = ['learn', 'understand', 'explain', 'teach', 'study', 'knowledge', 'concept', 'principle'];
  const educationalCount = educationalWords.filter(word => lowerContent.includes(word)).length;
  
  // Motivational indicators
  const motivationalWords = ['achieve', 'success', 'goal', 'dream', 'inspire', 'motivate', 'transform', 'change'];
  const motivationalCount = motivationalWords.filter(word => lowerContent.includes(word)).length;
  
  // Casual indicators
  const casualWords = ['hey', 'guys', 'awesome', 'cool', 'amazing', 'super', 'really', 'pretty'];
  const casualCount = casualWords.filter(word => lowerContent.includes(word)).length;
  
  // Determine dominant tone
  const scores = {
    professional: professionalCount,
    technical: technicalCount,
    educational: educationalCount,
    motivational: motivationalCount,
    casual: casualCount
  };
  
  const maxScore = Math.max(...Object.values(scores));
  const dominantTone = Object.entries(scores).find(([_, score]) => score === maxScore)?.[0];
  
  return (dominantTone as ContentAnalysis['toneStyle']) || 'educational';
}

function extractKeyTopics(content: string): string[] {
  const words = content.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3);
  
  // Common stop words to filter out
  const stopWords = new Set([
    'this', 'that', 'with', 'have', 'will', 'from', 'they', 'know', 'want', 'been',
    'good', 'much', 'some', 'time', 'very', 'when', 'come', 'here', 'just', 'like',
    'long', 'make', 'many', 'over', 'such', 'take', 'than', 'them', 'well', 'were'
  ]);
  
  // Count word frequency
  const wordCount = new Map<string, number>();
  words.forEach(word => {
    if (!stopWords.has(word)) {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    }
  });
  
  // Get top 5-8 most frequent words
  return Array.from(wordCount.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([word]) => word)
    .filter(word => word.length > 4); // Filter out short words
}

function determineTargetAudience(content: string, keyTopics: string[]): string {
  const lowerContent = content.toLowerCase();
  
  // Business audience indicators
  if (keyTopics.some(topic => ['business', 'marketing', 'sales', 'revenue', 'growth'].includes(topic)) ||
      lowerContent.includes('entrepreneur') || lowerContent.includes('startup')) {
    return 'entrepreneurs and business owners';
  }
  
  // Developer audience indicators
  if (keyTopics.some(topic => ['code', 'programming', 'development', 'technical', 'software'].includes(topic))) {
    return 'developers and technical professionals';
  }
  
  // Creative audience indicators
  if (keyTopics.some(topic => ['design', 'creative', 'content', 'writing', 'art'].includes(topic))) {
    return 'creatives and content creators';
  }
  
  // Student/learner audience indicators
  if (lowerContent.includes('learn') || lowerContent.includes('student') || lowerContent.includes('beginner')) {
    return 'students and lifelong learners';
  }
  
  // Professional audience indicators
  if (keyTopics.some(topic => ['professional', 'career', 'skill', 'industry'].includes(topic))) {
    return 'working professionals';
  }
  
  return 'anyone looking to improve their skills';
}

function identifyCoreTheme(content: string, keyTopics: string[]): string {
  if (keyTopics.length === 0) {
    return 'personal and professional development';
  }
  
  // Create theme based on most prominent topics
  const primaryTopic = keyTopics[0];
  const secondaryTopics = keyTopics.slice(1, 3);
  
  if (secondaryTopics.length > 0) {
    return `${primaryTopic} and ${secondaryTopics.join(', ')}`;
  }
  
  return primaryTopic;
}

function determineDifficultyLevel(content: string): ContentAnalysis['difficultyLevel'] {
  const lowerContent = content.toLowerCase();
  
  // Beginner indicators
  const beginnerWords = ['beginner', 'start', 'basic', 'introduction', 'simple', 'easy', 'first'];
  const beginnerCount = beginnerWords.filter(word => lowerContent.includes(word)).length;
  
  // Advanced indicators
  const advancedWords = ['advanced', 'expert', 'complex', 'sophisticated', 'mastery', 'deep'];
  const advancedCount = advancedWords.filter(word => lowerContent.includes(word)).length;
  
  // Technical complexity indicators
  const technicalWords = ['algorithm', 'architecture', 'framework', 'methodology', 'optimization'];
  const technicalCount = technicalWords.filter(word => lowerContent.includes(word)).length;
  
  if (advancedCount > 0 || technicalCount > 2) {
    return 'advanced';
  }
  
  if (beginnerCount > 0) {
    return 'beginner';
  }
  
  return 'intermediate';
}

function analyzeContentStructure(content: string): ContentAnalysis['contentStructure'] {
  const lowerContent = content.toLowerCase();
  
  return {
    hasIntroduction: lowerContent.includes('introduction') || lowerContent.includes('intro') || 
                    lowerContent.includes('start') || lowerContent.includes('begin'),
    hasConclusion: lowerContent.includes('conclusion') || lowerContent.includes('summary') || 
                  lowerContent.includes('end') || lowerContent.includes('finally'),
    hasActionItems: lowerContent.includes('action') || lowerContent.includes('step') || 
                   lowerContent.includes('todo') || lowerContent.includes('implement'),
    hasExamples: lowerContent.includes('example') || lowerContent.includes('instance') || 
                lowerContent.includes('case') || lowerContent.includes('sample')
  };
}

function generateLearningObjectives(keyTopics: string[], toneStyle: ContentAnalysis['toneStyle']): string[] {
  const objectives: string[] = [];
  
  // Generate objectives based on key topics
  keyTopics.slice(0, 5).forEach(topic => {
    switch (toneStyle) {
      case 'professional':
        objectives.push(`Master professional ${topic} strategies`);
        break;
      case 'technical':
        objectives.push(`Implement ${topic} solutions effectively`);
        break;
      case 'educational':
        objectives.push(`Understand the fundamentals of ${topic}`);
        break;
      case 'motivational':
        objectives.push(`Transform your approach to ${topic}`);
        break;
      default:
        objectives.push(`Learn practical ${topic} techniques`);
    }
  });
  
  // Add general objectives if we don't have enough
  if (objectives.length < 3) {
    objectives.push('Apply new knowledge to real-world situations');
    objectives.push('Develop actionable implementation strategies');
    objectives.push('Build confidence in your new skills');
  }
  
  return objectives.slice(0, 5);
}