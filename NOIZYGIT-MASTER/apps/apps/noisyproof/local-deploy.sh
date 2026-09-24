#!/bin/bash

echo "🚀 Local deployment preparation for Noisy Proof..."

# Check current auth status
echo "Checking Cloudflare authentication..."
wrangler whoami || {
    echo "❌ Not logged in to Cloudflare"
    echo "Please run: wrangler login"
    echo "Use the account with D1 database access"
    exit 1
}

# Create database locally first
echo "Creating local D1 database..."
wrangler d1 create noisy-proof --local || {
    echo "Database might already exist, continuing..."
}

# Apply schema locally
echo "Applying schema to local database..."
wrangler d1 execute noisy-proof --local --file=./schema.sql

# Build TypeScript
echo "Building TypeScript..."
npm run build || {
    echo "Build failed, running npm install first..."
    npm install
    npm run build
}

# Start local dev server
echo "Starting local development server..."
echo "Access at: http://localhost:8787"
wrangler dev --local
