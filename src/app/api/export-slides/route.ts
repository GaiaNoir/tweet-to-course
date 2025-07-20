import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import SlideGenerator, { SlideOptions, SlideTheme } from '@/lib/slide-generator';
import { database } from '@/lib/database';
import { Course } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      courseId, 
      format = 'pdf',
      theme = 'light', 
      includeBranding = true, 
      includeQuiz = false, 
      includeCTA = true, 
      customBranding 
    } = body;

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: 'Course ID is required' },
        { status: 400 }
      );
    }

    // Validate format
    if (!['pdf', 'ppt'].includes(format)) {
      return NextResponse.json(
        { success: false, error: 'Invalid export format. Use "pdf" or "ppt"' },
        { status: 400 }
      );
    }

    // Get user subscription to check permissions
    const { data: user } = await database
      .from('users')
      .select('subscription_tier')
      .eq('clerk_user_id', userId)
      .single();

    const isPaidUser = user?.subscription_tier === 'pro' || user?.subscription_tier === 'lifetime';

    // Get course data from database
    const { data: course, error: courseError } = await database
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .eq('user_id', userId)
      .single();

    if (courseError || !course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Convert database course to Course type
    const courseData: Course = {
      id: course.id,
      title: course.title,
      description: course.description,
      modules: course.modules as any,
      metadata: {
        sourceType: course.source_type as 'tweet' | 'thread' | 'manual',
        sourceUrl: course.source_url || undefined,
        generatedAt: course.created_at,
        version: 1,
      },
    };

    // Get theme configuration
    const themes = SlideGenerator.getThemes();
    const selectedTheme: SlideTheme = themes[theme] || themes.light;

    // Configure slide options
    const slideOptions: SlideOptions = {
      theme: selectedTheme,
      includeBranding: isPaidUser ? includeBranding : true, // Force branding for free users
      includeQuiz,
      includeCTA,
      customBranding: isPaidUser ? customBranding : undefined, // No custom branding for free users
    };

    // Generate slides
    const slideGenerator = new SlideGenerator();
    const slideContent = await slideGenerator.generateSlides(courseData, slideOptions);

    if (format === 'pdf') {
      // Export as PDF
      const pdfBuffer = await slideGenerator.exportToPDF(slideContent, slideOptions);
      
      // Log usage
      await database.from('usage_logs').insert({
        user_id: userId,
        action: 'export_slides_pdf',
        metadata: {
          courseId,
          theme,
          slideCount: slideContent.slides.length,
        },
      });

      // Return PDF as response
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${courseData.title.replace(/[^a-zA-Z0-9]/g, '_')}_slides.pdf"`,
        },
      });
    } else if (format === 'ppt') {
      // Export as PowerPoint
      const pptxBuffer = await slideGenerator.exportToPPTX(slideContent, slideOptions);
      
      // Log usage
      await database.from('usage_logs').insert({
        user_id: userId,
        action: 'export_slides_ppt',
        metadata: {
          courseId,
          theme,
          slideCount: slideContent.slides.length,
        },
      });

      // Return PPTX as response
      return new NextResponse(pptxBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'Content-Disposition': `attachment; filename="${courseData.title.replace(/[^a-zA-Z0-9]/g, '_')}_slides.pptx"`,
        },
      });
    }

  } catch (error) {
    console.error('Slide export error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to export slides',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}