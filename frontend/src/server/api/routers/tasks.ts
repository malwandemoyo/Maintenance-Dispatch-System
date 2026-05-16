import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { requireRole, requirePropertyManager, requireMaintenanceStaff } from "~/server/api/middleware/permissions";
import { TRPCError } from "@trpc/server";

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

export const tasksRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(["pending", "assigned", "in_progress", "completed", "cancelled", "open", "done", "deleted"]).optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const params = new URLSearchParams({
          page: input.page.toString(),
          limit: input.limit.toString(),
          ...(input.status && { status: input.status }),
          ...(input.priority && { priority: input.priority }),
        });

        const cookie = ctx.headers?.get("cookie") ?? "";
        // Debug: log whether we're forwarding a cookie (trimmed for privacy)
        try {
          console.debug(
            `[tRPC/tasks] forwarding cookie present=${!!cookie} value="${cookie ? cookie.slice(0,50) + (cookie.length>50? '...':'' ) : ''}"`
          );
        } catch (e) {
          // ignore logging errors
        }
        const response = await fetch(`${API_URL}/api/tasks/?${params}`, {
          headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
        });

        if (!response.ok) {
          const text = await response.text().catch(() => "<no-body>");
          console.debug(`[tRPC/tasks] backend responded status=${response.status} body=${text}`);
          throw new Error("Failed to fetch tasks");
        }

        return await response.json();
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to fetch tasks");
      }
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const cookie = ctx.headers?.get("cookie") ?? "";
        const response = await fetch(`${API_URL}/api/tasks/${input.id}/`, {
          headers: { "Content-Type": "application/json", ...(cookie ? { cookie } : {}) },
        });

        if (!response.ok) throw new Error("Task not found");
        
        return await response.json();
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to fetch task");
      }
    }),

  create: protectedProcedure
    .use(requirePropertyManager())
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
        property: z.number(),
        assigned_to: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const cookie = ctx.headers?.get("cookie") ?? "";
        const payload = {
          ...input,
          status: input.assigned_to ? "assigned" : "pending",
        };
        const response = await fetch(`${API_URL}/api/tasks/`, {
          method: "POST",
          headers: buildHeaders(cookie),
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || "Failed to create task");
        }
        
        return await response.json();
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to create task");
      }
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        status: z.enum(["pending", "assigned", "in_progress", "completed", "cancelled", "open", "done", "deleted"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const { id, ...data } = input;
        const cookie = ctx.headers?.get("cookie") ?? "";
        const response = await fetch(`${API_URL}/api/tasks/${id}/`, {
          method: "PUT",
          headers: buildHeaders(cookie),
          body: JSON.stringify(data),
        });

        if (!response.ok) throw new Error("Failed to update task");
        
        return await response.json();
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to update task");
      }
    }),

  assign: protectedProcedure
    .use(requirePropertyManager())
    .input(
      z.object({
        task_id: z.number(),
        staff_id: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const cookie = ctx.headers?.get("cookie") ?? "";
        const response = await fetch(`${API_URL}/api/tasks/${input.task_id}/`, {
          method: "PATCH",
          headers: buildHeaders(cookie),
          body: JSON.stringify({ assigned_to: input.staff_id, status: "assigned" }),
        });

        if (!response.ok) {
          if (response.status === 400) {
            const err = await response.json().catch(() => ({}));
            const message = Object.values(err).flat()[0] ?? "Validation error";
            throw new Error(message as string);
          }
          throw new Error("Failed to assign task");
        }

        return await response.json();
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to assign task");
      }
    }),

  markInProgress: protectedProcedure
    .use(requireMaintenanceStaff())
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const cookie = ctx.headers?.get("cookie") ?? "";
        const response = await fetch(`${API_URL}/api/tasks/${input.id}/mark_in_progress/`, {
          method: "POST",
          headers: buildHeaders(cookie),
        });

        if (!response.ok) throw new Error("Failed to update status");
        
        return await response.json();
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to update status");
      }
    }),

  markCompleted: protectedProcedure
    .use(requireMaintenanceStaff())
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const cookie = ctx.headers?.get("cookie") ?? "";
        const response = await fetch(`${API_URL}/api/tasks/${input.id}/mark_completed/`, {
          method: "POST",
          headers: buildHeaders(cookie),
        });

        if (!response.ok) throw new Error("Failed to mark completed");
        
        return await response.json();
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to mark completed");
      }
    }),

  delete: protectedProcedure
    .use(requirePropertyManager())
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const cookie = ctx.headers?.get("cookie") ?? "";
        const response = await fetch(`${API_URL}/api/tasks/${input.id}/`, {
          method: "DELETE",
          headers: buildHeaders(cookie),
        });

        if (!response.ok) throw new Error("Failed to delete task");
        
        return { success: true };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to delete task");
      }
    }),
});
