import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { requirePropertyManager } from "~/server/api/middleware/permissions";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Helper function to extract CSRF token from cookie
function extractCSRFToken(cookie: string): string {
  if (!cookie) return "";
  const parts = cookie.split(";").map((c) => c.trim());
  for (const p of parts) {
    if (p.startsWith("csrftoken=")) {
      return p.split("=")[1] ?? "";
    }
  }
  return "";
}

// Helper function to build headers with cookie and CSRF token
function buildHeaders(cookie: string): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (cookie) headers["Cookie"] = cookie;
  const csrf = extractCSRFToken(cookie);
  if (csrf) headers["X-CSRFToken"] = csrf;
  return headers;
}

export const propertiesRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const params = new URLSearchParams({
          page: input.page.toString(),
          limit: input.limit.toString(),
        });

        const cookie = ctx.headers?.get("cookie") ?? "";
        const response = await fetch(`${API_URL}/api/properties/?${params}`, {
          headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
        });

        if (!response.ok) throw new Error("Failed to fetch properties");
        
        return await response.json();
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to fetch properties");
      }
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const cookie = ctx.headers?.get("cookie") ?? "";
        const response = await fetch(`${API_URL}/api/properties/${input.id}/`, {
          headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
        });

        if (!response.ok) throw new Error("Property not found");
        
        return await response.json();
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to fetch property");
      }
    }),

  create: protectedProcedure
    .use(requirePropertyManager())
    .input(
      z.object({
        name: z.string().min(1),
        address: z.string().min(1),
        city: z.string().optional(),
        postal_code: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const cookie = ctx.headers?.get("cookie") ?? "";
        const response = await fetch(`${API_URL}/api/properties/`, {
          method: "POST",
          headers: buildHeaders(cookie),
          body: JSON.stringify(input),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || "Failed to create property");
        }
        
        return await response.json();
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to create property");
      }
    }),

  update: protectedProcedure
    .use(requirePropertyManager())
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        postal_code: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const { id, ...data } = input;
        const cookie = ctx.headers?.get("cookie") ?? "";
        const response = await fetch(`${API_URL}/api/properties/${id}/`, {
          method: "PUT",
          headers: buildHeaders(cookie),
          body: JSON.stringify(data),
        });

        if (!response.ok) throw new Error("Failed to update property");
        
        return await response.json();
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to update property");
      }
    }),

  delete: protectedProcedure
    .use(requirePropertyManager())
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const cookie = ctx.headers?.get("cookie") ?? "";
        const response = await fetch(`${API_URL}/api/properties/${input.id}/`, {
          method: "DELETE",
          headers: buildHeaders(cookie),
        });

        if (!response.ok) throw new Error("Failed to delete property");
        
        return { success: true };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to delete property");
      }
    }),
});
