import type { NextAuthConfig, DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const authConfig = {
  trustHost: true,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Username or email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const identifier = credentials?.identifier;

        if (!identifier || !credentials?.password) {
          throw new Error("Username/email and password required");
        }

        try {
          // Call Django login endpoint
          const response = await fetch(`${API_URL}/api/auth/login/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include", // Include cookies for Django session
            body: JSON.stringify({
              identifier,
              password: credentials.password,
            }),
          });

          if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.detail || "Invalid credentials");
          }

          const userResponse = await response.json();
          const user = userResponse.user ?? userResponse;

          // Return user object with role information
          // Django session cookie is automatically set by the browser and will be
          // forwarded by tRPC context for server-side requests
          return {
            id: String(user.id),
            email: user.email,
            name: user.first_name || user.username,
            role: user.role, // 'manager', 'maintenance_staff', or 'resident'
            image: user.avatar || null,
          };
        } catch (error) {
          console.error("Auth error:", error);
          throw error;
        }
      },
    }),
  ],

  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    async jwt({ token, user }) {
      // Store minimal user info in JWT for session persistence
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.email = user.email;
      }
      return token;
    },

    async session({ session, token }) {
      // Populate session from JWT token
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.AUTH_SECRET,
} satisfies NextAuthConfig;
