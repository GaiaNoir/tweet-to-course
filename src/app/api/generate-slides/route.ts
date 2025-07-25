import { NextRequest, NextResponse } from 'next/server';
import SlideGenerator, { SlideOptions, SlideTheme } from '@/lib/slide-generator';
import { createClient } from '@/lib/supabase';
import { database } from '@/lib/database';
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
    const { courseId, theme = 'light', includeBranding = true, includeQuiz = false, includeCTA = true, customBranding } = body;

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: 'Course ID is required' },
        { status: 400 }
      );
    }

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
      includeBranding,
      includeQuiz,
      includeCTA,
      customBranding,
    };

    // Generate slides
    const slideGenerator = new SlideGenerator();
    const slideContent = await slideGenerator.generateSlides(courseData, slideOptions);

    // Log usage
    await database.from('usage_logs').insert({
      user_id: userId,
      action: 'generate_slides',
      metadata: {
        courseId,
        theme,
        slideCount: slideContent.slides.length,
      },
    });

    return NextResponse.json({
      success: true,
      slides: {
        markdown: slideContent.markdown,
        html: slideContent.html,
        slideCount: slideContent.slides.length,
        theme: selectedTheme,
      },
    });

  } catch (error) {
    console.error('Slide generation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate slides',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}