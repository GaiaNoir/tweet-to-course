import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';
import { createClient } from '@/lib/supabase';
import { contentProcessor } from '@/lib/content-processor';
import { openai } from '@/lib/openai';
import { exportSystem, ExportOptions } from '@/lib/export-system';
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
    const { content, type, exportOptions } = body;

    if (!content || !type) {
      return NextResponse.json(
        { success: false, error: 'Content and type are required' },
        { status: 400 }
      );
    }

    // Check user's subscription and usage limits
    const userData = await database.getUser(userId);
    if (!userData) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // For free users, limit to 1 generation
    if (userData.subscription_tier === 'free' && userData.usage_count >= 1) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Free tier limit reached. Please upgrade to continue.',
          upgradeRequired: true 
        },
        { status: 403 }
      );
    }

    // Process the content
    const processedContent = await contentProcessor.processContent(content, type);
    
    if (!processedContent.success || !processedContent.content) {
      return NextResponse.json(
        { success: false, error: processedContent.error || 'Failed to process content' },
        { status: 400 }
      );
    }

    // Generate the course using OpenAI
    const courseResult = await generateCourseWithAI(processedContent.content);
    
    if (!courseResult.success || !courseResult.course) {
      return NextResponse.json(
        { success: false, error: courseResult.error || 'Failed to generate course' },
        { status: 500 }
      );
    }

    // Save the course to database
    const savedCourse = await database.saveCourse(userId, courseResult.course, processedContent.content);
    
    if (!savedCourse) {
      return NextResponse.json(
        { success: false, error: 'Failed to save course' },
        { status: 500 }
      );
    }

    // Generate complete export package if requested
    let exportPackage = null;
    if (exportOptions) {
      try {
        const options: ExportOptions = {
          ...exportSystem.getDefaultExportOptions(),
          ...exportOptions
        };
        
        exportPackage = await exportSystem.generateCompletePackage(courseResult.course, options);
      } catch (error) {
        console.error('Export generation failed:', error);
        // Don't fail the entire request if export fails
        exportPackage = { error: 'Export generation failed, but course was created successfully' };
      }
    }

    // Update user usage count
    await database.incrementUsageCount(userId, 'generate');

    return NextResponse.json({
      success: true,
      course: courseResult.course,
      courseId: savedCourse.id,
      exportPackage,
      usageCount: userData.usage_count + 1,
      subscriptionTier: userData.subscription_tier
    });

  } catch (error) {
    console.error('Complete course generation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

async function generateCourseWithAI(content: string): Promise<{ success: boolean; course?: Course; error?: string }> {
  try {
    const prompt = `Analyze this content and create a comprehensive 5-module course structure. 
    Extract the core theme, identify the target audience, and break the content into logical learning segments.

    Content: ${content}

    Create a JSON response with this structure:
    {
      "title": "Engaging course title",
      "description": "Brief course description",
      "targetAudience": "Who this course is for",
      "learningObjectives": ["What students will achieve"],
      "modules": [
        {
          "id": "module-1",
          "title": "Module title",
          "summary": "What this module covers (2-3 sentences)",
          "takeaways": ["3 specific actionable takeaways"],
          "order": 1,
          "estimatedReadTime": 15
        }
      ]
    }

    Requirements:
    - Exactly 5 modules
    - Each module should have 3 actionable takeaways
    - Focus on practical, implementable advice
    - Ensure logical progression from basic to advanced concepts
    - Make it valuable for the target audience`;

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are an expert course creator and instructional designer. Create comprehensive, valuable courses that provide real transformation for students."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const content_response = response.choices[0]?.message?.content;
    if (!content_response) {
      return { success: false, error: 'No response from AI' };
    }

    const courseData = JSON.parse(content_response);
    
    // Validate the structure
    if (!courseData.title || !courseData.modules || courseData.modules.length !== 5) {
      return { success: false, error: 'Invalid course structure generated' };
    }

    const course: Course = {
      id: `course-${Date.now()}`,
      title: courseData.title,
      description: courseData.description,
      modules: courseData.modules,
      metadata: {
        sourceType: 'thread',
        generatedAt: new Date().toISOString(),
        version: 1,
        targetAudience: courseData.targetAudience,
        learningObjectives: courseData.learningObjectives
      }
    };

    return { success: true, course };

  } catch (error) {
    console.error('AI course generation error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to generate course with AI' 
    };
  }
}