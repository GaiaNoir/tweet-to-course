'use client';

import React, { useState } from 'react';
import { Button } from './button';
import { Card } from './card';
import { Label } from './label';
import { MarketingAssets, formatMarketingAssetsForDownload } from '@/lib/marketing-assets-generator';

interface MarketingAssetsGeneratorProps {
  courseTitle: string;
  courseContent: string;
  originalTweet: string;
}

export function MarketingAssetsGenerator({ 
  courseTitle, 
  courseContent, 
  originalTweet 
}: MarketingAssetsGeneratorProps) {
  const [assets, setAssets] = useState<MarketingAssets | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [targetAudience, setTargetAudience] = useState('');
  const [error, setError] = useState<string | null>(null);

  const generateAssets = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/generate-marketing-assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseTitle,
          courseContent,
          originalTweet,
          targetAudience: targetAudience || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to generate marketing assets');
      }

      const data = await response.json();
      if (data.success && data.marketingAssets) {
        setAssets(data.marketingAssets);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadAssets = () => {
    if (!assets) return;
    
    const content = formatMarketingAssetsForDownload(assets, courseTitle);
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${courseTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_marketing_assets.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAsPDF = async () => {
    if (!assets) return;
    
    try {
      console.log('Starting marketing PDF export...');
      const response = await fetch('/api/export-marketing-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          marketingAssets: assets,
          courseTitle,
        }),
      });

      console.log('Marketing PDF export response status:', response.status);
      console.log('Marketing PDF export response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Marketing PDF export error data:', errorData);
        throw new Error(errorData.error || 'Failed to export PDF');
      }

      // Download the PDF
      const blob = await response.blob();
      console.log('Marketing PDF blob size:', blob.size);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${courseTitle.replace(/[^a-zA-Z0-9]/g, '_')}_marketing_assets.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log('Marketing PDF download triggered successfully');
    } catch (error) {
      console.error('PDF export error:', error);
      setError(error instanceof Error ? error.message : 'Failed to export PDF');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xl">🚀</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Generate Marketing Assets</h3>
            <p className="text-purple-600 font-medium">Turn your course into a marketing machine!</p>
          </div>
        </div>
        <p className="text-gray-700 mb-6 text-lg">
          Create professional marketing materials including cold DMs, ad copy templates, 
          tracking spreadsheets, and bonus resources - all tailored to your specific course content.
        </p>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="target-audience">Target Audience (Optional)</Label>
            <input
              id="target-audience"
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="e.g., SaaS founders, e-commerce entrepreneurs, content creators"
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <Button 
            onClick={generateAssets} 
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 text-lg shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Generating Your Marketing Arsenal...
              </>
            ) : (
              <>
                🚀 Generate Professional Marketing Assets
              </>
            )}
          </Button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}
      </Card>

      {assets && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Marketing Assets Generated</h3>
            <div className="flex gap-2">
              <Button onClick={downloadAssets} variant="outline">
                📄 Download as Markdown
              </Button>
              <Button onClick={downloadAsPDF} variant="outline">
                📋 Download as PDF
              </Button>
            </div>
          </div>

          {/* Cold DMs Section */}
          <Card className="p-6">
            <h4 className="text-lg font-semibold mb-4">🔥 Cold DMs & Outreach Messages</h4>
            <div className="space-y-4">
              {assets.coldDMs.map((dm, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <h5 className="font-medium mb-2">Message {index + 1}</h5>
                  <p className="text-sm whitespace-pre-wrap">{dm}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Ad Copy Templates */}
          <Card className="p-6">
            <h4 className="text-lg font-semibold mb-4">📱 Ad Copy Templates</h4>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h5 className="font-medium mb-2">Facebook/Meta Ads</h5>
                <p className="text-sm whitespace-pre-wrap">{assets.adCopyTemplate.facebook}</p>
              </div>
              <div className="p-4 bg-sky-50 rounded-lg">
                <h5 className="font-medium mb-2">Twitter/X Promoted Posts</h5>
                <p className="text-sm whitespace-pre-wrap">{assets.adCopyTemplate.twitter}</p>
              </div>
              <div className="p-4 bg-pink-50 rounded-lg">
                <h5 className="font-medium mb-2">Instagram Ads</h5>
                <p className="text-sm whitespace-pre-wrap">{assets.adCopyTemplate.instagram}</p>
              </div>
            </div>
          </Card>

          {/* Spreadsheet Template */}
          <Card className="p-6">
            <h4 className="text-lg font-semibold mb-4">📊 Marketing Tracking Spreadsheet</h4>
            <p className="text-sm text-gray-600 mb-4">{assets.spreadsheetTemplate.description}</p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    {assets.spreadsheetTemplate.headers.map((header, index) => (
                      <th key={index} className="border border-gray-300 p-2 text-left text-sm font-medium">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {assets.spreadsheetTemplate.sampleData.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="border border-gray-300 p-2 text-sm">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Bonus Resource */}
          <Card className="p-6">
            <h4 className="text-lg font-semibold mb-4">🎯 Bonus Resource: {assets.bonusResource.title}</h4>
            <p className="text-sm text-gray-600 mb-4">
              Type: {assets.bonusResource.type.charAt(0).toUpperCase() + assets.bonusResource.type.slice(1)}
            </p>
            <div className="space-y-2">
              {assets.bonusResource.content.map((item, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <span className="text-sm font-medium text-gray-500 mt-0.5">{index + 1}.</span>
                  <p className="text-sm">{item}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}