import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { requirePropertyManager } from "~/server/api/middleware/permissions";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const usersRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        role: z.enum(["property_manager", "maintenance_staff", "resident"]).optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const params = new URLSearchParams({
          page: input.page.toString(),
          limit: input.limit.toString(),
          ...(input.role && { role: input.role }),
        });
        const cookie = ctx.headers?.get("cookie") ?? "";

        const response = await fetch(`${API_URL}/api/users/?${params}`, {
          headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
        });

        if (!response.ok) throw new Error("Failed to fetch users");
        
        return await response.json();
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to fetch users");
      }
    }),

  getMaintenanceStaff: protectedProcedure
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
          role: "maintenance_staff",
        });
        const cookie = ctx.headers?.get("cookie") ?? "";
        console.debug(`[tRPC/users.getMaintenanceStaff] forwarding cookie present=${!!cookie} value="${cookie.substring(0, 40)}..."`);

        const response = await fetch(`${API_URL}/api/users/?${params}`, {
          headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
        });

        if (!response.ok) {
          const body = await response.text().catch(() => "");
          console.debug(`[tRPC/users.getMaintenanceStaff] backend responded status=${response.status} body="${body}"`);
          throw new Error("Failed to fetch maintenance staff");
        }
        
        const data = await response.json();
        console.debug(`[tRPC/users.getMaintenanceStaff] backend response OK, data:`, data);
        return data;
      } catch (error) {
        console.error(`[tRPC/users.getMaintenanceStaff] error:`, error);
        throw new Error(error instanceof Error ? error.message : "Failed to fetch maintenance staff");
      }
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const cookie = ctx.headers?.get("cookie") ?? "";
        const response = await fetch(`${API_URL}/api/users/${input.id}/`, {
          headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
        });

        if (!response.ok) throw new Error("User not found");
        
        return await response.json();
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to fetch user");
      }
    }),

  getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    try {
      const cookie = ctx.headers?.get("cookie") ?? "";
      const response = await fetch(`${API_URL}/api/auth/me/`, {
        headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
      });

      if (!response.ok) return null;
      
      return await response.json();
    } catch (error) {
      return null;
    }
  }),
});
