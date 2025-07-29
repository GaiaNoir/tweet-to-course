'use client';

import { useState } from 'react';

export default function TestNotionDirectPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testCourse = {
    title: 'Test Course: Social Media Marketing',
    modules: [
      {
        id: 'module-1',
        title: 'Introduction to Social Media',
        summary: 'Learn the basics of social media marketing and how to get started.',
        takeaways: [
          'Understand different social media platforms',
          'Learn basic marketing principles',
          'Set up your first campaign'
        ],
        order: 1
      },
      {
        id: 'module-2', 
        title: 'Content Creation Strategies',
        summary: 'Master the art of creating engaging content that converts.',
        takeaways: [
          'Create compelling visuals',
          'Write engaging captions',
          'Use hashtags effectively'
        ],
        order: 2
      }
    ],
    metadata: {
      generatedAt: new Date().toISOString(),
      sourceType: 'tweet',
      originalContent: 'Test tweet content'
    }
  };

  const testDirectExport = async () => {
    setLoading(true);
    setResult('');
    
    try {
      console.log('Testing direct Notion export...');
      const response = await fetch('/api/export-notion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseData: testCourse,
          exportType: 'direct'
        }),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      
      if (data.success) {
        setResult(`SUCCESS! Course exported to Notion!\n\nPage URL: ${data.pageUrl}\nPage ID: ${data.pageId}`);
      } else {
        setResult(`Response: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (error) {
      console.error('Test failed:', error);
      setResult('ERROR: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const testMarkdownExport = async () => {
    setLoading(true);
    setResult('');
    
    try {
      console.log('Testing markdown export...');
      const response = await fetch('/api/export-notion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseData: testCourse,
          exportType: 'markdown'
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const text = await blob.text();
        setResult('SUCCESS! Markdown generated:\n\n' + text.substring(0, 500) + '...');
        
        // Also trigger download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'test_course_notion.md';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const errorData = await response.json();
        setResult('ERROR: ' + JSON.stringify(errorData, null, 2));
      }
    } catch (error) {
      console.error('Test failed:', error);
      setResult('ERROR: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Test Direct Notion Export</h1>
      
      <div className="space-y-4 mb-8">
        <button
          onClick={testDirectExport}
          disabled={loading}
          className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 mr-4"
        >
          {loading ? 'Testing...' : 'Test Direct Export to Notion'}
        </button>
        
        <button
          onClick={testMarkdownExport}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Markdown Export'}
        </button>
      </div>

      {result && (
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="font-bold mb-2">Result:</h2>
          <pre className="whitespace-pre-wrap text-sm overflow-auto max-h-96">{result}</pre>
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-bold mb-4">What This Tests:</h2>
        <ul className="space-y-2 text-sm">
          <li><strong>Direct Export:</strong> Attempts to create a page directly in Notion (requires OAuth setup)</li>
          <li><strong>Markdown Export:</strong> Downloads a markdown file for manual import</li>
        </ul>
        
        <h3 className="text-lg font-semibold mt-4 mb-2">To Enable Direct Export:</h3>
        <ol className="space-y-1 text-sm list-decimal list-inside">
          <li>Set up Notion OAuth integration</li>
          <li>Implement user connection flow</li>
          <li>Store access tokens securely</li>
          <li>Update API to use real tokens</li>
        </ol>
      </div>

      <div className="mt-6">
        <a 
          href="/"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          ← Back to Main App
        </a>
      </div>
    </div>
  );
}