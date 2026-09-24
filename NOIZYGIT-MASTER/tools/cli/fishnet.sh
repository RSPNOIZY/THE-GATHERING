#!/bin/bash
# ============================================================================
# FISHNET — NOIZY.AI Code Consolidation Engine
# Scans GOD, catalogs everything, copies into enterprise repos
# Robert Stephen Plowman | 2026-04-01
# ============================================================================
set -euo pipefail

REPOS_DIR="/Users/m2ultra/NOIZYLAB/repos"
LOG_DIR="/Users/m2ultra/NOIZYLAB/logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${LOG_DIR}/fishnet_${TIMESTAMP}.log"
MANIFEST="${LOG_DIR}/fishnet_manifest_${TIMESTAMP}.json"

mkdir -p "$LOG_DIR"

log() { echo "[$(date '+%H:%M:%S')] $1" | tee -a "$LOG_FILE"; }
warn() { echo "[$(date '+%H:%M:%S')] ⚠ $1" | tee -a "$LOG_FILE"; }
ok() { echo "[$(date '+%H:%M:%S')] ✓ $1" | tee -a "$LOG_FILE"; }

log "========================================="
log "FISHNET v1.0 — Code Consolidation Engine"
log "Operator: RSP_001 | Machine: GOD"
log "========================================="

# ────────────────────────────────────────────
# MAPPING TABLE: source → target repo/subdir
# ────────────────────────────────────────────
declare -A MAPPINGS

# noizy-heaven (Cloudflare HEAVEN Worker + signaling)
MAPPINGS["noizy-heaven:1"]="/Users/m2ultra/Desktop/HEAVEN/src|src/worker"
MAPPINGS["noizy-heaven:2"]="/Users/m2ultra/Desktop/HEAVEN/wrangler.toml|wrangler.toml"
MAPPINGS["noizy-heaven:3"]="/Users/m2ultra/Desktop/HEAVEN/package.json|package.json"
MAPPINGS["noizy-heaven:4"]="/Users/m2ultra/NOIZYLAB/noisyproof/src|src/noisyproof"
MAPPINGS["noizy-heaven:5"]="/Users/m2ultra/NOIZYLAB/noisyproof/schema.sql|db/noisyproof-schema.sql"
MAPPINGS["noizy-heaven:6"]="/Users/m2ultra/NOIZYLAB/src/dashboard.js|src/dashboard/dashboard.js"
MAPPINGS["noizy-heaven:7"]="/Users/m2ultra/NOIZYLAB/src/landing.js|src/landing/landing.js"
MAPPINGS["noizy-heaven:8"]="/Users/m2ultra/NOIZYLAB/src/streaming|src/streaming"
MAPPINGS["noizy-heaven:9"]="/Users/m2ultra/NOIZYLAB/src/webhooks.js|src/webhooks/webhooks.js"
MAPPINGS["noizy-heaven:10"]="/Users/m2ultra/NOIZYLAB/src/index.js|src/legacy-index.js"
MAPPINGS["noizy-heaven:11"]="/Users/m2ultra/NOIZYLAB/noizy-landing/src|src/landing-worker"
MAPPINGS["noizy-heaven:12"]="/Users/m2ultra/NOIZYLAB/noizy-landing/wrangler.toml|config/landing-wrangler.toml"
MAPPINGS["noizy-heaven:13"]="/Users/m2ultra/noizy/noizyanthropic-edge/src|src/edge"
MAPPINGS["noizy-heaven:14"]="/Users/m2ultra/NOIZYLAB/cloudflare-workers|legacy/cloudflare-workers"

# noizy-gabriel (GABRIEL daemon + scripts)
MAPPINGS["noizy-gabriel:1"]="/Users/m2ultra/NOIZYANTHROPIC/GABRIEL/daemon|src/v1-daemon"
MAPPINGS["noizy-gabriel:2"]="/Users/m2ultra/NOIZYANTHROPIC/GABRIEL/audit|scripts/audit"
MAPPINGS["noizy-gabriel:3"]="/Users/m2ultra/NOIZYANTHROPIC/GABRIEL/scripts|scripts/install"
MAPPINGS["noizy-gabriel:4"]="/Users/m2ultra/NOIZYLAB/GABRIEL/scripts|scripts/health"
MAPPINGS["noizy-gabriel:5"]="/Users/m2ultra/NOIZYLAB/gabriel.db|data/gabriel-v2.db"
MAPPINGS["noizy-gabriel:6"]="/Users/m2ultra/NOIZYLAB/tools/gabriel_monitor.py|tools/gabriel_monitor.py"

# noizy-voice (voice pipeline, rob_ava, audio-hub)
MAPPINGS["noizy-voice:1"]="/Users/m2ultra/NOIZYLAB/voice-pipeline|src/voice-pipeline"
MAPPINGS["noizy-voice:2"]="/Users/m2ultra/NOIZYLAB/rob_ava|src/rob-ava"
MAPPINGS["noizy-voice:3"]="/Users/m2ultra/NOIZYLAB/voice-bridge-server.js|src/voice-bridge/server.js"
MAPPINGS["noizy-voice:4"]="/Users/m2ultra/NOIZYANTHROPIC/NOIZYLAB/audio-hub|src/audio-hub"
MAPPINGS["noizy-voice:5"]="/Users/m2ultra/NOIZYANTHROPIC/NOIZYEMPIRE/voice|src/empire-voice"
MAPPINGS["noizy-voice:6"]="/Users/m2ultra/NOIZYLAB/tools/voice_server.py|tools/voice_server.py"
MAPPINGS["noizy-voice:7"]="/Users/m2ultra/NOIZYLAB/tools/voice_bridge.py|tools/voice_bridge.py"
MAPPINGS["noizy-voice:8"]="/Users/m2ultra/NOIZYLAB/tools/audio_pipeline.py|tools/audio_pipeline.py"

# noizy-lab (MCP servers, dreamchamber, R&D)
MAPPINGS["noizy-lab:1"]="/Users/m2ultra/NOIZYLAB/mcp-gemma3|src/mcp-gemma3"
MAPPINGS["noizy-lab:2"]="/Users/m2ultra/NOIZYLAB/mcp|src/mcp-framework"
MAPPINGS["noizy-lab:3"]="/Users/m2ultra/NOIZYLAB/dreamchamber/src|src/dreamchamber"
MAPPINGS["noizy-lab:4"]="/Users/m2ultra/NOIZYLAB/dreamchamber/docker-compose.yml|deploy/dreamchamber-compose.yml"
MAPPINGS["noizy-lab:5"]="/Users/m2ultra/NOIZYLAB/dreamchamber/ecosystem.config.js|deploy/dreamchamber-ecosystem.js"
MAPPINGS["noizy-lab:6"]="/Users/m2ultra/NOIZYLAB/dreamchamber-audio-mcp|src/dreamchamber-audio-mcp"
MAPPINGS["noizy-lab:7"]="/Users/m2ultra/NOIZYANTHROPIC/NOIZYEMPIRE/servers|src/tts-servers"
MAPPINGS["noizy-lab:8"]="/Users/m2ultra/swift-library|src/swift-library"
MAPPINGS["noizy-lab:9"]="/Users/m2ultra/NOIZYLAB/rsp001_pipeline|src/rsp001-pipeline"

# noizy-ai (mothership, noizybeast, mc96, apps, web)
MAPPINGS["noizy-ai:1"]="/Users/m2ultra/NOIZYLAB/noizybeast|src/noizybeast"
MAPPINGS["noizy-ai:2"]="/Users/m2ultra/NOIZYLAB/mc96|src/mc96"
MAPPINGS["noizy-ai:3"]="/Users/m2ultra/Projects/MC96|src/mc96-projects"
MAPPINGS["noizy-ai:4"]="/Users/m2ultra/NOIZYLAB/apps|src/apps"
MAPPINGS["noizy-ai:5"]="/Users/m2ultra/NOIZYLAB/web|src/web"
MAPPINGS["noizy-ai:6"]="/Users/m2ultra/NOIZYLAB/noizyempire-claude|src/noizyempire-claude"
MAPPINGS["noizy-ai:7"]="/Users/m2ultra/NOIZYLAB/tools/empire_dashboard.py|tools/empire_dashboard.py"
MAPPINGS["noizy-ai:8"]="/Users/m2ultra/NOIZYLAB/tools/archivist.py|tools/archivist.py"
MAPPINGS["noizy-ai:9"]="/Users/m2ultra/NOIZYLAB/tools/grand_orchestrator.py|tools/grand_orchestrator.py"

# noizy-consent (NCP, schemas, contracts, consent)
MAPPINGS["noizy-consent:1"]="/Users/m2ultra/NOIZYLAB/schemas|schemas"
MAPPINGS["noizy-consent:2"]="/Users/m2ultra/NOIZYLAB/contracts|contracts"
MAPPINGS["noizy-consent:3"]="/Users/m2ultra/NOIZYLAB/NCP_v1.0_SPEC.md|specs/NCP_v1.0_SPEC.md"
MAPPINGS["noizy-consent:4"]="/Users/m2ultra/NOIZYLAB/rob_ava/policy|policy"

# noizy-infra (deploy scripts, tools, migration, turbo)
MAPPINGS["noizy-infra:1"]="/Users/m2ultra/NOIZYLAB/scripts|scripts"
MAPPINGS["noizy-infra:2"]="/Users/m2ultra/NOIZYLAB/migration-pack|migration-pack"
MAPPINGS["noizy-infra:3"]="/Users/m2ultra/NOIZYLAB/tools/n8n_workflows|n8n/workflows"
MAPPINGS["noizy-infra:4"]="/Users/m2ultra/NOIZYLAB/tools/n8n_docs_sync_workflow.json|n8n/docs-sync.json"
MAPPINGS["noizy-infra:5"]="/Users/m2ultra/NOIZYLAB/tools/mcp_docs_sync.ts|tools/mcp_docs_sync.ts"
MAPPINGS["noizy-infra:6"]="/Users/m2ultra/NOIZYLAB/turbo-scripts|turbo-scripts"
MAPPINGS["noizy-infra:7"]="/Users/m2ultra/NOIZYLAB/enterprise|enterprise"
MAPPINGS["noizy-infra:8"]="/Users/m2ultra/NOIZYLAB/github-consolidation|github-consolidation"
MAPPINGS["noizy-infra:9"]="/Users/m2ultra/NOIZYLAB/ecosystem.config.cjs|deploy/ecosystem.config.cjs"
MAPPINGS["noizy-infra:10"]="/Users/m2ultra/NOIZYLAB/deploy.sh|deploy/deploy.sh"
MAPPINGS["noizy-infra:11"]="/Users/m2ultra/NOIZYLAB/empire-boot.sh|deploy/empire-boot.sh"
MAPPINGS["noizy-infra:12"]="/Users/m2ultra/NOIZYLAB/LAUNCH_NOIZYLAB_COMPLETE.sh|deploy/launch-complete.sh"
MAPPINGS["noizy-infra:13"]="/Users/m2ultra/NOIZYANTHROPIC/NOIZYEMPIRE/tools|legacy/empire-tools"
MAPPINGS["noizy-infra:14"]="/Users/m2ultra/NOIZYLAB/CODEMASTER|tools/codemaster"
MAPPINGS["noizy-infra:15"]="/Users/m2ultra/NOIZYLAB/tools/postman|tools/postman"
MAPPINGS["noizy-infra:16"]="/Users/m2ultra/NOIZYLAB/dns-exports|config/dns-exports"
MAPPINGS["noizy-infra:17"]="/Users/m2ultra/NOIZYLAB/smoke_test.sh|tests/smoke_test.sh"
MAPPINGS["noizy-infra:18"]="/Users/m2ultra/NOIZYLAB/schema.sql|db/schema.sql"
MAPPINGS["noizy-infra:19"]="/Users/m2ultra/NOIZYLAB/seed.sql|db/seed.sql"

# noizy-docs (documentation, governance, legal, strategy)
MAPPINGS["noizy-docs:1"]="/Users/m2ultra/NOIZYLAB/docs|docs"
MAPPINGS["noizy-docs:2"]="/Users/m2ultra/NOIZYLAB/BRAND_MAP.md|brand/BRAND_MAP.md"
MAPPINGS["noizy-docs:3"]="/Users/m2ultra/NOIZYLAB/EMPIRE_CATALOG.md|empire/EMPIRE_CATALOG.md"
MAPPINGS["noizy-docs:4"]="/Users/m2ultra/NOIZYLAB/NOIZY_MASTER_INDEX_v1.0.md|index/NOIZY_MASTER_INDEX_v1.0.md"
MAPPINGS["noizy-docs:5"]="/Users/m2ultra/NOIZYLAB/NOIZY_EMPIRE_COMPLETE_v1.0.md|empire/NOIZY_EMPIRE_COMPLETE_v1.0.md"
MAPPINGS["noizy-docs:6"]="/Users/m2ultra/NOIZYLAB/NOIZY_GOVERNANCE_v1.0.md|governance/NOIZY_GOVERNANCE_v1.0.md"
MAPPINGS["noizy-docs:7"]="/Users/m2ultra/NOIZYLAB/NOIZY_LEGAL_REGULATORY_v1.0.md|legal/NOIZY_LEGAL_REGULATORY_v1.0.md"
MAPPINGS["noizy-docs:8"]="/Users/m2ultra/NOIZYLAB/OPERATIONS_MANUAL.md|ops/OPERATIONS_MANUAL.md"
MAPPINGS["noizy-docs:9"]="/Users/m2ultra/NOIZYLAB/NOIZYSTREAM_SPEC.md|specs/NOIZYSTREAM_SPEC.md"
MAPPINGS["noizy-docs:10"]="/Users/m2ultra/NOIZYLAB/UNIVERSAL_PROTECTOR_STRATEGY.md|strategy/UNIVERSAL_PROTECTOR_STRATEGY.md"
MAPPINGS["noizy-docs:11"]="/Users/m2ultra/NOIZYLAB/VOICE_CONTROL_PIPELINE.md|specs/VOICE_CONTROL_PIPELINE.md"
MAPPINGS["noizy-docs:12"]="/Users/m2ultra/NOIZYLAB/NOIZY_BEAST_IDE_BLUEPRINT.md|specs/NOIZY_BEAST_IDE_BLUEPRINT.md"
MAPPINGS["noizy-docs:13"]="/Users/m2ultra/NOIZYLAB/NOIZY_DEPLOYMENT_CHECKLIST_v1.0.md|ops/DEPLOYMENT_CHECKLIST.md"
MAPPINGS["noizy-docs:14"]="/Users/m2ultra/NOIZYLAB/HEAVEN_RUNBOOK.md|ops/HEAVEN_RUNBOOK.md"
MAPPINGS["noizy-docs:15"]="/Users/m2ultra/NOIZYLAB/AUDIO_STACK.md|specs/AUDIO_STACK.md"
MAPPINGS["noizy-docs:16"]="/Users/m2ultra/NOIZYLAB/GOSPEL.md|manifesto/GOSPEL.md"

# noizy-supersonic (already populated, add extra assets)
MAPPINGS["noizy-supersonic:1"]="/Users/m2ultra/NOIZYLAB/supersonic|src"

# noizy-fish (record label)
MAPPINGS["noizy-fish:1"]="/Users/m2ultra/NOIZYLAB/noizyfish|src"

# noizy-vox (voice marketplace)
MAPPINGS["noizy-vox:1"]="/Users/m2ultra/NOIZYLAB/noizyvox|src/noizyvox-local"
MAPPINGS["noizy-vox:2"]="/Users/m2ultra/NOIZYANTHROPIC/NOIZYLAB/noisyvox|src/noizyvox-v1"

# noizy-wisdom (elder voices — no code yet, create placeholder)
# noizy-kidz (safe creative space — no code yet, create placeholder)
# noizy-aquarium (production vault — no code yet, create placeholder)

# ────────────────────────────────────────────
# DRY RUN vs EXECUTE
# ────────────────────────────────────────────
MODE="${1:-dry-run}"
TOTAL=0
COPIED=0
SKIPPED=0
MISSING=0

log "Mode: $MODE"
log ""

# Start JSON manifest
echo '{"fishnet_run":"'$TIMESTAMP'","mode":"'$MODE'","mappings":[' > "$MANIFEST"
FIRST=true

for key in $(echo "${!MAPPINGS[@]}" | tr ' ' '\n' | sort); do
  REPO=$(echo "$key" | cut -d: -f1)
  MAPPING="${MAPPINGS[$key]}"
  SRC=$(echo "$MAPPING" | cut -d'|' -f1)
  DST=$(echo "$MAPPING" | cut -d'|' -f2)
  TARGET="${REPOS_DIR}/${REPO}/${DST}"
  TOTAL=$((TOTAL + 1))

  # JSON entry
  if [ "$FIRST" = true ]; then FIRST=false; else echo ',' >> "$MANIFEST"; fi

  if [ ! -e "$SRC" ]; then
    warn "MISSING: $SRC → $REPO/$DST"
    MISSING=$((MISSING + 1))
    echo -n '{"repo":"'$REPO'","src":"'$SRC'","dst":"'$DST'","status":"missing"}' >> "$MANIFEST"
    continue
  fi

  if [ "$MODE" = "execute" ]; then
    TARGET_DIR=$(dirname "$TARGET")
    mkdir -p "$TARGET_DIR"

    if [ -d "$SRC" ]; then
      # Copy directory contents
      rsync -a --exclude='node_modules' --exclude='.git' --exclude='__pycache__' --exclude='.env' --exclude='*.db' "$SRC/" "$TARGET/"
    else
      cp "$SRC" "$TARGET"
    fi
    ok "COPIED: $SRC → $REPO/$DST"
    COPIED=$((COPIED + 1))
    echo -n '{"repo":"'$REPO'","src":"'$SRC'","dst":"'$DST'","status":"copied"}' >> "$MANIFEST"
  else
    if [ -d "$SRC" ]; then
      COUNT=$(find "$SRC" -type f -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/__pycache__/*' | wc -l | tr -d ' ')
      log "DRY: $SRC ($COUNT files) → $REPO/$DST"
    else
      SIZE=$(ls -lh "$SRC" 2>/dev/null | awk '{print $5}')
      log "DRY: $SRC ($SIZE) → $REPO/$DST"
    fi
    COPIED=$((COPIED + 1))
    echo -n '{"repo":"'$REPO'","src":"'$SRC'","dst":"'$DST'","status":"ready"}' >> "$MANIFEST"
  fi
done

echo '],"summary":{"total":'$TOTAL',"copied":'$COPIED',"missing":'$MISSING',"skipped":'$SKIPPED'}}' >> "$MANIFEST"

log ""
log "========================================="
log "FISHNET COMPLETE"
log "Total mappings: $TOTAL"
log "Ready/Copied:   $COPIED"
log "Missing:        $MISSING"
log "Skipped:        $SKIPPED"
log "Manifest:       $MANIFEST"
log "Log:            $LOG_FILE"
log "========================================="

if [ "$MODE" = "execute" ]; then
  log ""
  log "Committing all repos..."
  for REPO_DIR in "${REPOS_DIR}"/noizy-*; do
    REPO_NAME=$(basename "$REPO_DIR")
    cd "$REPO_DIR"
    if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
      git add -A
      git commit -m "fishnet: consolidate code from GOD — ${TIMESTAMP}" --no-verify 2>/dev/null || true
      ok "Committed: $REPO_NAME"
    else
      log "No changes: $REPO_NAME"
    fi
  done
  log "All repos committed. Ready for: gh auth login && push."
fi
