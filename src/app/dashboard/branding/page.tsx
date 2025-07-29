'use client';

import React from 'react';
import { Navigation } from '@/components/ui/navigation';
import { BrandingSettings } from '@/components/ui/branding-settings';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function BrandingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Custom Branding
          </h1>
          <p className="text-gray-600">
            Customize your course exports with your own logo, colors, and branding. 
            These settings will be applied to all your PDF exports and course materials.
          </p>
        </div>

        {/* Branding Settings */}
        <BrandingSettings />

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">
            Branding Tips
          </h3>
          <ul className="text-blue-800 space-y-2 text-sm">
            <li>• Use high-quality PNG or SVG logos for best results</li>
            <li>• Choose colors that represent your brand and are easy to read</li>
            <li>• Keep your footer text concise and professional</li>
            <li>• Your branding will be applied to all future course exports</li>
          </ul>
        </div>
      </div>
    </div>
  );
}