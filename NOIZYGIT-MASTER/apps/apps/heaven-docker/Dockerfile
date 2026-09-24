FROM node:20-alpine

RUN apk add --no-cache curl

WORKDIR /app

# Copy Heaven worker source
COPY heaven-worker/ ./heaven-worker/

WORKDIR /app/heaven-worker
RUN npm install --omit=dev && npm install -g wrangler

EXPOSE 8787

# Run wrangler dev in local mode (no Cloudflare account needed)
CMD ["npx", "wrangler", "dev", "--local", "--port", "8787", "--ip", "0.0.0.0"]
