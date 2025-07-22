'use client';

import { useState } from 'react';
import { MarketingAssetsGenerator } from '@/components/ui/marketing-assets-generator';

export default function TestMarketingPage() {
  const testCourseTitle = "How to Build a Successful Twitter Presence";
  const testCourseContent = `
Module 1: Setting Up Your Profile for Success
Learn how to optimize your Twitter profile to attract the right audience and make a strong first impression.
- Craft a compelling bio that clearly states your value proposition
- Choose a professional profile picture that builds trust
- Use a header image that reinforces your brand message

Module 2: Content Strategy That Converts
Discover the types of content that drive engagement and build a loyal following on Twitter.
- Share valuable insights and actionable tips in your niche
- Use storytelling to make your content more relatable and memorable
- Balance promotional content with value-driven posts (80/20 rule)
  `;
  
  const testOriginalTweet = "🧵 How I grew my Twitter from 0 to 10K followers in 6 months (and you can too)";

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Marketing Assets Generator Test</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Data</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Course Title:</strong> {testCourseTitle}</p>
            <p><strong>Original Tweet:</strong> {testOriginalTweet}</p>
            <p><strong>Course Content:</strong> {testCourseContent.substring(0, 200)}...</p>
          </div>
        </div>

        <MarketingAssetsGenerator
          courseTitle={testCourseTitle}
          courseContent={testCourseContent}
          originalTweet={testOriginalTweet}
        />
      </div>
    </div>
  );
}