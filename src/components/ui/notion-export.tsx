'use client';

import { useState } from 'react';
import { Button } from './button';
import { Card } from './card';

interface NotionExportProps {
  courseId: string;
  courseTitle: string;
  isNotionConnected: boolean;
  onConnectionRequired: () => void;
}

export function NotionExport({ 
  courseId, 
  courseTitle, 
  isNotionConnected, 
  onConnectionRequired 
}: NotionExportProps) {
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState<{
    success: boolean;
    message: string;
    pageUrl?: string;
  } | null>(null);

  const exportToNotion = async () => {
    setExporting(true);
    setExportResult(null);

    try {
      console.log('Starting Notion export...');
      
      // Get course data from localStorage (simple approach)
      const courseData = {
        title: courseTitle,
        modules: [], // This would need to be passed in or retrieved
        metadata: {
          generatedAt: new Date().toISOString(),
          sourceType: 'tweet'
        }
      };

      const response = await fetch('/api/export-notion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseData,
          exportType: 'markdown'
        }),
      });

      console.log('Notion export response status:', response.status);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${courseTitle.replace(/[^a-zA-Z0-9]/g, '_')}_notion.md`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        setExportResult({
          success: true,
          message: 'Markdown file downloaded successfully!'
        });
      } else {
        const errorData = await response.json();
        setExportResult({
          success: false,
          message: errorData.error || 'Export failed'
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      setExportResult({
        success: false,
        message: 'Failed to export course'
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div>
          <h3 className="font-medium mb-2">Export to Notion</h3>
          <p className="text-sm text-gray-600 mb-4">
            Export "{courseTitle}" to your Notion workspace
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={exportToNotion}
            disabled={exporting}
            className="flex-1"
          >
            {exporting ? 'Exporting...' : 'Download Notion Markdown'}
          </Button>
        </div>

        {!isNotionConnected && (
          <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded">
            <p className="font-medium">Connect Notion for Direct Export</p>
            <p>Connect your Notion account to export courses directly to your workspace.</p>
          </div>
        )}

        {exportResult && (
          <div className={`p-3 rounded text-sm ${
            exportResult.success 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <p className="font-medium">
              {exportResult.success ? '✓ Success!' : '✗ Error'}
            </p>
            <p>{exportResult.message}</p>
            {exportResult.pageUrl && (
              <a
                href={exportResult.pageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-blue-600 hover:text-blue-800 underline"
              >
                View in Notion →
              </a>
            )}
          </div>
        )}

        <div className="text-xs text-gray-500">
          <p><strong>Markdown Export:</strong> Downloads a file you can manually import into Notion</p>
        </div>
      </div>
    </Card>
  );
}