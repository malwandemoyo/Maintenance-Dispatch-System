"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { ProtectedRoute } from "~/components/ProtectedRoute";
import { api } from "~/trpc/react";
import Link from "next/link";

function formatStaffName(member?: {
  first_name?: string;
  last_name?: string;
  username?: string;
}) {
  if (!member) return "Unassigned";

  const fullName = [member.first_name, member.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  return fullName || member.username || "Unassigned";
}

export default function TasksPage() {
  const { data: session } = useSession();
  const [tab, setTab] = useState<"open" | "done" | "deleted">("open");
  const [priority, setPriority] = useState<string | undefined>();

  const { data: tasksData, isLoading } = api.tasks.list.useQuery({
    status: tab,
    priority: priority as any,
  });

  const isManager = session?.user?.role === "manager";
  const visibleTabs = isManager
    ? [
        { key: "open", label: "New Tasks" },
        { key: "done", label: "Done Tasks" },
        { key: "deleted", label: "Deleted Tasks" },
      ]
    : [
        { key: "open", label: "New Tasks" },
        { key: "done", label: "Done Tasks" },
      ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
              {isManager && (
                <Link
                  href="/tasks/new"
                  className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
                >
                  Add Task
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Tabs */}
          <div className="mb-6 flex flex-wrap gap-2">
            {visibleTabs.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key as "open" | "done" | "deleted")}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  tab === item.key
                    ? "bg-blue-600 text-white"
                    : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="mb-8 rounded-lg bg-white p-6 shadow">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  value={tab}
                  onChange={(e) =>
                    setTab(e.target.value as "open" | "done" | "deleted")
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="open">New</option>
                  <option value="done">Done</option>
                  {isManager && <option value="deleted">Deleted</option>}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Priority
                </label>
                <select
                  value={priority || ""}
                  onChange={(e) => setPriority(e.target.value || undefined)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
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
            <div className="flex h-64 items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid gap-6">
              {tasksData?.results && tasksData.results.length > 0 ? (
                tasksData.results.map((task: any) => (
                  <Link key={task.id} href={`/tasks/${task.id}`}>
                    <div className="cursor-pointer overflow-hidden rounded-lg bg-white shadow transition-shadow hover:shadow-lg">
                      <div className="p-6">
                        <div className="mb-2 flex items-start justify-between">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {task.title}
                          </h3>
                          <div className="flex gap-2">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium ${
                                task.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : task.status === "in_progress"
                                    ? "bg-blue-100 text-blue-800"
                                    : task.status === "pending"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : task.status === "cancelled"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {task.status}
                            </span>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium ${
                                task.priority === "urgent"
                                  ? "bg-red-100 text-red-800"
                                  : task.priority === "high"
                                    ? "bg-orange-100 text-orange-800"
                                    : task.priority === "medium"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-green-100 text-green-800"
                              }`}
                            >
                              {task.priority}
                            </span>
                          </div>
                        </div>
                        {task.description && (
                          <p className="mb-4 line-clamp-2 text-gray-600">
                            {task.description}
                          </p>
                        )}
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>
                            Property:{" "}
                            {task.property_details?.name ||
                              task.property_name ||
                              "Unknown"}
                          </span>
                          <span>
                            Assigned to:{" "}
                            {formatStaffName(task.assigned_to_details)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="py-12 text-center">
                  <p className="text-lg text-gray-500">
                    No tasks found in this tab
                  </p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
