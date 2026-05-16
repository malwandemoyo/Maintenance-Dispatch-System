import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

let post = {
  id: 1,
  name: "Hello World",
};

export const postRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ input }) => {
      post = { id: post.id + 1, name: input.name };
      return post;
    }),

  // Return the latest post only when a session user exists. Use a public
  // procedure so server/client renders won't throw UNAUTHORIZED during
  // hydration; return `null` when unauthenticated.
  getLatest: publicProcedure.query(({ ctx }) => {
    if (!ctx.session?.user) return null;
    return post;
  }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});
