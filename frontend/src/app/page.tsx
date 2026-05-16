'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ProtectedRoute } from '~/components/ProtectedRoute';
import { api } from '~/trpc/react';
import { LoadingSpinner } from '~/components/LoadingSpinner';

export default function Dashboard() {
  const { data: session } = useSession();
  const { data: response, isLoading } = api.tasks.list.useQuery({
    status: 'open',
  });

  const tasks = response?.data ?? [];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Maintenance</h1>
            <p className="text-gray-600 mt-2">Welcome back, {session?.user?.name || 'User'}!</p>
            {session?.user?.role === 'resident' && (
              <p className="text-sm text-gray-500 mt-1">Use <Link href="/report-fault" className="text-blue-600">Report Fault</Link> to create a new issue.</p>
            )}
          </div>

          {/* Tasks Table */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : tasks.length > 0 ? (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
                      {!session || session.user.role !== 'resident' ? (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                      ) : null}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{session && session.user.role === 'resident' ? 'Location' : 'Property'}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {tasks.map((task: any) => (
                      <tr key={task.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{task.title}</p>
                          <p className="text-sm text-gray-600">{task.property_details?.name || task.property?.name || ''}</p>
                        </td>
                        {(!session || session.user.role !== 'resident') && (
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                                task.priority === 'high'
                                  ? 'bg-red-100 text-red-800'
                                  : task.priority === 'medium'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {task.priority}
                            </span>
                          </td>
                        )}
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-700">
                            {task.assigned_to_details
                              ? `${task.assigned_to_details.first_name || task.assigned_to_details.username || ''} ${task.assigned_to_details.last_name || ''}` + (task.assigned_to_details.staff_profile?.role_title ? ` - ${task.assigned_to_details.staff_profile.role_title}` : '')
                              : 'Unassigned'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600">{task.property_details?.address || ''}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                            {task.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/tasks/${task.id}`}
                            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-600 text-lg">No open tasks at the moment</p>
              <Link href="/tasks/new" className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium">
                Create a new task
              </Link>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
