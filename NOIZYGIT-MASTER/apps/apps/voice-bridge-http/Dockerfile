# ═══════════════════════════════════════════════════════════════
# NOIZY Voice Bridge HTTP — Cloud Run Dockerfile
# Node 22 Alpine · minimal surface · non-root user
# ═══════════════════════════════════════════════════════════════

FROM node:22-alpine AS base
WORKDIR /app

# Dependencies only (layer-cached unless package.json changes)
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

# Source
COPY server.mjs ./

# Non-root user for Cloud Run security best practice
RUN addgroup -S noizy && adduser -S noizy -G noizy
USER noizy

# Cloud Run always injects $PORT — server.mjs reads it
ENV PORT=8080
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:${PORT}/health || exit 1

CMD ["node", "server.mjs"]
