'use client';

import React, { useState } from 'react';
import { Course, UserProfile } from '@/types';
import { NotionExport } from './notion-export';
import { MarketingAssetsGenerator } from './marketing-assets-generator';
import { useAuth } from '@/hooks/useAuth';
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

  // Extract course overview and learning outcomes from the first module content if available
  const extractCourseOverview = (content: string) => {
    const lines = content.split('\n');
    const overviewStart = lines.findIndex(line => 
      line.includes('Course Overview') || 
      line.includes('## Course Overview') ||
      line.includes('# Course Overview')
    );
    const targetAudienceStart = lines.findIndex(line => 
      line.includes('Target Audience') || 
      line.includes('**Target Audience:**') ||
      line.includes('**Target Audience**')
    );
    const learningOutcomesStart = lines.findIndex(line => 
      line.includes('Learning Outcomes') || 
      line.includes('**Learning Outcomes:**') ||
      line.includes('**Learning Outcomes**')
    );
    const estimatedTimeStart = lines.findIndex(line => 
      line.includes('Estimated Time') || 
      line.includes('**Estimated Time:**') ||
      line.includes('**Estimated Time**')
    );
    
    let overview = '';
    let targetAudience = '';
    let learningOutcomes: string[] = [];
    let estimatedTime = '';
    
    if (overviewStart !== -1) {
      const overviewEnd = Math.min(
        targetAudienceStart !== -1 ? targetAudienceStart : lines.length,
        learningOutcomesStart !== -1 ? learningOutcomesStart : lines.length
      );
      overview = lines.slice(overviewStart + 1, overviewEnd)
        .join('\n')
        .trim()
        .replace(/^\*\*.*?\*\*:?\s*/, '') // Remove any bold formatting
        .replace(/^#+\s*/, ''); // Remove any header formatting
    }
    
    if (targetAudienceStart !== -1) {
      const targetEnd = Math.min(
        learningOutcomesStart !== -1 ? learningOutcomesStart : lines.length,
        estimatedTimeStart !== -1 ? estimatedTimeStart : lines.length
      );
      const targetLines = lines.slice(targetAudienceStart, targetEnd);
      targetAudience = targetLines
        .join('\n')
        .replace(/\*\*Target Audience:?\*\*\s*/, '')
        .replace(/Target Audience:?\s*/, '')
        .trim();
    }
    
    if (learningOutcomesStart !== -1) {
      const outcomesEnd = estimatedTimeStart !== -1 ? estimatedTimeStart : lines.length;
      const outcomesLines = lines.slice(learningOutcomesStart + 1, outcomesEnd);
      learningOutcomes = outcomesLines
        .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•') || line.trim().startsWith('*'))
        .map(line => line.replace(/^[-•*]\s*/, '').trim())
        .filter(line => line.length > 0);
    }
    
    if (estimatedTimeStart !== -1) {
      const timeLines = lines.slice(estimatedTimeStart, estimatedTimeStart + 2);
      estimatedTime = timeLines
        .join(' ')
        .replace(/\*\*Estimated Time:?\*\*\s*/, '')
        .replace(/Estimated Time:?\s*/, '')
        .trim();
    }
    
    return { overview, targetAudience, learningOutcomes, estimatedTime };
  };

  const courseInfo = extractCourseOverview(course.modules[0]?.summary || '');
  
  // Debug logging to see what's being extracted
  console.log('First module content:', course.modules[0]?.summary?.substring(0, 500));
  console.log('Extracted course info:', courseInfo);

  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">
      {/* Course Header */}
      <div className="border-b border-gray-200 pb-6 sm:pb-8 mb-6 sm:mb-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 sm:gap-6">
          <div className="flex-1">
            {isEditingTitle ? (
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="w-full text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 border-2 border-indigo-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
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
                <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors leading-tight">
                  {course.title}
                  <span className="ml-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    ✏️
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Click to edit title</p>
              </div>
            )}
            
            {/* Course Overview */}
            {courseInfo.overview && (
              <div className="mt-4 sm:mt-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">Course Overview</h2>
                <p className="text-base sm:text-lg text-gray-700 leading-relaxed">{courseInfo.overview}</p>
              </div>
            )}
            
            {/* Target Audience */}
            {courseInfo.targetAudience && (
              <div className="mt-6">
                <p className="text-gray-700">
                  <span className="font-semibold text-gray-900">Target Audience:</span> {courseInfo.targetAudience}
                </p>
              </div>
            )}
            
            {/* Learning Outcomes */}
            {courseInfo.learningOutcomes.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-3">Learning Outcomes:</h3>
                <ul className="space-y-2">
                  {courseInfo.learningOutcomes.map((outcome, index) => (
                    <li key={index} className="flex items-start gap-3 text-gray-700">
                      <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-semibold mt-0.5 flex-shrink-0">
                        {index + 1}
                      </span>
                      <span>{outcome}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Estimated Time */}
            {courseInfo.estimatedTime && (
              <div className="mt-6">
                <p className="text-gray-700">
                  <span className="font-semibold text-gray-900">Estimated Time:</span> {courseInfo.estimatedTime}
                </p>
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:min-w-[200px]">
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
        <div className="mt-4 sm:mt-6 flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
          <span>📅 Generated {new Date(course.metadata.generatedAt).toLocaleDateString()}</span>
          <span>📚 {course.modules.length} modules</span>
          <span className="hidden sm:inline">🔗 Source: {course.metadata.sourceType}</span>
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
      <div className="space-y-6 sm:space-y-8">
        {course.modules
          .sort((a, b) => a.order - b.order)
          .map((module, index) => {
            const isExpanded = expandedModules.has(module.id);
            const wordCount = Math.ceil(module.summary.length / 5);
            
            return (
              <div
                key={module.id}
                className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                {/* Module Header */}
                <div className="p-4 sm:p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start sm:items-center gap-3 sm:gap-4 mb-3">
                        <span className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-lg flex-shrink-0 mt-1 sm:mt-0">
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1 leading-tight">
                            {module.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                            Hook sentence that connects to original insight and promises value
                          </p>
                        </div>
                      </div>
                      
                      <div 
                        className="cursor-pointer hover:text-indigo-600 transition-colors"
                        onClick={() => toggleModuleExpansion(module.id)}
                      >
                        <p className="text-indigo-600 font-medium flex items-center gap-2">
                          Click to read full content ({wordCount} words)
                          <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Module Content (Expandable) */}
                {isExpanded && (
                  <div className="bg-white">
                    <div className="p-8 space-y-8">
                      {/* Complete Module Content */}
                      <div>
                        <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                          <span className="text-2xl">📖</span>
                          Complete Module Content
                        </h4>
                        
                        <div className="prose prose-lg prose-gray max-w-none">
                          <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
                            <ReactMarkdown
                              components={{
                                h1: ({children}) => <h1 className="text-2xl font-bold text-gray-900 mb-4">{children}</h1>,
                                h2: ({children}) => <h2 className="text-xl font-bold text-gray-900 mb-3 mt-6">{children}</h2>,
                                h3: ({children}) => <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-4">{children}</h3>,
                                p: ({children}) => <p className="mb-4 text-gray-700 leading-relaxed">{children}</p>,
                                ul: ({children}) => <ul className="mb-4 space-y-2 ml-4">{children}</ul>,
                                ol: ({children}) => <ol className="mb-4 space-y-2 ml-4 list-decimal">{children}</ol>,
                                li: ({children}) => <li className="text-gray-700 leading-relaxed">{children}</li>,
                                strong: ({children}) => <strong className="font-semibold text-gray-900">{children}</strong>,
                                em: ({children}) => <em className="italic text-gray-700">{children}</em>,
                                blockquote: ({children}) => <blockquote className="border-l-4 border-indigo-200 pl-4 italic text-gray-600 my-4">{children}</blockquote>,
                              }}
                            >
                              {module.summary}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>

                      {/* Key Takeaways */}
                      {module.takeaways && module.takeaways.length > 0 && (
                        <div>
                          <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                            <span className="text-2xl">🎯</span>
                            Key Takeaways
                          </h4>
                          <div className="grid gap-4">
                            {module.takeaways.map((takeaway, takeawayIndex) => (
                              <div
                                key={takeawayIndex}
                                className="flex items-start gap-4 p-4 bg-indigo-50 rounded-lg border border-indigo-100"
                              >
                                <span className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5 flex-shrink-0">
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