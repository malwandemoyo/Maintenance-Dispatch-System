"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { ProtectedRoute } from "~/components/ProtectedRoute";

interface ReportDetail {
  id: number;
  title: string;
  description: string;
  location?: string | null;
  status: string;
  manager_notes?: string | null;
  created_at: string;
  closed_at?: string | null;
  resolved_at?: string | null;
  photo?: string | null;
  property_details?: {
    id: number;
    name: string;
    address: string;
  } | null;
  reported_by_details?: {
    id: number;
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
  } | null;
  task_count?: number;
}

function statusClasses(status: string) {
  switch (status) {
    case "closed":
      return "bg-green-100 text-green-800";
    case "resolved":
      return "bg-emerald-100 text-emerald-800";
    case "in_progress":
      return "bg-blue-100 text-blue-800";
    case "acknowledged":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default function ReportDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const isManager = session?.user?.role === "manager";
  const reportId = params.id;

  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadReport() {
      try {
        setLoading(true);
        const response = await fetch(`/api/backend/api/reports/${reportId}/`, {
          credentials: "include",
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.detail || "Failed to load report");
        }

        if (isMounted) {
          setReport(data);
          setTaskTitle(data.title || "");
          setTaskDescription(data.description || "");
        }
      } catch (fetchError) {
        if (isMounted) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Failed to load report",
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (reportId) {
      void loadReport();
    }

    return () => {
      isMounted = false;
    };
  }, [reportId]);

  async function createTaskFromReport() {
    if (!report) return;

    try {
      setActionLoading(true);
      setActionError(null);

      const response = await fetch(
        `/api/backend/api/reports/${report.id}/create_task/`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: taskTitle,
            description: taskDescription,
            priority,
          }),
        },
      );

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.detail || "Failed to create task");
      }

      router.push(`/tasks/${data.id}`);
    } catch (createError) {
      setActionError(
        createError instanceof Error
          ? createError.message
          : "Failed to create task",
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function closeReport() {
    if (!report) return;

    try {
      setActionLoading(true);
      setActionError(null);

      const response = await fetch(
        `/api/backend/api/reports/${report.id}/close/`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.detail || "Failed to close report");
      }

      setReport(data);
    } catch (closeError) {
      setActionError(
        closeError instanceof Error
          ? closeError.message
          : "Failed to close report",
      );
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Report Details
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Review the report, create a task, and close it when complete.
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.back()}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Back
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">
              {error}
            </div>
          ) : report ? (
            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
              <section className="space-y-4 rounded-lg bg-white p-6 shadow">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900">
                      {report.title}
                    </h2>
                    <p className="text-sm text-gray-500">
                      Submitted {new Date(report.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${statusClasses(report.status)}`}
                  >
                    {report.status}
                  </span>
                </div>

                <p className="whitespace-pre-line text-gray-700">
                  {report.description}
                </p>

                <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="font-medium text-gray-500">Property</dt>
                    <dd className="text-gray-900">
                      {report.property_details?.name || "Unknown"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-500">Location</dt>
                    <dd className="text-gray-900">
                      {report.location || "Not specified"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-500">Reported By</dt>
                    <dd className="text-gray-900">
                      {report.reported_by_details?.first_name ||
                        report.reported_by_details?.username ||
                        "Unknown"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-500">Tasks</dt>
                    <dd className="text-gray-900">{report.task_count ?? 0}</dd>
                  </div>
                </dl>

                {report.photo && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-gray-500">
                      Photo
                    </p>
                    <Image
                      src={report.photo}
                      alt={report.title}
                      width={1200}
                      height={900}
                      unoptimized
                      className="h-auto max-h-96 w-full rounded-lg object-cover"
                    />
                  </div>
                )}

                {report.manager_notes && (
                  <div className="rounded-lg bg-gray-50 p-4">
                    <p className="mb-1 text-sm font-medium text-gray-500">
                      Manager Notes
                    </p>
                    <p className="whitespace-pre-line text-gray-700">
                      {report.manager_notes}
                    </p>
                  </div>
                )}
              </section>

              <aside className="h-fit space-y-4 rounded-lg bg-white p-6 shadow">
                <h3 className="text-lg font-semibold text-gray-900">Actions</h3>
                {actionError && (
                  <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
                    {actionError}
                  </div>
                )}

                {isManager ? (
                  <>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Task title
                      </label>
                      <input
                        value={taskTitle}
                        onChange={(e) => setTaskTitle(e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Task description
                      </label>
                      <textarea
                        value={taskDescription}
                        onChange={(e) => setTaskDescription(e.target.value)}
                        rows={6}
                        className="w-full rounded-md border border-gray-300 px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Priority
                      </label>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => void createTaskFromReport()}
                      disabled={actionLoading}
                      className="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {actionLoading ? "Creating..." : "Create Task"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void closeReport()}
                      disabled={actionLoading}
                      className="w-full rounded-lg bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      {actionLoading ? "Saving..." : "Close Report"}
                    </button>
                  </>
                ) : (
                  <p className="text-sm text-gray-600">
                    Only managers can create tasks or close reports.
                  </p>
                )}
              </aside>
            </div>
          ) : null}
        </main>
      </div>
    </ProtectedRoute>
  );
}
