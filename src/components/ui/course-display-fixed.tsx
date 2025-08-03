'use client';

import React, { useState } from 'react';
import { Course, UserProfile } from '@/types';
import { MarketingAssetsGenerator } from './marketing-assets-generator';
import { useAuth } from '@/components/auth/AuthProvider';

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
  onNotionConnectionRequiredAction?: () => void;
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
  onNotionConnectionRequiredAction = () => {}
}: CourseDisplayProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(course.title);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  const [showMarketing, setShowMarketing] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [isDownloadingMarkdown, setIsDownloadingMarkdown] = useState(false);

  const { user, profile, loading } = useAuth();
  const canExportNotion = profile?.subscription_status === 'pro' || profile?.subscription_status === 'lifetime';
  const isFreeTier = !profile?.subscription_status || profile?.subscription_status === 'free';

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

  const toggleModuleExpansion = (moduleId: number) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const handleDownloadPDF = async () => {
    if (isDownloadingPDF) return;
    setIsDownloadingPDF(true);
    
    try {
      const response = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          courseId: course.id,
          courseData: { ...course, modules: Array.isArray(course.modules) ? course.modules : [] },
        }),
      });

      if (!response.ok) throw new Error(`Failed to generate PDF: ${response.status}`);

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const filename = `${course.title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_')}_course.pdf`;
      
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = filename;
      downloadLink.style.display = 'none';
      
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('PDF download error:', error);
      alert(`Failed to download PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const handleDownloadMarkdown = async () => {
    if (isDownloadingMarkdown) return;
    setIsDownloadingMarkdown(true);
    
    try {
      const response = await fetch('/api/export-markdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ courseId: course.id, courseData: course }),
      });

      if (!response.ok) throw new Error(`Failed to generate markdown: ${response.status}`);

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const filename = `${course.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}.md`;
      
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = filename;
      downloadLink.style.display = 'none';
      
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Markdown download error:', error);
      alert(`Failed to download markdown: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDownloadingMarkdown(false);
    }
  };

  const handleExportComplete = () => {
    onExportComplete?.();
  };

  return (
    <div className="max-w-5xl mx-auto bg-gray-50 min-h-screen">
      {/* Professional Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-8 py-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              {isEditingTitle ? (
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="text-3xl font-bold text-gray-900 bg-transparent border-b-2 border-indigo-500 focus:outline-none focus:border-indigo-600 flex-1 py-2"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleTitleSave();
                      if (e.key === 'Escape') handleTitleCancel();
                    }}
                    autoFocus
                  />
                  <button
                    onClick={handleTitleSave}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleTitleCancel}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-bold text-gray-900 leading-tight">{course.title}</h1>
                  {onTitleUpdate && (
                    <button
                      onClick={() => setIsEditingTitle(true)}
                      className="text-gray-400 hover:text-indigo-600 transition-colors p-2 rounded-lg hover:bg-gray-50"
                      title="Edit title"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
              
              {/* Course Meta Information */}
              <div className="flex items-center gap-6 mt-4 text-gray-600">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  {course.modules.length} Modules
                </span>
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {course.modules.reduce((total, module) => total + (module.estimatedReadTime || 5), 0)} min read
                </span>
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {course.modules.reduce((total, module) => total + (module.takeaways?.length || 0), 0)} Key Points
                </span>
              </div>
            </div>
          </div>

          {/* Original Content Card */}
          {course.metadata?.originalContent && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Source Content</h3>
                  <blockquote className="text-blue-800 leading-relaxed italic">
                    "{course.metadata.originalContent}"
                  </blockquote>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                disabled={isRegenerating}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm hover:shadow-md"
              >
                {isRegenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Regenerating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Regenerate Course
                  </>
                )}
              </button>
            )}

            <button
              onClick={handleDownloadPDF}
              disabled={isDownloadingPDF}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm hover:shadow-md"
            >
              {isDownloadingPDF ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Generating PDF...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PDF
                </>
              )}
            </button>

            {canExportNotion && (
              <button
                onClick={handleDownloadMarkdown}
                disabled={isDownloadingMarkdown}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm hover:shadow-md"
              >
                {isDownloadingMarkdown ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Markdown
                  </>
                )}
              </button>
            )}

            {onExportComplete && (
              <button
                onClick={handleExportComplete}
                disabled={isExportingComplete}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm hover:shadow-md"
              >
                {isExportingComplete ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Complete Package
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="px-8 py-8 space-y-8">
        {/* Course Modules */}
        {course.modules.map((module, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Module Header */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </span>
                    <h2 className="text-2xl font-bold text-gray-900">{module.title}</h2>
                  </div>
                  <p className="text-gray-600 leading-relaxed">{module.summary}</p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {module.estimatedReadTime || 5} min read
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {module.takeaways?.length || 0} key takeaways
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => toggleModuleExpansion(index)}
                  className="ml-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg 
                    className={`w-6 h-6 transform transition-transform ${expandedModules.has(index) ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Module Content - Only show takeaways since CourseModule doesn't have content property */}
            {expandedModules.has(index) && (
              <div className="p-8">
                {/* Key Takeaways */}
                {module.takeaways && module.takeaways.length > 0 && (
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-indigo-900 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Key Takeaways
                    </h3>
                    <div className="space-y-3">
                      {module.takeaways.map((takeaway, takeawayIndex) => (
                        <div
                          key={takeawayIndex}
                          className="flex items-start gap-3 p-4 bg-white rounded-lg border border-indigo-100"
                        >
                          <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5 flex-shrink-0">
                            {takeawayIndex + 1}
                          </span>
                          <p className="text-gray-800 leading-relaxed">{takeaway}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Marketing Assets Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Marketing Assets</h2>
            <p className="text-xl text-gray-600">Generate professional marketing materials for your course</p>
          </div>
          <MarketingAssetsGenerator
            courseTitle={course.title}
            courseContent={course.modules.map(m => `${m.title}: ${m.summary}\n${m.takeaways?.join('\n') || ''}`).join('\n\n')}
            originalTweet={course.metadata.originalContent || ''}
          />
        </div>

        {/* Footer */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600">
            <div>
              Course generated with AI • {course.modules.length} modules • 
              {course.modules.reduce((total, module) => total + (module.estimatedReadTime || 5), 0)} min total read time
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => window.location.href = '/pricing'}
                className="text-indigo-600 hover:text-indigo-700 underline"
              >
                Upgrade for more features
              </button>
              <button
                onClick={() => window.print()}
                className="text-gray-600 hover:text-gray-700 underline"
              >
                Print Course
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
