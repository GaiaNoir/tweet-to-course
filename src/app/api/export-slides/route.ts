import { NextRequest, NextResponse } from 'next/server';
import SlideGenerator, { SlideOptions, SlideTheme } from '@/lib/slide-generator';
import { createClient } from '@/lib/supabase';
import { UserService, CourseService, UsageService } from '@/lib/database';
import { Course } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    
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
    const dbUser = await UserService.getUserByAuthId(userId);
    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const isPaidUser = dbUser.subscription_tier === 'pro' || dbUser.subscription_tier === 'lifetime';

    // Get course data from database
    const course = await CourseService.getCourseById(courseId);
    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if user owns the course
    const userCourses = await CourseService.getUserCourses(dbUser.id);
    const userOwnsCourse = userCourses.some(c => c.id === courseId);
    
    if (!userOwnsCourse) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Convert database course to Course type
    const courseData: Course = {
      id: course.id,
      title: course.title,
      description: course.description || 'Transform your knowledge into actionable insights',
      modules: Array.isArray(course.modules) ? course.modules : [],
      metadata: {
        sourceType: 'manual' as const,
        sourceUrl: undefined,
        originalContent: course.original_content,
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
      await UsageService.logAction({
        user_id: dbUser.id,
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
      await UsageService.logAction({
        user_id: dbUser.id,
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