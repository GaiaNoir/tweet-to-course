import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateCourseContent, checkRateLimit, OpenAIError } from '@/lib/openai';
import { processContent, ContentProcessingError } from '@/lib/content-processor';
import { createErrorResponse, ERROR_CODES } from '@/lib/error-handler';

// Mock OpenAI
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn(),
        },
      },
    })),
    APIError: class APIError extends Error {
      constructor(message: string, public status: number) {
        super(message);
        this.name = 'APIError';
      }
    },
  };
});

describe('OpenAI Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', () => {
      const userId = 'test-user-1';
      
      // First request should be allowed
      expect(checkRateLimit(userId)).toBe(true);
      
      // Subsequent requests within limit should be allowed
      for (let i = 0; i < 9; i++) {
        expect(checkRateLimit(userId)).toBe(true);
      }
    });

    it('should block requests exceeding rate limit', () => {
      const userId = 'test-user-2';
      
      // Use up the rate limit
      for (let i = 0; i < 10; i++) {
        checkRateLimit(userId);
      }
      
      // Next request should be blocked
      expect(checkRateLimit(userId)).toBe(false);
    });

    it('should reset rate limit after time window', () => {
      const userId = 'test-user-3';
      
      // Mock Date.now to control time
      const originalNow = Date.now;
      let currentTime = 1000000;
      Date.now = vi.fn(() => currentTime);
      
      // Use up rate limit
      for (let i = 0; i < 10; i++) {
        checkRateLimit(userId);
      }
      expect(checkRateLimit(userId)).toBe(false);
      
      // Advance time past window
      currentTime += 61000; // 61 seconds
      
      // Should be allowed again
      expect(checkRateLimit(userId)).toBe(true);
      
      // Restore original Date.now
      Date.now = originalNow;
    });
  });

  describe('Course Generation', () => {
    it('should generate course with valid content', async () => {
      // Get the mocked create function
      const openai = await import('openai');
      const MockedOpenAI = vi.mocked(openai.default);
      const mockInstance = MockedOpenAI.mock.results[0]?.value || { chat: { completions: { create: vi.fn() } } };
      const mockCreate = mockInstance.chat.completions.create;
      
      mockCreate.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              title: 'Test Course',
              modules: [
                {
                  title: 'Module 1',
                  summary: 'Summary 1',
                  takeaways: ['Takeaway 1', 'Takeaway 2']
                },
                {
                  title: 'Module 2',
                  summary: 'Summary 2',
                  takeaways: ['Takeaway 3']
                },
                {
                  title: 'Module 3',
                  summary: 'Summary 3',
                  takeaways: ['Takeaway 4', 'Takeaway 5']
                },
                {
                  title: 'Module 4',
                  summary: 'Summary 4',
                  takeaways: ['Takeaway 6']
                },
                {
                  title: 'Module 5',
                  summary: 'Summary 5',
                  takeaways: ['Takeaway 7', 'Takeaway 8']
                }
              ]
            })
          }
        }]
      });

      const result = await generateCourseContent('Test content for course generation');

      expect(result).toEqual({
        title: 'Test Course',
        modules: expect.arrayContaining([
          expect.objectContaining({
            id: 'module-1',
            title: 'Module 1',
            summary: 'Summary 1',
            takeaways: ['Takeaway 1', 'Takeaway 2'],
            order: 1
          })
        ])
      });

      expect(result.modules).toHaveLength(5);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4-turbo-preview',
          temperature: 0.7,
          max_tokens: 2000,
          response_format: { type: 'json_object' }
        })
      );
    });

    it('should handle OpenAI rate limit error', async () => {
      const { APIError } = await import('openai');
      
      // Get the mocked create function
      const openai = await import('openai');
      const MockedOpenAI = vi.mocked(openai.default);
      const mockInstance = MockedOpenAI.mock.results[0]?.value || { chat: { completions: { create: vi.fn() } } };
      const mockCreate = mockInstance.chat.completions.create;
      
      mockCreate.mockRejectedValue(
        new APIError('Rate limit exceeded', 429)
      );

      await expect(generateCourseContent('Test content')).rejects.toThrow(OpenAIError);
      
      try {
        await generateCourseContent('Test content');
      } catch (error) {
        expect(error).toBeInstanceOf(OpenAIError);
        expect((error as OpenAIError).code).toBe('OPENAI_RATE_LIMIT');
        expect((error as OpenAIError).retryable).toBe(true);
      }
    });

    it('should handle invalid JSON response', async () => {
      // Get the mocked create function
      const openai = await import('openai');
      const MockedOpenAI = vi.mocked(openai.default);
      const mockInstance = MockedOpenAI.mock.results[0]?.value || { chat: { completions: { create: vi.fn() } } };
      const mockCreate = mockInstance.chat.completions.create;
      
      mockCreate.mockResolvedValue({
        choices: [{
          message: {
            content: 'Invalid JSON response'
          }
        }]
      });

      await expect(generateCourseContent('Test content')).rejects.toThrow(OpenAIError);
      
      try {
        await generateCourseContent('Test content');
      } catch (error) {
        expect(error).toBeInstanceOf(OpenAIError);
        expect((error as OpenAIError).code).toBe('PARSE_ERROR');
      }
    });

    it('should handle incorrect module count', async () => {
      // Get the mocked create function
      const openai = await import('openai');
      const MockedOpenAI = vi.mocked(openai.default);
      const mockInstance = MockedOpenAI.mock.results[0]?.value || { chat: { completions: { create: vi.fn() } } };
      const mockCreate = mockInstance.chat.completions.create;
      
      mockCreate.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              title: 'Test Course',
              modules: [
                { title: 'Module 1', summary: 'Summary 1', takeaways: ['Takeaway 1'] },
                { title: 'Module 2', summary: 'Summary 2', takeaways: ['Takeaway 2'] },
                { title: 'Module 3', summary: 'Summary 3', takeaways: ['Takeaway 3'] }
              ]
            })
          }
        }]
      });

      await expect(generateCourseContent('Test content')).rejects.toThrow(OpenAIError);
      
      try {
        await generateCourseContent('Test content');
      } catch (error) {
        expect(error).toBeInstanceOf(OpenAIError);
        expect((error as OpenAIError).code).toBe('INVALID_MODULE_COUNT');
      }
    });
  });
});

describe('Content Processing', () => {
  describe('Tweet URL Processing', () => {
    it('should identify valid tweet URLs', async () => {
      const validUrls = [
        'https://twitter.com/username/status/1234567890',
        'https://x.com/username/status/1234567890',
        'https://mobile.twitter.com/username/status/1234567890',
      ];

      for (const url of validUrls) {
        await expect(processContent(url)).rejects.toThrow(ContentProcessingError);
        
        try {
          await processContent(url);
        } catch (error) {
          expect(error).toBeInstanceOf(ContentProcessingError);
          expect((error as ContentProcessingError).code).toBe('TWEET_EXTRACTION_NOT_IMPLEMENTED');
        }
      }
    });

    it('should reject invalid URLs', async () => {
      const invalidUrls = [
        'https://facebook.com/post/123',
        'https://instagram.com/p/abc123',
        'https://twitter.com/invalid-format',
        'not-a-url-at-all',
      ];

      for (const url of invalidUrls) {
        const result = await processContent(url);
        expect(result.type).toBe('text');
      }
    });
  });

  describe('Manual Text Processing', () => {
    it('should process valid text content', async () => {
      const validText = 'This is a valid piece of content that is long enough to be processed.';
      
      const result = await processContent(validText);
      
      expect(result).toEqual({
        content: validText,
        type: 'text'
      });
    });

    it('should reject empty content', async () => {
      await expect(processContent('')).rejects.toThrow(ContentProcessingError);
      await expect(processContent('   ')).rejects.toThrow(ContentProcessingError);
    });

    it('should reject content that is too short', async () => {
      await expect(processContent('short')).rejects.toThrow(ContentProcessingError);
      
      try {
        await processContent('short');
      } catch (error) {
        expect(error).toBeInstanceOf(ContentProcessingError);
        expect((error as ContentProcessingError).code).toBe('CONTENT_TOO_SHORT');
      }
    });

    it('should reject content that is too long', async () => {
      const longContent = 'a'.repeat(10001);
      
      await expect(processContent(longContent)).rejects.toThrow(ContentProcessingError);
      
      try {
        await processContent(longContent);
      } catch (error) {
        expect(error).toBeInstanceOf(ContentProcessingError);
        expect((error as ContentProcessingError).code).toBe('CONTENT_TOO_LONG');
      }
    });
  });
});

describe('Error Handling', () => {
  it('should create proper error responses', () => {
    const errorResponse = createErrorResponse('INVALID_URL', 'Custom message');
    
    expect(errorResponse).toEqual({
      success: false,
      error: {
        code: 'INVALID_URL',
        message: 'Custom message',
        retryable: false,
        details: undefined
      }
    });
  });

  it('should use default message when no custom message provided', () => {
    const errorResponse = createErrorResponse('RATE_LIMIT_EXCEEDED');
    
    expect(errorResponse.error.message).toBe(ERROR_CODES.RATE_LIMIT_EXCEEDED.message);
    expect(errorResponse.error.retryable).toBe(ERROR_CODES.RATE_LIMIT_EXCEEDED.retryable);
  });

  it('should include details when provided', () => {
    const details = { userId: 'test-123', timestamp: '2024-01-01' };
    const errorResponse = createErrorResponse('DATABASE_ERROR', undefined, details);
    
    expect(errorResponse.error.details).toEqual(details);
  });
});