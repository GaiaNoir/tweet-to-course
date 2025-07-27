'use client';

import React, { useState } from 'react';

export default function TestScraperPage() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const testScraper = async () => {
    if (!url.trim()) {
      setError('Please enter a Twitter/X URL');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/test-scraper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || 'Unknown error occurred');
      }
    } catch (err) {
      setError('Network error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Twitter Scraper Test
          </h1>
          
          <div className="space-y-6">
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                Twitter/X URL
              </label>
              <input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://twitter.com/username/status/123456789"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
              />
            </div>

            <button
              onClick={testScraper}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Testing...' : 'Test Scraper'}
            </button>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-red-800 font-medium">Error</h3>
                <p className="text-red-600 mt-1">{error}</p>
              </div>
            )}

            {result && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-green-800 font-medium mb-4">Scraping Result</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-700">Author:</h4>
                    <p className="text-gray-600">{result.author}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-700">Original Text:</h4>
                    <p className="text-gray-600 bg-gray-100 p-3 rounded border">
                      {result.originalText}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-700">Cleaned Text:</h4>
                    <p className="text-gray-600 bg-blue-50 p-3 rounded border">
                      {result.cleanedText}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-700">URL:</h4>
                    <p className="text-gray-600 break-all">{result.url}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-yellow-800 font-medium">Note</h3>
            <p className="text-yellow-700 mt-1">
              This is a test page for the Twitter scraper functionality. 
              The scraper tries to extract tweet content from public tweets.
              Some tweets may not be accessible due to privacy settings or rate limiting.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}