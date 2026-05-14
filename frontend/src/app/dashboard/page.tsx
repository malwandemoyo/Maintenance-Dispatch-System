'use client';

import { useSession } from 'next-auth/react';
import { ProtectedRoute } from '~/components/ProtectedRoute';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: session } = useSession();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900">
                Dashboard
              </h1>
              <div className="text-right">
                <p className="text-gray-600">Welcome, {session?.user?.name}</p>
                <p className="text-sm text-gray-500 capitalize">
                  Role: {session?.user?.role?.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Tasks Card */}
            <Link href="/tasks">
              <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow cursor-pointer h-full">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div className="ml-5">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500">Tasks</dt>
                        <dd className="text-lg font-medium text-gray-900">View & Manage</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            {/* Properties Card */}
            {session?.user?.role === 'property_manager' && (
              <Link href="/properties">
                <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-3m0 0l7-4 7 4M5 9v10a1 1 0 001 1h12a1 1 0 001-1V9" />
                        </svg>
                      </div>
                      <div className="ml-5">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500">Properties</dt>
                          <dd className="text-lg font-medium text-gray-900">Manage</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Profile Card */}
            <Link href="/profile">
              <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow cursor-pointer h-full">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="ml-5">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500">Profile</dt>
                        <dd className="text-lg font-medium text-gray-900">View & Edit</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Info Section */}
          <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-blue-900 mb-2">System Info</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>• This is a role-based task management system</li>
                <li>• Your access level depends on your assigned role</li>
                <li>• All data is securely managed with server-side permission checks</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-green-900 mb-2">Your Role</h3>
              <p className="text-sm text-green-800 mb-3 capitalize">
                <strong>{session?.user?.role?.replace('_', ' ')}</strong>
              </p>
              {session?.user?.role === 'property_manager' && (
                <ul className="space-y-1 text-sm text-green-800">
                  <li>✓ View all maintenance requests</li>
                  <li>✓ Assign tasks to maintenance staff</li>
                  <li>✓ Manage properties</li>
                </ul>
              )}
              {session?.user?.role === 'maintenance_staff' && (
                <ul className="space-y-1 text-sm text-green-800">
                  <li>✓ View assigned tasks only</li>
                  <li>✓ Update task status</li>
                  <li>✓ Add comments to tasks</li>
                </ul>
              )}
              {session?.user?.role === 'resident' && (
                <ul className="space-y-1 text-sm text-green-800">
                  <li>✓ Create maintenance requests</li>
                  <li>✓ View your own requests</li>
                  <li>✓ Track request status</li>
                </ul>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
