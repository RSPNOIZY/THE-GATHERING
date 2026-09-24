# DreamChamber Production Docker Image
FROM node:18-alpine AS base

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++ 

WORKDIR /app

# Dependencies layer
FROM base AS deps
COPY package*.json ./
RUN npm ci --production && npm cache clean --force

# Development dependencies layer
FROM base AS dev-deps
COPY package*.json ./
RUN npm ci && npm cache clean --force

# Build layer (if we add TypeScript or build steps later)
FROM dev-deps AS build
COPY . .
# RUN npm run build (when we have a build step)

# Production image
FROM base AS runtime
ENV NODE_ENV=production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy application code
COPY . .

# Change ownership
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 7777

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:7777/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

CMD ["node", "src/server.js"]
