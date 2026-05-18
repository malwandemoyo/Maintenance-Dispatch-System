'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  // Dark mode removed per UI decision

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo / Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-blue-600">MDS</span>
              <span className="ml-2 text-sm text-gray-600 hidden sm:inline">Maintenance Dispatch System</span>
            </Link>
          </div>

          {/* Center - Nav Links (only when user is logged in) */}
          {session?.user && (
            <div className="hidden md:flex items-center gap-8">
              {/* <Link href="/" className="text-gray-700 hover:text-blue-600 transition font-medium">
                Maintenance
              </Link> */}
              {/* {session.user.role !== 'resident' && (
                <Link href="/tasks" className="text-gray-700 hover:text-blue-600 transition font-medium">
                  Tasks
                </Link>
              )}
              {session.user.role === 'resident' && (
                <Link href="/report-fault" className="text-gray-700 hover:text-blue-600 transition font-medium">
                  Report Fault
                </Link>
              )} */}
              {/* {session.user.role === 'manager' && (
                <>
                  <Link href="/properties" className="text-gray-700 hover:text-blue-600 transition font-medium">
                    Properties
                  </Link>
                </>
              )} */}
            </div>
          )}

          {/* Right - User Menu Dropdown */}
          {session?.user ? (
            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold">
                    {session.user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="hidden sm:inline text-sm font-medium text-gray-700">
                    {session.user.name || 'User'}
                  </span>
                  <svg
                    className={`w-4 h-4 text-gray-600 transition ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                    {/* User Info */}
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">{session.user.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{session.user.role?.replace('_', ' ')}</p>
                    </div>

                    {/* Settings Link */}
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                      onClick={() => setIsOpen(false)}
                    >
                      ⚙️ Settings
                    </Link>

                    {/* Dark mode toggle removed */}

                    {/* Divider */}
                    <div className="border-t border-gray-200 my-2"></div>

                    {/* Logout */}
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        void handleLogout();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                    >
                      🚪 Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
