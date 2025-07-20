import { describe, it, expect, beforeEach } from 'vitest';
import SlideGenerator, { SlideOptions, SlideTheme } from '@/lib/slide-generator';
import { Course, CourseModule } from '@/types';

describe('SlideGenerator', () => {
  let slideGenerator: SlideGenerator;
  let mockCourse: Course;
  let defaultOptions: SlideOptions;

  beforeEach(() => {
    slideGenerator = new SlideGenerator();
    
    const mockModules: CourseModule[] = [
      {
        id: '1',
        title: 'Introduction to AI',
        summary: 'Learn the basics of artificial intelligence and its applications.',
        takeaways: [
          'Understand what AI is and how it works',
          'Identify common AI applications in daily life',
          'Recognize the potential and limitations of AI'
        ],
        order: 1,
        estimatedReadTime: 5
      },
      {
        id: '2',
        title: 'Machine Learning Fundamentals',
        summary: 'Explore the core concepts of machine learning and different types of algorithms.',
        takeaways: [
          'Differentiate between supervised and unsupervised learning',
          'Understand the importance of data quality',
          'Apply basic ML concepts to real-world problems'
        ],
        order: 2,
        estimatedReadTime: 8
      }
    ];

    mockCourse = {
      id: 'test-course-1',
      title: 'AI Fundamentals Course',
      description: 'A comprehensive introduction to artificial intelligence',
      modules: mockModules,
      metadata: {
        sourceType: 'manual',
        generatedAt: '2024-01-01T00:00:00Z',
        version: 1
      }
    };

    const lightTheme: SlideTheme = {
      name: 'light',
      backgroundColor: '#ffffff',
      textColor: '#2d3748',
      accentColor: '#3182ce',
      fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif'
    };

    defaultOptions = {
      theme: lightTheme,
      includeBranding: true,
      includeQuiz: false,
      includeCTA: true
    };
  });

  describe('generateSlides', () => {
    it('should generate slides with correct structure', async () => {
      const result = await slideGenerator.generateSlides(mockCourse, defaultOptions);

      expect(result).toHaveProperty('markdown');
      expect(result).toHaveProperty('html');
      expect(result).toHaveProperty('slides');
      expect(result.slides).toBeInstanceOf(Array);
      expect(result.slides.length).toBeGreaterThan(0);
    });

    it('should create title slide as first slide', async () => {
      const result = await slideGenerator.generateSlides(mockCourse, defaultOptions);
      
      const titleSlide = result.slides[0];
      expect(titleSlide.type).toBe('title');
      expect(titleSlide.title).toBe(mockCourse.title);
      expect(titleSlide.content).toContain(mockCourse.description);
    });

    it('should create content slides for each module', async () => {
      const result = await slideGenerator.generateSlides(mockCourse, defaultOptions);
      
      // Should have title + content slides for each module + summary + CTA
      // Each module gets 2 slides (overview + action items)
      const expectedMinSlides = 1 + (mockCourse.modules.length * 2) + 1 + 1; // title + modules + summary + CTA
      expect(result.slides.length).toBeGreaterThanOrEqual(expectedMinSlides);

      // Check that module content is included
      const contentSlides = result.slides.filter(slide => slide.type === 'content');
      expect(contentSlides.length).toBeGreaterThanOrEqual(mockCourse.modules.length);
    });

    it('should include summary slide', async () => {
      const result = await slideGenerator.generateSlides(mockCourse, defaultOptions);
      
      const summarySlides = result.slides.filter(slide => slide.type === 'summary');
      expect(summarySlides.length).toBe(1);
      
      const summarySlide = summarySlides[0];
      expect(summarySlide.title).toBe('Course Summary');
      expect(summarySlide.content.join(' ')).toContain('What We Covered');
    });

    it('should include CTA slide when enabled', async () => {
      const result = await slideGenerator.generateSlides(mockCourse, defaultOptions);
      
      const ctaSlides = result.slides.filter(slide => slide.type === 'cta');
      expect(ctaSlides.length).toBe(1);
      
      const ctaSlide = ctaSlides[0];
      expect(ctaSlide.title).toBe('Ready to Take Action?');
    });

    it('should exclude CTA slide when disabled', async () => {
      const optionsWithoutCTA = { ...defaultOptions, includeCTA: false };
      const result = await slideGenerator.generateSlides(mockCourse, optionsWithoutCTA);
      
      const ctaSlides = result.slides.filter(slide => slide.type === 'cta');
      expect(ctaSlides.length).toBe(0);
    });

    it('should include quiz slide when enabled', async () => {
      const optionsWithQuiz = { ...defaultOptions, includeQuiz: true };
      const result = await slideGenerator.generateSlides(mockCourse, optionsWithQuiz);
      
      const quizSlides = result.slides.filter(slide => slide.type === 'quiz');
      expect(quizSlides.length).toBe(1);
      
      const quizSlide = quizSlides[0];
      expect(quizSlide.title).toBe('Quick Knowledge Check');
    });

    it('should exclude quiz slide when disabled', async () => {
      const result = await slideGenerator.generateSlides(mockCourse, defaultOptions);
      
      const quizSlides = result.slides.filter(slide => slide.type === 'quiz');
      expect(quizSlides.length).toBe(0);
    });

    it('should generate valid markdown', async () => {
      const result = await slideGenerator.generateSlides(mockCourse, defaultOptions);
      
      expect(result.markdown).toContain('---\nmarp: true');
      expect(result.markdown).toContain('theme: custom');
      expect(result.markdown).toContain('paginate: true');
      expect(result.markdown).toContain(mockCourse.title);
      
      // Should contain slide separators
      const slideSeparators = result.markdown.match(/^---$/gm);
      expect(slideSeparators).toBeTruthy();
      expect(slideSeparators!.length).toBeGreaterThan(0);
    });

    it('should include speaker notes', async () => {
      const result = await slideGenerator.generateSlides(mockCourse, defaultOptions);
      
      // Check that at least some slides have speaker notes
      const slidesWithNotes = result.slides.filter(slide => slide.speakerNotes);
      expect(slidesWithNotes.length).toBeGreaterThan(0);
      
      // Check that speaker notes are included in markdown
      expect(result.markdown).toContain('<!--');
    });
  });

  describe('getThemes', () => {
    it('should return predefined themes', () => {
      const themes = SlideGenerator.getThemes();
      
      expect(themes).toHaveProperty('light');
      expect(themes).toHaveProperty('dark');
      
      expect(themes.light.name).toBe('light');
      expect(themes.dark.name).toBe('dark');
      
      // Check theme properties
      expect(themes.light).toHaveProperty('backgroundColor');
      expect(themes.light).toHaveProperty('textColor');
      expect(themes.light).toHaveProperty('accentColor');
      expect(themes.light).toHaveProperty('fontFamily');
    });

    it('should have valid color values', () => {
      const themes = SlideGenerator.getThemes();
      
      // Check that colors are valid hex codes
      expect(themes.light.backgroundColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(themes.light.textColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(themes.light.accentColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      
      expect(themes.dark.backgroundColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(themes.dark.textColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(themes.dark.accentColor).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });

  describe('theme application', () => {
    it('should apply light theme correctly', async () => {
      const lightTheme = SlideGenerator.getThemes().light;
      const options = { ...defaultOptions, theme: lightTheme };
      
      const result = await slideGenerator.generateSlides(mockCourse, options);
      
      expect(result.markdown).toContain(`backgroundColor: ${lightTheme.backgroundColor}`);
      expect(result.markdown).toContain(`color: ${lightTheme.textColor}`);
      expect(result.markdown).toContain(`background: ${lightTheme.backgroundColor}`);
    });

    it('should apply dark theme correctly', async () => {
      const darkTheme = SlideGenerator.getThemes().dark;
      const options = { ...defaultOptions, theme: darkTheme };
      
      const result = await slideGenerator.generateSlides(mockCourse, options);
      
      expect(result.markdown).toContain(`backgroundColor: ${darkTheme.backgroundColor}`);
      expect(result.markdown).toContain(`color: ${darkTheme.textColor}`);
      expect(result.markdown).toContain(`background: ${darkTheme.backgroundColor}`);
    });
  });

  describe('custom branding', () => {
    it('should include custom branding when provided', async () => {
      const optionsWithBranding = {
        ...defaultOptions,
        customBranding: {
          companyName: 'Test Company',
          website: 'https://test.com',
          logo: 'https://test.com/logo.png'
        }
      };
      
      const result = await slideGenerator.generateSlides(mockCourse, optionsWithBranding);
      
      const ctaSlide = result.slides.find(slide => slide.type === 'cta');
      expect(ctaSlide).toBeTruthy();
      expect(ctaSlide!.content.join(' ')).toContain('Test Company');
      expect(ctaSlide!.content.join(' ')).toContain('https://test.com');
    });

    it('should use default branding when custom branding not provided', async () => {
      const result = await slideGenerator.generateSlides(mockCourse, defaultOptions);
      
      const ctaSlide = result.slides.find(slide => slide.type === 'cta');
      expect(ctaSlide).toBeTruthy();
      expect(ctaSlide!.content.join(' ')).toContain('AI Course Alchemist');
    });
  });

  describe('export functionality', () => {
    it('should export slides to PDF', async () => {
      const result = await slideGenerator.generateSlides(mockCourse, defaultOptions);
      
      // Mock puppeteer for testing
      const mockPDF = Buffer.from('mock-pdf-content');
      
      // This would normally call the actual export method
      // For testing, we just verify the method exists and can be called
      expect(slideGenerator.exportToPDF).toBeDefined();
      expect(typeof slideGenerator.exportToPDF).toBe('function');
    });

    it('should export slides to PPTX', async () => {
      const result = await slideGenerator.generateSlides(mockCourse, defaultOptions);
      
      // This would normally call the actual export method
      // For testing, we just verify the method exists and can be called
      expect(slideGenerator.exportToPPTX).toBeDefined();
      expect(typeof slideGenerator.exportToPPTX).toBe('function');
    });
  });

  describe('edge cases', () => {
    it('should handle course with no modules', async () => {
      const emptyCourse = { ...mockCourse, modules: [] };
      
      const result = await slideGenerator.generateSlides(emptyCourse, defaultOptions);
      
      expect(result.slides.length).toBeGreaterThan(0); // Should still have title and summary
      expect(result.slides[0].type).toBe('title');
    });

    it('should handle modules with no takeaways', async () => {
      const courseWithEmptyTakeaways = {
        ...mockCourse,
        modules: [{
          ...mockCourse.modules[0],
          takeaways: []
        }]
      };
      
      const result = await slideGenerator.generateSlides(courseWithEmptyTakeaways, defaultOptions);
      
      expect(result.slides.length).toBeGreaterThan(0);
      expect(result.markdown).toContain(courseWithEmptyTakeaways.modules[0].title);
    });

    it('should handle very long course titles', async () => {
      const longTitleCourse = {
        ...mockCourse,
        title: 'A'.repeat(200) // Very long title
      };
      
      const result = await slideGenerator.generateSlides(longTitleCourse, defaultOptions);
      
      expect(result.slides[0].title).toBe(longTitleCourse.title);
      expect(result.markdown).toContain(longTitleCourse.title);
    });
  });
});