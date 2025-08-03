'use client';

import React, { useState } from 'react';
import { Course } from '@/types';

interface ContentInspectorProps {
  course: Course;
}

export function ContentInspector({ course }: ContentInspectorProps) {
  const [selectedModule, setSelectedModule] = useState(0);
  const [showRawContent, setShowRawContent] = useState(false);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const module = course.modules[selectedModule];

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-md z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm">Content Inspector</h3>
        <button
          onClick={() => setShowRawContent(!showRawContent)}
          className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
        >
          {showRawContent ? 'Hide' : 'Show'} Raw
        </button>
      </div>
      
      <div className="space-y-2 text-xs">
        <div>
          <label className="block font-medium">Module:</label>
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(Number(e.target.value))}
            className="w-full border border-gray-300 rounded px-2 py-1"
          >
            {course.modules.map((mod, index) => (
              <option key={index} value={index}>
                Module {index + 1}: {mod.title.substring(0, 30)}...
              </option>
            ))}
          </select>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="font-medium">Content Length:</span>
            <div className="text-green-600 font-bold">
              {module.summary.length.toLocaleString()} chars
            </div>
          </div>
          <div>
            <span className="font-medium">Takeaways:</span>
            <div className="text-blue-600 font-bold">
              {module.takeaways?.length || 0}
            </div>
          </div>
        </div>
        
        <div>
          <span className="font-medium">Word Count:</span>
          <div className="text-purple-600 font-bold">
            {module.summary.split(/\s+/).length.toLocaleString()} words
          </div>
        </div>
        
        <div>
          <span className="font-medium">Estimated Read:</span>
          <div className="text-orange-600 font-bold">
            {module.estimatedReadTime || 8} min
          </div>
        </div>
        
        {showRawContent && (
          <div className="mt-3">
            <span className="font-medium">Raw Content Preview:</span>
            <div className="bg-gray-100 p-2 rounded text-xs max-h-32 overflow-y-auto">
              <pre className="whitespace-pre-wrap">
                {module.summary.substring(0, 500)}
                {module.summary.length > 500 && '...'}
              </pre>
            </div>
          </div>
        )}
        
        <div className="pt-2 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            Total Course: {course.modules.reduce((total, mod) => total + mod.summary.length, 0).toLocaleString()} chars
          </div>
        </div>
      </div>
    </div>
  );
}