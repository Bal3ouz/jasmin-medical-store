# syntax=docker/dockerfile:1.6
# ---------------------------------------------------------------------------
# Multi-stage build for the Jasmin monorepo. Builds a single Next.js app at
# a time, identified by the APP build arg (`web` or `admin`). The resulting
# image runs the standalone server on port 3000.
#
# Run via:
#   docker build --build-arg APP=web -t jasmin-web .
#   docker build --build-arg APP=admin -t jasmin-admin .
# ---------------------------------------------------------------------------

ARG BUN_VERSION=1.2.0

# ---- deps stage: cache node_modules per workspace -------------------------
FROM oven/bun:${BUN_VERSION}-slim AS deps
WORKDIR /repo
# Copy lockfile + every package.json so `bun install` resolves the workspace
# topology without dragging the entire source tree into the cache layer.
COPY package.json bun.lock turbo.json ./
COPY apps/admin/package.json apps/admin/
COPY apps/web/package.json apps/web/
COPY packages/config/package.json packages/config/
COPY packages/db/package.json packages/db/
COPY packages/lib/package.json packages/lib/
COPY packages/ui/package.json packages/ui/
RUN bun install --frozen-lockfile

# ---- build stage: produce .next/standalone --------------------------------
FROM oven/bun:${BUN_VERSION} AS builder
ARG APP
ENV APP=${APP}
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /repo
# Bun hoists workspace deps into a single root node_modules; per-package
# directories are workspace symlinks created on install. Copy the whole tree
# from the deps stage so the symlinks stay intact.
COPY --from=deps /repo/ /repo/
COPY . .
# `bun --filter` is flaky inside docker layers (workspace registry not always
# detected), so cd into the target app and run next build directly. Workspace
# packages still resolve via the root node_modules symlinks.
RUN cd apps/${APP} && bun run build

# ---- runtime stage: minimal Bun image with the standalone bundle ----------
FROM oven/bun:${BUN_VERSION}-slim AS runner
ARG APP
ENV APP=${APP}
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
WORKDIR /app

# next.js's standalone build emits a self-contained tree at
# `apps/<app>/.next/standalone/`. Because we set `outputFileTracingRoot` to
# the repo root, that tree mirrors the repo layout — preserve it on copy so
# the workspace-symlinked imports keep resolving at runtime.
COPY --from=builder /repo/apps/${APP}/.next/standalone ./
COPY --from=builder /repo/apps/${APP}/.next/static ./apps/${APP}/.next/static
COPY --from=builder /repo/apps/${APP}/public ./apps/${APP}/public

EXPOSE 3000
# Re-resolve APP at exec time so the container picks up the right server.
CMD ["sh", "-c", "node apps/${APP}/server.js"]
