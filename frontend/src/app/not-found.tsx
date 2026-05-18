import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-100 px-4">
      <div className="w-full max-w-2xl rounded-3xl border border-blue-100 bg-white/90 p-8 text-center shadow-2xl backdrop-blur sm:p-12">
        <div className="text-7xl font-black text-blue-600 sm:text-8xl">404</div>
        <h1 className="mt-4 text-3xl font-bold text-gray-900 sm:text-4xl">
          Oops, you&apos;re lost;
        </h1>
        <p className="mt-4 text-base leading-relaxed text-gray-600 sm:text-lg">
          The page you’re looking for seems to have vanished
        </p>

        <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-5 text-left">
          <p className="font-semibold text-blue-900">
            Try one of these instead:
          </p>
          <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-blue-900/90 sm:text-base">
            <li>Head back home and keep the dispatch flowing.</li>
            <li>Check your dashboard for tasks, reports, and updates.</li>
            <li>
              If this keeps happening, the page may have joined the resident
              staff and disappeared for good.
            </li>
          </ul>
        </div>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
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

        <p className="mt-8 text-xs text-gray-500 sm:text-sm">
          Error 404 — page not found, but your sense of direction is still
          intact.
        </p>
      </div>
    </div>
  );
}
