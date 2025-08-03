'use client';

import React, { useState } from 'react';
import { Course, UserProfile } from '@/types';
import { MarketingAssetsGenerator } from './marketing-assets-generator';
import { useAuth } from '@/components/auth/AuthProvider';
import ReactMarkdown from 'react-markdown';
import { safeMarkdownComponents } from '@/lib/markdown-utils';
import { ContentInspector } from '@/components/debug/content-inspector';

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

interface HeadingProps {
  level: number;
  children: React.ReactNode;
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
        throw new Error(`Failed to generate PDF: ${response.status}`);
      }

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
      console.log('🔄 Starting markdown export for course:', course.title);
      
      const response = await fetch('/api/export-markdown', {
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
        const errorText = await response.text();
        console.error('❌ Markdown export failed:', response.status, errorText);
        throw new Error(`Failed to generate Markdown: ${response.status} - ${errorText}`);
      }

      const markdownContent = await response.text();
      console.log('✅ Markdown content generated:', markdownContent.length, 'characters');
      
      // Validate content
      if (!markdownContent || markdownContent.length < 100) {
        throw new Error('Generated markdown content is too short or empty');
      }

      // Create and download file
      const blob = new Blob([markdownContent], { type: 'text/markdown; charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const filename = `${course.title.replace(/[^a-z0-9\s\-_]/gi, '').replace(/\s+/g, '_').toLowerCase()}.md`;
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ Markdown file downloaded successfully:', filename);
      
      // Show success message
      if (typeof window !== 'undefined' && 'showNotification' in window) {
        // If you have a notification system
        (window as any).showNotification('Markdown exported successfully!', 'success');
      }
      
    } catch (error) {
      console.error('❌ Markdown download failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Show user-friendly error message
      if (errorMessage.includes('401') || errorMessage.includes('Authentication')) {
        alert('Please sign in to download the markdown file.');
      } else if (errorMessage.includes('403') || errorMessage.includes('subscription')) {
        alert('Markdown export is available for Pro users. Please upgrade your subscription.');
      } else {
        alert(`Failed to download Markdown: ${errorMessage}\n\nPlease try again or contact support if the issue persists.`);
      }
    } finally {
      setIsDownloadingMarkdown(false);
    }
  };

  const handleExportComplete = async () => {
    if (onExportComplete) {
      onExportComplete();
    }
  };

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

  // Extract course overview and learning outcomes from the first module content if available
  const extractCourseOverview = (content: string) => {
    if (!content) return { overview: '', targetAudience: '', learningOutcomes: [], estimatedTime: '' };
    
    const lines = content.split('\n');
    let overview = '';
    let targetAudience = '';
    let learningOutcomes: string[] = [];
    let estimatedTime = '';
    
    // Simple extraction logic
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (line.includes('overview') || line.includes('introduction')) {
        overview = lines[i + 1] || '';
      } else if (line.includes('target audience') || line.includes('who should')) {
        targetAudience = lines[i + 1] || '';
      } else if (line.includes('learning outcomes') || line.includes('you will learn')) {
        for (let j = i + 1; j < lines.length && j < i + 6; j++) {
          if (lines[j].trim().startsWith('-') || lines[j].trim().startsWith('•')) {
            learningOutcomes.push(lines[j].trim().substring(1).trim());
          }
        }
      } else if (line.includes('estimated time') || line.includes('duration')) {
        estimatedTime = lines[i + 1] || '';
      }
    }
    
    return { overview, targetAudience, learningOutcomes, estimatedTime };
  };

  // Get course info from the first module if available
  const firstModuleContent = course.modules && course.modules.length > 0 ? course.modules[0].summary : '';
  const courseInfo = firstModuleContent 
    ? extractCourseOverview(firstModuleContent) 
    : {
        overview: '',
        targetAudience: '',
        learningOutcomes: [],
        estimatedTime: ''
      };

  // Custom markdown components with proper typing
  const markdownComponents = safeMarkdownComponents;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-8">
      {/* Professional Course Header */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Title and Action Bar */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Title Section */}
            <div className="flex-1">
              <div className="mb-2">
                {isEditingTitle ? (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="flex-1 px-4 py-3 text-xl font-bold bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight text-gray-900">
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
                  📚 {course.modules.length} modules
                </span>
                <span className="flex items-center gap-1">
                  ⏱️ {course.modules.reduce((total, module) => total + (module.estimatedReadTime || 5), 0)} min read
                </span>
                {profile && (
                  <span className="flex items-center gap-1">
                    👤 
                    <span className={`font-medium ${isFreeTier ? 'text-orange-600' : 'text-green-600'}`}>
                      {profile.subscription_status?.toUpperCase()} Plan
                    </span>
                  </span>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 lg:min-w-[300px]">
              <button
                onClick={onRegenerate}
                disabled={isRegenerating}
                className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2 shadow-sm"
              >
                {isRegenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
                    Exporting...
                  </>
                ) : (
                  <>
                    📄 Export PDF
                  </>
                )}
              </button>

              {!isFreeTier && (
                <button
                  onClick={handleDownloadMarkdown}
                  disabled={isDownloadingMarkdown}
                  className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2 shadow-sm"
                >
                  {isDownloadingMarkdown ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Exporting...
                    </>
                  ) : (
                    <>
                      📝 Download Markdown
                    </>
                  )}
                </button>
              )}

              <button
                onClick={handleExportComplete}
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
                    Exporting...
                  </>
                ) : (
                  <>
                    📦 Complete Package
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Course Overview */}
        <div className="p-6 sm:p-8">
          {/* Extract and display course overview from first module */}
          {course.modules.length > 0 && (
            <div className="mb-8">
              <div className="prose prose-lg max-w-none">
                <ReactMarkdown 
                  components={{
                    ...markdownComponents,
                    h1: ({ children, ...props }) => (
                      <h1 className="text-3xl font-bold mb-6 text-gray-900 border-b-2 border-green-500 pb-3" {...props}>
                        {children}
                      </h1>
                    ),
                    h2: ({ children, ...props }) => (
                      <h2 className="text-2xl font-bold mb-4 text-gray-800 mt-8 flex items-center gap-3" {...props}>
                        <span className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {String(children).includes('Overview') ? '📋' : 
                           String(children).includes('Target') ? '👥' : 
                           String(children).includes('Learning') ? '🎯' : 
                           String(children).includes('Time') ? '⏱️' : '📌'}
                        </span>
                        {children}
                      </h2>
                    ),
                    h3: ({ children, ...props }) => (
                      <h3 className="text-xl font-semibold mb-3 text-gray-700 mt-6" {...props}>
                        {children}
                      </h3>
                    ),
                    p: ({ children, ...props }) => (
                      <p className="mb-4 text-gray-700 leading-relaxed" {...props}>
                        {children}
                      </p>
                    ),
                    ul: ({ children, ...props }) => (
                      <ul className="list-none mb-6 space-y-3" {...props}>
                        {children}
                      </ul>
                    ),
                    li: ({ children, ...props }) => (
                      <li className="flex items-start gap-3 text-gray-700 bg-green-50 rounded-lg p-3 border border-green-200" {...props}>
                        <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0">
                          ✓
                        </span>
                        <div className="flex-1">{children}</div>
                      </li>
                    ),
                    strong: ({ children, ...props }) => (
                      <strong className="font-bold text-gray-900" {...props}>
                        {children}
                      </strong>
                    ),
                  }}
                >
                  {/* Extract and display the course overview section from first module */}
                  {(() => {
                    const firstModuleContent = course.modules[0].summary;
                    // Extract only the overview section (everything before the main content)
                    const overviewMatch = firstModuleContent.match(/^([\s\S]*?)(?=### 📖 Complete Module Content|$)/);
                    return overviewMatch ? overviewMatch[1].trim() : firstModuleContent.substring(0, 1000);
                  })()}
                </ReactMarkdown>
              </div>
            </div>
          )}
          
          {/* Course Stats Dashboard */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
            <h3 className="text-xl font-bold text-green-900 mb-6 flex items-center gap-3">
              <span className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center">
                📊
              </span>
              Course Statistics
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-white rounded-xl p-4 border border-green-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl font-bold text-green-800 mb-1">{course.modules.length}</div>
                <div className="text-sm text-green-600 font-medium">Modules</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-green-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl font-bold text-green-800 mb-1">
                  {course.modules.reduce((total, module) => total + (module.estimatedReadTime || 8), 0)}
                </div>
                <div className="text-sm text-green-600 font-medium">Minutes</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-green-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl font-bold text-green-800 mb-1">
                  {course.modules.reduce((total, module) => total + (module.takeaways?.length || 0), 0)}
                </div>
                <div className="text-sm text-green-600 font-medium">Key Points</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-green-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl font-bold text-green-800 mb-1">
                  {course.metadata?.sourceType ? 
                    course.metadata.sourceType.charAt(0).toUpperCase() + course.metadata.sourceType.slice(1) : 
                    'Tweet'
                  }
                </div>
                <div className="text-sm text-green-600 font-medium">Source</div>
              </div>
            </div>
            
            {/* Course Progress Overview */}
            <div className="mt-6 pt-6 border-t border-green-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-green-800">Course Completion</span>
                <span className="text-sm font-bold text-green-900">Ready to Start</span>
              </div>
              <div className="w-full h-3 bg-green-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full w-0 transition-all duration-1000 hover:w-full"></div>
              </div>
              <p className="text-xs text-green-600 mt-2 text-center">Click on modules below to begin learning</p>
            </div>
          </div>
        </div>
      </div>

      {/* Course Modules */}
      <div className="space-y-6">
        {course.modules.map((module, index) => {
          const isExpanded = expandedModules.has(index);
          return (
            <div key={index} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              {/* Module Header */}
              <div 
                className="module-header bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-blue-200 p-6 sm:p-8 cursor-pointer hover:from-blue-100 hover:via-indigo-100 hover:to-purple-100 transition-all duration-300"
                onClick={() => toggleModuleExpansion(index)}
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-4 mb-4">
                      <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-md">
                        Module {index + 1}
                      </span>
                      <span className="bg-white text-blue-600 px-3 py-1 rounded-full text-sm font-medium border border-blue-200 shadow-sm">
                        ⏱️ {module.estimatedReadTime || 8} min read
                      </span>
                      <span className="bg-white text-purple-600 px-3 py-1 rounded-full text-sm font-medium border border-purple-200 shadow-sm">
                        🎯 {module.takeaways?.length || 0} takeaways
                      </span>
                      <span className="bg-white text-green-600 px-3 py-1 rounded-full text-sm font-medium border border-green-200 shadow-sm">
                        📝 {Math.round(module.summary.length / 100) / 10}k chars
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 leading-tight">
                      {module.title}
                    </h2>
                    <p className="text-gray-700 leading-relaxed text-base sm:text-lg line-clamp-3">
                      {/* Extract a clean summary from the module content */}
                      {module.summary.split('\n')[0].replace(/^#+\s*/, '').substring(0, 200)}
                      {module.summary.length > 200 ? '...' : ''}
                    </p>
                    
                    {/* Progress indicator */}
                    <div className="mt-4 flex items-center gap-3">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                          style={{ width: isExpanded ? '100%' : '0%' }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-500 font-medium">
                        {isExpanded ? 'Expanded' : 'Click to expand'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl ${isExpanded ? 'rotate-180 scale-110' : 'hover:scale-105'}`}>
                      <svg 
                        className="w-6 h-6" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M19 9l-7 7-7-7" 
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Module Content */}
              {isExpanded && (
                <div className="p-6 sm:p-8">
                  {/* Content Debug Info (for development) */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-semibold text-yellow-800 mb-2">Debug Info:</h4>
                      <p className="text-sm text-yellow-700">
                        Content length: {module.summary.length} characters
                      </p>
                      <p className="text-sm text-yellow-700">
                        Takeaways: {module.takeaways?.length || 0}
                      </p>
                      <details className="mt-2">
                        <summary className="text-sm text-yellow-700 cursor-pointer">Raw Content Preview</summary>
                        <pre className="text-xs text-yellow-600 mt-2 whitespace-pre-wrap max-h-32 overflow-y-auto">
                          {module.summary.substring(0, 500)}...
                        </pre>
                      </details>
                    </div>
                  )}

                  {/* Module Content with Professional Formatting */}
                  <div className="course-content module-content">
                    <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-6 sm:p-8 mb-8 border border-gray-200">
                      <ReactMarkdown 
                        components={{
                          ...markdownComponents,
                          h1: ({ children, ...props }) => (
                            <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-gray-900 border-b-3 border-blue-500 pb-4" {...props}>
                              {children}
                            </h1>
                          ),
                          h2: ({ children, ...props }) => (
                            <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800 mt-8 flex items-start gap-4" {...props}>
                              <span className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0 mt-1">
                                {String(children).includes('Overview') ? '📋' : 
                                 String(children).includes('Content') ? '📖' : 
                                 String(children).includes('Takeaway') ? '🎯' : 
                                 String(children).includes('Module') ? '📚' : '📌'}
                              </span>
                              <span className="flex-1">{children}</span>
                            </h2>
                          ),
                          h3: ({ children, ...props }) => (
                            <h3 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-700 mt-8 border-l-4 border-blue-400 pl-6 bg-blue-50 py-3 rounded-r-lg" {...props}>
                              {children}
                            </h3>
                          ),
                          h4: ({ children, ...props }) => (
                            <h4 className="text-lg sm:text-xl font-medium mb-3 text-gray-600 mt-6" {...props}>
                              {children}
                            </h4>
                          ),
                          p: ({ children, ...props }) => (
                            <p className="mb-6 text-gray-700 leading-relaxed text-base sm:text-lg" {...props}>
                              {children}
                            </p>
                          ),
                          ul: ({ children, ...props }) => (
                            <ul className="list-none mb-8 space-y-4" {...props}>
                              {children}
                            </ul>
                          ),
                          ol: ({ children, ...props }) => (
                            <ol className="list-none mb-8 space-y-4" {...props}>
                              {children}
                            </ol>
                          ),
                          li: ({ children, ...props }) => (
                            <li className="flex items-start gap-4 text-gray-700 bg-white rounded-xl p-4 sm:p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:border-blue-300" {...props}>
                              <span className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-1 flex-shrink-0">
                                ✓
                              </span>
                              <div className="flex-1 leading-relaxed">{children}</div>
                            </li>
                          ),
                          strong: ({ children, ...props }) => (
                            <strong className="font-bold text-gray-900 bg-yellow-100 px-2 py-1 rounded-md" {...props}>
                              {children}
                            </strong>
                          ),
                          blockquote: ({ children, ...props }) => (
                            <blockquote className="border-l-4 border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 pl-6 pr-4 py-6 italic text-gray-700 my-8 rounded-r-xl shadow-sm" {...props}>
                              <div className="text-blue-600 text-4xl mb-2">"</div>
                              {children}
                            </blockquote>
                          ),
                          code: ({ children, ...props }) => (
                            <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded-md text-sm font-mono border border-gray-200" {...props}>
                              {children}
                            </code>
                          ),
                          pre: ({ children, ...props }) => (
                            <pre className="bg-gray-900 text-gray-100 p-6 rounded-xl overflow-x-auto mb-6 border border-gray-700 shadow-lg" {...props}>
                              {children}
                            </pre>
                          ),
                        }}
                      >
                        {/* Display the FULL module content, not just a truncated version */}
                        {module.summary}
                      </ReactMarkdown>
                    </div>
                  </div>

                  {/* Key Takeaways Section */}
                  {module.takeaways && module.takeaways.length > 0 && (
                    <div className="mt-10">
                      <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-3xl p-6 sm:p-8 border border-indigo-200 shadow-lg">
                        <div className="text-center mb-8">
                          <div className="inline-flex items-center gap-3 bg-white rounded-full px-6 py-3 shadow-md border border-indigo-200 mb-4">
                            <span className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full flex items-center justify-center text-lg">
                              💡
                            </span>
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                              Key Takeaways
                            </h3>
                          </div>
                          <p className="text-gray-600 text-sm sm:text-base">
                            Essential insights from Module {index + 1}
                          </p>
                        </div>
                        
                        <div className="grid gap-6">
                          {module.takeaways.map((takeaway, takeawayIndex) => (
                            <div
                              key={takeawayIndex}
                              className="takeaway-card flex items-start gap-5 p-6 bg-white rounded-2xl border border-indigo-100 shadow-md hover:shadow-xl transition-all duration-300"
                            >
                              <div className="flex-shrink-0">
                                <span className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full flex items-center justify-center text-lg font-bold shadow-lg">
                                  {takeawayIndex + 1}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                {takeaway.includes(' - ') ? (
                                  <>
                                    <h4 className="font-bold text-gray-900 mb-3 text-lg sm:text-xl leading-tight">
                                      {takeaway.split(' - ')[0]}
                                    </h4>
                                    <p className="text-gray-700 leading-relaxed text-base sm:text-lg">
                                      {takeaway.split(' - ').slice(1).join(' - ')}
                                    </p>
                                  </>
                                ) : (
                                  <p className="font-semibold text-gray-900 leading-relaxed text-base sm:text-lg">
                                    {takeaway}
                                  </p>
                                )}
                                
                                {/* Action indicator */}
                                <div className="mt-4 flex items-center gap-2 text-sm text-indigo-600">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                  </svg>
                                  <span className="font-medium">Apply this insight</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Summary stats */}
                        <div className="mt-8 pt-6 border-t border-indigo-200">
                          <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <span className="w-4 h-4 bg-indigo-500 rounded-full"></span>
                              <span>{module.takeaways.length} key insights</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-4 h-4 bg-purple-500 rounded-full"></span>
                              <span>Ready to implement</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Module Progress and Metadata */}
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex flex-wrap gap-6 text-sm text-gray-500">
                        {module.estimatedReadTime && (
                          <span className="flex items-center gap-2 font-medium bg-gray-100 px-3 py-1 rounded-full">
                            <span className="text-lg">⏱️</span>
                            {module.estimatedReadTime} min read
                          </span>
                        )}
                        <span className="flex items-center gap-2 font-medium bg-blue-100 px-3 py-1 rounded-full text-blue-700">
                          <span className="text-lg">📝</span>
                          Module {index + 1} of {course.modules.length}
                        </span>
                        <span className="flex items-center gap-2 font-medium bg-purple-100 px-3 py-1 rounded-full text-purple-700">
                          <span className="text-lg">📊</span>
                          {module.takeaways?.length || 0} key takeaways
                        </span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500 font-medium">Progress:</span>
                        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
                            style={{ width: `${((index + 1) / course.modules.length) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {Math.round(((index + 1) / course.modules.length) * 100)}%
                        </span>
                      </div>
                    </div>
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
      
      {/* Debug Content Inspector */}
      <ContentInspector course={course} />
    </div>
  );
}
