"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  // Dark mode removed per UI decision

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          {/* Logo / Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-blue-600">MDS</span>
              <span className="ml-2 hidden text-sm text-gray-600 sm:inline">
                Maintenance Dispatch System
              </span>
            </Link>
          </div>

          {/* Center - Nav Links (only when user is logged in) */}
          {session?.user && (
            <div className="hidden items-center gap-8 md:flex">
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
                  className="flex items-center gap-2 rounded-lg px-3 py-2 transition hover:bg-gray-100"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm font-semibold text-white">
                    {session.user.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <span className="hidden text-sm font-medium text-gray-700 sm:inline">
                    {session.user.name || "User"}
                  </span>
                  <svg
                    className={`h-4 w-4 text-gray-600 transition ${isOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                  <div className="absolute right-0 z-10 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
                    {/* User Info */}
                    <div className="border-b border-gray-200 px-4 py-2">
                      <p className="text-sm font-medium text-gray-900">
                        {session.user.name}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {session.user.role?.replace("_", " ")}
                      </p>
                    </div>

                    {/* Settings Link */}
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
                      onClick={() => setIsOpen(false)}
                    >
                      ⚙️ Settings
                    </Link>

                    {/* Dark mode toggle removed */}

                    {/* Divider */}
                    <div className="my-2 border-t border-gray-200"></div>

                    {/* Logout */}
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        void handleLogout();
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
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
