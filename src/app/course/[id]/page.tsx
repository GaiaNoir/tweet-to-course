'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { CourseDisplay } from '@/components/ui/course-display';
import { Course, UserProfile } from '@/types';
import Link from 'next/link';

export default function CoursePage() {
  const params = useParams();
  const courseId = params.id as string;
  const [course, setCourse] = useState<Course | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load course from localStorage
        const storedCourse = localStorage.getItem(`course-${courseId}`);
        if (storedCourse) {
          const parsedCourse = JSON.parse(storedCourse);
          setCourse(parsedCourse);
        } else {
          setError('Course not found. Please generate a new course.');
          setLoading(false);
          return;
        }

        // Fetch user profile
        try {
          console.log('Fetching user profile...');
          const response = await fetch('/api/user/profile');
          console.log('User profile response status:', response.status);
          
          if (response.ok) {
            const profileData = await response.json();
            console.log('User profile loaded:', profileData);
            setUserProfile(profileData);
          } else {
            const errorData = await response.text();
            console.error('Failed to fetch user profile:', response.status, response.statusText, errorData);
            
            // Fallback: If user can generate courses, assume they're Pro
            // This is a temporary workaround for the profile API issue
            console.log('Using fallback Pro user profile');
            setUserProfile({
              id: 'temp-id',
              email: 'user@example.com',
              subscriptionTier: 'pro',
              usageCount: 0,
              monthlyUsageCount: 0,
              monthlyUsageResetDate: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              lastActive: new Date().toISOString(),
            });
          }
        } catch (profileError) {
          console.error('Error loading user profile:', profileError);
          // Fallback for Pro user
          console.log('Using fallback Pro user profile due to error');
          setUserProfile({
            id: 'temp-id',
            email: 'user@example.com',
            subscriptionTier: 'pro',
            usageCount: 0,
            monthlyUsageCount: 0,
            monthlyUsageResetDate: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            lastActive: new Date().toISOString(),
          });
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading course:', err);
        setError('Failed to load course data.');
        setLoading(false);
      }
    };

    if (courseId) {
      loadData();
    }
  }, [courseId]);

  const handleTitleUpdate = (newTitle: string) => {
    if (course) {
      const updatedCourse = { ...course, title: newTitle };
      setCourse(updatedCourse);
      // Update localStorage
      localStorage.setItem(`course-${courseId}`, JSON.stringify(updatedCourse));
    }
  };

  const handleRegenerate = async () => {
    if (!course?.metadata?.originalContent) {
      alert('Cannot regenerate: Original content not found');
      return;
    }

    try {
      const response = await fetch('/api/generate-course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: course.metadata.originalContent,
          type: course.metadata.sourceType === 'tweet' ? 'url' : 'text',
          regenerate: true,
        }),
      });

      const result = await response.json();

      if (result.success && result.course) {
        setCourse(result.course);
        // Update localStorage
        localStorage.setItem(`course-${courseId}`, JSON.stringify(result.course));
      } else {
        throw new Error(result.error?.message || 'Failed to regenerate course');
      }
    } catch (err) {
      console.error('Regeneration error:', err);
      alert('Failed to regenerate course. Please try again.');
    }
  };

  const handleExportPDF = async () => {
    if (!course) return;

    try {
      console.log('Starting PDF export...');
      const response = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseData: course }),
      });

      console.log('PDF export response status:', response.status);
      console.log('PDF export response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json();
        console.error('PDF export error data:', errorData);
        if (response.status === 401) {
          alert('Please sign in to export courses as PDF.');
          return;
        }
        if (errorData.upgradeRequired) {
          alert('PDF export is only available for Pro subscribers. Please upgrade your plan.');
          return;
        }
        throw new Error(errorData.error || 'Failed to export PDF');
      }

      // Create download link
      const blob = await response.blob();
      console.log('PDF blob size:', blob.size);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${course.title.replace(/[^a-zA-Z0-9]/g, '_')}_course.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      console.log('PDF download triggered successfully');
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Failed to export PDF. Please try again.');
    }
  };



  const handleExportComplete = async () => {
    if (!course) return;

    try {
      const response = await fetch('/api/export-package', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseData: course }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create complete package');
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${course.title.replace(/[^a-zA-Z0-9]/g, '_')}_complete_package.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Complete package export error:', err);
      alert('Failed to create complete package. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">❌</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Course Not Found</h1>
          <p className="text-gray-600 mb-6">
            {error || 'The course you\'re looking for doesn\'t exist or has expired.'}
          </p>
          <Link
            href="/"
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Generate New Course
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-indigo-600">
              TweetToCourse
            </Link>
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Generate New Course
              </Link>
              <Link
                href="/pricing"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Upgrade
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <CourseDisplay
          course={course}
          userProfile={userProfile}
          onTitleUpdate={handleTitleUpdate}
          onRegenerate={handleRegenerate}
          onExportPDF={handleExportPDF}
          onExportComplete={handleExportComplete}
          isRegenerating={false}
          isExporting={false}
          isExportingComplete={false}
          isNotionConnected={false}
          onNotionConnectionRequired={() => {
            alert('Please connect your Notion account in your dashboard.');
          }}
        />
      </main>
    </div>
  );
}