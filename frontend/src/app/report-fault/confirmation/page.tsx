'use client';

import Link from 'next/link';

export default function Confirmation() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow text-center">
        <h1 className="text-2xl font-bold mb-4">Report Submitted</h1>
        <p className="text-gray-600 mb-6">Thank you — your fault report has been submitted. Our maintenance team will review it shortly.</p>
        <Link href="/" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md">Back to Maintenance</Link>
      </div>
    </div>
  );
}
