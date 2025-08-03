'use client';

import React, { useState } from 'react';
import { Course, UserProfile } from '@/types';
import { MarketingAssetsGenerator } from './marketing-assets-generator';
import { useAuth } from '@/components/auth/AuthProvider';
import ReactMarkdown from 'react-markdown';

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
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  const [showMarketing, setShowMarketing] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [isDownloadingMarkdown, setIsDownloadingMarkdown] = useState(false);

  // Use the hook to get user profile and permissions
  const { user, profile, loading } = useAuth();
  
  // Derive permissions from profile data
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
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          courseId: course.id,
          courseData: {
            ...course,
            modules: Array.isArray(course.modules) ? course.modules : []
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to generate PDF`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${course.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('PDF download failed:', error);
      alert('Failed to download PDF. Please try again.');
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
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          courseId: course.id,
          courseData: course,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to generate Markdown`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${course.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.md`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Markdown download failed:', error);
      alert('Failed to download Markdown. Please try again.');
    } finally {
      setIsDownloadingMarkdown(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Professional Header Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Title Bar */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 p-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
            {/* Left: Title and Metadata */}
            <div className="flex-1">
              {/* Course Title */}
              <div className="mb-4">
                {isEditingTitle ? (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="flex-1 px-4 py-3 text-2xl font-bold bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter course title..."
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleTitleSave}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                      >
                        ✓ Save
                      </button>
                      <button
                        onClick={handleTitleCancel}
                        className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                      >
                        ✕ Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <h1 className="text-3xl lg:text-4xl font-bold leading-tight text-gray-900">
                      {course.title}
                    </h1>
                    {onTitleUpdate && (
                      <button
                        onClick={() => setIsEditingTitle(true)}
                        className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
                        title="Edit title"
                      >
                        ✏️
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              {/* Course Metadata */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <span>📅</span> Generated {new Date(course.metadata.generatedAt).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <span>📚</span> {course.modules.length} modules
                </span>
                <span className="flex items-center gap-1">
                  <span>⏱️</span> {course.modules.reduce((total, module) => total + (module.estimatedReadTime || 5), 0)} min read
                </span>
                {profile && (
                  <span className={`font-medium ${isFreeTier ? 'text-orange-600' : 'text-green-600'}`}>
                    {profile.subscription_status.toUpperCase()} Plan
                  </span>
                )}
              </div>
            </div>
            
            {/* Right: Action Buttons */}
            <div className="flex flex-wrap gap-3 lg:min-w-[400px] justify-end">
              <button
                onClick={onRegenerate}
                disabled={isRegenerating}
                className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:border-gray-400 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2 shadow-sm"
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
                onClick={handleDownloadPDF}
                disabled={isDownloadingPDF}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2 shadow-sm"
              >
                {isDownloadingPDF ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generating PDF...
                  </>
                ) : (
                  <>
                    📄 Download PDF
                  </>
                )}
              </button>
              
              {/* Markdown Download Button - Pro Feature */}
              {!isFreeTier && (
                <button
                  onClick={handleDownloadMarkdown}
                  disabled={isDownloadingMarkdown}
                  className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2 shadow-sm"
                >
                  {isDownloadingMarkdown ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Generating Markdown...
                    </>
                  ) : (
                    <>
                      📝 Download Markdown
                    </>
                  )}
                </button>
              )}
              
              {/* Complete Export Button - Premium Feature */}
              <button
                onClick={onExportComplete}
                disabled={isExportingComplete}
                className={`px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-sm ${
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
                    {isFreeTier && <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full ml-1">PRO</span>}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Course Overview Section */}
        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <span className="text-green-600">📋</span> Course Overview
          </h2>
          
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 space-y-6">
            {/* Course Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 border border-green-200 text-center">
                <div className="text-2xl font-bold text-green-800">{course.modules.length}</div>
                <div className="text-sm text-green-600">Modules</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-green-200 text-center">
                <div className="text-2xl font-bold text-green-800">
                  {course.modules.reduce((total, module) => total + (module.estimatedReadTime || 5), 0)}
                </div>
                <div className="text-sm text-green-600">Minutes</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-green-200 text-center">
                <div className="text-2xl font-bold text-green-800">
                  {course.modules.reduce((total, module) => total + (module.takeaways?.length || 0), 0)}
                </div>
                <div className="text-sm text-green-600">Key Points</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-green-200 text-center">
                <div className="text-2xl font-bold text-green-800">
                  {course.metadata.sourceType.charAt(0).toUpperCase() + course.metadata.sourceType.slice(1)}
                </div>
                <div className="text-sm text-green-600">Source</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Modules */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <span className="text-purple-600">📚</span> Course Modules
        </h2>
        
        {course.modules
          .sort((a, b) => a.order - b.order)
          .map((module, index) => {
            const isExpanded = expandedModules.has(parseInt(module.id));
            
            return (
              <div
                key={module.id}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
              >
                {/* Module Header */}
                <div className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start gap-4 mb-3">
                        <span className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2 leading-tight">
                            {module.title}
                          </h3>
                          <p className="text-gray-600 leading-relaxed">
                            {module.summary}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => toggleModuleExpansion(parseInt(module.id))}
                      className="px-4 py-2 bg-white border border-purple-200 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors font-medium flex items-center gap-2"
                    >
                      {isExpanded ? '📖 Collapse' : '👁️ Expand'}
                    </button>
                  </div>
                </div>

                {/* Module Content */}
                {isExpanded && (
                  <div className="p-6">
                    {/* Key Takeaways */}
                    {module.takeaways && module.takeaways.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <span className="text-purple-600">🎯</span> Key Takeaways
                        </h4>
                        <div className="space-y-3">
                          {module.takeaways.map((takeaway, takeawayIndex) => (
                            <div
                              key={takeawayIndex}
                              className="flex items-start gap-4 p-4 bg-purple-50 rounded-lg border border-purple-100"
                            >
                              <span className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5 flex-shrink-0">
                                {takeawayIndex + 1}
                              </span>
                              <div>
                                <p className="font-semibold text-gray-900 mb-1">
                                  {takeaway.split(' - ')[0]}
                                </p>
                                {takeaway.includes(' - ') && (
                                  <p className="text-gray-700 leading-relaxed">
                                    {takeaway.split(' - ').slice(1).join(' - ')}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Module Metadata */}
                    <div className="flex flex-wrap gap-6 text-sm text-gray-500 pt-6 border-t border-gray-200">
                      {module.estimatedReadTime && (
                        <span className="flex items-center gap-2 font-medium">
                          <span className="text-lg">⏱️</span>
                          {module.estimatedReadTime} min read
                        </span>
                      )}
                      <span className="flex items-center gap-2 font-medium">
                        <span className="text-lg">📝</span>
                        Module {index + 1} of {course.modules.length}
                      </span>
                      <span className="flex items-center gap-2 font-medium">
                        <span className="text-lg">📊</span>
                        {module.takeaways?.length || 0} key takeaways
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* Marketing Assets Generator */}
      <div className="mt-12 pt-8 border-t-4 border-purple-200">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">🚀 Ready to Market Your Course?</h2>
          <p className="text-xl text-gray-600">Generate professional marketing materials in seconds!</p>
        </div>
        <MarketingAssetsGenerator
          courseTitle={course.title}
          courseContent={course.modules.map(m => `${m.title}: ${m.summary}\n${m.takeaways?.join('\n') || ''}`).join('\n\n')}
          originalTweet={course.metadata.originalContent || ''}
        />
      </div>

      {/* Footer */}
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
              className="text-sm text-purple-600 hover:text-purple-700 underline"
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
