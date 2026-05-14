/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

// We'll rely on the Django session as the source of truth for server-side
// requests. Do not call NextAuth here — instead, attempt to resolve the
// logged-in user by forwarding the incoming Cookie header to the Django
// `/api/auth/me/` endpoint.

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  // Log whether a Cookie header was received (helps debug session forwarding)
  try {
    const hasCookie = !!opts.headers?.get("cookie");
    console.debug(`[tRPC] createTRPCContext - cookie present: ${hasCookie}`);
  } catch (e) {
    // ignore logging errors
  }

  // Build a session object exclusively from the Django session when possible.
  let session: { user: null | { id: string; name: string | null; email?: string | null; role?: string | null } } = { user: null };

  try {
    const hasCookie = !!opts.headers?.get("cookie");
    console.debug(`[tRPC] createTRPCContext - cookie present: ${hasCookie}`);
    if (hasCookie) {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const cookie = opts.headers.get("cookie") ?? "";
      try {
        const res = await fetch(`${API_URL}/api/auth/me/`, {
          headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
        });

        if (res.ok) {
          const userResp = await res.json().catch(() => null);
          const user = userResp?.user ?? userResp;
          if (user) {
            session = {
              user: {
                id: String(user.id),
                name: user.first_name || user.username || user.email || null,
                email: user.email ?? null,
                role: user.role ?? null,
              },
            };
            console.debug('[tRPC] createTRPCContext - populated session.user from Django session');
          } else {
            console.debug('[tRPC] createTRPCContext - /api/auth/me/ returned ok but no user payload');
          }
        } else {
          // Improved debug: log trimmed cookie and response body to help diagnose 403
          try {
            const text = await res.text().catch(() => '<no-body>');
            const trimmed = (cookie || '').slice(0, 200) + (cookie && cookie.length > 200 ? '...' : '');
            console.debug('[tRPC] createTRPCContext - /api/auth/me/ returned non-ok', res.status, 'cookie=', trimmed, 'body=', text);
          } catch (e) {
            console.debug('[tRPC] createTRPCContext - /api/auth/me/ returned non-ok', res.status);
          }
        }
      } catch (e) {
        console.debug('[tRPC] createTRPCContext - error fetching /api/auth/me/', String(e));
      }
    }
  } catch (e) {
    // swallow — we don't want a broken auth probe to crash the request pipeline
    console.debug('[tRPC] createTRPCContext - unexpected error', String(e));
  }

  return {
    session,
    ...opts,
  };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Create a server-side caller.
 *
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;
export const middleware = t.middleware;

/**
 * Middleware for timing procedure execution and adding an artificial delay in development.
 *
 * You can remove this if you don't like it, but it can help catch unwanted waterfalls by simulating
 * network latency that would occur in production but not in local development.
 */
const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();

  if (t._config.isDev) {
    // artificial delay in dev
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const result = await next();

  const end = Date.now();
  console.log(`[TRPC] ${path} took ${end - start}ms to execute`);

  return result;
});

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure.use(timingMiddleware);

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.session.user` is not null.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next({
      ctx: {
        // infers the `session` as non-nullable
        session: { ...ctx.session, user: ctx.session.user },
      },
    });
  });
