#!/bin/bash

# Quick test for Cloudflare token
echo "Testing Cloudflare API token..."
wrangler whoami

if [ $? -eq 0 ]; then
    echo "✅ Token working! You can now deploy."
    echo ""
    echo "Next steps:"
    echo "1. Restart Windsurf (Cmd+Shift+P → Developer: Reload Window)"
    echo "2. Retry D1 schema creation in Cascade"
else
    echo "❌ Token not set or invalid"
    echo ""
    echo "Run: export CLOUDFLARE_API_TOKEN='your-token-here'"
fi
