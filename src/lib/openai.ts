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
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert course creator who transforms content into comprehensive, detailed educational modules. Create extensive, in-depth content with full explanations, examples, and practical guidance. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 16384,
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

    // Ensure 5-10 modules
    if (parsedResponse.modules.length < 5 || parsedResponse.modules.length > 10) {
      throw new OpenAIError(
        'Expected 5-10 modules in response',
        'INVALID_MODULE_COUNT',
        true
      );
    }

    // Add IDs and validate module structure with enhanced data
    const modules = parsedResponse.modules.map((module: any, index: number) => ({
      id: `module-${index + 1}`,
      title: module.title || `Module ${index + 1}`,
      summary: module.content || module.summary || '', // Use 'content' field from new prompt, fallback to 'summary'
      takeaways: Array.isArray(module.takeaways) ? module.takeaways : [],
      order: index + 1,
      estimatedReadTime: module.estimatedReadTime || Math.ceil(contentAnalysis.estimatedDuration / parsedResponse.modules.length), // Distribute total time across modules
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
  const prompt = `You are an expert practitioner who has actually achieved the results mentioned in this tweet. Write a detailed mini-course sharing your EXACT methods, not theoretical advice.

Tweet: "${content}"

CRITICAL: Write as if you personally achieved these results and are sharing your exact playbook. NO generic advice, NO "we'll explore" language, NO theoretical content.

REQUIREMENTS FOR EACH MODULE:
- Start immediately with actionable content - no introductions or "we'll cover" statements
- Give EXACT step-by-step processes you personally used
- Include specific tools, settings, and configurations
- Share real numbers, metrics, and timeframes from your experience
- Provide copy-paste templates, scripts, and formulas
- Address specific problems you encountered and exact solutions
- Write 800-1200 words of pure, actionable content per module

WRITING STYLE:
- Write in first person as the expert who achieved these results
- Use specific examples: "When I did X, I got Y result in Z timeframe"
- Include exact numbers: "This increased my revenue by $2,847 in 3 weeks"
- Give precise instructions: "Set your bid to $0.15, target these 3 interests, run for exactly 7 days"
- Share insider secrets: "Most people don't know this, but..."
- Be conversational but authoritative

ABSOLUTELY AVOID:
- "We will explore..." or "In this module, we'll..."
- Generic advice without specifics
- Theoretical explanations without practical application
- Vague promises or motivational content
- "You can achieve..." without showing exactly how

STRUCTURE EACH MODULE AS:
1. Immediate actionable content (no intro fluff)
2. Exact step-by-step process with specific tools
3. Real examples with actual numbers and outcomes
4. Common mistakes and exact solutions
5. Advanced optimization techniques
6. Specific metrics to track and benchmarks

{
  "title": "[Specific Outcome]: The Exact System I Used to [Specific Achievement]",
  "modules": [
    {
      "title": "The Foundation Setup That Generated My First Results",
      "content": "Here's exactly how I set up the foundation that led to my first breakthrough. I'll walk you through every single step, tool, and setting I used.

[WRITE 800-1200 WORDS OF PURE ACTIONABLE CONTENT]

Start with the exact first step you took. For example: 'The first thing I did was create an account on [specific platform]. Here's the exact setup process: Go to [specific URL], click [specific button], enter these exact details: [specific information]. Set your profile to [exact settings] because this affects [specific outcome].'

Continue with each subsequent step, including:
- Exact tools and their specific configurations
- Screenshots descriptions of what to click/select
- Specific timeframes: 'This took me exactly 2 hours and 15 minutes'
- Real results: 'After 3 days, I had [specific metric]'
- Mistakes I made: 'I initially set [setting] to [value] which caused [problem]. Change it to [correct value] instead.'
- Optimization discoveries: 'I found that changing [specific element] increased [metric] by 34%'

Include specific templates, scripts, or formulas you used. Give exact numbers and metrics throughout. Share insider tips that most people don't know.",
      "takeaways": [
        "Exact setup process: Use [specific tool], configure [exact settings], expect [specific result] in [timeframe] - I achieved [actual result]",
        "Critical first milestone: Following this process, you should hit [specific metric] within [timeframe] - I tracked this using [specific method]",
        "Biggest mistake to avoid: Never [specific action] because it caused me to lose [specific amount/metric] - do [exact alternative] instead",
        "Secret optimization: [Specific technique] that increased my [metric] by [percentage] - here's the exact process: [detailed steps]"
      ],
      "estimatedReadTime": 10
    },
    {
      "title": "The Implementation Strategy That Scaled My Results",
      "content": "Once I had the foundation, here's the exact implementation strategy I used to scale from [starting point] to [end result]. Every step is based on what actually worked for me.

[WRITE 800-1200 WORDS OF PURE ACTIONABLE CONTENT]

Start with the exact next phase: 'After getting [specific result] from the foundation, I implemented this scaling strategy. Here's step one: [exact action]. I used [specific tool] with these exact settings: [detailed configuration].'

Include:
- Exact scaling methods with specific tools and settings
- Real case studies from your experience with actual numbers
- Advanced techniques that most people miss
- Specific optimization methods with measurable results
- Troubleshooting for problems you actually encountered
- Scaling milestones with realistic timeframes
- Personal insights from real implementation

Provide copy-paste templates, exact scripts, and specific formulas. Share real metrics and outcomes throughout.",
      "takeaways": [
        "Scaling method: Use [specific tool/technique], implement [exact process], track [specific metrics] - this grew my [result] by [percentage] in [timeframe]",
        "Real case study: Started with [specific situation], applied [exact method], achieved [specific results] in [timeframe] - here's the breakdown: [metrics]",
        "Hidden technique: [Specific method] that most people miss - it improved my [metric] by [amount] because [detailed explanation]",
        "Scaling trigger: When you hit [specific metric], implement [exact strategy] to reach [next milestone] - realistic timeframe: [period]"
      ],
      "estimatedReadTime": 10
    },
    {
      "title": "Advanced Optimization Techniques That Multiplied My Results",
      "content": "Here are the advanced optimization techniques I discovered that took my results from good to exceptional. These are the insider methods that separate beginners from experts.

[WRITE 800-1200 WORDS OF PURE ACTIONABLE CONTENT]

Share your advanced discoveries: 'After [timeframe] of testing, I discovered this optimization that increased my [metric] by [percentage]. Here's exactly how to implement it: [step-by-step process].'

Include:
- Advanced strategies with specific implementation steps
- Exact tools for advanced optimization
- Real optimization examples with detailed metrics
- A/B testing methods you actually used
- Advanced analytics and tracking setups
- Common advanced mistakes and exact solutions
- Scaling strategies with real projections
- Personal optimization insights with data

Provide exact formulas, specific settings, and real examples throughout.",
      "takeaways": [
        "Advanced technique: [Specific method] using [exact tools] - implementation: [detailed steps] - result: [specific outcome] in [timeframe]",
        "Optimization discovery: [Specific change] improved [metric] by [percentage] - here's why it works and how to implement: [explanation]",
        "Advanced troubleshooting: When [specific problem] occurs, use [exact solution] - this solved [issue] and improved [metric] by [amount]",
        "Expert milestone: [Specific achievement] indicates you're ready for [next level] - implement [exact strategy] for [projected outcome]"
      ],
      "estimatedReadTime": 10
    },
    {
      "title": "The Scaling System That Automated My Success",
      "content": "Here's the exact scaling and automation system I built that allowed me to maintain and grow my results without constant manual work.

[WRITE 800-1200 WORDS OF PURE ACTIONABLE CONTENT]

Share your automation discoveries: 'To scale beyond [specific point], I built this automation system using [specific tools]. Here's the exact setup: [detailed process].'

Include:
- Exact automation tools and configurations
- Scaling strategies with real implementation timelines
- Team building and delegation processes you used
- Advanced automation techniques
- Specific systems for sustainable growth
- Common scaling mistakes and solutions
- Long-term growth strategies with real data
- Personal scaling insights with metrics

Provide exact workflows, specific tools, and real examples.",
      "takeaways": [
        "Automation system: [Specific setup] using [exact tools] - saves [amount] hours per [timeframe] - increases [metric] by [percentage]",
        "Scaling strategy: [Specific method] with [exact tools] - timeline: [schedule] - expected growth: [projections] based on my data",
        "Team scaling: Hire [specific roles] when [metric] reaches [amount] - use [exact process] - expect [ROI] within [timeframe]",
        "Growth milestone: [Specific achievement] indicates readiness for [next phase] - implement [strategy] for [outcome] in [timeframe]"
      ],
      "estimatedReadTime": 10
    },
    {
      "title": "Mastery-Level Strategies for Long-Term Success",
      "content": "These are the mastery-level strategies I use to maintain and continuously improve my results. This is what separates the top 1% from everyone else.

[WRITE 800-1200 WORDS OF PURE ACTIONABLE CONTENT]

Share your mastery insights: 'After achieving [specific results], I discovered these advanced strategies that maintain long-term success. Here's what most people never learn: [specific insight].'

Include:
- Mastery-level techniques with exact implementation
- Expert tools and advanced configurations
- Long-term strategy development methods
- Advanced problem-solving approaches
- Sustainable systems for continued growth
- Expert-level optimization techniques
- Personal mastery insights with real examples
- Advanced metrics and benchmarks

This should be your most advanced and detailed content.",
      "takeaways": [
        "Mastery technique: [Advanced method] that separates experts from beginners - implementation: [process] - results: [outcomes] in [timeframe]",
        "Expert optimization: [Specific advanced technique] that improved [metric] by [percentage] - requires [skills/tools] - timeline: [period]",
        "Long-term strategy: [Specific approach] for sustainable [outcome] - implementation over [timeframe] - expected results: [projections]",
        "Mastery milestone: Achieving [specific metric] indicates mastery level - next steps: [strategy] for [advanced outcome]"
      ],
      "estimatedReadTime": 10
    }
  ]
}`;
  return prompt;
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
      "content": "Brief summary of what this module covers",
      "takeaways": ["Actionable takeaway 1", "Actionable takeaway 2"]
    },
    {
      "title": "Module 2 Title", 
      "content": "Brief summary of what this module covers",
      "takeaways": ["Actionable takeaway 1", "Actionable takeaway 2", "Actionable takeaway 3"]
    },
    {
      "title": "Module 3 Title",
      "content": "Brief summary of what this module covers", 
      "takeaways": ["Actionable takeaway 1"]
    },
    {
      "title": "Module 4 Title",
      "content": "Brief summary of what this module covers",
      "takeaways": ["Actionable takeaway 1", "Actionable takeaway 2"]
    },
    {
      "title": "Module 5 Title",
      "content": "Brief summary of what this module covers",
      "takeaways": ["Actionable takeaway 1", "Actionable takeaway 2"]
    }
  ]
}
`;
}

// Export the openai instance for backward compatibility
export { openai };
export default openai;