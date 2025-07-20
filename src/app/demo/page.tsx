'use client';

import { useState } from 'react';
import { Navigation, CourseDisplay } from '@/components/ui';
import { SlideGenerator } from '@/components/ui/slide-generator';
import { CoverArtGenerator } from '@/components/ui/cover-art-generator';
import { Course, UserProfile } from '@/types';

// Demo course data
const demoCourse: Course = {
  id: 'demo-course-1',
  title: 'How to Build a Successful Twitter Presence',
  description: 'A comprehensive guide to growing your Twitter following and engagement',
  modules: [
    {
      id: 'module-1',
      title: 'Module 1: Setting Up Your Profile for Success',
      summary: 'Learn how to optimize your Twitter profile to attract the right audience and make a strong first impression.',
      takeaways: [
        'Craft a compelling bio that clearly states your value proposition',
        'Choose a professional profile picture that builds trust',
        'Use a header image that reinforces your brand message'
      ],
      order: 1,
      estimatedReadTime: 5
    },
    {
      id: 'module-2',
      title: 'Module 2: Content Strategy That Converts',
      summary: 'Discover the types of content that drive engagement and build a loyal following on Twitter.',
      takeaways: [
        'Share valuable insights and actionable tips in your niche',
        'Use storytelling to make your content more relatable and memorable',
        'Balance promotional content with value-driven posts (80/20 rule)'
      ],
      order: 2,
      estimatedReadTime: 7
    },
    {
      id: 'module-3',
      title: 'Module 3: Engagement and Community Building',
      summary: 'Master the art of building genuine relationships and fostering community engagement.',
      takeaways: [
        'Respond to comments and mentions within 2-4 hours when possible',
        'Join relevant conversations and add meaningful value',
        'Host Twitter Spaces or participate in community discussions'
      ],
      order: 3,
      estimatedReadTime: 6
    },
    {
      id: 'module-4',
      title: 'Module 4: Timing and Consistency',
      summary: 'Learn when and how often to post for maximum reach and engagement.',
      takeaways: [
        'Post during peak hours when your audience is most active',
        'Maintain a consistent posting schedule (3-5 tweets per day)',
        'Use scheduling tools to maintain consistency even when busy'
      ],
      order: 4,
      estimatedReadTime: 4
    },
    {
      id: 'module-5',
      title: 'Module 5: Analytics and Growth Optimization',
      summary: 'Track your performance and optimize your strategy based on data-driven insights.',
      takeaways: [
        'Monitor key metrics: engagement rate, follower growth, and click-through rates',
        'Analyze your top-performing content to identify patterns',
        'Adjust your strategy based on what resonates with your audience'
      ],
      order: 5,
      estimatedReadTime: 8
    }
  ],
  metadata: {
    sourceType: 'thread',
    sourceUrl: 'https://twitter.com/example/status/1234567890',
    generatedAt: new Date().toISOString(),
    version: 1
  }
};

const demoFreeUser: UserProfile = {
  id: 'demo-user-free',
  email: 'demo@example.com',
  subscriptionTier: 'free',
  usageCount: 1,
  createdAt: '2024-01-01T00:00:00Z',
  lastActive: new Date().toISOString()
};

const demoProUser: UserProfile = {
  id: 'demo-user-pro',
  email: 'pro@example.com',
  subscriptionTier: 'pro',
  usageCount: 15,
  createdAt: '2024-01-01T00:00:00Z',
  lastActive: new Date().toISOString()
};

export default function DemoPage() {
  const [userTier, setUserTier] = useState<'free' | 'pro'>('free');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [courseTitle, setCourseTitle] = useState(demoCourse.title);
  const [isNotionConnected, setIsNotionConnected] = useState(false);

  const currentUser = userTier === 'free' ? demoFreeUser : demoProUser;
  const currentCourse = { ...demoCourse, title: courseTitle };

  const handleTitleUpdate = (newTitle: string) => {
    setCourseTitle(newTitle);
    console.log('Title updated to:', newTitle);
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsRegenerating(false);
    console.log('Course regenerated');
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    // Simulate PDF export
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsExporting(false);
    console.log('PDF exported');
  };

  const handleExportNotion = async () => {
    setIsExporting(true);
    // Simulate Notion export
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsExporting(false);
    console.log('Exported to Notion');
  };

  const handleNotionConnectionRequired = () => {
    console.log('Notion connection required - would redirect to connect');
    // In real app, this would trigger the connection flow
    alert('This would redirect to connect your Notion account');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation />
      
      <main className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Course Display Demo
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            This is a demonstration of the course display component with all its features.
          </p>
          
          {/* User Tier Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className="text-gray-700 font-medium">Demo as:</span>
            <div className="flex bg-white rounded-lg p-1 shadow-sm">
              <button
                onClick={() => setUserTier('free')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  userTier === 'free'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Free User
              </button>
              <button
                onClick={() => setUserTier('pro')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  userTier === 'pro'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Pro User
              </button>
            </div>
          </div>

          {/* Notion Connection Toggle (for Pro users) */}
          {userTier === 'pro' && (
            <div className="flex items-center justify-center gap-4 mb-8">
              <span className="text-gray-700 font-medium">Notion Status:</span>
              <div className="flex bg-white rounded-lg p-1 shadow-sm">
                <button
                  onClick={() => setIsNotionConnected(false)}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    !isNotionConnected
                      ? 'bg-red-100 text-red-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Disconnected
                </button>
                <button
                  onClick={() => setIsNotionConnected(true)}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    isNotionConnected
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Connected
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Course Display */}
        <CourseDisplay
          course={currentCourse}
          userProfile={currentUser}
          onTitleUpdate={handleTitleUpdate}
          onRegenerate={handleRegenerate}
          onExportPDF={handleExportPDF}
          onExportNotion={handleExportNotion}
          isRegenerating={isRegenerating}
          isExporting={isExporting}
          isNotionConnected={isNotionConnected}
          onNotionConnectionRequired={handleNotionConnectionRequired}
        />

        {/* Slide Generator */}
        <div className="mt-16">
          <SlideGenerator
            course={currentCourse}
            userTier={currentUser.subscriptionTier}
          />
        </div>

        {/* Cover Art Generator */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              AI Cover Art Generator
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Generate professional cover art for your course using AI. Choose from different styles 
              and download in multiple formats.
            </p>
          </div>
          
          <CoverArtGenerator
            courseTitle={currentCourse.title}
            courseContent={currentCourse.modules.map(m => m.summary).join(' ')}
            onCoverArtGenerated={(coverArt) => {
              console.log('Generated cover art:', coverArt);
            }}
          />
        </div>

        {/* Feature Highlights */}
        <div className="mt-16 bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Component Features
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-indigo-600 text-xl">✏️</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Editable Title</h3>
              <p className="text-gray-600 text-sm">
                Click on the course title to edit it inline with save/cancel options
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-indigo-600 text-xl">📚</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Expandable Modules</h3>
              <p className="text-gray-600 text-sm">
                Click on any module to expand and see detailed takeaways
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-indigo-600 text-xl">🔄</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Regeneration</h3>
              <p className="text-gray-600 text-sm">
                Regenerate the course with loading states and user feedback
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-indigo-600 text-xl">📄</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">PDF Export</h3>
              <p className="text-gray-600 text-sm">
                Export courses to PDF with watermark logic for free users
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-indigo-600 text-xl">📝</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Notion Export</h3>
              <p className="text-gray-600 text-sm">
                Pro users can export to Notion, free users see upgrade prompts
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-indigo-600 text-xl">📱</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Responsive Design</h3>
              <p className="text-gray-600 text-sm">
                Fully responsive layout that works on mobile and desktop
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-indigo-600 text-xl">🎨</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Slide Generation</h3>
              <p className="text-gray-600 text-sm">
                Generate presentation slides with light/dark themes and custom branding
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-indigo-600 text-xl">📊</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Multi-Format Export</h3>
              <p className="text-gray-600 text-sm">
                Export slides as PDF or PowerPoint with speaker notes and branding
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-indigo-600 text-xl">🎯</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Interactive Features</h3>
              <p className="text-gray-600 text-sm">
                Optional quiz slides and call-to-action slides for engagement
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-indigo-600 text-xl">🖼️</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">AI Cover Art</h3>
              <p className="text-gray-600 text-sm">
                Generate professional cover images with DALL·E, auto-detect style, and download in multiple formats
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-indigo-600 text-xl">🎨</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Style Detection</h3>
              <p className="text-gray-600 text-sm">
                Automatically detects appropriate style (professional, playful, modern, minimalist) based on content
              </p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Try switching between Free and Pro user modes to see different features and restrictions.
          </p>
        </div>
      </main>
    </div>
  );
}