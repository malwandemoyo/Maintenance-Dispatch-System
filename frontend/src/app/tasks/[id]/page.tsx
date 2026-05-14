'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { ProtectedRoute } from '~/components/ProtectedRoute';
import { api } from '~/trpc/react';
import Link from 'next/link';

export default function TaskDetailPage() {
  const params = useParams();
  const taskId = parseInt(params.id as string);
  const { data: session } = useSession();
  const [comment, setComment] = useState('');

  const { data: task, isLoading } = api.tasks.get.useQuery({ id: taskId });
  const { data: comments } = api.comments.list.useQuery({ task_id: taskId });
  const { data: staff } = api.users.getMaintenanceStaff.useQuery({});

  const assignMutation = api.tasks.assign.useMutation();
  const updateStatusMutation = api.tasks.markInProgress.useMutation();
  const completeMutation = api.tasks.markCompleted.useMutation();
  const commentMutation = api.comments.create.useMutation();

  const handleAssign = async (staffId: number) => {
    try {
      await assignMutation.mutateAsync({ task_id: taskId, staff_id: staffId });
    } catch (error) {
      console.error('Failed to assign task:', error);
    }
  };

  const handleStatusUpdate = async (action: 'progress' | 'completed') => {
    try {
      if (action === 'progress') {
        await updateStatusMutation.mutateAsync({ id: taskId });
      } else {
        await completeMutation.mutateAsync({ id: taskId });
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      await commentMutation.mutateAsync({ task_id: taskId, content: comment });
      setComment('');
    } catch (error) {
      console.error('Failed to post comment:', error);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!task) {
    return (
      <ProtectedRoute>
        <div className="flex justify-center items-center min-h-screen">
          <p className="text-gray-500">Task not found</p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <Link href="/tasks" className="text-blue-600 hover:text-blue-700">
                ← Back to Tasks
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">{task.title}</h1>
              <div className="w-20"></div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Task Details */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
                  <p className="text-gray-700">{task.description || 'No description'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="text-lg font-semibold capitalize text-gray-900">{task.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Priority</p>
                    <p className="text-lg font-semibold capitalize text-gray-900">{task.priority}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Property</p>
                    <p className="text-lg font-semibold text-gray-900">{task.property}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Assigned to</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {task.assigned_to_name || 'Unassigned'}
                    </p>
                  </div>
                </div>

                {/* Status Actions */}
                {session?.user?.role === 'maintenance_staff' && task.status !== 'completed' && (
                  <div className="flex gap-2">
                    {task.status === 'assigned' && (
                      <button
                        onClick={() => handleStatusUpdate('progress')}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
                      >
                        Start Work
                      </button>
                    )}
                    {task.status === 'in_progress' && (
                      <button
                        onClick={() => handleStatusUpdate('completed')}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg"
                      >
                        Mark Completed
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Comments Section */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Comments</h2>

                {/* Comment Form */}
                <form onSubmit={handleCommentSubmit} className="mb-6">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
                    >
                      Post
                    </button>
                  </div>
                </form>

                {/* Comments List */}
                <div className="space-y-4">
                  {comments?.results && comments.results.length > 0 ? (
                    comments.results.map((c: any) => (
                      <div key={c.id} className="border-l-4 border-gray-300 pl-4">
                        <p className="font-semibold text-gray-900">{c.author_name}</p>
                        <p className="text-sm text-gray-500">{c.created_at}</p>
                        <p className="text-gray-700 mt-1">{c.content}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No comments yet</p>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div>
              {session?.user?.role === 'property_manager' && task.status === 'pending' && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Assign Task</h3>
                  <select
                    onChange={(e) => handleAssign(parseInt(e.target.value))}
                    defaultValue=""
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 mb-4"
                  >
                    <option value="">Select staff member...</option>
                    {staff?.results?.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.first_name} {s.last_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
