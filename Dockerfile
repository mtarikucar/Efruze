# syntax=docker/dockerfile:1.7
#
# Multi-stage Next.js + Prisma build. Final image ships only production deps +
# the .next output, with the Prisma CLI available so the entrypoint can apply
# schema changes at start.

# --- 1. install all deps (build cache layer) ---
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# --- 2. build ---
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time env. Prisma's generate doesn't need a real DB connection, but
# `next build` runs server-component code which imports lib/env.ts; in
# production mode that file's Zod superRefine rejects a localhost DATABASE_URL.
# Pass non-localhost placeholders that satisfy validation — real values come
# from docker-compose at runtime. NEXT_PUBLIC_* values DO get baked into the
# client bundle, so set them with the real production URL.
ARG DATABASE_URL=postgresql://placeholder@db:5432/efruze?schema=public
ARG NEXT_PUBLIC_SITE_URL=https://efruze.muhammedtarikucar.com
# Build-time placeholder so lib/env.ts's prod superRefine (which requires
# AUTH_SECRET when NODE_ENV=production) is satisfied during `next build`.
# The runtime AUTH_SECRET comes from docker-compose env at container start.
ARG AUTH_SECRET=build-time-placeholder-secret-not-used-at-runtime
ENV DATABASE_URL=$DATABASE_URL \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    AUTH_SECRET=$AUTH_SECRET \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production
RUN npx prisma generate
RUN npm run build

# --- 3. trim down to production deps only ---
FROM node:20-alpine AS prod-deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --legacy-peer-deps && npm cache clean --force

# --- 4. runtime ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN apk add --no-cache libc6-compat openssl curl \
 && addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/next.config.ts ./next.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/i18n ./i18n
COPY --from=builder --chown=nextjs:nodejs /app/messages ./messages
# lib/ is needed by prisma/seed.ts (imports mock-events / mock-journal seed data)
COPY --from=builder --chown=nextjs:nodejs /app/lib ./lib

# Regenerate Prisma client against the slim prod node_modules.
RUN npx prisma generate

USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3000/ >/dev/null || exit 1

# `prisma db push` applies the schema to an empty DB on first start, and is a
# no-op on subsequent starts. v1 ships without versioned migrations; switch to
# `prisma migrate deploy` once you've generated a baseline migration locally.
CMD ["sh", "-c", "npx prisma db push --skip-generate && node node_modules/.bin/next start"]
