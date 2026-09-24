#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# NOIZY EMPIRE — Registry Builder
# Regenerates empire-registry.json from live filesystem state
# Usage: bash scripts/build-registry.sh
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

EMPIRE_ROOT="${EMPIRE_ROOT:-/Users/m2ultra/THE-GATHERING}"
REGISTRY="$EMPIRE_ROOT/command-center/empire-registry.json"

echo "🜂 NOIZY Empire Registry Builder"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Root: $EMPIRE_ROOT"
echo ""

# Count tools
TOOL_COUNT=$(find "$EMPIRE_ROOT/tools" -maxdepth 1 -type f \( -name "*.sh" -o -name "*.js" -o -name "*.mjs" \) 2>/dev/null | wc -l | tr -d ' ')

# Count agents
AGENT_MASTERS=$(find "$EMPIRE_ROOT/DREAMCHAMBER/AGENTS" -name "MASTER_*.md" 2>/dev/null | wc -l | tr -d ' ')

# Count workers
WORKER_COUNT=$(find "$EMPIRE_ROOT/heaven/workers" -maxdepth 1 -mindepth 1 -type d 2>/dev/null | grep -v '_cloudflare' | wc -l | tr -d ' ')

# Count migrations
MIGRATION_COUNT=$(find "$EMPIRE_ROOT/supabase/migrations" -name "*.sql" 2>/dev/null | wc -l | tr -d ' ')

# Count projects
PROJECT_COUNT=$(find "$EMPIRE_ROOT/PROJECTS" -maxdepth 1 -mindepth 1 -type d 2>/dev/null | wc -l | tr -d ' ')

# Service ports (scan from README/EMPIRE_MAP)
echo "📊 Empire Inventory:"
echo "  Tools:       $TOOL_COUNT scripts"
echo "  Agent docs:  $AGENT_MASTERS master doctrines"  
echo "  CF Workers:  $WORKER_COUNT"
echo "  DB schemas:  $MIGRATION_COUNT migrations"
echo "  Projects:    $PROJECT_COUNT staging dirs"
echo ""

# Validate registry exists
if [ -f "$REGISTRY" ]; then
  VERSION=$(jq -r '.version' "$REGISTRY" 2>/dev/null || echo "unknown")
  BRANDS=$(jq '.brands | length' "$REGISTRY" 2>/dev/null || echo "?")
  AGENTS=$(jq '.agents | length' "$REGISTRY" 2>/dev/null || echo "?")
  echo "✅ Registry exists: v$VERSION"
  echo "   Brands: $BRANDS · Agents: $AGENTS"
else
  echo "⚠️  Registry not found at $REGISTRY"
  echo "   Run from THE-GATHERING root or set EMPIRE_ROOT"
  exit 1
fi

# Validate all brand paths
echo ""
echo "🔗 Validating brand paths..."
jq -r '.brands[] | select(.local_path != null) | .local_path' "$REGISTRY" | while read -r path; do
  full_path="$EMPIRE_ROOT/$path"
  if [ -d "$full_path" ] || [ -d "$path" ]; then
    echo "  ✅ $path"
  else
    echo "  ❌ $path (not found)"
  fi
done

# Validate master docs
echo ""
echo "📄 Validating master docs..."
jq -r '.agents[] | select(.master_doc != null) | .master_doc' "$REGISTRY" | while read -r doc; do
  if [ -f "$EMPIRE_ROOT/$doc" ]; then
    echo "  ✅ $doc"
  else
    echo "  ❌ $doc (not found)"
  fi
done

echo ""
echo "🜂 Registry validation complete. GORUNFREE."
