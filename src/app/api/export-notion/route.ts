import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, canPerformAction, incrementUsage } from '@/lib/auth';
import { hasNotionConnection, getNotionConnection, createNotionPage as createNotionPageIntegration } from '@/lib/notion-integration';

interface ExportNotionRequest {
  courseId?: string;
  courseData?: unknown;
  parentPageId?: string;
  exportType: 'direct' | 'markdown';
}

interface NotionBlock {
  object: 'block';
  type: string;
  [key: string]: unknown;
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
    const body: ExportNotionRequest = await request.json();
    const { courseId, courseData, parentPageId, exportType = 'markdown' } = body;

    if (!courseData) {
      return NextResponse.json(
        { success: false, error: 'Course data is required' },
        { status: 400 }
      );
    }

    // Get current user
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 401 }
      );
    }
    
    console.log('User for export:', { 
      id: user.id, 
      subscription_tier: user.subscriptionTier, 
      usage_count: user.usageCount 
    });

    // Check if user can export to Notion (Pro/Lifetime only)
    const canExport = canPerformAction('export_notion');
    console.log('Export permission check:', {
      subscription_tier: user.subscriptionTier,
      usage_count: user.usageCount,
      canExport,
      exportType
    });
    
    if (!canExport) {
      console.log('Export denied - user needs upgrade');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Notion export is only available for Pro and Lifetime subscribers',
          upgradeRequired: true,
          availablePlans: ['pro', 'lifetime'],
          currentTier: user.subscriptionTier
        },
        { status: 403 }
      );
    }

    // Use course data directly
    const course = courseData;

    if (exportType === 'direct') {
      // Check if user has Notion connected
      const userHasNotionConnection = hasNotionConnection();
      
      if (!userHasNotionConnection) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Notion account not connected. Please connect your Notion account first.',
            requiresConnection: true
          },
          { status: 400 }
        );
      }

      // Get user's Notion connection
      const notionConnection = getNotionConnection();
      if (!notionConnection) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Notion connection not found. Please reconnect your account.',
            requiresConnection: true
          },
          { status: 400 }
        );
      }
      
      // Create page directly in Notion
      const notionResult = await createNotionPage(
        notionConnection.accessToken,
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

      // Increment usage count
      try {
        incrementUsage();
      } catch (logError) {
        console.error('Failed to update usage count:', logError);
      }

      return NextResponse.json({
        success: true,
        message: 'Course exported to Notion successfully!',
        pageUrl: notionResult.pageUrl,
        pageId: notionResult.pageId
      });

    } else {
      // Generate markdown for manual import
      const notionExport = generateNotionContent(course);

      // Increment usage count
      try {
        incrementUsage();
      } catch (logError) {
        console.error('Failed to update usage count:', logError);
      }

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
  course: unknown,
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

    modules.forEach((module: unknown, index: number) => {
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
    modules.forEach((module: unknown, index: number) => {
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
    const pageData: unknown = {
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

function generateNotionContent(course: unknown): NotionExport {
  // For markdown export, we don't need proper Notion blocks, just generate markdown
  let markdown = '';

  // Title
  markdown += `# ${course.title}\n\n`;

  // Course metadata
  const generatedDate = new Date().toLocaleDateString();
  markdown += `*Generated on: ${generatedDate}*\n\n`;

  // Course overview
  markdown += `## Course Overview\n\n`;

  const modules = Array.isArray(course.modules) ? course.modules : [];
  
  if (modules.length > 0) {
    markdown += `This course contains ${modules.length} comprehensive modules designed to provide actionable insights and practical takeaways.\n\n`;
  }

  // Table of contents
  markdown += `## Table of Contents\n\n`;

  modules.forEach((module: unknown, index: number) => {
    markdown += `- Module ${index + 1}: ${(module as any).title}\n`;
  });
  markdown += '\n';

  // Modules content
  modules.forEach((module: unknown, index: number) => {
    // Module heading
    markdown += `## Module ${index + 1}: ${(module as any).title}\n\n`;

    // Module summary
    if (module.summary) {
      markdown += `${module.summary}\n\n`;
    }

    // Key takeaways
    if (module.takeaways && Array.isArray(module.takeaways)) {
      markdown += `### Key Takeaways\n\n`;

      module.takeaways.forEach((takeaway: string) => {
        markdown += `- ${takeaway}\n`;
      });
      markdown += '\n';
    }

    // Add divider between modules (except for the last one)
    if (index < modules.length - 1) {
      markdown += '---\n\n';
    }
  });

  // Footer
  markdown += '---\n\n*Generated by AI Course Alchemist - Transform your threads into sellable courses*\n';

  return {
    title: course.title,
    blocks: [], // Empty blocks array for markdown export
    markdown
  };
}

export async function GET() {
  return NextResponse.json(
    { success: false, error: 'GET method not supported' },
    { status: 405 }
  );
}