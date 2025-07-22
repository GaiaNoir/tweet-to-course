import { NextRequest, NextResponse } from 'next/server';
import { generateMarketingAssets } from '@/lib/marketing-assets-generator';
import { sanitizeError, logError } from '@/lib/error-handler';

export async function POST(request: NextRequest) {
  let courseTitle: string | undefined;
  let originalTweet: string | undefined;
  let courseContent: string | undefined;
  let targetAudience: string | undefined;
  
  try {
    const requestData = await request.json();
    ({ courseTitle, courseContent, originalTweet, targetAudience } = requestData);

    if (!courseTitle || !courseContent || !originalTweet) {
      return NextResponse.json(
        { 
          success: false,
          error: {
            code: 'MISSING_CONTENT',
            message: 'Missing required fields: courseTitle, courseContent, and originalTweet are required',
            retryable: false
          }
        },
        { status: 400 }
      );
    }

    const marketingAssets = await generateMarketingAssets(
      courseTitle,
      courseContent,
      originalTweet,
      targetAudience
    );

    return NextResponse.json({ 
      success: true,
      marketingAssets 
    });
  } catch (error) {
    logError(error as Error, { 
      endpoint: 'generate-marketing-assets',
      courseTitle,
      hasOriginalTweet: !!originalTweet 
    });
    
    const sanitizedError = sanitizeError(error);
    return NextResponse.json(sanitizedError, { status: 500 });
  }
}