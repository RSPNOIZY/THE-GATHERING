# Lucy API — Dockerfile
# Forked from Heaven identity | NODE_ENV=production

FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:22-alpine AS runtime
LABEL maintainer="NOIZYLAB <admin@noizylab.com>"
LABEL service="lucy-api"
LABEL version="1.0.0"
LABEL heaven.fork="true"

RUN addgroup -S lucy && adduser -S lucy -G lucy

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .

RUN chown -R lucy:lucy /app
USER lucy

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:8080/health || exit 1

ENV NODE_ENV=production
ENV IDENTITY=lucy

CMD ["node", "src/index.js"]
