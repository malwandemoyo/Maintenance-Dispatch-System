'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ProtectedRoute } from '~/components/ProtectedRoute';

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
    case 'closed':
      return 'bg-green-100 text-green-800';
    case 'resolved':
      return 'bg-emerald-100 text-emerald-800';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800';
    case 'acknowledged':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export default function ReportsPage() {
  const { data: session } = useSession();
  const isManager = session?.user?.role === 'manager';
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadReports() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/backend/api/reports/', {
          credentials: 'include',
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.detail || 'Failed to load reports');
        }

        if (isMounted) {
          setReports(Array.isArray(data.results) ? data.results : data);
        }
      } catch (fetchError) {
        if (isMounted) {
          setError(fetchError instanceof Error ? fetchError.message : 'Failed to load reports');
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
              <p className="text-sm text-gray-600 mt-1">Resident fault reports waiting for review, tasks, or closure.</p>
            </div>
            <Link
              href="/report-fault"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
            >
              New Report
            </Link>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {!isManager && (
            <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              You can view your own reports here. Managers can review all reports for their properties.
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">{error}</div>
          ) : reports.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg shadow">
              <p className="text-gray-500 text-lg">No reports found.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {reports.map((report) => (
                <Link key={report.id} href={`/reports/${report.id}`}>
                  <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
                    <div className="p-6">
                      <div className="flex justify-between items-start gap-4 mb-3">
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900">{report.title}</h2>
                          <p className="text-sm text-gray-500">{new Date(report.created_at).toLocaleString()}</p>
                        </div>
                        <div className="flex gap-2 flex-wrap justify-end">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusClasses(report.status)}`}>
                            {report.status}
                          </span>
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {report.task_count ?? 0} task(s)
                          </span>
                        </div>
                      </div>

                      <p className="text-gray-600 mb-4 line-clamp-2">{report.description}</p>

                      <div className="flex flex-wrap justify-between gap-3 text-sm text-gray-500">
                        <span>Property: {report.property_details?.name || 'Unknown'}</span>
                        <span>Location: {report.location || 'Not specified'}</span>
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
