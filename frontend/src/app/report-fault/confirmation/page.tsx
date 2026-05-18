"use client";

import Link from "next/link";

export default function Confirmation() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl rounded-lg bg-white p-8 text-center shadow">
        <h1 className="mb-4 text-2xl font-bold">Report Submitted</h1>
        <p className="mb-6 text-gray-600">
          Thank you — your fault report has been submitted. Our maintenance team
          will review it shortly.
        </p>
        <Link
          href="/"
          className="inline-block rounded-md bg-blue-600 px-4 py-2 text-white"
        >
          Back to Maintenance
        </Link>
      </div>
    </div>
  );
}
