'use client';

import { useState } from 'react';
import { Course } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectItem } from '@/components/ui/select';
import { Download, Eye, Presentation, FileText } from 'lucide-react';

interface SlideGeneratorProps {
  course: Course;
  userTier: 'free' | 'pro' | 'lifetime';
}

interface SlidePreview {
  markdown: string;
  html: string;
  slideCount: number;
  theme: {
    name: string;
    backgroundColor: string;
    textColor: string;
    accentColor: string;
  };
}

export function SlideGenerator({ course, userTier }: SlideGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [slidePreview, setSlidePreview] = useState<SlidePreview | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  // Slide options
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [includeBranding, setIncludeBranding] = useState(true);
  const [includeQuiz, setIncludeQuiz] = useState(false);
  const [includeCTA, setIncludeCTA] = useState(true);
  
  const isPaidUser = userTier === 'pro' || userTier === 'lifetime';

  const handleGenerateSlides = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-slides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: course.id,
          theme,
          includeBranding,
          includeQuiz,
          includeCTA,
          customBranding: isPaidUser ? {
            companyName: 'AI Course Alchemist',
            website: 'https://coursealchemy.ai',
          } : undefined,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSlidePreview(data.slides);
        setShowPreview(true);
      } else {
        throw new Error(data.error || 'Failed to generate slides');
      }
    } catch (error) {
      console.error('Error generating slides:', error);
      alert('Failed to generate slides. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportSlides = async (format: 'pdf' | 'ppt') => {
    if (!slidePreview) {
      alert('Please generate slides first');
      return;
    }

    setIsExporting(true);
    try {
      const response = await fetch('/api/export-slides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: course.id,
          format,
          theme,
          includeBranding,
          includeQuiz,
          includeCTA,
          customBranding: isPaidUser ? {
            companyName: 'AI Course Alchemist',
            website: 'https://coursealchemy.ai',
          } : undefined,
        }),
      });

      if (format === 'pdf') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${course.title.replace(/[^a-zA-Z0-9]/g, '_')}_slides.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        if (data.success) {
          // Show instructions for PPT export
          alert(data.message + '\n\n' + data.instructions.join('\n'));
        } else {
          throw new Error(data.error || 'Failed to export slides');
        }
      }
    } catch (error) {
      console.error('Error exporting slides:', error);
      alert('Failed to export slides. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Presentation className="h-5 w-5" />
            Generate Presentation Slides
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Theme Selection */}
          <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
            <Select value={theme} onValueChange={(value: 'light' | 'dark') => setTheme(value)}>
              <SelectItem value="light">Light Theme</SelectItem>
              <SelectItem value="dark">Dark Theme</SelectItem>
            </Select>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="branding">Include Branding</Label>
              <Switch
                id="branding"
                checked={includeBranding}
                onCheckedChange={setIncludeBranding}
                disabled={!isPaidUser} // Free users always have branding
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="quiz">Include Quiz Slide</Label>
              <Switch
                id="quiz"
                checked={includeQuiz}
                onCheckedChange={setIncludeQuiz}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="cta">Include Call-to-Action</Label>
              <Switch
                id="cta"
                checked={includeCTA}
                onCheckedChange={setIncludeCTA}
              />
            </div>
          </div>

          {!isPaidUser && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                Free users include AI Course Alchemist branding. Upgrade to Pro for custom branding options.
              </p>
            </div>
          )}

          {/* Generate Button */}
          <Button
            onClick={handleGenerateSlides}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Generating Slides...
              </>
            ) : (
              <>
                <Presentation className="h-4 w-4 mr-2" />
                Generate Slides
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Preview and Export */}
      {slidePreview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Slide Preview ({slidePreview.slideCount} slides)
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? 'Hide' : 'Show'} Preview
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {showPreview && (
              <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
                <div 
                  className="prose max-w-none"
                  style={{ 
                    backgroundColor: slidePreview.theme.backgroundColor,
                    color: slidePreview.theme.textColor,
                    padding: '1rem',
                    borderRadius: '0.5rem',
                  }}
                >
                  <pre className="whitespace-pre-wrap text-sm">
                    {slidePreview.markdown.substring(0, 1000)}
                    {slidePreview.markdown.length > 1000 && '...'}
                  </pre>
                </div>
              </div>
            )}

            {/* Export Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={() => handleExportSlides('pdf')}
                disabled={isExporting}
                className="flex-1"
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export as PDF
                  </>
                )}
              </Button>
              
              <Button
                onClick={() => handleExportSlides('ppt')}
                disabled={isExporting}
                variant="outline"
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-2" />
                Export as PPT
              </Button>
            </div>

            <p className="text-sm text-gray-600">
              PDF export creates a presentation-ready file. PPT export provides markdown content for manual conversion.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}