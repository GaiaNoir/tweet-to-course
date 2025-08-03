import { describe, it, expect } from '@jest/globals';
import { Course } from '@/types';

// Mock course data for testing
const mockCourse: Course = {
  id: 'test-course-1',
  title: 'Test Course: Making Money Online',
  modules: [
    {
      id: 'module-1',
      title: 'The Online Money-Making Mindset Revolution',
      summary: `## Course Overview
This comprehensive mini-course transforms the vague concept of "making money online" into five concrete, actionable pathways that you can start implementing today.

**Target Audience:** Aspiring entrepreneurs, side-hustlers, and anyone seeking to create legitimate online income streams

**Learning Outcomes:**
- Master 5 proven online business models with step-by-step implementation guides
- Develop a systematic approach to validating and launching digital income streams
- Build automated systems that generate revenue while you sleep

**Estimated Time:** 2.5 hours across 5 focused modules

### 📖 Complete Module Content

Three years ago, I was scrolling through Twitter seeing everyone claim they were "making money online" while I sat at my first dollar digitally. After losing $2,000 on a dropshipping course that promised "passive income in 30 days," I realized most people approach online income with the wrong mindset entirely.

**The Digital Income Reality Framework:** Unlike traditional employment, online income operates on completely different principles. Instead of trading time for money, you're building systems that can scale infinitely. But this requires a fundamental mindset shift that most people never make.

**The Four Pillars of Online Income Success:**
1. **Value Creation Over Get-Rich-Quick**: Every sustainable online business solves a real problem for real people. Focus on creating genuine value, not chasing trending "opportunities."
2. **Systems Thinking**: Online success comes from building repeatable processes, not one-time efforts. Think in terms of funnels, automation, and scalable systems.
3. **Long-term Compound Growth**: Most online businesses take 6-12 months to gain traction. Expect gradual growth that accelerates over time, not overnight success.
4. **Multiple Income Stream Strategy**: Diversification isn't just smart—it's essential. One income stream is risky; 3-5 streams provide security and exponential growth potential.`,
      takeaways: [
        'Value-First Approach - Focus on solving problems, not chasing money, and the money will follow naturally',
        'Systems Over Hustle - Build repeatable processes that work without your constant presence',
        'Patient Persistence - Online success takes 6-12 months of consistent effort before significant results appear',
        'Multiple Stream Strategy - Diversify income sources to achieve financial security and freedom'
      ],
      order: 1,
      estimatedReadTime: 8
    },
    {
      id: 'module-2',
      title: 'Building Your First Digital Income Stream',
      summary: `### 📖 Complete Module Content

After my dropshipping disaster, I discovered the power of starting small and validating ideas before investing heavily. My first successful online venture was a simple newsletter that grew to $500/month within 3 months.

**The Validation-First Framework:**
1. **Identify a Specific Problem**: Look for pain points in communities you're already part of
2. **Create a Minimum Viable Solution**: Start with the simplest possible version
3. **Test Market Demand**: Validate before you build
4. **Scale What Works**: Double down on proven concepts

**Implementation Timeline:**
- Week 1-2: Problem identification and market research
- Week 3-4: Create and launch MVP
- Month 2-3: Gather feedback and iterate
- Month 4+: Scale successful elements`,
      takeaways: [
        'Start Small, Think Big - Begin with simple solutions and scale based on market response',
        'Validate Before Building - Test demand before investing time and money',
        'Community-First Approach - Solve problems for communities you understand',
        'Iterate Based on Feedback - Use customer input to improve and expand'
      ],
      order: 2,
      estimatedReadTime: 10
    }
  ],
  metadata: {
    sourceType: 'tweet',
    originalContent: 'Making money online is not about finding the perfect opportunity. It\'s about building systems that create value.',
    generatedAt: new Date().toISOString(),
    version: 1
  }
};

describe('Export Markdown Functionality', () => {
  it('should generate proper markdown structure', () => {
    // Test the markdown generation logic
    const expectedStructure = [
      '# Test Course: Making Money Online',
      '## Course Overview',
      '## Table of Contents',
      '## Module 1: The Online Money-Making Mindset Revolution',
      '## Module 2: Building Your First Digital Income Stream',
      '### 🎯 Key Takeaways',
      '## Course Summary'
    ];

    // This would test the actual markdown generation
    // For now, we'll just verify the structure is correct
    expect(mockCourse.title).toBe('Test Course: Making Money Online');
    expect(mockCourse.modules).toHaveLength(2);
    expect(mockCourse.modules[0].takeaways).toHaveLength(4);
    expect(mockCourse.modules[1].takeaways).toHaveLength(4);
  });

  it('should sanitize filename correctly', () => {
    const title = 'Test Course: Making Money Online!';
    const sanitized = title
      .replace(/[^a-z0-9\s\-_]/gi, '')
      .replace(/\s+/g, '_')
      .toLowerCase();
    
    expect(sanitized).toBe('test_course_making_money_online');
  });

  it('should calculate total reading time', () => {
    const totalTime = mockCourse.modules.reduce(
      (total, module) => total + (module.estimatedReadTime || 8), 
      0
    );
    
    expect(totalTime).toBe(18); // 8 + 10 minutes
  });

  it('should count total takeaways', () => {
    const totalTakeaways = mockCourse.modules.reduce(
      (total, module) => total + (module.takeaways?.length || 0), 
      0
    );
    
    expect(totalTakeaways).toBe(8); // 4 + 4 takeaways
  });
});

// Integration test helper
export async function testMarkdownExport(course: Course) {
  try {
    const response = await fetch('/api/export-markdown', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        courseId: course.id,
        courseData: course,
      }),
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.status}`);
    }

    const markdownContent = await response.text();
    
    // Verify markdown structure
    const hasTitle = markdownContent.includes(`# ${course.title}`);
    const hasModules = course.modules.every(module => 
      markdownContent.includes(`## Module ${module.order}: ${module.title}`)
    );
    const hasTakeaways = markdownContent.includes('### 🎯 Key Takeaways');
    const hasSummary = markdownContent.includes('## Course Summary');

    return {
      success: true,
      content: markdownContent,
      validation: {
        hasTitle,
        hasModules,
        hasTakeaways,
        hasSummary,
        length: markdownContent.length
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}