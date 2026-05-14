import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const commentsRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        task_id: z.number(),
        page: z.number().default(1),
        limit: z.number().default(20),
      })
    )
    .query(async ({ input }) => {
      try {
        const params = new URLSearchParams({
          task_id: input.task_id.toString(),
          page: input.page.toString(),
          limit: input.limit.toString(),
        });

        const response = await fetch(`${API_URL}/api/comments/?${params}`, {
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        if (!response.ok) throw new Error("Failed to fetch comments");
        
        return await response.json();
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to fetch comments");
      }
    }),

  create: protectedProcedure
    .input(
      z.object({
        task_id: z.number(),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const response = await fetch(`${API_URL}/api/comments/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(input),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || "Failed to create comment");
        }
        
        return await response.json();
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to create comment");
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      try {
        const response = await fetch(`${API_URL}/api/comments/${input.id}/`, {
          method: "DELETE",
          credentials: "include",
        });

        if (!response.ok) throw new Error("Failed to delete comment");
        
        return { success: true };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to delete comment");
      }
    }),
});
