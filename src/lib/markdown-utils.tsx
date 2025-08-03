import React from 'react';
import type { Components } from 'react-markdown';

/**
 * Utility functions for ReactMarkdown components
 * Helps filter out invalid HTML attributes that ReactMarkdown might pass
 */

// List of invalid HTML attributes that ReactMarkdown might pass
const INVALID_HTML_ATTRIBUTES = [
  'ordered', // ReactMarkdown passes this to ol elements, but it's not a valid HTML attribute
  'depth',   // ReactMarkdown internal prop
  'index',   // ReactMarkdown internal prop
];

/**
 * Filters out invalid HTML attributes from props
 * @param props - The props object from ReactMarkdown
 * @returns Clean props object without invalid HTML attributes
 */
export function filterInvalidHtmlAttributes(props: any): any {
  const cleanProps = { ...props };
  
  INVALID_HTML_ATTRIBUTES.forEach(attr => {
    delete cleanProps[attr];
  });
  
  return cleanProps;
}

/**
 * Creates a safe ReactMarkdown component that filters invalid attributes
 * @param Component - The HTML component to render
 * @param className - CSS classes to apply
 * @returns A function that can be used in ReactMarkdown components
 */
export function createSafeMarkdownComponent(
  Component: string, 
  className?: string
) {
  return ({ children, ...props }: any) => {
    const cleanProps = filterInvalidHtmlAttributes(props);
    const componentProps = className ? { ...cleanProps, className } : cleanProps;
    
    return React.createElement(Component, componentProps, children);
  };
}

// Pre-built safe components for common use cases
export const safeMarkdownComponents: Partial<Components> = {
  h1: ({ children, ...props }: any) => {
    const cleanProps = filterInvalidHtmlAttributes(props);
    return <h1 className="text-2xl font-bold mb-4 text-gray-900" {...cleanProps}>{children}</h1>;
  },
  h2: ({ children, ...props }: any) => {
    const cleanProps = filterInvalidHtmlAttributes(props);
    return <h2 className="text-xl font-semibold mb-3 text-gray-800" {...cleanProps}>{children}</h2>;
  },
  h3: ({ children, ...props }: any) => {
    const cleanProps = filterInvalidHtmlAttributes(props);
    return <h3 className="text-lg font-medium mb-2 text-gray-700" {...cleanProps}>{children}</h3>;
  },
  p: ({ children, ...props }: any) => {
    const cleanProps = filterInvalidHtmlAttributes(props);
    return <p className="mb-4 text-gray-700 leading-relaxed" {...cleanProps}>{children}</p>;
  },
  ul: ({ children, ...props }: any) => {
    const cleanProps = filterInvalidHtmlAttributes(props);
    return <ul className="list-disc list-inside mb-4 space-y-2" {...cleanProps}>{children}</ul>;
  },
  ol: ({ children, ...props }: any) => {
    const cleanProps = filterInvalidHtmlAttributes(props);
    return <ol className="list-decimal list-inside mb-4 space-y-2" {...cleanProps}>{children}</ol>;
  },
  li: ({ children, ...props }: any) => {
    const cleanProps = filterInvalidHtmlAttributes(props);
    return <li className="text-gray-700" {...cleanProps}>{children}</li>;
  },
  strong: ({ children, ...props }: any) => {
    const cleanProps = filterInvalidHtmlAttributes(props);
    return <strong className="font-semibold text-gray-900" {...cleanProps}>{children}</strong>;
  },
  blockquote: ({ children, ...props }: any) => {
    const cleanProps = filterInvalidHtmlAttributes(props);
    return <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 my-4" {...cleanProps}>{children}</blockquote>;
  },
};