# Multi-stage Dockerfile for Next.js frontend with pnpm
# Stages: dependencies, builder, runner (production), development

# ==================== DEPENDENCIES STAGE ====================
FROM node:20-alpine AS deps
WORKDIR /app

# Install pnpm via Corepack for a more stable production install path
RUN corepack enable && corepack prepare pnpm@10.25.0 --activate

# Copy pnpm lock file
COPY pnpm-lock.yaml ./

# Install dependencies (frozen lockfile for reproducible builds)
RUN pnpm install --frozen-lockfile --prod

# ==================== BUILDER STAGE ====================
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm via Corepack for a more stable production install path
RUN corepack enable && corepack prepare pnpm@10.25.0 --activate

# Copy pnpm lock file and all source
COPY pnpm-lock.yaml ./
COPY . .

# Install all dependencies (including dev)
RUN pnpm install --frozen-lockfile

# Build Next.js app
ARG NODE_ENV=production
ARG SKIP_ENV_VALIDATION=1
ENV NODE_ENV=production
ENV SKIP_ENV_VALIDATION=${SKIP_ENV_VALIDATION}
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm run build

# ==================== PRODUCTION RUNNER STAGE ====================
FROM node:20-alpine AS production
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy the entire standalone output (includes server.js)
COPY --from=builder /app/.next/standalone /app
# Copy static files
COPY --from=builder /app/.next/static /app/.next/static
COPY --from=builder /app/public /app/public

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["node", "server.js"]

# ==================== DEVELOPMENT STAGE ====================
FROM node:20-alpine AS development
WORKDIR /app

# Install pnpm via Corepack for a more stable production install path
RUN corepack enable && corepack prepare pnpm@10.25.0 --activate

# Set development environment
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

# Install dependencies from host volume
# (will be overridden by docker-compose volume mount)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000 || exit 1

# Default command for development (can be overridden by compose)
CMD ["pnpm", "dev"]

# ==================== DEFAULT TARGET ====================
# Use production as default, override with --target flag for dev
FROM production