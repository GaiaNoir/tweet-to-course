import { Navigation } from '@/components/ui/navigation-supabase';

export default function MigrateUser() {
  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white p-8 rounded-lg shadow">
            <h1 className="text-2xl font-bold mb-6">Account Migration</h1>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h2 className="text-lg font-semibold text-blue-800 mb-2">
                🔄 We've Upgraded Our Authentication System
              </h2>
              <p className="text-blue-700">
                We've migrated from Clerk to Supabase Auth for better performance and security.
              </p>
            </div>

            <div className="space-y-4">
              <div className="border-l-4 border-yellow-400 pl-4">
                <h3 className="font-semibold text-gray-900">For Existing Users:</h3>
                <p className="text-gray-600 mt-1">
                  You'll need to create a new account using the same email address. 
                  Your subscription and data will be preserved.
                </p>
              </div>

              <div className="border-l-4 border-green-400 pl-4">
                <h3 className="font-semibold text-gray-900">For New Users:</h3>
                <p className="text-gray-600 mt-1">
                  Simply sign up with your email and password to get started.
                </p>
              </div>
            </div>

            <div className="mt-8 flex space-x-4">
              <a
                href="/auth/sign-up"
                className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-medium"
              >
                Create New Account
              </a>
              <a
                href="/auth/sign-in"
                className="bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 font-medium"
              >
                Sign In
              </a>
            </div>

            <div className="mt-8 bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">What's New:</h3>
              <ul className="text-gray-600 space-y-1 text-sm">
                <li>• More secure authentication</li>
                <li>• Faster sign-in process</li>
                <li>• Better integration with your data</li>
                <li>• No more sync issues</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}