import React from 'react';
import Link from 'next/link';
import { MessageSquare, Star, ArrowLeft } from 'lucide-react';

export default function FeedbackPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center space-x-3 group mb-8">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
              <span className="text-white font-bold text-xl">TC</span>
            </div>
            <span className="text-xl font-bold text-slate-900">TweetToCourse</span>
          </Link>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">We'd love your feedback</h1>
          <p className="text-xl text-slate-600">Help us improve TweetToCourse with your thoughts and suggestions</p>
        </div>

        {/* Feedback Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <form className="space-y-6">
            <div>
              <label htmlFor="feedback-type" className="block text-sm font-medium text-slate-700 mb-2">
                What type of feedback is this?
              </label>
              <select
                id="feedback-type"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              >
                <option value="">Select feedback type</option>
                <option value="bug">Bug Report</option>
                <option value="feature">Feature Request</option>
                <option value="improvement">Improvement Suggestion</option>
                <option value="general">General Feedback</option>
              </select>
            </div>

            <div>
              <label htmlFor="rating" className="block text-sm font-medium text-slate-700 mb-2">
                How would you rate your experience?
              </label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="p-1 text-slate-300 hover:text-yellow-400 transition-colors"
                  >
                    <Star className="w-8 h-8 fill-current" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-2">
                Subject
              </label>
              <input
                id="subject"
                type="text"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="Brief description of your feedback"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-2">
                Your feedback
              </label>
              <textarea
                id="message"
                rows={6}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
                placeholder="Tell us more about your experience, suggestions, or issues you've encountered..."
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                Email (optional)
              </label>
              <input
                id="email"
                type="email"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="your@email.com"
              />
              <p className="text-xs text-slate-500 mt-1">We'll only use this to follow up on your feedback if needed</p>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <MessageSquare className="w-5 h-5" />
              <span>Send Feedback</span>
            </button>
          </form>
        </div>

        {/* Alternative Contact Methods */}
        <div className="mt-8 text-center">
          <p className="text-slate-600 mb-4">Prefer to reach out directly?</p>
          <div className="space-y-2">
            <p>
              <a href="mailto:feedback@tweettocourse.com" className="text-indigo-600 hover:text-indigo-500 font-medium">
                feedback@tweettocourse.com
              </a>
            </p>
            <p>
              <a href="https://twitter.com/tweettocourse" className="text-indigo-600 hover:text-indigo-500 font-medium">
                @tweettocourse on Twitter
              </a>
            </p>
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