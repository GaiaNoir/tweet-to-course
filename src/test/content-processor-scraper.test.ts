import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processContent, ContentProcessingError } from '../lib/content-processor';

// Mock the twitter-scraper module
vi.mock('../lib/twitter-scraper', () => ({
  scrapeTweetSimple: vi.fn(),
  scrapeTweet: vi.fn(),
  cleanTweetText: vi.fn(),
  TwitterScraperError: class TwitterScraperError extends Error {
    constructor(message: string, public code: string, public retryable: boolean = false) {
      super(message);
      this.name = 'TwitterScraperError';
    }
  }
}));

import { scrapeTweetSimple, scrapeTweet, cleanTweetText, TwitterScraperError } from '../lib/twitter-scraper';

describe('Content Processor with Scraper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('processContent with Twitter URLs', () => {
    it('should successfully process a Twitter URL using simple scraping', async () => {
      const mockScrapedTweet = {
        text: 'This is a great insight about productivity and success!',
        author: 'John Doe'
      };

      (scrapeTweetSimple as any).mockResolvedValueOnce(mockScrapedTweet);
      (cleanTweetText as any).mockReturnValueOnce('This is a great insight about productivity and success!');

      const result = await processContent('https://twitter.com/johndoe/status/123456789');

      expect(result.type).toBe('url');
      expect(result.content).toBe('This is a great insight about productivity and success!');
      expect(result.metadata?.tweetId).toBe('123456789');
      expect(result.metadata?.username).toBe('John Doe');
      expect(result.metadata?.originalUrl).toBe('https://twitter.com/johndoe/status/123456789');
    });

    it('should fallback to full scraping when simple scraping fails', async () => {
      const mockScrapedTweet = {
        text: 'This content was scraped with full scraping!',
        author: 'Jane Smith'
      };

      (scrapeTweetSimple as any).mockRejectedValueOnce(new Error('Simple scraping failed'));
      (scrapeTweet as any).mockResolvedValueOnce(mockScrapedTweet);
      (cleanTweetText as any).mockReturnValueOnce('This content was scraped with full scraping!');

      const result = await processContent('https://x.com/janesmith/status/987654321');

      expect(result.type).toBe('url');
      expect(result.content).toBe('This content was scraped with full scraping!');
      expect(result.metadata?.username).toBe('Jane Smith');
      expect(scrapeTweetSimple).toHaveBeenCalledFirst();
      expect(scrapeTweet).toHaveBeenCalledWith('https://x.com/janesmith/status/987654321');
    });

    it('should handle insufficient content after cleaning', async () => {
      const mockScrapedTweet = {
        text: 'Short',
        author: 'Test User'
      };

      (scrapeTweetSimple as any).mockResolvedValueOnce(mockScrapedTweet);
      (cleanTweetText as any).mockReturnValueOnce('Short'); // Too short after cleaning

      await expect(processContent('https://twitter.com/test/status/123'))
        .rejects
        .toThrow(ContentProcessingError);
    });

    it('should handle scraper errors correctly', async () => {
      const scraperError = new TwitterScraperError(
        'Tweet not found or private',
        'TWEET_NOT_FOUND',
        true
      );

      (scrapeTweetSimple as any).mockRejectedValueOnce(scraperError);
      (scrapeTweet as any).mockRejectedValueOnce(scraperError);

      await expect(processContent('https://twitter.com/private/status/123'))
        .rejects
        .toThrow(ContentProcessingError);
    });

    it('should handle unexpected errors gracefully', async () => {
      (scrapeTweetSimple as any).mockRejectedValueOnce(new Error('Network error'));
      (scrapeTweet as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(processContent('https://twitter.com/test/status/123'))
        .rejects
        .toThrow(ContentProcessingError);
    });

    it('should work with different Twitter URL formats', async () => {
      const mockScrapedTweet = {
        text: 'Content from mobile Twitter',
        author: 'Mobile User'
      };

      (scrapeTweetSimple as any).mockResolvedValueOnce(mockScrapedTweet);
      (cleanTweetText as any).mockReturnValueOnce('Content from mobile Twitter');

      const result = await processContent('https://mobile.twitter.com/mobileuser/status/555666777');

      expect(result.type).toBe('url');
      expect(result.content).toBe('Content from mobile Twitter');
      expect(result.metadata?.tweetId).toBe('555666777');
    });
  });

  describe('processContent with text input', () => {
    it('should still process regular text input normally', async () => {
      const textInput = 'This is regular text content that should be processed normally without any scraping.';

      const result = await processContent(textInput);

      expect(result.type).toBe('text');
      expect(result.content).toBe(textInput);
      expect(result.metadata).toBeUndefined();
      expect(scrapeTweetSimple).not.toHaveBeenCalled();
      expect(scrapeTweet).not.toHaveBeenCalled();
    });

    it('should reject mixed content (URL in text)', async () => {
      const mixedInput = 'Check out this tweet https://twitter.com/user/status/123 and let me know what you think!';

      await expect(processContent(mixedInput))
        .rejects
        .toThrow(ContentProcessingError);
    });
  });

  describe('URL validation', () => {
    it('should reject invalid Twitter URLs', async () => {
      await expect(processContent('https://facebook.com/post/123'))
        .rejects
        .toThrow(ContentProcessingError);
    });

    it('should reject malformed Twitter URLs', async () => {
      await expect(processContent('https://twitter.com/invalid-format'))
        .rejects
        .toThrow(ContentProcessingError);
    });
  });
});