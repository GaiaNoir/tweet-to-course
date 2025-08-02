import { NextRequest, NextResponse } from 'next/server';
import { authUtils, userProfile } from '@/lib/auth';
import type { Course } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const userId = await authUtils.getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile to check subscription
    const profile = await userProfile.getProfile(userId);
    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Check if user has Pro subscription for markdown export
    if (profile.subscription_status === 'free') {
      return NextResponse.json({ 
        error: 'Pro subscription required for markdown export' 
      }, { status: 403 });
    }

    const { courseData } = await request.json();
    
    if (!courseData || !courseData.title) {
      return NextResponse.json({ error: 'Invalid course data' }, { status: 400 });
    }

    // Convert course to markdown
    const markdown = convertCourseToMarkdown(courseData);
    
    // Return markdown content with proper headers for download
    return new NextResponse(markdown, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': `attachment; filename="${sanitizeFilename(courseData.title)}.md"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Markdown export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function convertCourseToMarkdown(course: Course): string {
  const lines: string[] = [];
  
  // Course title
  lines.push(`# ${course.title}`);
  lines.push('');
  
  // Course metadata
  if (course.metadata?.originalContent) {
    lines.push('## Original Content');
    lines.push('');
    lines.push(`> ${course.metadata.originalContent}`);
    lines.push('');
  }
  
  // Course overview (if available from first module)
  if (course.modules && course.modules.length > 0) {
    const firstModule = course.modules[0];
    if (firstModule.content) {
      const overviewMatch = firstModule.content.match(/## Course Overview\s*([\s\S]*?)(?=\n## |$)/);
      if (overviewMatch) {
        lines.push('## Course Overview');
        lines.push('');
        lines.push(overviewMatch[1].trim());
        lines.push('');
      }
      
      const learningOutcomesMatch = firstModule.content.match(/## Learning Outcomes\s*([\s\S]*?)(?=\n## |$)/);
      if (learningOutcomesMatch) {
        lines.push('## Learning Outcomes');
        lines.push('');
        lines.push(learningOutcomesMatch[1].trim());
        lines.push('');
      }
    }
  }
  
  // Table of Contents
  lines.push('## Table of Contents');
  lines.push('');
  course.modules?.forEach((module, index) => {
    lines.push(`${index + 1}. [${module.title}](#module-${index + 1}-${sanitizeAnchor(module.title)})`);
  });
  lines.push('');
  
  // Course modules
  course.modules?.forEach((module, index) => {
    lines.push(`## Module ${index + 1}: ${module.title}`);
    lines.push('');
    
    if (module.summary) {
      lines.push('### Summary');
      lines.push('');
      lines.push(module.summary);
      lines.push('');
    }
    
    if (module.content) {
      lines.push('### Content');
      lines.push('');
      // Clean up the content to remove redundant headers
      const cleanContent = module.content
        .replace(/^# .*$/gm, '') // Remove H1 headers
        .replace(/^## Course Overview[\s\S]*?(?=\n## [^C]|$)/gm, '') // Remove course overview section
        .replace(/^## Learning Outcomes[\s\S]*?(?=\n## [^L]|$)/gm, '') // Remove learning outcomes section
        .trim();
      
      lines.push(cleanContent);
      lines.push('');
    }
    
    if (module.takeaways && module.takeaways.length > 0) {
      lines.push('### Key Takeaways');
      lines.push('');
      module.takeaways.forEach((takeaway, takeawayIndex) => {
        lines.push(`${takeawayIndex + 1}. ${takeaway}`);
      });
      lines.push('');
    }
    
    if (module.estimatedReadTime) {
      lines.push(`**Estimated Reading Time:** ${module.estimatedReadTime} minutes`);
      lines.push('');
    }
    
    lines.push('---');
    lines.push('');
  });
  
  // Footer
  lines.push('## Course Information');
  lines.push('');
  lines.push(`- **Total Modules:** ${course.modules?.length || 0}`);
  lines.push(`- **Total Reading Time:** ${course.modules?.reduce((total, module) => total + (module.estimatedReadTime || 5), 0)} minutes`);
  if (course.metadata?.generatedAt) {
    lines.push(`- **Generated:** ${new Date(course.metadata.generatedAt).toLocaleDateString()}`);
  }
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('*Generated with TweetToCourse - Transform tweets into comprehensive courses*');
  
  return lines.join('\n');
}

function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9\s\-_]/gi, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .toLowerCase()
    .substring(0, 50); // Limit length
}

function sanitizeAnchor(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s\-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}
