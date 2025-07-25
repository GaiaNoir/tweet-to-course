import { NextRequest, NextResponse } from 'next/server';
import { UserService, CourseService, UsageService } from '@/lib/database';
import { createClient } from '@/lib/supabase';
import { canPerformAction } from '@/lib/subscription-utils';
import { createAdminClient } from '@/lib/supabase';

interface ExportNotionRequest {
  courseId?: string;
  courseData?: any;
  parentPageId?: string;
  exportType: 'direct' | 'markdown';
}

interface NotionBlock {
  object: 'block';
  type: string;
  [key: string]: any;
}

interface NotionExport {
  title: string;
  blocks: NotionBlock[];
  markdown: string;
}

interface NotionPageResult {
  success: boolean;
  pageId?: string;
  pageUrl?: string;
  error?: string;
}

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

    const body: ExportNotionRequest = await request.json();
    const { courseId, courseData, parentPageId, exportType = 'direct' } = body;

    if (!courseId && !courseData) {
      return NextResponse.json(
        { success: false, error: 'Course ID or course data is required' },
        { status: 400 }
      );
    }

    // Get user data and check permissions
    const dbUser = await UserService.getUserByAuthId(userId);
    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user can export to Notion (Pro/Lifetime only)
    if (!canPerformAction(dbUser.subscription_tier, dbUser.usage_count, 'export_notion')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Notion export is only available for Pro and Lifetime subscribers',
          upgradeRequired: true,
          availablePlans: ['pro', 'lifetime']
        },
        { status: 403 }
      );
    }

    // Get course data - either from database or directly from request
    let course;
    
    if (courseData) {
      // Use course data directly (for temporary/anonymous courses)
      course = courseData;
    } else if (courseId) {
      // Get course from database
      course = await CourseService.getCourseById(courseId);
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
    }

    if (exportType === 'direct') {
      // Check if user has Notion connected
      const adminClient = createAdminClient();
      const { data: integration, error: integrationError } = await adminClient
        .from('user_integrations')
        .select('access_token')
        .eq('user_id', dbUser.id)
        .eq('provider', 'notion')
        .single();

      if (integrationError || !integration) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Notion account not connected. Please connect your Notion account first.',
            requiresConnection: true
          },
          { status: 400 }
        );
      }

      // Create page directly in Notion
      const notionResult = await createNotionPage(
        integration.access_token,
        course,
        parentPageId
      );

      if (!notionResult.success) {
        return NextResponse.json(
          { 
            success: false, 
            error: notionResult.error || 'Failed to create Notion page'
          },
          { status: 500 }
        );
      }

      // Log the export action
      await UsageService.logAction({
        user_id: dbUser.id,
        action: 'export_notion',
        metadata: {
          course_id: courseId || 'temporary',
          course_title: course.title,
          notion_page_id: notionResult.pageId,
          export_type: 'direct',
          is_temporary_course: !courseId,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Course exported to Notion successfully!',
        pageUrl: notionResult.pageUrl,
        pageId: notionResult.pageId
      });

    } else {
      // Generate markdown for manual import
      const notionExport = generateNotionContent(course);

      // Log the export action
      await UsageService.logAction({
        user_id: dbUser.id,
        action: 'export_notion',
        metadata: {
          course_id: courseId || 'temporary',
          course_title: course.title,
          export_type: 'markdown',
          is_temporary_course: !courseId,
        },
      });

      const filename = `${course.title.replace(/[^a-zA-Z0-9]/g, '_')}_notion.md`;
      
      return new NextResponse(notionExport.markdown, {
        headers: {
          'Content-Type': 'text/markdown',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

  } catch (error) {
    console.error('Notion export error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to export to Notion',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function createNotionPage(
  accessToken: string,
  course: any,
  parentPageId?: string
): Promise<NotionPageResult> {
  try {
    const modules = Array.isArray(course.modules) ? course.modules : [];
    
    // Build the page content as Notion blocks
    const children: NotionBlock[] = [];

    // Course metadata
    const generatedDate = new Date().toLocaleDateString();
    children.push({
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [
          {
            type: 'text',
            text: { content: `Generated on: ${generatedDate}` },
            annotations: { italic: true }
          }
        ]
      }
    });

    // Course overview
    children.push({
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ type: 'text', text: { content: 'Course Overview' } }]
      }
    });

    if (modules.length > 0) {
      children.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: `This course contains ${modules.length} comprehensive modules designed to provide actionable insights and practical takeaways.`
              }
            }
          ]
        }
      });
    }

    // Table of contents
    children.push({
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ type: 'text', text: { content: 'Table of Contents' } }]
      }
    });

    modules.forEach((module: any, index: number) => {
      children.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            {
              type: 'text',
              text: { content: `Module ${index + 1}: ${module.title}` }
            }
          ]
        }
      });
    });

    // Modules content
    modules.forEach((module: any, index: number) => {
      // Module heading
      children.push({
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [
            {
              type: 'text',
              text: { content: `Module ${index + 1}: ${module.title}` }
            }
          ]
        }
      });

      // Module summary
      if (module.summary) {
        children.push({
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: { content: module.summary }
              }
            ]
          }
        });
      }

      // Key takeaways
      if (module.takeaways && Array.isArray(module.takeaways)) {
        children.push({
          object: 'block',
          type: 'heading_3',
          heading_3: {
            rich_text: [{ type: 'text', text: { content: 'Key Takeaways' } }]
          }
        });

        module.takeaways.forEach((takeaway: string) => {
          children.push({
            object: 'block',
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [
                {
                  type: 'text',
                  text: { content: takeaway }
                }
              ]
            }
          });
        });
      }

      // Add divider between modules (except for the last one)
      if (index < modules.length - 1) {
        children.push({
          object: 'block',
          type: 'divider',
          divider: {}
        });
      }
    });

    // Footer
    children.push({
      object: 'block',
      type: 'divider',
      divider: {}
    });

    children.push({
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [
          {
            type: 'text',
            text: { content: 'Generated by AI Course Alchemist - Transform your threads into sellable courses' },
            annotations: { italic: true }
          }
        ]
      }
    });

    // Create the page
    const pageData: any = {
      properties: {
        title: {
          title: [
            {
              type: 'text',
              text: { content: course.title }
            }
          ]
        }
      },
      children: children.slice(0, 100) // Notion has a limit of 100 blocks per request
    };

    // Set parent - either a specific page or the user's workspace
    if (parentPageId) {
      pageData.parent = { type: 'page_id', page_id: parentPageId };
    } else {
      pageData.parent = { type: 'workspace', workspace: true };
    }

    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify(pageData)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Notion API error:', errorData);
      return {
        success: false,
        error: `Notion API error: ${response.status} ${response.statusText}`
      };
    }

    const result = await response.json();

    // If we have more than 100 blocks, add them in subsequent requests
    if (children.length > 100) {
      const remainingBlocks = children.slice(100);
      const chunks = [];
      
      // Split remaining blocks into chunks of 100
      for (let i = 0; i < remainingBlocks.length; i += 100) {
        chunks.push(remainingBlocks.slice(i, i + 100));
      }

      // Add each chunk
      for (const chunk of chunks) {
        await fetch(`https://api.notion.com/v1/blocks/${result.id}/children`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28',
          },
          body: JSON.stringify({ children: chunk })
        });
      }
    }

    return {
      success: true,
      pageId: result.id,
      pageUrl: result.url
    };

  } catch (error) {
    console.error('Error creating Notion page:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

function generateNotionContent(course: any): NotionExport {
  const blocks: NotionBlock[] = [];
  let markdown = '';

  // Title
  blocks.push({
    type: 'heading_1',
    content: course.title
  });
  markdown += `# ${course.title}\n\n`;

  // Course metadata
  const generatedDate = new Date().toLocaleDateString();
  blocks.push({
    type: 'paragraph',
    content: `Generated on: ${generatedDate}`
  });
  markdown += `*Generated on: ${generatedDate}*\n\n`;

  // Course overview
  blocks.push({
    type: 'heading_2',
    content: 'Course Overview'
  });
  markdown += `## Course Overview\n\n`;

  const modules = Array.isArray(course.modules) ? course.modules : [];
  
  if (modules.length > 0) {
    blocks.push({
      type: 'paragraph',
      content: `This course contains ${modules.length} comprehensive modules designed to provide actionable insights and practical takeaways.`
    });
    markdown += `This course contains ${modules.length} comprehensive modules designed to provide actionable insights and practical takeaways.\n\n`;
  }

  // Table of contents
  blocks.push({
    type: 'heading_2',
    content: 'Table of Contents'
  });
  markdown += `## Table of Contents\n\n`;

  modules.forEach((module: any, index: number) => {
    blocks.push({
      type: 'bulleted_list_item',
      content: `Module ${index + 1}: ${module.title}`
    });
    markdown += `- Module ${index + 1}: ${module.title}\n`;
  });
  markdown += '\n';

  // Modules content
  modules.forEach((module: any, index: number) => {
    // Module heading
    blocks.push({
      type: 'heading_2',
      content: `Module ${index + 1}: ${module.title}`
    });
    markdown += `## Module ${index + 1}: ${module.title}\n\n`;

    // Module summary
    if (module.summary) {
      blocks.push({
        type: 'paragraph',
        content: module.summary
      });
      markdown += `${module.summary}\n\n`;
    }

    // Key takeaways
    if (module.takeaways && Array.isArray(module.takeaways)) {
      blocks.push({
        type: 'heading_3',
        content: 'Key Takeaways'
      });
      markdown += `### Key Takeaways\n\n`;

      module.takeaways.forEach((takeaway: string) => {
        blocks.push({
          type: 'bulleted_list_item',
          content: takeaway
        });
        markdown += `- ${takeaway}\n`;
      });
      markdown += '\n';
    }

    // Add divider between modules (except for the last one)
    if (index < modules.length - 1) {
      blocks.push({
        type: 'divider',
        content: ''
      });
      markdown += '---\n\n';
    }
  });

  // Footer
  blocks.push({
    type: 'divider',
    content: ''
  });
  blocks.push({
    type: 'paragraph',
    content: 'Generated by AI Course Alchemist - Transform your threads into sellable courses'
  });
  markdown += '---\n\n*Generated by AI Course Alchemist - Transform your threads into sellable courses*\n';

  return {
    title: course.title,
    blocks,
    markdown
  };
}

export async function GET() {
  return NextResponse.json(
    { success: false, error: 'GET method not supported' },
    { status: 405 }
  );
}