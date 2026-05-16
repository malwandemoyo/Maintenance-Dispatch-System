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
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (cookie) headers.Cookie = cookie;
        const response = await fetch(`${API_URL}/api/auth/me/`, {
          headers,
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
      if (cookie) headers.Cookie = cookie;
      if (csrf) headers["X-CSRFToken"] = csrf;

      await fetch(`${API_URL}/api/auth/logout/`, {
        method: "POST",
        headers,
      });

      await signOut({ redirect: false });
      return { success: true };
    } catch {
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
        role: z.enum(["manager", "maintenance_staff", "resident"]),
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
          const errorResp = await response.json();
          throw new Error(errorResp.detail || "Registration failed");
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
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (cookie) headers.Cookie = cookie;
        const response = await fetch(`${API_URL}/api/auth/me/`, {
          headers,
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
    } catch {
      return null;
    }
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        first_name: z.string().optional(),
        last_name: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        unit_number: z.string().optional(),
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
        if (cookie) headers.Cookie = cookie;
        if (csrf) headers["X-CSRFToken"] = csrf;

        const response = await fetch(`${API_URL}/api/auth/profile_update/`, {
          method: "PUT",
          headers,
          body: JSON.stringify(input),
        });

        if (!response.ok) {
          if (response.status === 400) {
            try {
              const errorData = await response.json();
              // Extract error message from Django response
              let errorMessage = "Update failed";
              
              if (errorData.detail) {
                errorMessage = errorData.detail;
              } else {
                const firstError = Object.values(errorData).find(
                  (val) => val && (typeof val === 'string' || Array.isArray(val))
                );
                if (firstError) {
                  errorMessage = Array.isArray(firstError) ? firstError[0] : firstError as string;
                }
              }
              
              throw new Error(errorMessage);
            } catch {
              throw new Error("Profile update failed");
            }
          }
          throw new Error("Profile update failed");
        }
        
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
        new_password2: z.string().min(8),
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
        if (cookie) headers.Cookie = cookie;
        if (csrf) headers["X-CSRFToken"] = csrf;

        const response = await fetch(`${API_URL}/api/auth/change_password/`, {
          method: "POST",
          headers,
          body: JSON.stringify(input),
        });

        if (!response.ok) {
          if (response.status === 400) {
            try {
              const errorData = await response.json();
              
              // Extract error message from Django response
              let errorMessage = "Validation error";
              
              // Handle field-specific errors
              if (errorData.old_password) {
                errorMessage = Array.isArray(errorData.old_password)
                  ? errorData.old_password[0]
                  : errorData.old_password;
              } else if (errorData.new_password) {
                errorMessage = Array.isArray(errorData.new_password)
                  ? errorData.new_password[0]
                  : errorData.new_password;
              } 
              // Handle non-field errors (raised as ValidationError with string)
              else if (errorData.non_field_errors) {
                errorMessage = Array.isArray(errorData.non_field_errors)
                  ? errorData.non_field_errors[0]
                  : errorData.non_field_errors;
              }
              // Handle detail field
              else if (errorData.detail) {
                errorMessage = errorData.detail;
              } 
              // Fallback: get first error
              else {
                const firstError = Object.values(errorData).find(
                  (val) => val && (typeof val === 'string' || Array.isArray(val))
                );
                if (firstError) {
                  errorMessage = Array.isArray(firstError) ? firstError[0] : firstError as string;
                }
              }
              
              throw new Error(errorMessage);
            } catch (parseError) {
              // Parsing failed - return a generic message
              if (parseError instanceof Error && parseError.message !== "Password change failed") {
                throw parseError; // Re-throw if it's our custom error
              }
              throw new Error("Password change failed");
            }
          }
          throw new Error("Password change failed");
        }

        return { success: true };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Password change failed";
        console.error('Change password error:', message);
        throw new Error(message);
      }
    }),
});
