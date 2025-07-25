import Link from 'next/link';

export default function MigrationNotice() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Account Migration Required
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We've upgraded our authentication system for better security and performance.
          </p>
        </div>
        
        <div className="bg-white py-8 px-6 shadow rounded-lg">
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    What's happening?
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      We've migrated from Clerk to Supabase Auth for improved security and features. 
                      Your existing data is safe and will be automatically linked when you sign in.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-900">What you need to do:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                <li>Sign in again using the same email address you used before</li>
                <li>Your existing courses and subscription will be automatically restored</li>
                <li>Enjoy improved security and new features!</li>
              </ol>
            </div>
            
            <div className="pt-4 space-y-3">
              <Link
                href="/auth/sign-in"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign In to Continue
              </Link>
              
              <Link
                href="/auth/sign-up"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create New Account
              </Link>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Having trouble? Contact support for assistance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}