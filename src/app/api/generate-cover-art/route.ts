import { NextRequest, NextResponse } from 'next/server';
import { generateCoverArt, downloadImageAsBase64, CoverArtOptions } from '@/lib/cover-art-generator';
import { OpenAIError } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseTitle, courseContent, style, count } = body;

    // Validate required fields
    if (!courseTitle || !courseContent) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_REQUIRED_FIELDS',
            message: 'Course title and content are required',
            retryable: false,
          },
        },
        { status: 400 }
      );
    }

    // Validate course title length
    if (courseTitle.length > 100) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TITLE_TOO_LONG',
            message: 'Course title must be 100 characters or less',
            retryable: false,
          },
        },
        { status: 400 }
      );
    }

    // Validate course content length
    if (courseContent.length > 2000) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONTENT_TOO_LONG',
            message: 'Course content must be 2000 characters or less for cover generation',
            retryable: false,
          },
        },
        { status: 400 }
      );
    }

    // Validate style if provided
    const validStyles = ['professional', 'playful', 'modern', 'minimalist'];
    if (style && !validStyles.includes(style)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STYLE',
            message: `Style must be one of: ${validStyles.join(', ')}`,
            retryable: false,
          },
        },
        { status: 400 }
      );
    }

    // Validate count if provided
    const imageCount = count ? Math.min(Math.max(parseInt(count), 1), 3) : 3;

    const options: CoverArtOptions = {
      courseTitle,
      courseContent,
      style,
      count: imageCount,
    };

    // Generate cover art
    const coverArt = await generateCoverArt(options);

    // Download images and convert to base64 for client-side handling
    const coverArtWithBase64 = await Promise.all(
      coverArt.map(async (art) => {
        try {
          const base64Data = await downloadImageAsBase64(art.url);
          return {
            ...art,
            base64Data,
          };
        } catch (error) {
          console.error('Failed to download image:', error);
          // Return the original URL if base64 conversion fails
          return art;
        }
      })
    );

    return NextResponse.json({
      success: true,
      coverArt: coverArtWithBase64,
      metadata: {
        style: options.style,
        count: coverArt.length,
        generatedAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Cover art generation error:', error);

    if (error instanceof OpenAIError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            retryable: error.retryable,
          },
        },
        { status: error.retryable ? 429 : 400 }
      );
    }

    // Handle unexpected errors
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred while generating cover art',
          retryable: true,
        },
      },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'GET method not supported for cover art generation',
        retryable: false,
      },
    },
    { status: 405 }
  );
}