'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('App route error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-100 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full bg-white/90 backdrop-blur rounded-3xl shadow-2xl border border-red-100 p-8 sm:p-12 text-center">
        <div className="text-7xl sm:text-8xl font-black text-red-600">500</div>
        <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-gray-900">
          Our bad. The system tripped over its own toolbox.
        </h1>
        <p className="mt-4 text-gray-600 text-base sm:text-lg leading-relaxed">
          Something went wrong on our side. A bolt may have loosened, a wire may have sparked,
          or the app may have simply decided to take an unscheduled tea break.
        </p>

        <div className="mt-8 rounded-2xl bg-red-50 border border-red-100 p-5 text-left">
          <p className="font-semibold text-red-900">What you can do:</p>
          <ul className="mt-3 space-y-2 text-sm sm:text-base text-red-900/90 list-disc list-inside">
            <li>Hit retry in case the issue was a one-off hiccup.</li>
            <li>Go back home or the dashboard and try again.</li>
            <li>If it still fails, the fault is on our side — not yours.</li>
          </ul>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center rounded-xl bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700"
          >
            Retry
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Go Home
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Dashboard
          </Link>
        </div>

        <p className="mt-8 text-xs sm:text-sm text-gray-500">
          Error 500 — our fault, not yours.
        </p>
      </div>
    </div>
  );
}
