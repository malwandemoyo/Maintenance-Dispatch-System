"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // First call the proxied backend route so the browser request is
      // same-origin and will accept the `Set-Cookie: sessionid` header.
      const backendResponse = await fetch("/api/backend/api/auth/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ identifier, password }),
      });

      if (!backendResponse.ok) {
        const backendError = await backendResponse.json().catch(() => null);
        throw new Error(backendError?.detail ?? "Invalid credentials");
      }

      // Then call NextAuth signIn to create/refresh the NextAuth session (JWT)
      const result = await signIn("credentials", {
        identifier,
        password,
        redirect: false,
      });

      if (!result?.ok) {
        setError(result?.error ?? "Login failed");
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An error occurred during login",
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        <div className="rounded-lg bg-white p-8 shadow-lg">
          <h1 className="mb-8 text-center text-3xl font-bold text-gray-900">
            Maintenance Dispatch
          </h1>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="identifier"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Username or Email
              </label>
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoComplete="username"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="manager1 or manager@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
                Register here
              </Link>
            </p>
          </div> */}

          <div className="mt-6 border-t border-gray-200 pt-6">
            <p className="text-center text-xs text-gray-500">
              Demo Credentials:
            </p>
            <p className="mt-1 text-center text-xs text-gray-500">
              Manager: manager1 or manager@maintenanceservices.co.zw /
              Manager@123
            </p>
            <p className="text-center text-xs text-gray-500">
              Staff: staff1 or staff1@maintenanceservices.co.zw / Staff@123
            </p>
            <p className="text-center text-xs text-gray-500">
              Resident: resident1 or resident1@example.com / Resident@123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
