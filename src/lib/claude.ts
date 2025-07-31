import Anthropic from '@anthropic-ai/sdk';
import { analyzeContent, ContentAnalysis } from './content-processor';

// Build-safe Claude client initialization
const getClaudeClient = () => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey && typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
    console.warn('Missing ANTHROPIC_API_KEY environment variable');
  }
  return new Anthropic({
    apiKey: apiKey || 'placeholder-key',
    timeout: 120000, // 2 minutes timeout for Claude API calls
    maxRetries: 2, // Retry failed requests up to 2 times
  });
};

// Lazy initialization to avoid build-time errors
let _claude: Anthropic | null = null;

const claude = new Proxy({} as Anthropic, {
  get(_target, prop) {
    if (!_claude) {
      _claude = getClaudeClient();
    }
    return _claude[prop as keyof Anthropic];
  }
});

// Rate limiting configuration
const RATE_LIMIT = {
  maxRequests: 10,
  windowMs: 120 * 1000, // 1 minute
  requestCounts: new Map<string, { count: number; resetTime: number }>(),
};

// Error types for better error handling
export class ClaudeError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'ClaudeError';
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

// Enhanced Claude API client with content analysis
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
    throw new ClaudeError(
      'Rate limit exceeded. Please try again in a minute.',
      'RATE_LIMIT_EXCEEDED',
      true
    );
  }

  try {
    // Analyze content for better course generation
    const contentAnalysis = analyzeContent(content);

    console.log('🔍 Content length:', content.length);

    const response = await claude.messages.create({
      model: 'claude-sonnet-4-20250514', // Latest Claude 3.5 Sonnet model
      max_tokens: 20000, // Increased tokens for comprehensive courses
      temperature: 1, // Higher creativity for more engaging content
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are an expert course creator tasked with developing a high-value, expert-level mini-course based on a single tweet. Your goal is to create a course outline that provides deep, specialized knowledge and can be sold for at least $25. The course should focus on actionable advice and encourage learners to take immediate action based on what they've learned.

Here is the tweet you'll be working with:

<tweet>
${content}
</tweet>

Your Task
Transform the provided tweets into a structured 5-module mini course following the exact format and quality standards outlined below. Each module should expand significantly on the original tweet content while maintaining the core insights and adding substantial educational value.

Course Structure Requirements
Course Header Format:
# Course Title: [Compelling, Benefit-Driven Title]

## Course Overview
[2-3 sentences describing what students will learn and the specific outcomes they'll achieve]

**Target Audience:** [Specific description of who this course serves]

**Learning Outcomes:**
- [Specific skill/knowledge student will gain]
- [Another concrete learning outcome]
- [Third measurable result]
- [Fourth actionable capability]
- [Fifth practical benefit]

**Estimated Time:** [Total time commitment - typically 2-3 hours for 5 modules]

Module Structure (Repeat for all 5 modules):
## [Module Number]
[Module Title: Compelling and Specific]
[Hook sentence that connects to original tweet insight and promises value]

### 📖 Complete Module Content

[DETAILED EXPANSION - 250-350 words that include:]

[Opening paragraph with personal story or specific example that illustrates the main concept]

**[Framework/System Name]:**
[Detailed explanation of the core system or approach]

[Numbered or bulleted breakdown of the process/system:]
1. **[Step/Component 1]**: [Detailed explanation with specific example]
2. **[Step/Component 2]**: [Actionable details with metrics when possible]
3. **[Step/Component 3]**: [Implementation guidance with tools/resources]
4. **[Step/Component 4]**: [Results to expect or success indicators]

**[Subsection Title - Tools/Resources/Implementation]:**
- [Specific tool recommendation with reasoning]
- [Another concrete resource with how to use it]
- [Implementation tip with specific instructions]
- [Metric to track or timeline to follow]

**[Subsection Title - Common Mistakes/Troubleshooting]:**
- [Specific mistake with explanation of why it happens]
- [Another pitfall with guidance on avoiding it]
- [Problem scenario with step-by-step solution]

**[Results/Timeline Section]:**
- Week/Month 1: [Specific milestone with measurable outcome]
- Week/Month 2: [Next achievement with concrete metric]
- Week/Month 3: [Advanced result with success indicator]
- Week/Month 4: [Final goal with quantifiable measure]

### 🎯 Key Takeaways
1. **[Takeaway 1]** - [Brief but actionable summary of core concept]
2. **[Takeaway 2]** - [Another implementable insight from the module]
3. **[Takeaway 3]** - [Third practical point with specific guidance]
4. **[Takeaway 4]** - [Fourth actionable takeaway with clear benefit]

Content Expansion Guidelines
From Tweet to Module - Expansion Strategy:

1. Identify Core Insight: Extract the main valuable point from the tweet
2. Add Personal Context: Create a relatable story or example that illustrates the concept
3. Build Framework: Develop a systematic approach around the tweet's advice
4. Provide Implementation: Give step-by-step instructions for applying the insight
5. Include Tools/Resources: Recommend specific tools, templates, or resources
6. Address Challenges: Anticipate problems and provide troubleshooting guidance
7. Set Expectations: Include realistic timelines and measurable outcomes

Quality Standards for Each Module:

- Personal Stories: Include specific anecdotes with numbers, timelines, and outcomes
- Actionable Frameworks: Create systematic approaches that readers can follow
- Concrete Tools: Recommend specific software, resources, or templates
- Measurable Results: Provide metrics, timelines, and success indicators
- Troubleshooting: Address common problems and provide solutions
- Progressive Difficulty: Each module should build on the previous one

Writing Style Requirements:

- Conversational Tone: Write like you're teaching a friend, not lecturing
- Specific Examples: Use concrete numbers, percentages, and real scenarios
- Story-Driven: Start modules with engaging personal anecdotes
- Action-Oriented: Focus on what readers should DO, not just what they should know
- Results-Focused: Emphasize outcomes and transformations throughout

Module Flow Framework:

- Module 1: Foundation/Mindset - Core concepts and mental frameworks
- Module 2: Implementation - First steps, setup, and initial execution
- Module 3: Systems/Optimization - Scaling strategies and efficiency improvements
- Module 4: Advanced Tactics - Sophisticated techniques and monetization
- Module 5: Sustainability - Long-term success and systematic growth

Content Enhancement Requirements:
Add These Elements to Every Module:

- Specific Numbers: Include percentages, dollar amounts, timeframes, metrics
- Tool Recommendations: Name exact software, apps, or resources with reasons why
- Templates/Checklists: Reference specific frameworks readers can follow
- Common Mistakes: Identify pitfalls with explanations of how to avoid them
- Success Metrics: Define what success looks like with measurable indicators
- Implementation Timeline: Provide realistic expectations for seeing results

Avoid These Common Issues:

- Generic advice without specific implementation steps
- Vague timelines or unrealistic expectations
- Missing troubleshooting or problem-solving guidance
- Lack of concrete tools or resource recommendations
- Content that doesn't clearly build from the original tweet insight

Example Input-Output Relationship:
If Tweet Says: "The best way to grow on Twitter is consistency"
Your Module Should Include:

- Personal story about your consistency journey with specific numbers
- Framework for maintaining consistency (batch creation, scheduling, etc.)
- Specific tools for consistent posting (Buffer, Hypefury, etc.)
- Common consistency mistakes and how to avoid them
- Timeline for seeing results from consistent posting
- Metrics to track consistency and its impact on growth

Final Quality Check:
Before submitting, ensure each module:

✅ Expands the original tweet insight by 10x with valuable detail
✅ Includes personal stories or specific examples with numbers
✅ Provides actionable frameworks or step-by-step processes
✅ Recommends specific tools, resources, or templates
✅ Addresses common problems with practical solutions
✅ Sets realistic expectations with measurable outcomes
✅ Builds logically from previous modules
✅ Could standalone as valuable educational content

Now, please create a complete 5-module mini course based on the tweets I provide, following this exact structure and meeting these quality standards. 

IMPORTANT: Include the course overview information (Course Overview, Target Audience, Learning Outcomes, Estimated Time) at the beginning of the first module's content so it can be displayed properly in the UI.

Return the response as a JSON object with the following structure:

{
  "title": "Course Title Here",
  "modules": [
    {
      "title": "Module Title",
      "content": "## Course Overview\n[2-3 sentences describing what students will learn]\n\n**Target Audience:** [Specific description]\n\n**Learning Outcomes:**\n- [Outcome 1]\n- [Outcome 2]\n- [Outcome 3]\n- [Outcome 4]\n- [Outcome 5]\n\n**Estimated Time:** [Total time]\n\n[Rest of module content as markdown text]",
      "takeaways": ["takeaway 1", "takeaway 2", "takeaway 3", "takeaway 4"],
      "estimatedReadTime": 8
    }
  ]
}`
            }
          ]
        }
      ],
    }, {
      timeout: 45000 // 45 seconds timeout
    
    });

    const responseText = response.content[0]?.type === 'text' ? response.content[0].text : '';
    if (!responseText) {
      throw new ClaudeError(
        'No response received from Claude',
        'NO_RESPONSE',
        true
      );
    }

    let parsedResponse;
    try {
      // Try to extract JSON from the response if it's wrapped in markdown or other text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : responseText;

      parsedResponse = JSON.parse(jsonText);
      console.log('✅ JSON parsing successful');
      console.log('🔍 Claude response structure:', Object.keys(parsedResponse));
    } catch (parseError) {
      console.log('❌ JSON parsing failed:', parseError);
      console.log('📝 Raw response text:', responseText.substring(0, 500));
      throw new ClaudeError(
        'Failed to parse Claude response as JSON',
        'PARSE_ERROR',
        true
      );
    }

    // Validate response structure
    const title = parsedResponse.title || parsedResponse.courseTitle;
    if (!title || !parsedResponse.modules || !Array.isArray(parsedResponse.modules)) {
      console.log('❌ Invalid response format:', {
        hasTitle: !!title,
        hasModules: !!parsedResponse.modules,
        isModulesArray: Array.isArray(parsedResponse.modules),
        actualKeys: Object.keys(parsedResponse)
      });
      throw new ClaudeError(
        'Invalid response format from Claude',
        'INVALID_FORMAT',
        true
      );
    }

    // Ensure at least 3 modules
    if (parsedResponse.modules.length < 3) {
      console.log('❌ Too few modules:', parsedResponse.modules.length);
      throw new ClaudeError(
        `Expected at least 3 modules, got ${parsedResponse.modules.length}`,
        'INVALID_MODULE_COUNT',
        true
      );
    }

    // Process modules
    const modules = parsedResponse.modules.map((module: any, index: number) => {
      // Clean up the content to ensure it's properly formatted
      let content = module.content || module.summary || '';

      // Remove unwanted UI text that shouldn't be in the content
      content = content
        .replace(/Click to read full content \(\d+ words\)/gi, '')
        .replace(/Click to read full content/gi, '')
        .replace(/\(\d+ words\)/gi, '')
        .replace(/⏱️ \[?\d+\]? min read/gi, '')
        .replace(/📝 Module \[?\d+\]? of \d+/gi, '')
        .replace(/📊 \d+ key takeaways/gi, '')
        .replace(/⏱️.*?min read/gi, '')
        .replace(/📝.*?Module.*?of.*?\d+/gi, '')
        .replace(/📊.*?takeaways/gi, '')
        .trim();

      // If the content contains markdown headers, ensure proper formatting
      if (content.includes('###') || content.includes('**')) {
        content = content
          .replace(/### /g, '\n### ')
          .replace(/\*\*(.*?)\*\*/g, '**$1**')
          .trim();
      }

      return {
        id: `module-${index + 1}`,
        title: module.title || `Module ${index + 1}`,
        summary: content,
        takeaways: Array.isArray(module.takeaways) ? module.takeaways : [],
        order: index + 1,
        estimatedReadTime: module.estimatedReadTime || Math.ceil(contentAnalysis.estimatedDuration / parsedResponse.modules.length),
      };
    });

    return {
      title: title,
      modules,
      metadata: {
        coreTheme: contentAnalysis.coreTheme,
        targetAudience: contentAnalysis.targetAudience,
        difficultyLevel: contentAnalysis.difficultyLevel,
        estimatedDuration: contentAnalysis.estimatedDuration,
      },
    };

  } catch (error) {
    if (error instanceof ClaudeError) {
      throw error;
    }

    // Handle timeout errors specifically
    if (error instanceof Error && (error.message.includes('timeout') || error.message.includes('TIMEOUT'))) {
      throw new ClaudeError(
        'Claude API request timed out. Please try again with shorter content or try again later.',
        'CLAUDE_TIMEOUT',
        true
      );
    }

    // Handle Claude API errors
    if (error && typeof error === 'object' && 'status' in error) {
      const apiError = error as any;

      if (apiError.status === 400) {
        if (apiError.error?.error?.message?.includes('credit balance is too low')) {
          throw new ClaudeError(
            'Claude API credits exhausted. Please add credits to your Anthropic account at console.anthropic.com',
            'CLAUDE_CREDITS_EXHAUSTED',
            false
          );
        }
        throw new ClaudeError(
          'Invalid request to Claude API. Please check your input.',
          'CLAUDE_INVALID_REQUEST',
          false
        );
      }

      if (apiError.status === 429) {
        throw new ClaudeError(
          'Claude API rate limit exceeded. Please try again later.',
          'CLAUDE_RATE_LIMIT',
          true
        );
      }

      if (apiError.status === 401) {
        throw new ClaudeError(
          'Claude API authentication failed. Please check your API key.',
          'CLAUDE_AUTH_ERROR',
          false
        );
      }

      if (apiError.status >= 500) {
        throw new ClaudeError(
          'Claude service temporarily unavailable',
          'CLAUDE_SERVER_ERROR',
          true
        );
      }

      throw new ClaudeError(
        `Claude API error: ${apiError.message || 'Unknown error'}`,
        'CLAUDE_API_ERROR',
        false
      );
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      throw new ClaudeError(
        'Failed to parse Claude response',
        'PARSE_ERROR',
        true
      );
    }

    // Handle network errors
    if (error instanceof Error && error.message.includes('fetch')) {
      throw new ClaudeError(
        'Network error connecting to Claude',
        'NETWORK_ERROR',
        true
      );
    }

    // Generic error fallback
    throw new ClaudeError(
      'Unexpected error during course generation',
      'UNKNOWN_ERROR',
      true
    );
  }
}

// Export the claude instance for backward compatibility
export { claude };
export default claude;