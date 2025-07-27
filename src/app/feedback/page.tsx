'use client';

import React from 'react';
import { Navigation } from '@/components/ui/navigation';
import { MessageCircle, Mail, Clock } from 'lucide-react';

export default function FeedbackPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="p-4 bg-indigo-100 rounded-full">
              <MessageCircle className="w-8 h-8 text-indigo-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            We'd Love Your Feedback
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            TweetToCourse is still in beta, and your feedback helps us improve. 
            Share your thoughts, suggestions, or report any issues you've encountered.
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left Column - Why Feedback Matters */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Help Us Build Something Amazing
              </h2>
              <p className="text-gray-600 mb-6">
                As a beta product, we're constantly evolving based on user feedback. 
                Your insights are invaluable in shaping the future of TweetToCourse.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2"></div>
                  <div>
                    <h3 className="font-medium text-gray-900">Feature Requests</h3>
                    <p className="text-gray-600 text-sm">Tell us what features would make your experience better</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2"></div>
                  <div>
                    <h3 className="font-medium text-gray-900">Bug Reports</h3>
                    <p className="text-gray-600 text-sm">Help us identify and fix issues you've encountered</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2"></div>
                  <div>
                    <h3 className="font-medium text-gray-900">General Feedback</h3>
                    <p className="text-gray-600 text-sm">Share your overall experience and suggestions</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Contact Information */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Get in Touch
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Mail className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">Email Us</h3>
                    <a 
                      href="mailto:tlaliketumile2@gmail.com"
                      className="text-indigo-600 hover:text-indigo-700 transition-colors"
                    >
                      tlaliketumile2@gmail.com
                    </a>
                    <p className="text-gray-600 text-sm mt-1">
                      Send us your feedback, questions, or bug reports
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Clock className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">Response Time</h3>
                    <p className="text-gray-600 text-sm">
                      We typically respond within 6-8 hours during business days
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Email Button */}
              <div className="mt-8">
                <a
                  href="mailto:tlaliketumile2@gmail.com?subject=TweetToCourse Beta Feedback"
                  className="w-full inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Mail className="w-5 h-5 mr-2" />
                  Send Feedback Email
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* What to Include Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            What to Include in Your Feedback
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 font-bold text-lg">1</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Describe the Issue</h3>
              <p className="text-gray-600 text-sm">
                What happened? What were you trying to do when the issue occurred?
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 font-bold text-lg">2</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Steps to Reproduce</h3>
              <p className="text-gray-600 text-sm">
                If it's a bug, help us understand how to recreate the problem
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-purple-600 font-bold text-lg">3</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Your Environment</h3>
              <p className="text-gray-600 text-sm">
                Browser, device type, or any other relevant technical details
              </p>
            </div>
          </div>
        </div>

        {/* Thank You Section */}
        <div className="text-center mt-12">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Thank You for Helping Us Improve
          </h3>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Every piece of feedback helps us make TweetToCourse better for everyone. 
            We're grateful for your time and input as we continue to develop and refine the platform.
          </p>
        </div>
      </div>
    </div>
  );
}