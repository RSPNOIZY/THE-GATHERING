# Heaven API — Dockerfile
# Node.js 22 LTS / Express backend for Heaven identity

FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:22-alpine AS runtime
LABEL maintainer="NOIZYLAB <admin@noizylab.com>"
LABEL service="heaven-api"
LABEL version="1.0.0"

RUN addgroup -S heaven && adduser -S heaven -G heaven

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .

# Ownership
RUN chown -R heaven:heaven /app
USER heaven

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:8080/health || exit 1

ENV NODE_ENV=production
ENV IDENTITY=heaven

CMD ["node", "src/index.js"]
