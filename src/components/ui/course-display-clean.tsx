'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { filterInvalidHtmlAttributes } from '@/lib/markdown-utils';
import { useAuth } from '@/components/auth/AuthProvider';

interface CourseInfo {
  title: string;
  overview: string;
  targetAudience: string;
  estimatedTime: string;
  learningOutcomes: string[];
}

interface Module {
  title: string;
  summary: string;
  content: string;
  keyTakeaways: string[];
  estimatedReadingTime: string;
}

interface CourseDisplayProps {
  course: {
    title: string;
    originalContent: string;
    courseInfo: CourseInfo;
    modules: Module[];
  };
  onRegenerate: () => void;
  isRegenerating: boolean;
  onExportPDF: () => void;
  isExportingPDF: boolean;
  onExportMarkdown: () => void;
  isExportingMarkdown: boolean;
  onExportComplete: () => void;
  isExportingComplete: boolean;
}

export function CourseDisplay({
  course,
  onRegenerate,
  isRegenerating,
  onExportPDF,
  isExportingPDF,
  onExportMarkdown,
  isExportingMarkdown,
  onExportComplete,
  isExportingComplete
}: CourseDisplayProps) {
  const { profile } = useAuth();
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  
  const isFreeTier = !profile || profile.subscription_status === 'free';
  const isPro = profile && (profile.subscription_status === 'pro' || profile.subscription_status === 'lifetime');

  const toggleModule = (index: number) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedModules(newExpanded);
  };

  const { courseInfo, modules } = course;

  return (
    <div className="max-w-7xl mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-700 dark:to-purple-700 p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          {/* Course Title and Info */}
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
              {courseInfo.title}
            </h1>
            
            {/* Original Content Preview */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-6">
              <h3 className="text-sm font-semibold text-white/90 mb-2">Original Content:</h3>
              <p className="text-white/80 text-sm leading-relaxed line-clamp-3">
                {course.originalContent}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:min-w-[200px]">
            <button
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
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
              onClick={onExportPDF}
              disabled={isExportingPDF}
              className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
            >
              {isExportingPDF ? (
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

            {isPro && (
              <button
                onClick={onExportMarkdown}
                disabled={isExportingMarkdown}
                className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
              >
                {isExportingMarkdown ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    📝 Download Markdown
                  </>
                )}
              </button>
            )}

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
      </div>

      {/* Course Information Section */}
      <div className="p-6 sm:p-8 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        {/* Course Overview */}
        {courseInfo.overview && (
          <div className="mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3">Course Overview</h2>
            <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 leading-relaxed">{courseInfo.overview}</p>
          </div>
        )}
        
        {/* Target Audience */}
        {courseInfo.targetAudience && (
          <div className="mb-6">
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-semibold text-gray-900 dark:text-white">Target Audience:</span> {courseInfo.targetAudience}
            </p>
          </div>
        )}
        
        {/* Learning Outcomes */}
        {courseInfo.learningOutcomes.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Learning Outcomes:</h3>
            <ul className="space-y-2">
              {courseInfo.learningOutcomes.map((outcome, index) => (
                <li key={index} className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                  <span className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center text-xs font-semibold mt-0.5 flex-shrink-0">
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
          <div>
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-semibold text-gray-900 dark:text-white">Estimated Time:</span> {courseInfo.estimatedTime}
            </p>
          </div>
        )}
      </div>

      {/* Course Modules */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {modules.map((module, index) => (
          <div key={index} className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center font-semibold text-sm">
                  {index + 1}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{module.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{module.estimatedReadingTime}</p>
                </div>
              </div>
              <button
                onClick={() => toggleModule(index)}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
              >
                {expandedModules.has(index) ? 'Collapse' : 'Expand'}
              </button>
            </div>

            <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">{module.summary}</p>

            {expandedModules.has(index) && (
              <div className="space-y-6">
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <ReactMarkdown
                    components={{
                      h1: ({ children, ...props }) => {
                        const cleanProps = filterInvalidHtmlAttributes(props);
                        return <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4" {...cleanProps}>{children}</h1>;
                      },
                      h2: ({ children, ...props }) => {
                        const cleanProps = filterInvalidHtmlAttributes(props);
                        return <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3" {...cleanProps}>{children}</h2>;
                      },
                      h3: ({ children, ...props }) => {
                        const cleanProps = filterInvalidHtmlAttributes(props);
                        return <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2" {...cleanProps}>{children}</h3>;
                      },
                      p: ({ children, ...props }) => {
                        const cleanProps = filterInvalidHtmlAttributes(props);
                        return <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed" {...cleanProps}>{children}</p>;
                      },
                      ul: ({ children, ...props }) => {
                        const cleanProps = filterInvalidHtmlAttributes(props);
                        return <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 mb-4" {...cleanProps}>{children}</ul>;
                      },
                      ol: ({ children, ...props }) => {
                        const cleanProps = filterInvalidHtmlAttributes(props);
                        return <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 mb-4" {...cleanProps}>{children}</ol>;
                      },
                      li: ({ children, ...props }) => {
                        const cleanProps = filterInvalidHtmlAttributes(props);
                        return <li className="text-gray-700 dark:text-gray-300" {...cleanProps}>{children}</li>;
                      },
                      strong: ({ children, ...props }) => {
                        const cleanProps = filterInvalidHtmlAttributes(props);
                        return <strong className="font-semibold text-gray-900 dark:text-white" {...cleanProps}>{children}</strong>;
                      },
                      em: ({ children, ...props }) => {
                        const cleanProps = filterInvalidHtmlAttributes(props);
                        return <em className="italic text-gray-700 dark:text-gray-300" {...cleanProps}>{children}</em>;
                      },
                      code: ({ children, ...props }) => {
                        const cleanProps = filterInvalidHtmlAttributes(props);
                        return <code className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-2 py-1 rounded text-sm font-mono" {...cleanProps}>{children}</code>;
                      },
                      blockquote: ({ children, ...props }) => {
                        const cleanProps = filterInvalidHtmlAttributes(props);
                        return <blockquote className="border-l-4 border-indigo-500 pl-4 italic text-gray-700 dark:text-gray-300 mb-4" {...cleanProps}>{children}</blockquote>;
                      },
                    }}
                  >
                    {module.content}
                  </ReactMarkdown>
                </div>

                {module.keyTakeaways.length > 0 && (
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
                    <h4 className="font-semibold text-indigo-900 dark:text-indigo-300 mb-3">Key Takeaways:</h4>
                    <ul className="space-y-2">
                      {module.keyTakeaways.map((takeaway, takeawayIndex) => (
                        <li key={takeawayIndex} className="flex items-start gap-2 text-indigo-800 dark:text-indigo-200">
                          <span className="text-indigo-500 dark:text-indigo-400 mt-1">•</span>
                          <span>{takeaway}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 dark:bg-gray-800 p-6 sm:p-8 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Course generated by TweetToCourse • {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
