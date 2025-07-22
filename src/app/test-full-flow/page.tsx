'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';

export default function TestFullFlowPage() {
  const { user, isLoaded } = useUser();
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testCourse = {
    id: 'test-course',
    title: 'Test Course for Export',
    modules: [
      {
        id: 'module-1',
        title: 'Test Module',
        summary: 'This is a test module for debugging exports',
        takeaways: ['Test takeaway 1', 'Test takeaway 2'],
        order: 1
      }
    ],
    metadata: {
      sourceType: 'thread',
      generatedAt: new Date().toISOString(),
      version: 1
    }
  };

  const testPDFExport = async () => {
    addResult('Starting PDF export test...');
    
    try {
      const response = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseData: testCourse }),
      });

      addResult(`PDF Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        addResult(`PDF Error: ${JSON.stringify(errorData)}`);
        return;
      }

      const blob = await response.blob();
      addResult(`PDF Success! Blob size: ${blob.size} bytes`);
      
      // Trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'test_course.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      addResult(`PDF Exception: ${error}`);
    }
  };

  const testMarketingPDFExport = async () => {
    addResult('Starting Marketing PDF export test...');
    
    const marketingAssets = {
      coldDMs: ['Test DM 1', 'Test DM 2'],
      adCopyTemplate: {
        facebook: 'Test Facebook ad',
        twitter: 'Test Twitter ad',
        instagram: 'Test Instagram ad'
      },
      spreadsheetTemplate: {
        description: 'Test spreadsheet',
        headers: ['Header 1', 'Header 2'],
        sampleData: [['Data 1', 'Data 2']]
      },
      bonusResource: {
        title: 'Test Bonus',
        type: 'checklist',
        content: ['Item 1', 'Item 2']
      }
    };
    
    try {
      const response = await fetch('/api/export-marketing-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          marketingAssets,
          courseTitle: testCourse.title
        }),
      });

      addResult(`Marketing PDF Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        addResult(`Marketing PDF Error: ${JSON.stringify(errorData)}`);
        return;
      }

      const blob = await response.blob();
      addResult(`Marketing PDF Success! Blob size: ${blob.size} bytes`);
      
      // Trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'test_marketing_assets.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      addResult(`Marketing PDF Exception: ${error}`);
    }
  };

  const testNotionExport = async () => {
    addResult('Starting Notion export test...');
    
    try {
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

      addResult(`Notion Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        addResult(`Notion Error: ${JSON.stringify(errorData)}`);
        return;
      }

      const blob = await response.blob();
      addResult(`Notion Success! Blob size: ${blob.size} bytes`);
      
      // Trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'test_course_notion.md';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      addResult(`Notion Exception: ${error}`);
    }
  };

  const testSimplePDF = async () => {
    addResult('Testing simple PDF endpoint...');
    
    try {
      const response = await fetch('/api/test-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      addResult(`Simple PDF Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        addResult(`Simple PDF Error: ${JSON.stringify(errorData)}`);
        return;
      }

      const blob = await response.blob();
      addResult(`Simple PDF Success! Blob size: ${blob.size} bytes`);
      
      // Trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'simple_test.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      addResult(`Simple PDF Exception: ${error}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  if (!isLoaded) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Export Testing Page</h1>
        
        {/* User Info */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
          {user ? (
            <div>
              <p><strong>User ID:</strong> {user.id}</p>
              <p><strong>Email:</strong> {user.emailAddresses[0]?.emailAddress}</p>
              <p><strong>Status:</strong> <span className="text-green-600">Authenticated</span></p>
            </div>
          ) : (
            <p className="text-red-600">Not authenticated - Please sign in</p>
          )}
        </div>

        {/* Test Buttons */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">Export Tests</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={testSimplePDF}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Test Simple PDF
            </button>
            <button
              onClick={testPDFExport}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            >
              Test Course PDF
            </button>
            <button
              onClick={testMarketingPDFExport}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              Test Marketing PDF
            </button>
            <button
              onClick={testNotionExport}
              className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
            >
              Test Notion Export
            </button>
          </div>
          <button
            onClick={clearResults}
            className="mt-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Clear Results
          </button>
        </div>

        {/* Test Results */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <div className="bg-gray-100 p-4 rounded max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500">No tests run yet. Click a test button above.</p>
            ) : (
              <div className="space-y-1">
                {testResults.map((result, index) => (
                  <div key={index} className="text-sm font-mono">
                    {result}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}