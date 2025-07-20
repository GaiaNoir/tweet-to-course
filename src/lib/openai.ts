import OpenAI from 'openai';
import { analyzeContent, ContentAnalysis } from './content-processor';

// Build-safe OpenAI client initialization
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey && typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
    console.warn('Missing OPENAI_API_KEY environment variable');
  }
  return new OpenAI({
    apiKey: apiKey || 'placeholder-key',
  });
};

// Lazy initialization to avoid build-time errors
let _openai: OpenAI | null = null;

const openai = new Proxy({} as OpenAI, {
  get(target, prop) {
    if (!_openai) {
      _openai = getOpenAIClient();
    }
    return _openai[prop as keyof OpenAI];
  }
});

// Rate limiting configuration
const RATE_LIMIT = {
  maxRequests: 10,
  windowMs: 60 * 1000, // 1 minute
  requestCounts: new Map<string, { count: number; resetTime: number }>(),
};

// Error types for better error handling
export class OpenAIError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'OpenAIError';
  }
}

// Rate limiting function
export function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = RATE_LIMIT.requestCounts.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    // Reset or initialize rate limit
    RATE_LIMIT.requestCounts.set(userId, {
      count: 1,
      resetTime: now + RATE_LIMIT.windowMs,
    });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT.maxRequests) {
    return false;
  }

  userLimit.count++;
  return true;
}

// Enhanced OpenAI API client with content analysis
export async function generateCourseContent(
  content: string,
  userId?: string
): Promise<{
  title: string;
  modules: Array<{
    id: string;
    title: string;
    summary: string;
    takeaways: string[];
    order: number;
    estimatedReadTime?: number;
  }>;
  metadata?: {
    coreTheme: string;
    targetAudience: string;
    difficultyLevel: string;
    estimatedDuration: number;
  };
}> {
  // Rate limiting check
  if (userId && !checkRateLimit(userId)) {
    throw new OpenAIError(
      'Rate limit exceeded. Please try again in a minute.',
      'RATE_LIMIT_EXCEEDED',
      true
    );
  }

  try {
    // Analyze content for better course generation
    const contentAnalysis = analyzeContent(content);
    const prompt = createEnhancedCoursePrompt(content, contentAnalysis);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert course creator who transforms content into structured educational modules. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new OpenAIError(
        'No response received from OpenAI',
        'NO_RESPONSE',
        true
      );
    }

    const parsedResponse = JSON.parse(response);
    
    // Validate response structure
    if (!parsedResponse.title || !parsedResponse.modules || !Array.isArray(parsedResponse.modules)) {
      throw new OpenAIError(
        'Invalid response format from OpenAI',
        'INVALID_FORMAT',
        true
      );
    }

    // Ensure exactly 5 modules
    if (parsedResponse.modules.length !== 5) {
      throw new OpenAIError(
        'Expected exactly 5 modules in response',
        'INVALID_MODULE_COUNT',
        true
      );
    }

    // Add IDs and validate module structure with enhanced data
    const modules = parsedResponse.modules.map((module: any, index: number) => ({
      id: `module-${index + 1}`,
      title: module.title || `Module ${index + 1}`,
      summary: module.summary || '',
      takeaways: Array.isArray(module.takeaways) ? module.takeaways : [],
      order: index + 1,
      estimatedReadTime: module.estimatedReadTime || Math.ceil(contentAnalysis.estimatedDuration / 5), // Distribute total time across modules
    }));

    return {
      title: parsedResponse.title,
      modules,
      metadata: {
        coreTheme: contentAnalysis.coreTheme,
        targetAudience: contentAnalysis.targetAudience,
        difficultyLevel: contentAnalysis.difficultyLevel,
        estimatedDuration: contentAnalysis.estimatedDuration,
      },
    };

  } catch (error) {
    if (error instanceof OpenAIError) {
      throw error;
    }

    // Handle OpenAI API errors
    if (error && typeof error === 'object' && 'status' in error) {
      const apiError = error as any;
      if (apiError.status === 429) {
        throw new OpenAIError(
          'OpenAI API rate limit exceeded. Please try again later.',
          'OPENAI_RATE_LIMIT',
          true
        );
      }
      
      if (apiError.status === 401) {
        throw new OpenAIError(
          'OpenAI API authentication failed',
          'OPENAI_AUTH_ERROR',
          false
        );
      }

      if (apiError.status >= 500) {
        throw new OpenAIError(
          'OpenAI service temporarily unavailable',
          'OPENAI_SERVER_ERROR',
          true
        );
      }

      throw new OpenAIError(
        `OpenAI API error: ${apiError.message}`,
        'OPENAI_API_ERROR',
        false
      );
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      throw new OpenAIError(
        'Failed to parse OpenAI response',
        'PARSE_ERROR',
        true
      );
    }

    // Handle network errors
    if (error instanceof Error && error.message.includes('fetch')) {
      throw new OpenAIError(
        'Network error connecting to OpenAI',
        'NETWORK_ERROR',
        true
      );
    }

    // Generic error fallback
    throw new OpenAIError(
      'Unexpected error during course generation',
      'UNKNOWN_ERROR',
      true
    );
  }
}

// Enhanced prompt creation using content analysis
function createEnhancedCoursePrompt(content: string, analysis: ContentAnalysis): string {
  return `
Transform the following content into a structured mini-course with exactly 5 modules, tailored for the identified audience and theme.

Content Analysis:
- Core Theme: ${analysis.coreTheme}
- Target Audience: ${analysis.targetAudience}
- Tone/Style: ${analysis.toneStyle}
- Difficulty Level: ${analysis.difficultyLevel}
- Key Topics: ${analysis.keyTopics.join(', ')}
- Estimated Duration: ${analysis.estimatedDuration} minutes

Content to transform:
"""
${content}
"""

Requirements:
1. Create exactly 5 modules that build upon each other logically
2. Each module should have a clear title, summary, and 1-3 actionable takeaways
3. Generate an engaging course title that appeals to ${analysis.targetAudience}
4. Match the ${analysis.toneStyle} tone throughout
5. Ensure content is appropriate for ${analysis.difficultyLevel} level
6. Focus on practical, actionable insights related to ${analysis.coreTheme}
7. Include estimated read time for each module (distribute ${analysis.estimatedDuration} minutes across 5 modules)

Respond with valid JSON in this exact format:
{
  "title": "Course Title Here (engaging and specific to the theme)",
  "modules": [
    {
      "title": "Module 1 Title (Foundation/Introduction)",
      "summary": "Brief summary of what this module covers",
      "takeaways": ["Actionable takeaway 1", "Actionable takeaway 2"],
      "estimatedReadTime": 3
    },
    {
      "title": "Module 2 Title (Building Knowledge)", 
      "summary": "Brief summary of what this module covers",
      "takeaways": ["Actionable takeaway 1", "Actionable takeaway 2", "Actionable takeaway 3"],
      "estimatedReadTime": 4
    },
    {
      "title": "Module 3 Title (Core Concepts)",
      "summary": "Brief summary of what this module covers", 
      "takeaways": ["Actionable takeaway 1", "Actionable takeaway 2"],
      "estimatedReadTime": 3
    },
    {
      "title": "Module 4 Title (Advanced Application)",
      "summary": "Brief summary of what this module covers",
      "takeaways": ["Actionable takeaway 1", "Actionable takeaway 2"],
      "estimatedReadTime": 4
    },
    {
      "title": "Module 5 Title (Implementation/Next Steps)",
      "summary": "Brief summary of what this module covers",
      "takeaways": ["Actionable takeaway 1", "Actionable takeaway 2"],
      "estimatedReadTime": 3
    }
  ]
}
`;
}

// Legacy prompt function for backward compatibility
function createCoursePrompt(content: string): string {
  return `
Transform the following content into a structured mini-course with exactly 5 modules. 

Content to transform:
"""
${content}
"""

Requirements:
1. Create exactly 5 modules
2. Each module should have a clear title, summary, and 1-3 actionable takeaways
3. Generate an engaging course title
4. Ensure logical flow between modules
5. Focus on practical, actionable insights

Respond with valid JSON in this exact format:
{
  "title": "Course Title Here",
  "modules": [
    {
      "title": "Module 1 Title",
      "summary": "Brief summary of what this module covers",
      "takeaways": ["Actionable takeaway 1", "Actionable takeaway 2"]
    },
    {
      "title": "Module 2 Title", 
      "summary": "Brief summary of what this module covers",
      "takeaways": ["Actionable takeaway 1", "Actionable takeaway 2", "Actionable takeaway 3"]
    },
    {
      "title": "Module 3 Title",
      "summary": "Brief summary of what this module covers", 
      "takeaways": ["Actionable takeaway 1"]
    },
    {
      "title": "Module 4 Title",
      "summary": "Brief summary of what this module covers",
      "takeaways": ["Actionable takeaway 1", "Actionable takeaway 2"]
    },
    {
      "title": "Module 5 Title",
      "summary": "Brief summary of what this module covers",
      "takeaways": ["Actionable takeaway 1", "Actionable takeaway 2"]
    }
  ]
}
`;
}

// Export the openai instance for backward compatibility
export { openai };
export default openai;