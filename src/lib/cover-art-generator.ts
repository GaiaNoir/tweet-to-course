import OpenAI from 'openai';
import { OpenAIError } from './openai';

// Build-safe OpenAI client initialization
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey && typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
    console.warn('Missing OPENAI_API_KEY environment variable');
  }
  return new OpenAI({
    apiKey: apiKey || 'placeholder-key',
  });
};

// Lazy initialization to avoid build-time errors
let _openai: OpenAI | null = null;

const openai = new Proxy({} as OpenAI, {
  get(target, prop) {
    if (!_openai) {
      _openai = getOpenAIClient();
    }
    return _openai[prop as keyof OpenAI];
  }
});

export interface CoverArtOptions {
  courseTitle: string;
  courseContent: string;
  style?: 'professional' | 'playful' | 'modern' | 'minimalist';
  count?: number; // 1-3 images
}

export interface GeneratedCoverArt {
  id: string;
  url: string;
  style: string;
  prompt: string;
}

// Analyze course content to determine appropriate style
function analyzeCourseStyle(courseTitle: string, courseContent: string): 'professional' | 'playful' | 'modern' | 'minimalist' {
  const content = (courseTitle + ' ' + courseContent).toLowerCase();
  
  // Keywords that suggest different styles
  const professionalKeywords = ['business', 'corporate', 'finance', 'leadership', 'management', 'strategy', 'professional'];
  const playfulKeywords = ['creative', 'fun', 'art', 'design', 'social media', 'content creation', 'personal'];
  const modernKeywords = ['tech', 'digital', 'ai', 'startup', 'innovation', 'growth', 'marketing'];
  
  const professionalScore = professionalKeywords.reduce((score, keyword) => 
    content.includes(keyword) ? score + 1 : score, 0);
  const playfulScore = playfulKeywords.reduce((score, keyword) => 
    content.includes(keyword) ? score + 1 : score, 0);
  const modernScore = modernKeywords.reduce((score, keyword) => 
    content.includes(keyword) ? score + 1 : score, 0);
  
  if (professionalScore >= playfulScore && professionalScore >= modernScore) {
    return 'professional';
  } else if (playfulScore >= modernScore) {
    return 'playful';
  } else if (modernScore > 0) {
    return 'modern';
  }
  
  return 'minimalist'; // Default fallback
}

// Generate style-specific prompts
function createCoverArtPrompt(title: string, style: string, variation: number): string {
  const basePrompt = `Create a course cover image for "${title}". `;
  
  const stylePrompts = {
    professional: [
      `${basePrompt}Professional business style with clean typography, corporate colors (navy, gray, white), subtle geometric patterns, modern sans-serif fonts, high-quality stock photo aesthetic, LinkedIn-worthy appearance.`,
      `${basePrompt}Executive education style with elegant design, premium feel, sophisticated color palette, minimal text overlay, professional photography style, conference presentation quality.`,
      `${basePrompt}Corporate training aesthetic with structured layout, authoritative typography, business-appropriate imagery, clean white background, professional color scheme.`
    ],
    playful: [
      `${basePrompt}Creative and vibrant design with bright colors, fun illustrations, hand-drawn elements, playful typography, energetic composition, social media friendly aesthetic.`,
      `${basePrompt}Artistic and colorful style with creative graphics, bold color combinations, whimsical elements, modern illustration style, Instagram-worthy design.`,
      `${basePrompt}Fun and engaging design with cartoon-style illustrations, bright gradients, creative typography, youthful energy, approachable and friendly aesthetic.`
    ],
    modern: [
      `${basePrompt}Modern tech aesthetic with gradient backgrounds, sleek typography, digital elements, contemporary color palette (purple, blue, teal), startup-style design.`,
      `${basePrompt}Futuristic design with geometric shapes, neon accents, tech-inspired graphics, modern sans-serif fonts, digital transformation theme.`,
      `${basePrompt}Contemporary style with clean lines, bold typography, tech company aesthetic, innovative design elements, Silicon Valley inspired.`
    ],
    minimalist: [
      `${basePrompt}Minimalist design with clean white background, simple typography, subtle colors, plenty of white space, elegant simplicity, Scandinavian design influence.`,
      `${basePrompt}Clean and simple aesthetic with minimal elements, monochromatic color scheme, elegant typography, sophisticated simplicity, Apple-inspired design.`,
      `${basePrompt}Ultra-minimal style with single focal point, clean typography, neutral colors, maximum white space, zen-like simplicity.`
    ]
  };
  
  const prompts = stylePrompts[style as keyof typeof stylePrompts] || stylePrompts.minimalist;
  return prompts[variation % prompts.length] + ' High quality, 1024x1024 pixels, course cover design, no text overlay needed.';
}

// Generate cover art using DALL·E
export async function generateCoverArt(options: CoverArtOptions): Promise<GeneratedCoverArt[]> {
  const { courseTitle, courseContent, count = 3 } = options;
  
  // Determine style if not provided
  const style = options.style || analyzeCourseStyle(courseTitle, courseContent);
  
  // Validate count
  const imageCount = Math.min(Math.max(count, 1), 3);
  
  try {
    const coverArtPromises = Array.from({ length: imageCount }, async (_, index) => {
      const prompt = createCoverArtPrompt(courseTitle, style, index);
      
      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        response_format: 'url',
      });
      
      const imageUrl = response.data[0]?.url;
      if (!imageUrl) {
        throw new OpenAIError(
          'No image URL received from DALL·E',
          'NO_IMAGE_URL',
          true
        );
      }
      
      return {
        id: `cover-${Date.now()}-${index}`,
        url: imageUrl,
        style,
        prompt,
      };
    });
    
    const results = await Promise.all(coverArtPromises);
    return results;
    
  } catch (error) {
    if (error instanceof OpenAIError) {
      throw error;
    }
    
    // Handle OpenAI API errors
    if (error && typeof error === 'object' && 'status' in error) {
      const apiError = error as { status: number; message?: string };
      
      if (apiError.status === 429) {
        throw new OpenAIError(
          'DALL·E API rate limit exceeded. Please try again later.',
          'DALLE_RATE_LIMIT',
          true
        );
      }
      
      if (apiError.status === 401) {
        throw new OpenAIError(
          'DALL·E API authentication failed',
          'DALLE_AUTH_ERROR',
          false
        );
      }
      
      if (apiError.status === 400) {
        throw new OpenAIError(
          'Invalid request to DALL·E API. The content might violate usage policies.',
          'DALLE_INVALID_REQUEST',
          false
        );
      }
      
      if (apiError.status >= 500) {
        throw new OpenAIError(
          'DALL·E service temporarily unavailable',
          'DALLE_SERVER_ERROR',
          true
        );
      }
      
      throw new OpenAIError(
        `DALL·E API error: ${apiError.message || 'Unknown error'}`,
        'DALLE_API_ERROR',
        false
      );
    }
    
    // Handle network errors
    if (error instanceof Error && error.message.includes('fetch')) {
      throw new OpenAIError(
        'Network error connecting to DALL·E API',
        'DALLE_NETWORK_ERROR',
        true
      );
    }
    
    // Generic error fallback
    throw new OpenAIError(
      'Unexpected error during cover art generation',
      'DALLE_UNKNOWN_ERROR',
      true
    );
  }
}

// Download image from URL and convert to base64 for client-side handling
export async function downloadImageAsBase64(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = response.headers.get('content-type') || 'image/png';
    
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    throw new OpenAIError(
      'Failed to download generated image',
      'IMAGE_DOWNLOAD_ERROR',
      true
    );
  }
}

// Utility to convert base64 to downloadable blob
export function base64ToBlob(base64Data: string, contentType: string = 'image/png'): Blob {
  // Handle both data URL format and plain base64
  const base64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: contentType });
}

// Export coverArtGenerator object for backward compatibility
export const coverArtGenerator = {
  generateCoverArt,
  downloadImageAsBase64,
  base64ToBlob,
};