"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ProtectedRoute } from "~/components/ProtectedRoute";

interface ReportItem {
  id: number;
  title: string;
  description: string;
  status: string;
  location?: string | null;
  created_at: string;
  property_details?: {
    id: number;
    name: string;
    address: string;
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

export default function ReportsPage() {
  const { data: session } = useSession();
  const isManager = session?.user?.role === "manager";
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadReports() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/backend/api/reports/", {
          credentials: "include",
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.detail || "Failed to load reports");
        }

        if (isMounted) {
          setReports(Array.isArray(data.results) ? data.results : data);
        }
      } catch (fetchError) {
        if (isMounted) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Failed to load reports",
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadReports();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
              <p className="mt-1 text-sm text-gray-600">
                Resident fault reports waiting for review, tasks, or closure.
              </p>
            </div>
            <Link
              href="/report-fault"
              className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
            >
              New Report
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {!isManager && (
            <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              You can view your own reports here.
            </div>
          )}

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">
              {error}
            </div>
          ) : reports.length === 0 ? (
            <div className="rounded-lg bg-white py-16 text-center shadow">
              <p className="text-lg text-gray-500">No reports found.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {reports.map((report) => (
                <Link key={report.id} href={`/reports/${report.id}`}>
                  <div className="cursor-pointer overflow-hidden rounded-lg bg-white shadow transition-shadow hover:shadow-lg">
                    <div className="p-6">
                      <div className="mb-3 flex items-start justify-between gap-4">
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900">
                            {report.title}
                          </h2>
                          <p className="text-sm text-gray-500">
                            {new Date(report.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex flex-wrap justify-end gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${statusClasses(report.status)}`}
                          >
                            {report.status}
                          </span>
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800">
                            {report.task_count ?? 0} task(s)
                          </span>
                        </div>
                      </div>

                      <p className="mb-4 line-clamp-2 text-gray-600">
                        {report.description}
                      </p>

                      <div className="flex flex-wrap justify-between gap-3 text-sm text-gray-500">
                        <span>
                          Property: {report.property_details?.name || "Unknown"}
                        </span>
                        <span>
                          Location: {report.location || "Not specified"}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
