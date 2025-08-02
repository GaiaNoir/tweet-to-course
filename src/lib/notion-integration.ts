/**
 * Simple Notion Integration for Direct Export
 * This handles the OAuth flow and API calls to create pages in Notion
 */

// Temporary fallback for getCurrentUser until proper auth integration
function getCurrentUser() {
  // Return a mock user for now to prevent errors
  return { id: 'temp-user-id' };
}

export interface NotionConnection {
  accessToken: string;
  workspaceName: string;
  connectedAt: string;
}

// Simple storage for Notion connections (in production, use database)
const notionConnections = new Map<string, NotionConnection>();

/**
 * Check if user has Notion connected
 */
export function hasNotionConnection(): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  
  return notionConnections.has(user.id);
}

/**
 * Get user's Notion connection
 */
export function getNotionConnection(): NotionConnection | null {
  const user = getCurrentUser();
  if (!user) return null;
  
  return notionConnections.get(user.id) || null;
}

/**
 * Store Notion connection (simulate OAuth success)
 */
export function setNotionConnection(connection: NotionConnection): void {
  const user = getCurrentUser();
  if (!user) return;
  
  notionConnections.set(user.id, connection);
  
  // Also store in localStorage for persistence
  if (typeof window !== 'undefined') {
    localStorage.setItem(`notion-connection-${user.id}`, JSON.stringify(connection));
  }
}

/**
 * Load Notion connection from localStorage
 */
export function loadNotionConnection(): NotionConnection | null {
  const user = getCurrentUser();
  if (!user || typeof window === 'undefined') return null;
  
  const stored = localStorage.getItem(`notion-connection-${user.id}`);
  if (stored) {
    try {
      const connection = JSON.parse(stored);
      notionConnections.set(user.id, connection);
      return connection;
    } catch (e) {
      console.error('Failed to parse stored Notion connection:', e);
    }
  }
  
  return null;
}

/**
 * Remove Notion connection
 */
export function removeNotionConnection(): void {
  const user = getCurrentUser();
  if (!user) return;
  
  notionConnections.delete(user.id);
  
  if (typeof window !== 'undefined') {
    localStorage.removeItem(`notion-connection-${user.id}`);
  }
}

/**
 * Simulate connecting to Notion (for testing)
 */
export function simulateNotionConnection(): NotionConnection {
  const connection: NotionConnection = {
    accessToken: 'demo_access_token_' + Date.now(),
    workspaceName: 'Demo Workspace',
    connectedAt: new Date().toISOString(),
  };
  
  setNotionConnection(connection);
  return connection;
}

/**
 * Create a page in Notion using the API
 */
export async function createNotionPage(
  accessToken: string,
  course: any,
  parentPageId?: string
): Promise<{ success: boolean; pageId?: string; pageUrl?: string; error?: string }> {
  try {
    // For demo purposes, simulate successful page creation
    if (accessToken.startsWith('demo_')) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const pageId = 'demo-page-' + Date.now();
      const pageUrl = `https://notion.so/Demo-Course-${pageId}`;
      
      return {
        success: true,
        pageId,
        pageUrl
      };
    }
    
    // Real Notion API implementation would go here
    const modules = Array.isArray(course.modules) ? course.modules : [];
    
    // Build the page content as Notion blocks
    const children: any[] = [];

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