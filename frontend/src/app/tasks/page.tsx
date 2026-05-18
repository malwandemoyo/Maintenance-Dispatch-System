'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { ProtectedRoute } from '~/components/ProtectedRoute';
import { api } from '~/trpc/react';
import Link from 'next/link';

function formatStaffName(member?: {
  first_name?: string;
  last_name?: string;
  username?: string;
}) {
  if (!member) return 'Unassigned';

  const fullName = [member.first_name, member.last_name].filter(Boolean).join(' ').trim();
  return fullName || member.username || 'Unassigned';
}

export default function TasksPage() {
  const { data: session } = useSession();
  const [tab, setTab] = useState<'open' | 'done' | 'deleted'>('open');
  const [priority, setPriority] = useState<string | undefined>();

  const { data: tasksData, isLoading } = api.tasks.list.useQuery({
    status: tab,
    priority: priority as any,
  });

  const isManager = session?.user?.role === 'manager';
  const visibleTabs = isManager
    ? [
        { key: 'open', label: 'New Tasks' },
        { key: 'done', label: 'Done Tasks' },
        { key: 'deleted', label: 'Deleted Tasks' },
      ]
    : [
        { key: 'open', label: 'New Tasks' },
        { key: 'done', label: 'Done Tasks' },
      ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
              {isManager && (
                <Link
                  href="/tasks/new"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
                >
                  Add Task
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {visibleTabs.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key as 'open' | 'done' | 'deleted')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  tab === item.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={tab}
                  onChange={(e) => setTab(e.target.value as 'open' | 'done' | 'deleted')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="open">New</option>
                  <option value="done">Done</option>
                  {isManager && <option value="deleted">Deleted</option>}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={priority || ''}
                  onChange={(e) => setPriority(e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tasks List */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid gap-6">
              {tasksData?.results && tasksData.results.length > 0 ? (
                tasksData.results.map((task: any) => (
                  <Link key={task.id} href={`/tasks/${task.id}`}>
                    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {task.title}
                          </h3>
                          <div className="flex gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              task.status === 'completed' ? 'bg-green-100 text-green-800' :
                              task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                              task.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              task.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {task.status}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                              task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {task.priority}
                            </span>
                          </div>
                        </div>
                        {task.description && (
                          <p className="text-gray-600 mb-4 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>Property: {task.property_details?.name || task.property_name || 'Unknown'}</span>
                          <span>Assigned to: {formatStaffName(task.assigned_to_details)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No tasks found in this tab</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
