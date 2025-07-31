import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/generate-course/route';

// Mock dependencies
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/claude', () => ({
  generateCourseContent: vi.fn(),
  ClaudeError: class ClaudeError extends Error {
    constructor(message: string, public code: string, public retryable: boolean) {
      super(message);
      this.name = 'ClaudeError';
    }
  },
}));

vi.mock('@/lib/content-processor', () => ({
  processContent: vi.fn(),
  ContentProcessingError: class ContentProcessingError extends Error {
    constructor(message: string, public code: string, public retryable: boolean) {
      super(message);
      this.name = 'ContentProcessingError';
    }
  },
  prepareContentForAI: vi.fn((content: string) => content),
}));

vi.mock('@/lib/database', () => ({
  createClient: vi.fn(),
}));

function createMockSupabase(userData: any = null, courseData: any = null) {
  return {
    from: vi.fn((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: userData,
                error: userData ? null : { code: 'PGRST116' },
              }),
            })),
          })),
          upsert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      if (table === 'courses') {
        return {
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: courseData || { id: 'course-123' },
                error: null,
              }),
            })),
          })),
        };
      }
      if (table === 'usage_logs') {
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      return {};
    }),
  };
}

describe('/api/generate-course', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST', () => {
    it('should generate course successfully for valid content', async () => {
      // Mock auth
      const { auth } = await import('@clerk/nextjs/server');
      vi.mocked(auth).mockResolvedValue({ userId: 'test-user-123' });

      // Mock content processing
      const { processContent } = await import('@/lib/content-processor');
      vi.mocked(processContent).mockResolvedValue({
        content: 'Processed content',
        type: 'text',
      });

      // Mock Claude
      const { generateCourseContent } = await import('@/lib/claude');
      vi.mocked(generateCourseContent).mockResolvedValue({
        title: 'Test Course',
        modules: [
          {
            id: 'module-1',
            title: 'Module 1',
            summary: 'Summary 1',
            takeaways: ['Takeaway 1'],
            order: 1,
          },
          {
            id: 'module-2',
            title: 'Module 2',
            summary: 'Summary 2',
            takeaways: ['Takeaway 2'],
            order: 2,
          },
          {
            id: 'module-3',
            title: 'Module 3',
            summary: 'Summary 3',
            takeaways: ['Takeaway 3'],
            order: 3,
          },
          {
            id: 'module-4',
            title: 'Module 4',
            summary: 'Summary 4',
            takeaways: ['Takeaway 4'],
            order: 4,
          },
          {
            id: 'module-5',
            title: 'Module 5',
            summary: 'Summary 5',
            takeaways: ['Takeaway 5'],
            order: 5,
          },
        ],
        metadata: {
          coreTheme: 'Test Theme',
          targetAudience: 'Test Audience',
          difficultyLevel: 'Beginner',
          estimatedDuration: 60,
        },
      });

      // Mock database
      const { createClient } = await import('@/lib/database');
      const mockSupabase = createMockSupabase(
        { subscription_tier: 'free', usage_count: 0 },
        { id: 'course-123' }
      );
      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      const request = new NextRequest('http://localhost:3000/api/generate-course', {
        method: 'POST',
        body: JSON.stringify({
          content: 'This is test content for course generation that is long enough.',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.course).toBeDefined();
      expect(data.course.title).toBe('Test Course');
      expect(data.course.modules).toHaveLength(5);
    });

    it('should return error for missing content', async () => {
      const request = new NextRequest('http://localhost:3000/api/generate-course', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('MISSING_CONTENT');
    });

    it('should handle content processing errors', async () => {
      // Mock auth
      const { auth } = await import('@clerk/nextjs/server');
      vi.mocked(auth).mockResolvedValue({ userId: 'test-user-123' });

      // Mock content processing error
      const { processContent, ContentProcessingError } = await import('@/lib/content-processor');
      vi.mocked(processContent).mockRejectedValue(
        new ContentProcessingError('Content too short', 'CONTENT_TOO_SHORT', false)
      );

      const request = new NextRequest('http://localhost:3000/api/generate-course', {
        method: 'POST',
        body: JSON.stringify({
          content: 'short',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('CONTENT_TOO_SHORT');
      expect(data.error.retryable).toBe(false);
    });

    it('should handle Claude errors', async () => {
      // Mock auth
      const { auth } = await import('@clerk/nextjs/server');
      vi.mocked(auth).mockResolvedValue({ userId: 'test-user-123' });

      // Mock content processing
      const { processContent } = await import('@/lib/content-processor');
      vi.mocked(processContent).mockResolvedValue({
        content: 'Processed content',
        type: 'text',
      });

      // Mock Claude error
      const { generateCourseContent, ClaudeError } = await import('@/lib/claude');
      vi.mocked(generateCourseContent).mockRejectedValue(
        new ClaudeError('Rate limit exceeded', 'CLAUDE_RATE_LIMIT', true)
      );

      // Mock database
      const { createClient } = await import('@/lib/database');
      const mockSupabase = createMockSupabase({ subscription_tier: 'free', usage_count: 0 });
      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      const request = new NextRequest('http://localhost:3000/api/generate-course', {
        method: 'POST',
        body: JSON.stringify({
          content: 'This is test content for course generation that is long enough.',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('CLAUDE_RATE_LIMIT');
      expect(data.error.retryable).toBe(true);
    });

    it('should enforce usage limits for free users', async () => {
      // Mock auth
      const { auth } = await import('@clerk/nextjs/server');
      vi.mocked(auth).mockResolvedValue({ userId: 'test-user-123' });

      // Mock content processing
      const { processContent } = await import('@/lib/content-processor');
      vi.mocked(processContent).mockResolvedValue({
        content: 'Processed content',
        type: 'text',
      });

      // Mock database - user has already used their free generation
      const { createClient } = await import('@/lib/database');
      const mockSupabase = createMockSupabase({ subscription_tier: 'free', usage_count: 1 });
      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      const request = new NextRequest('http://localhost:3000/api/generate-course', {
        method: 'POST',
        body: JSON.stringify({
          content: 'This is test content for course generation that is long enough.',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('USAGE_LIMIT_EXCEEDED');
      expect(data.usageCount).toBe(1);
    });

    it('should allow regeneration for free users', async () => {
      // Mock auth
      const { auth } = await import('@clerk/nextjs/server');
      vi.mocked(auth).mockResolvedValue({ userId: 'test-user-123' });

      // Mock content processing
      const { processContent } = await import('@/lib/content-processor');
      vi.mocked(processContent).mockResolvedValue({
        content: 'Processed content',
        type: 'text',
      });

      // Mock Claude
      const { generateCourseContent } = await import('@/lib/claude');
      vi.mocked(generateCourseContent).mockResolvedValue({
        title: 'Test Course',
        modules: Array.from({ length: 5 }, (_, i) => ({
          id: `module-${i + 1}`,
          title: `Module ${i + 1}`,
          summary: `Summary ${i + 1}`,
          takeaways: [`Takeaway ${i + 1}`],
          order: i + 1,
        })),
        metadata: {
          coreTheme: 'Test Theme',
          targetAudience: 'Test Audience',
          difficultyLevel: 'Beginner',
          estimatedDuration: 60,
        },
      });

      // Mock database - user has already used their free generation
      const { createClient } = await import('@/lib/database');
      const mockSupabase = createMockSupabase(
        { subscription_tier: 'free', usage_count: 1 },
        { id: 'course-123' }
      );
      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      const request = new NextRequest('http://localhost:3000/api/generate-course', {
        method: 'POST',
        body: JSON.stringify({
          content: 'This is test content for course generation that is long enough.',
          regenerate: true,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.course).toBeDefined();
    });

    it('should handle rate limiting', async () => {
      // Mock auth
      const { auth } = await import('@clerk/nextjs/server');
      vi.mocked(auth).mockResolvedValue({ userId: 'test-user-rate-limit' });

      // Make multiple requests quickly to trigger rate limiting
      const requests = Array.from({ length: 6 }, () =>
        new NextRequest('http://localhost:3000/api/generate-course', {
          method: 'POST',
          body: JSON.stringify({
            content: 'This is test content for course generation that is long enough.',
          }),
        })
      );

      const responses = await Promise.all(requests.map(request => POST(request)));
      const lastResponse = responses[responses.length - 1];
      const data = await lastResponse.json();

      expect(lastResponse.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });
  });
});