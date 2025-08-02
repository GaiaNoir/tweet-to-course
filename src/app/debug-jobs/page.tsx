'use client';

import { useState, useEffect } from 'react';

interface Job {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  error_message?: string;
  user_id: string;
}

export default function DebugJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string>('');

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      // This would need to be implemented as an API endpoint
      const response = await fetch('/api/debug-jobs');
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
      } else {
        setMessage('Failed to fetch jobs');
      }
    } catch (error) {
      setMessage(`Error fetching jobs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const processStuckJobs = async () => {
    setIsProcessing(true);
    setMessage('');
    
    try {
      console.log('🔧 Triggering manual job processing...');
      
      const response = await fetch('/api/process-jobs-manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        setMessage(`✅ Manual processing completed: ${result.processedSuccessfully}/${result.totalJobs} jobs processed successfully`);
        // Refresh jobs list
        await fetchJobs();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        setMessage(`❌ Manual processing failed: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Manual processing error:', error);
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerSingleJob = async () => {
    setIsProcessing(true);
    setMessage('');
    
    try {
      console.log('🔧 Triggering single job processing...');
      
      const response = await fetch('/api/process-jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        setMessage(`✅ Single job processing: ${result.message}`);
        // Refresh jobs list
        await fetchJobs();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        setMessage(`❌ Single job processing failed: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Single job processing error:', error);
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Job Processing Debug Page</h1>
          
          <div className="space-y-6">
            {/* Control Panel */}
            <div className="border rounded-lg p-6 bg-blue-50">
              <h2 className="text-xl font-semibold mb-4">Job Processing Controls</h2>
              <div className="flex gap-4 flex-wrap">
                <button
                  onClick={fetchJobs}
                  disabled={isLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'Loading...' : 'Refresh Jobs'}
                </button>
                
                <button
                  onClick={triggerSingleJob}
                  disabled={isProcessing}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isProcessing ? 'Processing...' : 'Process Single Job'}
                </button>
                
                <button
                  onClick={processStuckJobs}
                  disabled={isProcessing}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50"
                >
                  {isProcessing ? 'Processing...' : 'Process All Stuck Jobs'}
                </button>
              </div>
              
              {message && (
                <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                  <p className="font-mono text-sm">{message}</p>
                </div>
              )}
            </div>
            
            {/* Jobs List */}
            <div className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Jobs</h2>
              
              {jobs.length === 0 ? (
                <p className="text-gray-500">No jobs found or failed to load jobs.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Job ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Updated
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Error
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {jobs.map((job) => (
                        <tr key={job.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {job.id.substring(0, 8)}...
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              job.status === 'completed' ? 'bg-green-100 text-green-800' :
                              job.status === 'failed' ? 'bg-red-100 text-red-800' :
                              job.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {job.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(job.created_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(job.updated_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-red-600 max-w-xs truncate">
                            {job.error_message || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            {/* Instructions */}
            <div className="border rounded-lg p-6 bg-yellow-50">
              <h3 className="text-lg font-semibold mb-2">How to Use This Debug Page</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li><strong>Refresh Jobs:</strong> Reload the jobs list to see current status</li>
                <li><strong>Process Single Job:</strong> Process one pending job (good for testing)</li>
                <li><strong>Process All Stuck Jobs:</strong> Reset and process all stuck jobs</li>
                <li>Check the browser console for detailed logs during processing</li>
                <li>Jobs stuck in "processing" for more than 5 minutes will be reset to "pending"</li>
              </ul>
            </div>
            
            {/* Quick Fix */}
            <div className="border rounded-lg p-6 bg-green-50">
              <h3 className="text-lg font-semibold mb-2">🚀 Quick Fix for Stuck Course Generation</h3>
              <p className="text-gray-700 mb-3">
                If your course generation is stuck in "processing", click the <strong>"Process All Stuck Jobs"</strong> button above. 
                This will reset any stuck jobs and process them immediately.
              </p>
              <p className="text-sm text-gray-600">
                Note: This debug page requires the jobs API endpoints to be implemented. 
                For now, you can manually trigger job processing using the buttons above.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
