import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full bg-white/90 backdrop-blur rounded-3xl shadow-2xl border border-blue-100 p-8 sm:p-12 text-center">
        <div className="text-7xl sm:text-8xl font-black text-blue-600">404</div>
        <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-gray-900">
          Oops, you're lost;
        </h1>
        <p className="mt-4 text-gray-600 text-base sm:text-lg leading-relaxed">
          The page you’re looking for seems to have vanished
        </p>

        <div className="mt-8 rounded-2xl bg-blue-50 border border-blue-100 p-5 text-left">
          <p className="font-semibold text-blue-900">Try one of these instead:</p>
          <ul className="mt-3 space-y-2 text-sm sm:text-base text-blue-900/90 list-disc list-inside">
            <li>Head back home and keep the dispatch flowing.</li>
            <li>Check your dashboard for tasks, reports, and updates.</li>
            <li>If this keeps happening, the page may have joined the resident staff and disappeared for good.</li>
          </ul>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Go Home
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Open Dashboard
          </Link>
        </div>

        <p className="mt-8 text-xs sm:text-sm text-gray-500">
          Error 404 — page not found, but your sense of direction is still intact.
        </p>
      </div>
    </div>
  );
}
