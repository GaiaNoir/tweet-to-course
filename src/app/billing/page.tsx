import { requireAuth, getUserProfile } from '@/lib/auth';
import { Navigation } from '@/components/ui/navigation';
import { SubscriptionManagement } from '@/components/ui/subscription-management';
import { CreditCard, Calendar, DollarSign, FileText } from 'lucide-react';
import Link from 'next/link';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

export default async function BillingPage() {
  const userId = await requireAuth();
  const userProfile = await getUserProfile(userId);
  
  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Error loading profile
          </h1>
          <p className="text-gray-600 mb-4">
            We couldn't load your billing information. Please try again.
          </p>
          <Link 
            href="/dashboard"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="mt-2 text-gray-600">
            Manage your subscription, billing information, and payment history.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Subscription Management */}
            <SubscriptionManagement 
              currentTier={userProfile.subscriptionTier}
              customerCode={userProfile.customerCode}
              subscriptionCode={userProfile.subscriptionCode}
            />

            {/* Billing Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center mb-4">
                <CreditCard className="w-5 h-5 text-gray-400 mr-2" />
                <h2 className="text-lg font-medium text-gray-900">
                  Billing Information
                </h2>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <p className="mt-1 text-sm text-gray-900">{userProfile.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Customer ID
                    </label>
                    <p className="mt-1 text-sm text-gray-900 font-mono">
                      {userProfile.customerCode || 'Not available'}
                    </p>
                  </div>
                </div>

                {userProfile.subscriptionTier !== 'free' && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600">✓</span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800">
                          Active Pro Subscription
                        </h3>
                        <p className="text-sm text-green-700">
                          Your subscription is active and all Pro features are available.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Payment History */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center mb-4">
                <FileText className="w-5 h-5 text-gray-400 mr-2" />
                <h2 className="text-lg font-medium text-gray-900">
                  Payment History
                </h2>
              </div>

              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  Payment history will appear here once you make your first payment.
                </p>
                {userProfile.subscriptionTier === 'free' && (
                  <Link
                    href="/pricing"
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200"
                  >
                    Upgrade to Pro
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Account Summary
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">Member Since</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(userProfile.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">Current Plan</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {userProfile.subscriptionTier}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">Courses Generated</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {userProfile.usageCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Support */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Need Help?
              </h3>
              
              <div className="space-y-3">
                <a
                  href="mailto:support@tweettocourse.com"
                  className="block text-sm text-indigo-600 hover:text-indigo-500"
                >
                  Contact Support
                </a>
                <Link
                  href="/pricing"
                  className="block text-sm text-indigo-600 hover:text-indigo-500"
                >
                  View Pricing Plans
                </Link>
                <a
                  href="#"
                  className="block text-sm text-indigo-600 hover:text-indigo-500"
                >
                  Billing FAQ
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}