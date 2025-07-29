'use client';

import React, { useState } from 'react';
import { Course, UserProfile } from '@/types';
import { NotionExport } from './notion-export';
import { MarketingAssetsGenerator } from './marketing-assets-generator';
import { useAuth } from '@/hooks/useAuth';

interface CourseDisplayProps {
  course: Course;
  onTitleUpdate?: (newTitle: string) => void;
  onRegenerate?: () => void;
  onExportPDF?: () => void;
  onExportComplete?: () => void;
  isRegenerating?: boolean;
  isExporting?: boolean;
  isExportingComplete?: boolean;
  isNotionConnected?: boolean;
  onNotionConnectionRequired?: () => void;
}

export function CourseDisplay({
  course,
  onTitleUpdate,
  onRegenerate,
  onExportPDF,
  onExportComplete,
  isRegenerating = false,
  isExporting = false,
  isExportingComplete = false,
  isNotionConnected = false,
  onNotionConnectionRequired = () => {}
}: CourseDisplayProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(course.title);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  // Use the hook to get user profile and permissions
  const { user: userProfile, loading, canExportNotion, isFreeTier } = useAuth();

  const handleTitleSave = () => {
    if (editedTitle.trim() && editedTitle !== course.title) {
      onTitleUpdate?.(editedTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setEditedTitle(course.title);
    setIsEditingTitle(false);
  };

  const toggleModuleExpansion = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };
  
  // Debug logging
  console.log('CourseDisplay - User Profile:', userProfile);
  console.log('CourseDisplay - Can Export Notion:', canExportNotion);
  console.log('CourseDisplay - Is Free Tier:', isFreeTier);

  // Show loading state while checking user permissions
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 max-w-4xl mx-auto">
      {/* Course Header */}
      <div className="border-b border-gray-200 pb-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            {isEditingTitle ? (
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="flex-1 text-2xl md:text-3xl font-bold text-gray-900 border-2 border-indigo-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTitleSave();
                    if (e.key === 'Escape') handleTitleCancel();
                  }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleTitleSave}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleTitleCancel}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="group cursor-pointer" onClick={() => setIsEditingTitle(true)}>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                  {course.title}
                  <span className="ml-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    ✏️
                  </span>
                </h1>
                <p className="text-sm text-gray-500 mt-1">Click to edit title</p>
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
            >
              {isRegenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  Regenerating...
                </>
              ) : (
                <>
                  🔄 Regenerate
                </>
              )}
            </button>
            
            <button
              onClick={onExportPDF}
              disabled={isExporting}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Exporting...
                </>
              ) : (
                <>
                  📄 Download PDF
                </>
              )}
            </button>
            
            {/* Complete Export Button - Premium Feature */}
            <button
              onClick={onExportComplete}
              disabled={isExportingComplete}
              className={`px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                isFreeTier 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600' 
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isExportingComplete ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating Package...
                </>
              ) : (
                <>
                  🎁 Complete Package
                  {isFreeTier && <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full ml-1">NEW</span>}
                </>
              )}
            </button>


          </div>
        </div>
        
        {/* Course Metadata */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
          <span>📅 Generated {new Date(course.metadata.generatedAt).toLocaleDateString()}</span>
          <span>📚 {course.modules.length} modules</span>
          <span>🔗 Source: {course.metadata.sourceType}</span>
          {userProfile && (
            <span className={`font-medium ${isFreeTier ? 'text-orange-600' : 'text-green-600'}`}>
              {userProfile.subscriptionTier.toUpperCase()} Plan
            </span>
          )}
          {isFreeTier && (
            <span className="text-orange-600 font-medium">⚠️ Free tier - PDF includes watermark</span>
          )}
        </div>
      </div>

      {/* Course Modules */}
      <div className="space-y-6">
        {course.modules
          .sort((a, b) => a.order - b.order)
          .map((module, index) => {
            const isExpanded = expandedModules.has(module.id);
            
            return (
              <div
                key={module.id}
                className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Module Header */}
                <div
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleModuleExpansion(module.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-semibold text-sm">
                          {index + 1}
                        </span>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {module.title}
                        </h3>
                      </div>
                      <p className="text-gray-600 leading-relaxed">
                        {module.summary}
                      </p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Module Content (Expandable) */}
                {isExpanded && (
                  <div className="px-6 pb-6 border-t border-gray-100 bg-gray-50">
                    <div className="pt-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <span>🎯</span>
                        Key Takeaways
                      </h4>
                      <ul className="space-y-2">
                        {module.takeaways.map((takeaway, takeawayIndex) => (
                          <li
                            key={takeawayIndex}
                            className="flex items-start gap-3 text-gray-700"
                          >
                            <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-semibold mt-0.5 flex-shrink-0">
                              {takeawayIndex + 1}
                            </span>
                            <span className="leading-relaxed">{takeaway}</span>
                          </li>
                        ))}
                      </ul>
                      {module.estimatedReadTime && (
                        <div className="mt-4 text-sm text-gray-500 flex items-center gap-2">
                          <span>⏱️</span>
                          Estimated read time: {module.estimatedReadTime} minutes
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* Marketing Assets Generator - PROMINENT SECTION */}
      <div className="mt-12 pt-8 border-t-4 border-purple-200">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">🚀 Ready to Market Your Course?</h2>
          <p className="text-xl text-gray-600">Generate professional marketing materials in seconds!</p>
        </div>
        <MarketingAssetsGenerator
          courseTitle={course.title}
          courseContent={course.modules.map(m => `${m.title}: ${m.summary}\n${m.takeaways.join('\n')}`).join('\n\n')}
          originalTweet={course.metadata.originalContent || ''}
        />
      </div>

      {/* Export Options */}
      {canExportNotion && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <NotionExport
            courseId={course.id}
            courseTitle={course.title}
            courseData={course}
            isNotionConnected={isNotionConnected}
            onConnectionRequired={onNotionConnectionRequired}
          />
        </div>
      )}

      {/* Footer Actions */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-500">
            <p>
              Course generated with AI • {course.modules.length} modules • 
              {course.modules.reduce((total, module) => total + (module.estimatedReadTime || 5), 0)} min read
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => window.location.href = '/pricing'}
              className="text-sm text-indigo-600 hover:text-indigo-700 underline"
            >
              Upgrade for more features
            </button>
            <button
              onClick={() => window.print()}
              className="text-sm text-gray-600 hover:text-gray-700 underline"
            >
              Print Course
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}