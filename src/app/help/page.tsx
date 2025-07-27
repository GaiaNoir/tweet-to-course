'use client';

import React from 'react';
import { Navigation } from '@/components/ui/navigation';
import { HelpCircle, Mail, Clock, AlertTriangle, CreditCard } from 'lucide-react';

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="p-4 bg-blue-100 rounded-full">
              <HelpCircle className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Help & Support
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get help with TweetToCourse and resolve any issues you might encounter.
          </p>
        </div>

        {/* Payment Issues Section - Highlighted */}
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-8 mb-8">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-orange-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Payment Issues? We've Got You Covered
              </h2>
              <div className="bg-white rounded-lg p-6 mb-6">
                <div className="flex items-start space-x-3 mb-4">
                  <CreditCard className="w-5 h-5 text-orange-600 mt-1" />
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">
                      Not on Pro Tier After Payment?
                    </h3>
                    <p className="text-gray-600 mb-4">
                      If you've completed your payment but your account still shows as Free tier, 
                      don't worry! This can happen due to processing delays or technical issues.
                    </p>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">What to do:</h4>
                      <ol className="list-decimal list-inside space-y-2 text-blue-800">
                        <li>Send us an email with your payment confirmation</li>
                        <li>Include your account email address</li>
                        <li>We'll manually upgrade your account to Pro</li>
                        <li>You'll receive confirmation once it's done</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg p-6">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">Contact Support</h3>
                      <a 
                        href="mailto:tlaliketumile2@gmail.com?subject=Pro Tier Upgrade Request - Payment Issue"
                        className="text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        tlaliketumile2@gmail.com
                      </a>
                      <p className="text-gray-600 text-sm mt-1">
                        Email us about your payment issue
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Clock className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">Quick Resolution</h3>
                      <p className="text-gray-600 text-sm">
                        We'll upgrade your account to Pro tier within 6-8 hours of receiving your email
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <a
                  href="mailto:tlaliketumile2@gmail.com?subject=Pro Tier Upgrade Request - Payment Issue&body=Hi,%0D%0A%0D%0AI've completed my payment for the Pro tier but my account is still showing as Free tier.%0D%0A%0D%0AAccount Email: [Your email here]%0D%0APayment Date: [Date of payment]%0D%0APayment Method: [Paystack/Card details]%0D%0A%0D%0APlease upgrade my account to Pro tier.%0D%0A%0D%0AThank you!"
                  className="w-full inline-flex items-center justify-center px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <Mail className="w-5 h-5 mr-2" />
                  Email Support About Payment Issue
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* General Help Sections */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Getting Started */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Getting Started
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">How to Generate a Course</h3>
                <p className="text-gray-600 text-sm">
                  Paste a Twitter thread URL or text content, and our AI will structure it into a mini-course.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Export Options</h3>
                <p className="text-gray-600 text-sm">
                  Pro users can export courses as PDF, Notion pages, or presentation slides.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Marketing Assets</h3>
                <p className="text-gray-600 text-sm">
                  Generate unlimited marketing materials including sales pages and promotional content.
                </p>
              </div>
            </div>
          </div>

          {/* Account & Billing */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Account & Billing
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Subscription Management</h3>
                <p className="text-gray-600 text-sm">
                  Manage your subscription, view usage, and update billing information in your dashboard.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Free vs Pro Tier</h3>
                <p className="text-gray-600 text-sm">
                  Free: 1 course/month with watermarks. Pro: Unlimited courses, no watermarks, all exports.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Cancellation</h3>
                <p className="text-gray-600 text-sm">
                  You can cancel anytime. Pro features remain active until your billing period ends.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Common Issues */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Common Issues & Solutions
          </h2>
          
          <div className="space-y-6">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-medium text-gray-900 mb-2">Course Generation Failed</h3>
              <p className="text-gray-600 text-sm mb-2">
                This usually happens with very short content or invalid URLs.
              </p>
              <p className="text-gray-600 text-sm">
                <strong>Solution:</strong> Ensure your Twitter thread has substantial content (at least 3-4 tweets) or try pasting the text directly.
              </p>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-medium text-gray-900 mb-2">Export Not Working</h3>
              <p className="text-gray-600 text-sm mb-2">
                PDF or Notion exports might fail due to browser restrictions or large content.
              </p>
              <p className="text-gray-600 text-sm">
                <strong>Solution:</strong> Try refreshing the page and exporting again. For large courses, break them into smaller sections.
              </p>
            </div>

            <div className="border-l-4 border-yellow-500 pl-4">
              <h3 className="font-medium text-gray-900 mb-2">Usage Limit Reached</h3>
              <p className="text-gray-600 text-sm mb-2">
                Free tier users are limited to 1 course generation per month.
              </p>
              <p className="text-gray-600 text-sm">
                <strong>Solution:</strong> Upgrade to Pro for unlimited generations or wait until next month.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Still Need Help?
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Email Support</h3>
              <p className="text-gray-600 text-sm mb-4">
                Get personalized help with any issue you're facing
              </p>
              <a
                href="mailto:tlaliketumile2@gmail.com?subject=TweetToCourse Support Request"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Contact Support
              </a>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Response Time</h3>
              <p className="text-gray-600 text-sm mb-4">
                We typically respond within 6-8 hours during business days
              </p>
              <div className="text-sm text-gray-500">
                Monday - Friday, 9 AM - 6 PM
              </div>
            </div>
          </div>
        </div>

        {/* Beta Notice */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm">
            <span className="italic mr-2">beta</span>
            TweetToCourse is in beta - your feedback helps us improve!
          </div>
        </div>
      </div>
    </div>
  );
}