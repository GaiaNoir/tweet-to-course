// Twitter/X scraper utility using Puppeteer
import puppeteer from 'puppeteer';

export interface ScrapedTweet {
  text: string;
  author: string;
  timestamp?: string;
  metrics?: {
    likes?: number;
    retweets?: number;
    replies?: number;
  };
}

export class TwitterScraperError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'TwitterScraperError';
  }
}

// Convert Twitter URL to nitter URL for easier scraping
function convertToNitterUrl(twitterUrl: string): string {
  return twitterUrl
    .replace('twitter.com', 'nitter.net')
    .replace('x.com', 'nitter.net')
    .replace('mobile.twitter.com', 'nitter.net');
}

// Scrape tweet content using Puppeteer
export async function scrapeTweet(url: string): Promise<ScrapedTweet> {
  let browser;
  
  try {
    // Configure browser launch options based on environment
    const isProduction = process.env.NODE_ENV === 'production';
    const isVercel = process.env.VERCEL === '1';
    
    const launchOptions: any = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    };

    // Additional configuration for Vercel/serverless environments
    if (isProduction || isVercel) {
      launchOptions.args.push(
        '--single-process',
        '--no-zygote',
        '--memory-pressure-off'
      );
      launchOptions.timeout = 30000; // 30 second timeout
    }

    // Launch browser with minimal configuration for better performance
    browser = await puppeteer.launch(launchOptions);

    const page = await browser.newPage();
    
    // Set user agent to avoid detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 720 });

    // Try multiple approaches for scraping
    let scrapedTweet: ScrapedTweet | null = null;

    // Approach 1: Try Nitter (more reliable)
    try {
      const nitterUrl = convertToNitterUrl(url);
      await page.goto(nitterUrl, { waitUntil: 'networkidle2', timeout: 15000 });
      
      scrapedTweet = await scrapeFromNitter(page);
      if (scrapedTweet) {
        return scrapedTweet;
      }
    } catch (error) {
      console.log('Nitter scraping failed, trying direct Twitter scraping:', error);
    }

    // Approach 2: Try direct Twitter scraping
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
      
      scrapedTweet = await scrapeFromTwitter(page);
      if (scrapedTweet) {
        return scrapedTweet;
      }
    } catch (error) {
      console.log('Direct Twitter scraping failed:', error);
    }

    throw new TwitterScraperError(
      'Unable to extract tweet content. The tweet may be private, deleted, or protected.',
      'SCRAPING_FAILED',
      true
    );

  } catch (error) {
    if (error instanceof TwitterScraperError) {
      throw error;
    }
    
    if (error.message.includes('timeout')) {
      throw new TwitterScraperError(
        'Request timed out. Please try again.',
        'TIMEOUT_ERROR',
        true
      );
    }
    
    throw new TwitterScraperError(
      'Failed to scrape tweet content. Please try copying the text manually.',
      'UNKNOWN_ERROR',
      true
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Scrape from Nitter (alternative Twitter frontend)
async function scrapeFromNitter(page: any): Promise<ScrapedTweet | null> {
  try {
    // Wait for tweet content to load
    await page.waitForSelector('.tweet-content', { timeout: 10000 });
    
    // Extract tweet text
    const tweetText = await page.evaluate(() => {
      const contentElement = document.querySelector('.tweet-content');
      return contentElement ? contentElement.textContent?.trim() : null;
    });

    // Extract author
    const author = await page.evaluate(() => {
      const authorElement = document.querySelector('.fullname');
      return authorElement ? authorElement.textContent?.trim() : 'Unknown';
    });

    // Extract timestamp
    const timestamp = await page.evaluate(() => {
      const timeElement = document.querySelector('.tweet-date a');
      return timeElement ? timeElement.getAttribute('title') : undefined;
    });

    if (!tweetText) {
      return null;
    }

    return {
      text: tweetText,
      author,
      timestamp
    };
  } catch (error) {
    console.log('Nitter scraping error:', error);
    return null;
  }
}

// Scrape from direct Twitter
async function scrapeFromTwitter(page: any): Promise<ScrapedTweet | null> {
  try {
    // Wait for tweet content to load (Twitter uses dynamic loading)
    await page.waitForSelector('[data-testid="tweetText"]', { timeout: 10000 });
    
    // Extract tweet text
    const tweetText = await page.evaluate(() => {
      const tweetElements = document.querySelectorAll('[data-testid="tweetText"]');
      if (tweetElements.length > 0) {
        return tweetElements[0].textContent?.trim();
      }
      
      // Fallback selectors
      const fallbackSelectors = [
        '.tweet-text',
        '.TweetTextSize',
        '[lang]'
      ];
      
      for (const selector of fallbackSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent) {
          return element.textContent.trim();
        }
      }
      
      return null;
    });

    // Extract author
    const author = await page.evaluate(() => {
      const authorSelectors = [
        '[data-testid="User-Name"]',
        '.username',
        '.fullname'
      ];
      
      for (const selector of authorSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent) {
          return element.textContent.trim();
        }
      }
      
      return 'Unknown';
    });

    if (!tweetText) {
      return null;
    }

    return {
      text: tweetText,
      author
    };
  } catch (error) {
    console.log('Twitter scraping error:', error);
    return null;
  }
}

// Fallback: Simple fetch-based scraping (less reliable but faster)
export async function scrapeTweetSimple(url: string): Promise<ScrapedTweet> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 429) {
        throw new TwitterScraperError(
          'Rate limited by Twitter. Please try again later.',
          'RATE_LIMITED',
          true
        );
      }
      if (response.status === 404) {
        throw new TwitterScraperError(
          'Tweet not found. It may have been deleted or the account is private.',
          'TWEET_NOT_FOUND',
          false
        );
      }
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    
    // Multiple extraction strategies
    const extractionStrategies = [
      // Strategy 1: Open Graph meta tags
      {
        textPattern: /<meta property="og:description" content="([^"]+)"/,
        authorPattern: /<meta property="og:title" content="([^"]+)"/
      },
      // Strategy 2: Twitter meta tags
      {
        textPattern: /<meta name="twitter:description" content="([^"]+)"/,
        authorPattern: /<meta name="twitter:title" content="([^"]+)"/
      },
      // Strategy 3: JSON-LD structured data
      {
        textPattern: /"text":"([^"]+)"/,
        authorPattern: /"name":"([^"]+)"/
      }
    ];

    let tweetText = '';
    let author = 'Unknown';

    for (const strategy of extractionStrategies) {
      const textMatch = html.match(strategy.textPattern);
      const authorMatch = html.match(strategy.authorPattern);
      
      if (textMatch) {
        tweetText = textMatch[1]
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&#39;/g, "'")
          .replace(/&nbsp;/g, ' ');
        
        if (authorMatch) {
          author = authorMatch[1].split(' on X')[0].split(' on Twitter')[0];
        }
        break;
      }
    }
    
    if (!tweetText) {
      throw new TwitterScraperError(
        'Could not extract tweet text. The tweet may be protected or deleted.',
        'EXTRACTION_FAILED',
        true
      );
    }

    // Validate extracted content
    if (tweetText.length < 5) {
      throw new TwitterScraperError(
        'Extracted tweet content is too short. Please try copying the text manually.',
        'INSUFFICIENT_CONTENT',
        true
      );
    }

    return {
      text: tweetText,
      author: author || 'Unknown'
    };

  } catch (error) {
    if (error instanceof TwitterScraperError) {
      throw error;
    }
    
    if (error.name === 'AbortError') {
      throw new TwitterScraperError(
        'Request timed out. Please try again.',
        'TIMEOUT_ERROR',
        true
      );
    }
    
    throw new TwitterScraperError(
      'Simple scraping failed. Please try copying the text manually.',
      'SIMPLE_SCRAPING_FAILED',
      true
    );
  }
}

// Clean and format scraped tweet text
export function cleanTweetText(text: string): string {
  return text
    .replace(/https?:\/\/[^\s]+/g, '') // Remove URLs
    .replace(/#\w+/g, '') // Remove hashtags (optional)
    .replace(/@\w+/g, '') // Remove mentions (optional)
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}