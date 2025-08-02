'use client';

import { useState } from 'react';

export default function TestPDFPage() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [testResult, setTestResult] = useState<string>('');

  const testSimplePDF = async () => {
    setIsDownloading(true);
    setTestResult('');
    
    try {
      console.log('🧪 Testing simple PDF download...');
      
      const response = await fetch('/api/test-pdf-download');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'test-simple.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setTestResult('✅ Simple PDF download test successful!');
      
    } catch (error) {
      console.error('❌ Simple PDF test failed:', error);
      setTestResult(`❌ Simple PDF test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const testCoursePDF = async () => {
    setIsDownloading(true);
    setTestResult('');
    
    try {
      console.log('🧪 Testing course PDF download...');
      
      const mockCourse = {
        id: 'test-course-123',
        title: 'Test Course for PDF Generation',
        modules: [
          {
            title: 'Module 1: Introduction',
            summary: 'This is a test module to verify PDF generation works correctly.',
            takeaways: [
              'Understanding PDF generation',
              'Testing download functionality',
              'Ensuring proper formatting'
            ],
            estimatedReadTime: 5
          },
          {
            title: 'Module 2: Advanced Topics',
            summary: 'This module covers more advanced concepts for testing purposes.',
            takeaways: [
              'Advanced PDF features',
              'Error handling',
              'User experience optimization'
            ],
            estimatedReadTime: 8
          }
        ],
        metadata: {
          originalContent: 'Test tweet content for PDF generation'
        }
      };
      
      const response = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          courseId: mockCourse.id,
          courseData: mockCourse,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'test-course.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setTestResult('✅ Course PDF download test successful!');
      
    } catch (error) {
      console.error('❌ Course PDF test failed:', error);
      setTestResult(`❌ Course PDF test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">PDF Download Test Page</h1>
          
          <div className="space-y-6">
            <div className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Simple PDF Test</h2>
              <p className="text-gray-600 mb-4">
                Test basic PDF generation and download functionality with a simple document.
              </p>
              <button
                onClick={testSimplePDF}
                disabled={isDownloading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDownloading ? 'Testing...' : 'Test Simple PDF Download'}
              </button>
            </div>
            
            <div className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Course PDF Test</h2>
              <p className="text-gray-600 mb-4">
                Test the full course PDF generation with mock course data, including modules and formatting.
              </p>
              <button
                onClick={testCoursePDF}
                disabled={isDownloading}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDownloading ? 'Testing...' : 'Test Course PDF Download'}
              </button>
            </div>
            
            {testResult && (
              <div className="border rounded-lg p-6 bg-gray-50">
                <h3 className="text-lg font-semibold mb-2">Test Result</h3>
                <p className="font-mono text-sm">{testResult}</p>
              </div>
            )}
            
            <div className="border rounded-lg p-6 bg-blue-50">
              <h3 className="text-lg font-semibold mb-2">Instructions</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Click either test button to trigger a PDF download</li>
                <li>Check your browser's downloads folder for the PDF files</li>
                <li>Open the PDFs to verify they contain the expected content</li>
                <li>Check the browser console for detailed logging information</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
