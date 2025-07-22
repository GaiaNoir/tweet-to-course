import { NextRequest, NextResponse } from 'next/server';
import { scrapeTweetSimple, cleanTweetText } from '@/lib/twitter-scraper';
import { isValidTweetUrl } from '@/lib/content-processor';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }

    if (!isValidTweetUrl(url)) {
      return NextResponse.json(
        { success: false, error: 'Invalid Twitter/X URL format' },
        { status: 400 }
      );
    }

    // Test simple scraping
    const scrapedTweet = await scrapeTweetSimple(url);
    const cleanedText = cleanTweetText(scrapedTweet.text);

    return NextResponse.json({
      success: true,
      data: {
        originalText: scrapedTweet.text,
        cleanedText,
        author: scrapedTweet.author,
        url
      }
    });

  } catch (error) {
    console.error('Scraper test error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message: 'POST a Twitter/X URL to test the scraper',
      example: {
        url: 'https://twitter.com/username/status/123456789'
      }
    }
  );
}