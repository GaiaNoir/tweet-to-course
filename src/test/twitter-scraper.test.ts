import { describe, it, expect, vi } from 'vitest';
import { scrapeTweetSimple, cleanTweetText, TwitterScraperError } from '../lib/twitter-scraper';

// Mock fetch for testing
global.fetch = vi.fn();

describe('Twitter Scraper', () => {
  describe('scrapeTweetSimple', () => {
    it('should extract tweet content from HTML', async () => {
      const mockHtml = `
        <html>
          <head>
            <meta property="og:description" content="This is a test tweet content with some insights!" />
            <meta property="og:title" content="John Doe on X" />
          </head>
        </html>
      `;

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockHtml)
      });

      const result = await scrapeTweetSimple('https://twitter.com/johndoe/status/123456789');
      
      expect(result.text).toBe('This is a test tweet content with some insights!');
      expect(result.author).toBe('John Doe');
    });

    it('should handle HTML entities correctly', async () => {
      const mockHtml = `
        <html>
          <head>
            <meta property="og:description" content="Test &quot;quoted&quot; text &amp; symbols" />
            <meta property="og:title" content="Jane Smith on X" />
          </head>
        </html>
      `;

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockHtml)
      });

      const result = await scrapeTweetSimple('https://twitter.com/janesmith/status/987654321');
      
      expect(result.text).toBe('Test "quoted" text & symbols');
      expect(result.author).toBe('Jane Smith');
    });

    it('should throw error when tweet content is not found', async () => {
      const mockHtml = '<html><head></head><body>No tweet content</body></html>';

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockHtml)
      });

      await expect(scrapeTweetSimple('https://twitter.com/test/status/123'))
        .rejects
        .toThrow(TwitterScraperError);
    });

    it('should handle HTTP errors', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      await expect(scrapeTweetSimple('https://twitter.com/test/status/123'))
        .rejects
        .toThrow(TwitterScraperError);
    });
  });

  describe('cleanTweetText', () => {
    it('should remove URLs from tweet text', () => {
      const text = 'Check out this amazing article https://example.com/article and let me know what you think!';
      const cleaned = cleanTweetText(text);
      expect(cleaned).toBe('Check out this amazing article  and let me know what you think!');
    });

    it('should remove hashtags and mentions', () => {
      const text = 'Great insights from @johndoe about #productivity and #success!';
      const cleaned = cleanTweetText(text);
      expect(cleaned).toBe('Great insights from  about  and !');
    });

    it('should normalize whitespace', () => {
      const text = 'This   has    multiple     spaces\n\nand\tlines';
      const cleaned = cleanTweetText(text);
      expect(cleaned).toBe('This has multiple spaces and lines');
    });

    it('should handle empty or whitespace-only text', () => {
      expect(cleanTweetText('')).toBe('');
      expect(cleanTweetText('   \n\t   ')).toBe('');
    });

    it('should preserve basic punctuation and structure', () => {
      const text = 'Here are 3 key points: 1) First point, 2) Second point, 3) Third point!';
      const cleaned = cleanTweetText(text);
      expect(cleaned).toBe('Here are 3 key points: 1) First point, 2) Second point, 3) Third point!');
    });
  });

  describe('TwitterScraperError', () => {
    it('should create error with correct properties', () => {
      const error = new TwitterScraperError('Test message', 'TEST_CODE', true);
      
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('TEST_CODE');
      expect(error.retryable).toBe(true);
      expect(error.name).toBe('TwitterScraperError');
    });

    it('should default retryable to false', () => {
      const error = new TwitterScraperError('Test message', 'TEST_CODE');
      expect(error.retryable).toBe(false);
    });
  });
});