import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { requireRole, requirePropertyManager, requireMaintenanceStaff } from "~/server/api/middleware/permissions";
import { TRPCError } from "@trpc/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const tasksRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(["pending", "assigned", "in_progress", "completed", "cancelled"]).optional(),
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

        const response = await fetch(`${API_URL}/api/tasks/?${params}`, {
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        if (!response.ok) throw new Error("Failed to fetch tasks");
        
        return await response.json();
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to fetch tasks");
      }
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      try {
        const response = await fetch(`${API_URL}/api/tasks/${input.id}/`, {
          headers: { "Content-Type": "application/json" },
          credentials: "include",
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
        property_id: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const response = await fetch(`${API_URL}/api/tasks/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(input),
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
        status: z.enum(["pending", "assigned", "in_progress", "completed", "cancelled"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { id, ...data } = input;
        const response = await fetch(`${API_URL}/api/tasks/${id}/`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
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
    .mutation(async ({ input }) => {
      try {
        const response = await fetch(`${API_URL}/api/tasks/${input.task_id}/assign_to/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ assigned_to: input.staff_id }),
        });

        if (!response.ok) throw new Error("Failed to assign task");
        
        return await response.json();
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to assign task");
      }
    }),

  markInProgress: protectedProcedure
    .use(requireMaintenanceStaff())
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      try {
        const response = await fetch(`${API_URL}/api/tasks/${input.id}/mark_in_progress/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
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
    .mutation(async ({ input }) => {
      try {
        const response = await fetch(`${API_URL}/api/tasks/${input.id}/mark_completed/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
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
    .mutation(async ({ input }) => {
      try {
        const response = await fetch(`${API_URL}/api/tasks/${input.id}/`, {
          method: "DELETE",
          credentials: "include",
        });

        if (!response.ok) throw new Error("Failed to delete task");
        
        return { success: true };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to delete task");
      }
    }),
});
