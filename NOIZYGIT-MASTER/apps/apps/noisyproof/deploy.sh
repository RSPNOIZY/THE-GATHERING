#!/bin/bash

echo "🚀 Deploying Noisy Proof V1..."

# Check if database exists
DB_ID=$(grep database_id wrangler.toml | cut -d'"' -f2)
if [ "$DB_ID" = "YOUR_DATABASE_ID" ]; then
    echo "Creating D1 database..."
    DB_RESULT=$(wrangler d1 create noisy-proof 2>&1)
    DB_ID=$(echo "$DB_RESULT" | grep -o '"[a-f0-9-]*"' | tr -d '"')
    
    # Update wrangler.toml
    sed -i '' "s/YOUR_DATABASE_ID/$DB_ID/" wrangler.toml
    echo "✅ Database created: $DB_ID"
fi

# Apply schema
echo "Applying database schema..."
wrangler d1 execute noisy-proof --file=./schema.sql

# Check if KV namespace exists
KV_ID=$(grep "id =" wrangler.toml | head -1 | cut -d'"' -f2)
if [ "$KV_ID" = "YOUR_KV_NAMESPACE_ID" ]; then
    echo "Creating KV namespace..."
    KV_RESULT=$(wrangler kv:namespace create "cache" 2>&1)
    KV_ID=$(echo "$KV_RESULT" | grep -o 'id = "[^"]*"' | cut -d'"' -f2)
    
    # Update wrangler.toml
    sed -i '' "s/YOUR_KV_NAMESPACE_ID/$KV_ID/" wrangler.toml
    
    # Create preview namespace
    KV_PREVIEW=$(wrangler kv:namespace create "cache" --preview 2>&1)
    KV_PREVIEW_ID=$(echo "$KV_PREVIEW" | grep -o 'preview_id = "[^"]*"' | cut -d'"' -f2)
    sed -i '' "s/YOUR_KV_PREVIEW_ID/$KV_PREVIEW_ID/" wrangler.toml
    
    echo "✅ KV namespace created: $KV_ID"
fi

# Build
echo "Building TypeScript..."
npm run build

# Deploy
echo "Deploying to Cloudflare..."
wrangler deploy

echo "✅ Noisy Proof V1 deployed successfully!"
echo ""
echo "API Endpoints:"
echo "  POST https://heaven.rsp-5f3.workers.dev/audio/register"
echo "  POST https://heaven.rsp-5f3.workers.dev/consent/grant"
echo "  POST https://heaven.rsp-5f3.workers.dev/consent/check"
echo "  GET  https://heaven.rsp-5f3.workers.dev/provenance/:fingerprintId"
echo "  GET  https://heaven.rsp-5f3.workers.dev/audit/verify"
echo "  GET  https://heaven.rsp-5f3.workers.dev/audit/stats"
