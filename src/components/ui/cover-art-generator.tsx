'use client';

import { useState } from 'react';
import { Button } from './button';
import { Card } from './card';
import { Select } from './select';
import { Label } from './label';

interface GeneratedCoverArt {
  id: string;
  url: string;
  style: string;
  prompt: string;
  base64Data?: string;
}

interface CoverArtGeneratorProps {
  courseTitle: string;
  courseContent: string;
  onCoverArtGenerated?: (coverArt: GeneratedCoverArt[]) => void;
}

export function CoverArtGenerator({ 
  courseTitle, 
  courseContent, 
  onCoverArtGenerated 
}: CoverArtGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [coverArt, setCoverArt] = useState<GeneratedCoverArt[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<string>('auto');
  const [selectedCover, setSelectedCover] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const styles = [
    { value: 'auto', label: 'Auto-detect Style' },
    { value: 'professional', label: 'Professional' },
    { value: 'playful', label: 'Playful & Creative' },
    { value: 'modern', label: 'Modern & Tech' },
    { value: 'minimalist', label: 'Minimalist' },
  ];

  const handleGenerateCoverArt = async () => {
    if (!courseTitle.trim() || !courseContent.trim()) {
      setError('Course title and content are required');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setCoverArt([]);
    setSelectedCover(null);

    try {
      const response = await fetch('/api/generate-cover-art', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseTitle,
          courseContent,
          style: selectedStyle === 'auto' ? undefined : selectedStyle,
          count: 3,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to generate cover art');
      }

      setCoverArt(data.coverArt);
      setSelectedCover(data.coverArt[0]?.id || null);
      onCoverArtGenerated?.(data.coverArt);

    } catch (err) {
      console.error('Cover art generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate cover art');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadCover = (cover: GeneratedCoverArt, format: 'png' | 'jpeg') => {
    try {
      // Use base64 data if available, otherwise use the URL
      const imageData = cover.base64Data || cover.url;
      
      if (cover.base64Data) {
        // Download from base64 data
        const link = document.createElement('a');
        link.href = imageData;
        link.download = `${courseTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_cover.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Download from URL
        const link = document.createElement('a');
        link.href = imageData;
        link.target = '_blank';
        link.download = `${courseTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_cover.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download cover art');
    }
  };

  const handleCoverSelect = (coverId: string) => {
    setSelectedCover(coverId);
  };

  return (
    <div className="space-y-6">
      {/* Generation Controls */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Generate Cover Art</h3>
            <p className="text-sm text-gray-600 mb-4">
              Create professional cover images for your course using AI
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="style-select">Cover Style</Label>
              <Select
                value={selectedStyle}
                onValueChange={setSelectedStyle}
                disabled={isGenerating}
              >
                {styles.map((style) => (
                  <option key={style.value} value={style.value}>
                    {style.label}
                  </option>
                ))}
              </Select>
            </div>

            <Button
              onClick={handleGenerateCoverArt}
              disabled={isGenerating || !courseTitle.trim() || !courseContent.trim()}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating Cover Art...
                </>
              ) : (
                'Generate Cover Art'
              )}
            </Button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Generated Cover Art Display */}
      {coverArt.length > 0 && (
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Generated Cover Art</h3>
              <p className="text-sm text-gray-600 mb-4">
                Select your favorite cover and download it in your preferred format
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {coverArt.map((cover, index) => (
                <div
                  key={cover.id}
                  className={`relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                    selectedCover === cover.id
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleCoverSelect(cover.id)}
                >
                  <div className="aspect-square relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cover.base64Data || cover.url}
                      alt={`Cover art option ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Image load error:', e);
                        // Fallback to URL if base64 fails
                        if (cover.base64Data && e.currentTarget.src !== cover.url) {
                          e.currentTarget.src = cover.url;
                        }
                      }}
                    />
                    
                    {selectedCover === cover.id && (
                      <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                        ✓
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-white">
                    <p className="text-xs text-gray-500 capitalize mb-2">
                      {cover.style} Style
                    </p>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadCover(cover, 'png');
                        }}
                        className="flex-1 text-xs"
                      >
                        PNG
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadCover(cover, 'jpeg');
                        }}
                        className="flex-1 text-xs"
                      >
                        JPEG
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selectedCover && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Selected:</strong> Cover {coverArt.findIndex(c => c.id === selectedCover) + 1} 
                  ({coverArt.find(c => c.id === selectedCover)?.style} style)
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Click the download buttons above to save your selected cover art.
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Loading State */}
      {isGenerating && (
        <Card className="p-6">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <div>
              <p className="text-lg font-medium">Creating your cover art...</p>
              <p className="text-sm text-gray-600">
                This may take 30-60 seconds. We&apos;re generating 3 unique designs for you.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}