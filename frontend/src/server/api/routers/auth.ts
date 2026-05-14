import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "~/server/api/trpc";
import { signIn, signOut } from "~/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const authRouter = createTRPCRouter({
  login: publicProcedure
    .input(
      z.object({
        identifier: z.string().min(1).optional(),
        email: z.string().min(1).optional(),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const identifier = input.identifier ?? input.email;

        if (!identifier) {
          throw new Error("Username/email is required");
        }

        await signIn("credentials", {
          identifier,
          password: input.password,
          redirect: false,
        });

        // Fetch user details from Django
        const cookie = ctx?.headers?.get("cookie") ?? "";
        const response = await fetch(`${API_URL}/api/auth/me/`, {
          headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
        });

        if (!response.ok) throw new Error("Failed to fetch user");
        
        const userResponse = await response.json();
        const user = userResponse.user ?? userResponse;
        return { success: true, user };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Login failed");
      }
    }),

  logout: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      // Call Django logout endpoint
      // Forward cookie from incoming request so Django can end the session
      // when this is called server-side.
      const cookie = ctx?.headers?.get("cookie") ?? null;
      await fetch(`${API_URL}/api/auth/logout/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
      });

      await signOut({ redirect: false });
      return { success: true };
    } catch (error) {
      throw new Error("Logout failed");
    }
  }),

  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
        first_name: z.string().min(1),
        last_name: z.string().min(1),
        role: z.enum(["property_manager", "maintenance_staff", "resident"]),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const response = await fetch(`${API_URL}/api/auth/register/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(input),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || "Registration failed");
        }

        const user = await response.json();
        return { success: true, user };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Registration failed");
      }
    }),

  getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    try {
      const cookie = ctx.headers?.get("cookie") ?? "";
      const response = await fetch(`${API_URL}/api/auth/me/`, {
        headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
      });

      if (!response.ok) return null;
      
      const user = await response.json();
      return {
        id: user.id,
        email: user.email,
        name: user.first_name,
        role: user.role,
        avatar: user.avatar,
      };
    } catch (error) {
      return null;
    }
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        first_name: z.string().optional(),
        last_name: z.string().optional(),
        phone: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const cookie = ctx.headers?.get("cookie") ?? "";
        const response = await fetch(`${API_URL}/api/auth/profile_update/`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
          body: JSON.stringify(input),
        });

        if (!response.ok) throw new Error("Profile update failed");
        
        const user = await response.json();
        return { success: true, user };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Update failed");
      }
    }),

  changePassword: protectedProcedure
    .input(
      z.object({
        old_password: z.string().min(1),
        new_password: z.string().min(8),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const cookie = ctx.headers?.get("cookie") ?? "";

        // extract csrftoken if present in cookie and send as X-CSRFToken
        let csrf = "";
        if (cookie) {
          const parts = cookie.split(";").map((c) => c.trim());
          for (const p of parts) {
            if (p.startsWith("csrftoken=")) {
              csrf = p.split("=")[1] ?? "";
              break;
            }
          }
        }

        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (cookie) headers["Cookie"] = cookie;
        if (csrf) headers["X-CSRFToken"] = csrf;

        const response = await fetch(`${API_URL}/api/auth/change_password/`, {
          method: "POST",
          headers,
          body: JSON.stringify(input),
        });

        if (!response.ok) throw new Error("Password change failed");

        return { success: true };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Password change failed");
      }
    }),
});
