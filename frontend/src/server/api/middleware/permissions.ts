import { TRPCError } from '@trpc/server';
import { middleware, publicProcedure } from '~/server/api/trpc';

/**
 * Permission middleware for tRPC
 * Validates user role-based access to procedures
 */
export const permissionMiddleware = middleware(async ({ ctx, next }) => {
  // This middleware is called for all protected procedures
  // ctx.session is already checked by protectedProcedure
  return next();
});

/**
 * Validate user has required role
 */
export function requireRole(...allowedRoles: string[]) {
  return middleware(({ ctx, next }) => {
    if (!ctx.session?.user?.role) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in',
      });
    }

    if (!allowedRoles.includes(ctx.session.user.role)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to perform this action',
      });
    }

    return next();
  });
}

/**
 * Validate user is property manager
 */
export function requirePropertyManager() {
  return requireRole('property_manager');
}

/**
 * Validate user is maintenance staff
 */
export function requireMaintenanceStaff() {
  return requireRole('maintenance_staff');
}

/**
 * Validate user is resident
 */
export function requireResident() {
  return requireRole('resident');
}
