import { Course, CourseModule } from '@/types';
import { Marp } from '@marp-team/marp-core';

export interface SlideTheme {
  name: 'light' | 'dark';
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  fontFamily: string;
}

export interface SlideOptions {
  theme: SlideTheme;
  includeBranding: boolean;
  includeQuiz: boolean;
  includeCTA: boolean;
  customBranding?: {
    logo?: string;
    companyName?: string;
    website?: string;
  };
}

export interface SlideContent {
  markdown: string;
  html: string;
  slides: SlideData[];
}

export interface SlideData {
  type: 'title' | 'content' | 'summary' | 'quiz' | 'cta';
  title: string;
  content: string[];
  speakerNotes?: string;
}

export class SlideGenerator {
  private marp: Marp;
  
  constructor() {
    this.marp = new Marp({
      html: true,
      markdown: {
        breaks: true,
        linkify: true,
      },
    });
  }

  /**
   * Generate slides from course data
   */
  async generateSlides(course: Course, options: SlideOptions): Promise<SlideContent> {
    const slides = this.createSlideData(course, options);
    const markdown = this.generateMarkdown(slides, options);
    
    // Generate HTML using Marp
    const { html } = await this.marp.render(markdown);
    
    return {
      markdown,
      html,
      slides,
    };
  }

  /**
   * Create structured slide data from course
   */
  private createSlideData(course: Course, options: SlideOptions): SlideData[] {
    const slides: SlideData[] = [];

    // Title slide
    slides.push({
      type: 'title',
      title: course.title,
      content: [
        course.description || 'Transform your knowledge into actionable insights',
        `${course.modules.length} modules • Generated from ${course.metadata.sourceType}`,
      ],
      speakerNotes: `Welcome to ${course.title}. This course contains ${course.modules.length} modules designed to provide actionable insights and practical takeaways.`,
    });

    // Content slides for each module
    course.modules.forEach((module, index) => {
      // Module overview slide
      slides.push({
        type: 'content',
        title: `Module ${index + 1}: ${module.title}`,
        content: [
          '## Overview',
          module.summary,
          '',
          '## Key Takeaways',
          ...module.takeaways.map(takeaway => `• ${takeaway}`),
        ],
        speakerNotes: `This is module ${index + 1} focusing on ${module.title}. The main points to cover are: ${module.takeaways.join(', ')}.`,
      });

      // Detailed takeaways slide
      if (module.takeaways.length > 2) {
        slides.push({
          type: 'content',
          title: `${module.title} - Action Items`,
          content: [
            '## Actionable Steps',
            ...module.takeaways.map((takeaway, i) => `${i + 1}. ${takeaway}`),
            '',
            '## Implementation Tips',
            '• Start with the first action item',
            '• Apply one concept at a time',
            '• Track your progress and results',
          ],
          speakerNotes: `Focus on implementation. Encourage the audience to pick one action item to start with immediately after this presentation.`,
        });
      }
    });

    // Summary slide
    slides.push({
      type: 'summary',
      title: 'Course Summary',
      content: [
        '## What We Covered',
        ...course.modules.map((module, i) => `${i + 1}. ${module.title}`),
        '',
        '## Next Steps',
        '• Choose one key takeaway to implement today',
        '• Set a timeline for applying these concepts',
        '• Track your progress and results',
      ],
      speakerNotes: 'Summarize the key points and encourage immediate action. The most important thing is to start implementing one concept right away.',
    });

    // Optional quiz slide
    if (options.includeQuiz) {
      slides.push(this.generateQuizSlide(course));
    }

    // Optional CTA slide
    if (options.includeCTA) {
      slides.push(this.generateCTASlide(course, options));
    }

    return slides;
  }

  /**
   * Generate quiz slide based on course content
   */
  private generateQuizSlide(course: Course): SlideData {
    const questions = course.modules.slice(0, 3).map((module, i) => 
      `${i + 1}. What is the main focus of "${module.title}"?`
    );

    return {
      type: 'quiz',
      title: 'Quick Knowledge Check',
      content: [
        '## Test Your Understanding',
        ...questions,
        '',
        '## Discussion Points',
        '• Which concept resonates most with you?',
        '• What will you implement first?',
        '• How will you measure success?',
      ],
      speakerNotes: 'Use this as an interactive moment. Ask the audience to think about or discuss these questions.',
    };
  }

  /**
   * Generate CTA slide
   */
  private generateCTASlide(course: Course, options: SlideOptions): SlideData {
    const branding = options.customBranding;
    
    return {
      type: 'cta',
      title: 'Ready to Take Action?',
      content: [
        '## Get Started Today',
        '• Download the course materials',
        '• Join our community for support',
        '• Share your progress with #CourseAlchemist',
        '',
        branding?.website ? `## Learn More: ${branding.website}` : '## Learn More',
        branding?.companyName ? `Created by ${branding.companyName}` : 'Created with AI Course Alchemist',
      ],
      speakerNotes: 'End with a clear call to action. Encourage the audience to take the next step and provide ways to stay connected.',
    };
  }

  /**
   * Generate Marp markdown from slide data
   */
  private generateMarkdown(slides: SlideData[], options: SlideOptions): string {
    const theme = this.getThemeCSS(options.theme);
    let markdown = `---
marp: true
theme: custom
paginate: true
backgroundColor: ${options.theme.backgroundColor}
color: ${options.theme.textColor}
---

<style>
${theme}
</style>

`;

    slides.forEach((slide, index) => {
      if (index > 0) {
        markdown += '\n---\n\n';
      }

      // Add slide content
      markdown += `# ${slide.title}\n\n`;
      markdown += slide.content.join('\n') + '\n';

      // Add speaker notes
      if (slide.speakerNotes) {
        markdown += `\n<!-- ${slide.speakerNotes} -->\n`;
      }
    });

    return markdown;
  }

  /**
   * Get CSS for theme
   */
  private getThemeCSS(theme: SlideTheme): string {
    return `
section {
  background: ${theme.backgroundColor};
  color: ${theme.textColor};
  font-family: ${theme.fontFamily};
  font-size: 28px;
  line-height: 1.6;
}

h1 {
  color: ${theme.accentColor};
  font-size: 2.5em;
  font-weight: bold;
  margin-bottom: 0.5em;
  text-align: center;
}

h2 {
  color: ${theme.accentColor};
  font-size: 1.8em;
  font-weight: 600;
  margin: 1em 0 0.5em 0;
  border-bottom: 2px solid ${theme.accentColor};
  padding-bottom: 0.2em;
}

ul {
  margin: 1em 0;
  padding-left: 1.5em;
}

li {
  margin: 0.5em 0;
  line-height: 1.4;
}

strong {
  color: ${theme.accentColor};
  font-weight: 600;
}

.title-slide {
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.summary-slide {
  background: linear-gradient(135deg, ${theme.backgroundColor} 0%, ${theme.accentColor}20 100%);
}

.cta-slide {
  background: linear-gradient(135deg, ${theme.accentColor}10 0%, ${theme.backgroundColor} 100%);
  text-align: center;
}

footer {
  font-size: 0.8em;
  color: ${theme.textColor}80;
}
`;
  }

  /**
   * Get predefined themes
   */
  static getThemes(): Record<string, SlideTheme> {
    return {
      light: {
        name: 'light',
        backgroundColor: '#ffffff',
        textColor: '#2d3748',
        accentColor: '#3182ce',
        fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
      },
      // Dark theme removed - app is now light theme only
    };
  }

  /**
   * Export slides as PDF
   */
  async exportToPDF(slideContent: SlideContent, options: SlideOptions): Promise<Buffer> {
    // This will be implemented with puppeteer for PDF generation
    const puppeteer = await import('puppeteer');
    
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    try {
      const page = await browser.newPage();
      await page.setContent(slideContent.html, { waitUntil: 'networkidle0' });
      
      const pdf = await page.pdf({
        format: 'A4',
        landscape: true,
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px',
        },
      });
      
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  /**
   * Export slides as PowerPoint (PPTX)
   */
  async exportToPPTX(slideContent: SlideContent, options: SlideOptions): Promise<Buffer> {
    const PptxGenJS = await import('pptxgenjs');
    const pptx = new PptxGenJS.default();

    // Set presentation properties
    pptx.author = options.customBranding?.companyName || 'AI Course Alchemist';
    pptx.company = options.customBranding?.companyName || 'AI Course Alchemist';
    pptx.title = slideContent.slides[0]?.title || 'Course Presentation';
    pptx.subject = 'Generated Course Slides';

    // Define slide layout
    pptx.defineLayout({ name: 'CUSTOM', width: 10, height: 7.5 });

    // Process each slide
    slideContent.slides.forEach((slideData, index) => {
      const slide = pptx.addSlide();

      // Apply theme colors
      const bgColor = this.hexToRgb(options.theme.backgroundColor);
      const textColor = this.hexToRgb(options.theme.textColor);
      const accentColor = this.hexToRgb(options.theme.accentColor);

      // Set slide background
      slide.background = { color: options.theme.backgroundColor.replace('#', '') };

      if (slideData.type === 'title') {
        // Title slide layout
        slide.addText(slideData.title, {
          x: 0.5,
          y: 2,
          w: 9,
          h: 1.5,
          fontSize: 44,
          fontFace: 'Arial',
          color: options.theme.accentColor.replace('#', ''),
          align: 'center',
          bold: true,
        });

        // Subtitle content
        const subtitle = slideData.content.join(' • ');
        slide.addText(subtitle, {
          x: 0.5,
          y: 4,
          w: 9,
          h: 1,
          fontSize: 24,
          fontFace: 'Arial',
          color: options.theme.textColor.replace('#', ''),
          align: 'center',
        });

        // Add branding footer if enabled
        if (options.includeBranding) {
          const brandingText = options.customBranding?.companyName || 'AI Course Alchemist';
          slide.addText(brandingText, {
            x: 0.5,
            y: 6.5,
            w: 9,
            h: 0.5,
            fontSize: 14,
            fontFace: 'Arial',
            color: options.theme.textColor.replace('#', ''),
            align: 'center',
            italic: true,
          });
        }
      } else {
        // Content slides
        slide.addText(slideData.title, {
          x: 0.5,
          y: 0.5,
          w: 9,
          h: 1,
          fontSize: 36,
          fontFace: 'Arial',
          color: options.theme.accentColor.replace('#', ''),
          bold: true,
        });

        // Process content
        let yPosition = 1.8;
        const lineHeight = 0.4;

        slideData.content.forEach((line) => {
          if (line.startsWith('## ')) {
            // Section header
            const headerText = line.replace('## ', '');
            slide.addText(headerText, {
              x: 0.5,
              y: yPosition,
              w: 9,
              h: 0.6,
              fontSize: 28,
              fontFace: 'Arial',
              color: options.theme.accentColor.replace('#', ''),
              bold: true,
            });
            yPosition += 0.8;
          } else if (line.startsWith('• ') || line.match(/^\d+\. /)) {
            // Bullet point or numbered list
            const bulletText = line.replace(/^[•\d]+\.?\s*/, '');
            slide.addText(`• ${bulletText}`, {
              x: 1,
              y: yPosition,
              w: 8,
              h: lineHeight,
              fontSize: 20,
              fontFace: 'Arial',
              color: options.theme.textColor.replace('#', ''),
            });
            yPosition += lineHeight + 0.1;
          } else if (line.trim() !== '') {
            // Regular text
            slide.addText(line, {
              x: 0.5,
              y: yPosition,
              w: 9,
              h: lineHeight,
              fontSize: 18,
              fontFace: 'Arial',
              color: options.theme.textColor.replace('#', ''),
            });
            yPosition += lineHeight + 0.1;
          }
        });

        // Add slide number
        slide.addText(`${index + 1}`, {
          x: 9,
          y: 7,
          w: 0.5,
          h: 0.3,
          fontSize: 12,
          fontFace: 'Arial',
          color: options.theme.textColor.replace('#', ''),
          align: 'center',
        });
      }

      // Add speaker notes if available
      if (slideData.speakerNotes) {
        slide.addNotes(slideData.speakerNotes);
      }
    });

    // Generate and return the PPTX buffer
    const pptxBuffer = await pptx.write({ outputType: 'nodebuffer' });
    return pptxBuffer as Buffer;
  }

  /**
   * Helper function to convert hex color to RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
}

// Create default instance for backward compatibility
export const slideGenerator = new SlideGenerator();

// Export themes for backward compatibility
export const slideThemes = SlideGenerator.getThemes();

// Default export
export default SlideGenerator;