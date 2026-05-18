"use client";

import { useMemo } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ProtectedRoute } from "~/components/ProtectedRoute";
import { api } from "~/trpc/react";
import { LoadingSpinner } from "~/components/LoadingSpinner";

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function HomeDashboard() {
  const { data: session } = useSession();
  const { data: response, isLoading } = api.tasks.list.useQuery(
    { status: "open" },
    { enabled: session?.user?.role !== "resident" },
  );

  const tasks = response?.results ?? response?.data ?? [];
  const role = session?.user?.role;
  const userName = session?.user?.name ?? "User";
  const firstName = userName.trim().split(/\s+/)[0] || "User";
  const timeGreeting = useMemo(() => getTimeGreeting(), []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <header className="bg-white shadow">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Maintenance Dispatch System
            </h1>
            <p className="mt-1 text-gray-600">
              {timeGreeting}, <strong>{firstName}</strong>
            </p>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {role === "resident" && (
            <div className="space-y-6">
              <div className="rounded-lg border-l-4 border-blue-600 bg-white p-6 shadow-md">
                <h2 className="mb-4 text-xl font-semibold text-gray-900">
                  Quick Start
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Link
                    href="/report-fault"
                    className="rounded-lg bg-blue-600 px-6 py-3 text-center font-semibold text-white transition hover:bg-blue-700"
                  >
                    📝 Report a Fault
                  </Link>
                  <Link
                    href="/reports"
                    className="rounded-lg bg-indigo-600 px-6 py-3 text-center font-semibold text-white transition hover:bg-indigo-700"
                  >
                    📋 View My Reports
                  </Link>
                </div>
              </div>
              <div className="rounded-lg bg-white p-6 shadow-md">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  How it works
                </h2>
                <ol className="space-y-3 text-gray-700">
                  <li>
                    <strong>1. Report a Fault:</strong> Click the button above
                    to submit a maintenance issue.
                  </li>
                  <li>
                    <strong>2. Get Updates:</strong> Check your reports page to
                    see status and manager notes.
                  </li>
                  <li>
                    <strong>3. Track Tasks:</strong> When a manager creates a
                    task, you can see progress.
                  </li>
                </ol>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : tasks.length > 0 ? (
            <div className="overflow-hidden rounded-lg bg-white shadow">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-200 bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Task
                      </th>
                      {role !== "resident" && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Priority
                        </th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Assigned To
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Property
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {tasks.map((task: any) => (
                      <tr key={task.id} className="transition hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">
                            {task.title}
                          </p>
                          <p className="text-sm text-gray-600">
                            {task.property_details?.name ??
                              task.property?.name ??
                              ""}
                          </p>
                        </td>
                        {role !== "resident" && (
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                task.priority === "high"
                                  ? "bg-red-100 text-red-800"
                                  : task.priority === "medium"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-green-100 text-green-800"
                              }`}
                            >
                              {task.priority}
                            </span>
                          </td>
                        )}
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-700">
                            {task.assigned_to_details
                              ? `${task.assigned_to_details.first_name ?? task.assigned_to_details.username ?? ""} ${task.assigned_to_details.last_name ?? ""}` +
                                (task.assigned_to_details.staff_profile
                                  ?.role_title
                                  ? ` - ${task.assigned_to_details.staff_profile.role_title}`
                                  : "")
                              : "Unassigned"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600">
                            {task.property_details?.name ??
                              task.property_name ??
                              task.property?.name ??
                              "Unknown"}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                            {task.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/tasks/${task.id}`}
                            className="text-sm font-medium text-blue-600 hover:text-blue-700"
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
            <div className="rounded-lg bg-white p-12 text-center shadow">
              <p className="text-lg text-gray-600">
                No open tasks at the moment
              </p>
            </div>
          )}

          {(role === "maintenance_staff" || role === "manager") && (
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {role === "maintenance_staff" && (
                <>
                  {/* <Link href="/tasks?status=open" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition border-l-4 border-orange-500">
                    <div className="text-3xl font-bold text-orange-600 mb-2">📂</div>
                    <div className="font-semibold text-gray-900">Open Tasks</div>
                    <p className="text-sm text-gray-600">Pending assignment</p>
                  </Link>
                  <Link href="/tasks?status=in_progress" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition border-l-4 border-blue-500">
                    <div className="text-3xl font-bold text-blue-600 mb-2">⚙️</div>
                    <div className="font-semibold text-gray-900">In Progress</div>
                    <p className="text-sm text-gray-600">Currently working on</p>
                  </Link> */}
                </>
              )}
              {role === "manager" && (
                <>
                  {/* <Link href="/reports?status=pending" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition border-l-4 border-yellow-500">
                    <div className="text-3xl font-bold text-yellow-600 mb-2">⏳</div>
                    <div className="font-semibold text-gray-900">Pending Reports</div>
                    <p className="text-sm text-gray-600">Awaiting review</p>
                  </Link>
                  <Link href="/reports?status=acknowledged" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition border-l-4 border-blue-500">
                    <div className="text-3xl font-bold text-blue-600 mb-2">✓</div>
                    <div className="font-semibold text-gray-900">Acknowledged</div>
                    <p className="text-sm text-gray-600">In progress</p>
                  </Link> */}
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
