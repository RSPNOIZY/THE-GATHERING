#!/bin/bash
set -e
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  🧠 10CC ROOM - AI Constellation Orchestrator                 ║"
echo "║  5 Thinkers • 5 Doers • 2 Verifiers • 3 Special Modes        ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
cd "$(dirname "$0")"
wrangler deploy --minify
echo ""
echo "✅ Deployed: https://noizylab-10cc-room.fishmusicinc.workers.dev"
echo ""
echo "Add API keys:"
echo "  wrangler secret put ANTHROPIC_API_KEY"
echo "  wrangler secret put OPENAI_API_KEY"
echo "  wrangler secret put GOOGLE_API_KEY"
echo "  wrangler secret put DEEPSEEK_API_KEY"
echo "  wrangler secret put MISTRAL_API_KEY"
echo "  wrangler secret put GROQ_API_KEY"
echo "  wrangler secret put PERPLEXITY_API_KEY"
