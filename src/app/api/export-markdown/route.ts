import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { Course } from '@/types';

interface ExportMarkdownRequest {
  courseId: string;
  courseData: Course;
}

/**
 * Export course content as Markdown format
 * This endpoint converts the course data into a clean, formatted Markdown document
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: ExportMarkdownRequest = await request.json();
    const { courseId, courseData } = body;

    // Validate required fields
    if (!courseData || !courseData.title || !courseData.modules) {
      return NextResponse.json(
        { error: 'Invalid course data provided' },
        { status: 400 }
      );
    }

    // Get user authentication
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check user subscription status for markdown export
    try {
      const { createAdminClient } = await import('@/lib/supabase');
      const adminSupabase = createAdminClient();
      
      const { data: userProfile, error: profileError } = await adminSupabase
        .from('users')
        .select('subscription_status')
        .eq('id', user.id)
        .single();

      if (profileError || !userProfile) {
        console.error('Failed to get user profile:', profileError);
        return NextResponse.json(
          { error: 'Failed to verify subscription status' },
          { status: 500 }
        );
      }

      // Check if user has Pro or Lifetime subscription
      const isProUser = userProfile.subscription_status === 'pro' || userProfile.subscription_status === 'lifetime';
      
      if (!isProUser) {
        return NextResponse.json(
          { 
            error: 'Markdown export is available for Pro users only. Please upgrade your subscription.',
            code: 'SUBSCRIPTION_REQUIRED'
          },
          { status: 403 }
        );
      }
    } catch (subscriptionError) {
      console.error('Subscription check failed:', subscriptionError);
      return NextResponse.json(
        { error: 'Failed to verify subscription status' },
        { status: 500 }
      );
    }

    // Generate Markdown content
    const markdownContent = generateMarkdownContent(courseData);

    // Log the export for usage tracking
    try {
      const { createAdminClient } = await import('@/lib/supabase');
      const adminSupabase = createAdminClient();
      
      await adminSupabase
        .from('usage_logs')
        .insert({
          user_id: user.id,
          action: 'export_markdown',
          metadata: {
            course_id: courseId,
            course_title: courseData.title,
            modules_count: courseData.modules.length,
            content_length: markdownContent.length,
          },
        });
    } catch (logError) {
      console.error('Failed to log markdown export:', logError);
      // Don't fail the export if logging fails
    }

    // Return the markdown content as plain text
    return new NextResponse(markdownContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${sanitizeFilename(courseData.title)}.md"`,
      },
    });

  } catch (error) {
    console.error('Markdown export error:', error);
    return NextResponse.json(
      { error: 'Failed to export markdown' },
      { status: 500 }
    );
  }
}

/**
 * Generate clean Markdown content from course data
 */
function generateMarkdownContent(course: Course): string {
  const lines: string[] = [];
  
  // Course title
  lines.push(`# ${course.title}`);
  lines.push('');
  
  // Course metadata
  if (course.metadata) {
    lines.push('---');
    lines.push('**Course Information**');
    lines.push('');
    lines.push(`- **Source**: ${course.metadata.sourceType || 'Unknown'}`);
    lines.push(`- **Generated**: ${new Date(course.metadata.generatedAt || Date.now()).toLocaleDateString()}`);
    lines.push(`- **Modules**: ${course.modules.length}`);
    lines.push(`- **Estimated Reading Time**: ${course.modules.reduce((total, module) => total + (module.estimatedReadTime || 8), 0)} minutes`);
    lines.push('---');
    lines.push('');
  }

  // Extract course overview from first module if available
  if (course.modules.length > 0) {
    const firstModuleContent = course.modules[0].summary;
    const overviewMatch = firstModuleContent.match(/^([\s\S]*?)(?=### 📖 Complete Module Content|$)/);
    
    if (overviewMatch && overviewMatch[1].trim()) {
      lines.push('## Course Overview');
      lines.push('');
      lines.push(cleanMarkdownContent(overviewMatch[1].trim()));
      lines.push('');
      lines.push('---');
      lines.push('');
    }
  }

  // Table of Contents
  lines.push('## Table of Contents');
  lines.push('');
  course.modules.forEach((module, index) => {
    lines.push(`${index + 1}. [${module.title}](#module-${index + 1}-${slugify(module.title)})`);
  });
  lines.push('');
  lines.push('---');
  lines.push('');

  // Course modules
  course.modules.forEach((module, index) => {
    // Module header
    lines.push(`## Module ${index + 1}: ${module.title}`);
    lines.push('');
    
    // Module metadata
    lines.push(`**Estimated Reading Time**: ${module.estimatedReadTime || 8} minutes`);
    if (module.takeaways && module.takeaways.length > 0) {
      lines.push(`**Key Takeaways**: ${module.takeaways.length}`);
    }
    lines.push('');
    
    // Module content
    const cleanContent = cleanMarkdownContent(module.summary);
    lines.push(cleanContent);
    lines.push('');
    
    // Key takeaways section
    if (module.takeaways && module.takeaways.length > 0) {
      lines.push('### 🎯 Key Takeaways');
      lines.push('');
      module.takeaways.forEach((takeaway, takeawayIndex) => {
        if (takeaway.includes(' - ')) {
          const [title, description] = takeaway.split(' - ');
          lines.push(`${takeawayIndex + 1}. **${title.trim()}** - ${description.trim()}`);
        } else {
          lines.push(`${takeawayIndex + 1}. ${takeaway}`);
        }
      });
      lines.push('');
    }
    
    // Module separator
    if (index < course.modules.length - 1) {
      lines.push('---');
      lines.push('');
    }
  });

  // Course footer
  lines.push('---');
  lines.push('');
  lines.push('## Course Summary');
  lines.push('');
  lines.push(`This course contains ${course.modules.length} modules with a total estimated reading time of ${course.modules.reduce((total, module) => total + (module.estimatedReadTime || 8), 0)} minutes.`);
  lines.push('');
  
  const totalTakeaways = course.modules.reduce((total, module) => total + (module.takeaways?.length || 0), 0);
  if (totalTakeaways > 0) {
    lines.push(`**Total Key Insights**: ${totalTakeaways} actionable takeaways`);
    lines.push('');
  }
  
  lines.push(`*Generated on ${new Date().toLocaleDateString()} using AI-powered course generation*`);

  return lines.join('\n');
}

/**
 * Clean and format markdown content
 */
function cleanMarkdownContent(content: string): string {
  return content
    // Remove duplicate headers
    .replace(/^#+\s*(.+)$/gm, (match, title) => {
      // Don't duplicate the main module title
      if (title.includes('Module') && title.includes(':')) {
        return '';
      }
      return match;
    })
    // Clean up extra whitespace
    .replace(/\n{3,}/g, '\n\n')
    // Ensure proper list formatting
    .replace(/^(\d+\.)\s*/gm, '$1 ')
    .replace(/^(-|\*)\s*/gm, '- ')
    // Clean up bold formatting
    .replace(/\*\*(.*?)\*\*/g, '**$1**')
    // Remove any UI-specific text that shouldn't be in markdown
    .replace(/Click to read full content.*$/gm, '')
    .replace(/⏱️.*?min read/g, '')
    .replace(/📝.*?Module.*?of.*?\d+/g, '')
    .replace(/📊.*?takeaways/g, '')
    .trim();
}

/**
 * Create URL-friendly slug from text
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Sanitize filename for download
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9\s\-_]/gi, '')
    .replace(/\s+/g, '_')
    .toLowerCase();
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'GET method not supported' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'PUT method not supported' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'DELETE method not supported' },
    { status: 405 }
  );
}