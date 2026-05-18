"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App route error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-100 px-4">
      <div className="w-full max-w-2xl rounded-3xl border border-red-100 bg-white/90 p-8 text-center shadow-2xl backdrop-blur sm:p-12">
        <div className="text-7xl font-black text-red-600 sm:text-8xl">500</div>
        <h1 className="mt-4 text-3xl font-bold text-gray-900 sm:text-4xl">
          Our bad. The system tripped over its own toolbox.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-gray-600 sm:text-lg">
          Something went wrong on our side. A bolt may have loosened, a wire may
          have sparked, or the app may have simply decided to take an
          unscheduled tea break.
        </p>

        <div className="mt-8 rounded-2xl border border-red-100 bg-red-50 p-5 text-left">
          <p className="font-semibold text-red-900">What you can do:</p>
          <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-red-900/90 sm:text-base">
            <li>Hit retry in case the issue was a one-off hiccup.</li>
            <li>Go back home or the dashboard and try again.</li>
            <li>If it still fails, the fault is on our side — not yours.</li>
          </ul>
        </div>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
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

        <p className="mt-8 text-xs text-gray-500 sm:text-sm">
          Error 500 — our fault, not yours.
        </p>
      </div>
    </div>
  );
}
