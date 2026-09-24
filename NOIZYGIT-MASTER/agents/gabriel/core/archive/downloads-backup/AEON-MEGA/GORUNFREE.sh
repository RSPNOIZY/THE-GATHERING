#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# AEON MEGA DEPLOY - GORUNFREE
# Brain + Heart + Power = ONE COMMAND
# ═══════════════════════════════════════════════════════════════
set -e
cd "$(dirname "$0")"

echo ""
echo "⚡ AEON MEGA DEPLOY ⚡"
echo ""

# Create D1 database
wrangler d1 create aeon-god-kernel 2>/dev/null || true

# Get D1 ID and update wrangler.toml
D1_ID=$(wrangler d1 list --json 2>/dev/null | grep -o '"uuid":"[^"]*' | grep -A1 aeon-god-kernel | tail -1 | cut -d'"' -f4)
if [ -n "$D1_ID" ]; then
    sed -i.bak "s/database_id = .*/database_id = \"$D1_ID\"/" wrangler.toml
fi

# Initialize schema
wrangler d1 execute aeon-god-kernel --file=schema.sql --remote 2>/dev/null || true

# Deploy
wrangler deploy

echo ""
echo "⚡ DEPLOYED ⚡"
echo ""
