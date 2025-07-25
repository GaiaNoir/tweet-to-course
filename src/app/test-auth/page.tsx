import { getCurrentUser, getAuth } from '@/lib/auth-supabase';
import { Navigation } from '@/components/ui/navigation-supabase';

export default async function TestAuth() {
  try {
    const user = await getCurrentUser();
    const authStatus = await getAuth();
    
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-2xl font-bold mb-6">Auth Debug Page</h1>
            
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <h2 className="text-lg font-semibold mb-4">Current User</h2>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <h2 className="text-lg font-semibold mb-4">Auth Status</h2>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(authStatus, null, 2)}
              </pre>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">User ID</h2>
              <p className="text-sm">
                User ID: <code className="bg-gray-100 px-2 py-1 rounded">{user?.id || 'Not available'}</code>
              </p>
              <p className="text-sm mt-2">
                Email: <code className="bg-gray-100 px-2 py-1 rounded">{user?.email || 'Not available'}</code>
              </p>
            </div>
          </div>
        </div>
      </>
    );
  } catch (error) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-2xl font-bold mb-6 text-red-600">Auth Error</h1>
            <div className="bg-red-50 p-6 rounded-lg">
              <pre className="text-red-800 text-sm overflow-auto">
                {error instanceof Error ? error.message : JSON.stringify(error, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </>
    );
  }
}