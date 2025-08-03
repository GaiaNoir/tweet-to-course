import React from 'react';
import Link from 'next/link';
import { Mail, MessageCircle, Book, ArrowLeft } from 'lucide-react';

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center space-x-3 group mb-8">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
              <span className="text-white font-bold text-xl">TC</span>
            </div>
            <span className="text-xl font-bold text-slate-900">TweetToCourse</span>
          </Link>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">How can we help?</h1>
          <p className="text-xl text-slate-600">Get support and find answers to common questions</p>
        </div>

        {/* Help Options */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-4">Email Support</h3>
            <p className="text-slate-600 mb-6">Get help directly from our support team</p>
            <a
              href="mailto:support@tweettocourse.com"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
            >
              Contact Support
            </a>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-4">Live Chat</h3>
            <p className="text-slate-600 mb-6">Chat with us in real-time</p>
            <button className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200">
              Start Chat
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Book className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-4">Documentation</h3>
            <p className="text-slate-600 mb-6">Browse our comprehensive guides</p>
            <Link
              href="/docs"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
            >
              View Docs
            </Link>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">How do I confirm my email address?</h3>
              <p className="text-slate-600">After signing up, check your email for a confirmation link. Click the link to verify your account. If you don't see the email, check your spam folder or request a new confirmation email.</p>
            </div>

            <div className="border-b border-slate-200 pb-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">What if I don't receive the confirmation email?</h3>
              <p className="text-slate-600">First, check your spam/junk folder. If it's not there, you can request a new confirmation email from the confirmation page. Make sure you entered the correct email address during signup.</p>
            </div>

            <div className="border-b border-slate-200 pb-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">How do I reset my password?</h3>
              <p className="text-slate-600">Go to the sign-in page and click "Forgot your password?". Enter your email address and we'll send you a reset link.</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">How do I change my email address?</h3>
              <p className="text-slate-600">Currently, you'll need to contact our support team to change your email address. We're working on adding this feature to your account settings.</p>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-12">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-500 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}