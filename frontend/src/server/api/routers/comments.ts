import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Extract CSRF token from cookie string (Django expects csrftoken=xxx)
function extractCsrfToken(cookieString: string): string | null {
  const m = /csrftoken=([^;]+)/.exec(cookieString);
  return m?.[1] ?? null;
}

export const commentsRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        task_id: z.number(),
        page: z.number().default(1),
        limit: z.number().default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const params = new URLSearchParams({
          task_id: input.task_id.toString(),
          page: input.page.toString(),
          limit: input.limit.toString(),
        });
        const cookie = ctx.headers?.get("cookie") ?? "";
        console.debug(`[tRPC/comments.list] forwarding cookie present=${!!cookie} value="${cookie.substring(0, 40)}..."`);

        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (cookie) headers.Cookie = cookie;

        const response = await fetch(`${API_URL}/api/comments/?${params}`, {
          headers,
        });

        if (!response.ok) {
          const body = await response.text().catch(() => "");
          console.debug(`[tRPC/comments.list] backend responded status=${response.status} body="${body}"`);
          throw new Error("Failed to fetch comments");
        }
        
        const data = await response.json();
        console.debug(`[tRPC/comments.list] backend response OK, data:`, data);
        return data;
      } catch (error) {
        console.error(`[tRPC/comments.list] error:`, error);
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
    .mutation(async ({ input, ctx }) => {
      try {
        const cookie = ctx.headers?.get("cookie") ?? "";
        const csrfToken = extractCsrfToken(cookie);
        console.debug(`[tRPC/comments.create] forwarding cookie present=${!!cookie} csrfToken=${!!csrfToken}`);
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (cookie) headers.Cookie = cookie;
        if (csrfToken) headers["X-CSRFToken"] = csrfToken;

        const response = await fetch(`${API_URL}/api/comments/`, {
          method: "POST",
          headers,
          body: JSON.stringify({ task: input.task_id, content: input.content }),
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => "");
          console.debug(`[tRPC/comments.create] backend responded status=${response.status} body="${errorText}"`);
          try {
            const error = JSON.parse(errorText);
            throw new Error(error.detail || "Failed to create comment");
          } catch {
            throw new Error("Failed to create comment");
          }
        }
        
        const data = await response.json();
        console.debug(`[tRPC/comments.create] backend response OK, data:`, data);
        return data;
      } catch (error) {
        console.error(`[tRPC/comments.create] error:`, error);
        throw new Error(error instanceof Error ? error.message : "Failed to create comment");
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const cookie = ctx.headers?.get("cookie") ?? "";
        const csrfToken = extractCsrfToken(cookie);
        const headers: Record<string, string> = {};
        if (cookie) headers.Cookie = cookie;
        if (csrfToken) headers["X-CSRFToken"] = csrfToken;

        const response = await fetch(`${API_URL}/api/comments/${input.id}/`, {
          method: "DELETE",
          headers,
        });

        if (!response.ok) throw new Error("Failed to delete comment");
        
        return { success: true };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to delete comment");
      }
    }),
});
