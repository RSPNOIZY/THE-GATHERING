#!/bin/bash
# ╔══════════════════════════════════════════════════════════════════════════╗
# ║   MC96ECOUNIVERSE — DRIVE ASSIGNMENT MAP                                 ║
# ║   RSP_001 · GOD.local · 192GB · 2026-06-10                              ║
# ║   12 volumes · All assigned · GORUNFREE                                  ║
# ╚══════════════════════════════════════════════════════════════════════════╝

# ── CANONICAL DRIVE ROLES ──────────────────────────────────────────────────

export MC96_GOD="/Users/m2ultra/NOIZYANTHROPIC"          # PRIMARY: Code, agents, workers
export MC96_RED="/Volumes/RED DRAGON"                     # MASTER BACKUP: 3.2Ti free
export MC96_SOUND="/Volumes/SOUND_DESIGN"                 # STUDIO: Sound design, MC96 toolkit
export MC96_CODE="/Volumes/4TB_02"                        # CODE: Rescued IP, projects, archives
export MC96_SOURCE="/Volumes/12TB"                        # SOURCE: Audio, samples, instruments
export MC96_LACIE="/Volumes/4TB Lacie"                    # BACKUP: Pre-Apr17, manifestos, code
export MC96_SGW="/Volumes/2TB_SGW"                        # CURRENT: Health + music work
export MC96_JOE="/Volumes/JOE"                            # WORKSPACE: GABRIEL agents, NOIZYLAB
export MC96_6TB="/Volumes/6TB"                            # ARCHIVE: Older audio, Ollama models
export MC96_MAG="/Volumes/MAG 4TB"                        # OVERFLOW: Secondary media
export MC96_BLK="/Volumes/4TB BLK"                        # INSTRUMENTS: Read-only (full)
export MC96_SAMPLES="/Volumes/SAMPLE_MASTER"              # SAMPLES: Read-only (full)
export MC96_GRF="/Volumes/3TB-GRF"                        # STAGING: Rescue + GRF archive

# ── CANONICAL PATHS ────────────────────────────────────────────────────────

export MC96_AQUARIUM_CANON="$MC96_RED/NOIZYFISH_AQUARIUM_CANONICAL"
export MC96_ARCHIVES_CANON="$MC96_RED/NOIZYLAB_ARCHIVES_CANONICAL"
export MC96_CODE_CANON="$MC96_CODE/CODEMASTER_CANONICAL"
export MC96_WORKSPACE_CANON="$MC96_JOE/NOIZYLAB_WORKSPACES"
export MC96_TOOLKIT="$MC96_SOUND/_MC96_TOOLKIT"

# ── SERVICE PORTS ──────────────────────────────────────────────────────────

export GABRIEL_PORT=9777
export LUCY_PORT=9788
export NOIZYARMY_PORT=9333
export VOICE_PORT=9799
export DREAMCHAMBER_PORT=7777
export OLLAMA_PORT=11434
export N8N_PORT=5678
export QDRANT_PORT=6333
export NEO4J_PORT=7687
export REDIS_PORT=6379
export POSTGRES_PORT=5432
export MEILISEARCH_PORT=7700
export GRAFANA_PORT=3000

# ── CLOUDFLARE ─────────────────────────────────────────────────────────────

export CF_ACCOUNT_ID="5f36aa9795348ea681d0b21910dfc82a"
export HEAVEN_URL="https://heaven.rsp-5f3.workers.dev"
export HEAVEN_DIR="$MC96_GOD/repos/noizy-heaven"

# ── EMPIRE STATUS ──────────────────────────────────────────────────────────

mc96_status() {
  echo "╔══════════════════════════════════════════════════════╗"
  echo "║  MC96ECOUNIVERSE STATUS — $(date +%H:%M:%S)               ║"
  echo "╚══════════════════════════════════════════════════════╝"
  echo ""
  echo "── SERVICES ──────────────────────────────────────────"
  curl -s http://localhost:$GABRIEL_PORT/health    >/dev/null 2>&1 && echo "✅ GABRIEL    :$GABRIEL_PORT" || echo "🔴 GABRIEL    :$GABRIEL_PORT DOWN"
  curl -s http://localhost:$LUCY_PORT/health       >/dev/null 2>&1 && echo "✅ LUCY       :$LUCY_PORT" || echo "🔴 LUCY       :$LUCY_PORT DOWN"
  curl -s http://localhost:$NOIZYARMY_PORT/health  >/dev/null 2>&1 && echo "✅ NOIZYARMY  :$NOIZYARMY_PORT" || echo "🔴 NOIZYARMY  :$NOIZYARMY_PORT DOWN"
  curl -s http://localhost:$N8N_PORT/healthz       >/dev/null 2>&1 && echo "✅ n8n        :$N8N_PORT" || echo "🔴 n8n        :$N8N_PORT DOWN"
  curl -s http://localhost:$OLLAMA_PORT/api/tags   >/dev/null 2>&1 && echo "✅ Ollama     :$OLLAMA_PORT" || echo "🔴 Ollama     :$OLLAMA_PORT DOWN"
  curl -s http://localhost:$QDRANT_PORT            >/dev/null 2>&1 && echo "✅ Qdrant     :$QDRANT_PORT" || echo "🔴 Qdrant     :$QDRANT_PORT DOWN"
  curl -s $HEAVEN_URL/health                       >/dev/null 2>&1 && echo "✅ HEAVEN     $HEAVEN_URL" || echo "🔴 HEAVEN     offline"
  echo ""
  echo "── DRIVES ────────────────────────────────────────────"
  df -h | grep /Volumes | awk '{printf "%-20s %5s used  %5s free  %3s\n", $9, $3, $4, $5}' | sort -k4 -rn
  echo ""
  echo "── RSYNC JOBS ────────────────────────────────────────"
  ps aux | grep rsync | grep -v grep | wc -l | xargs echo "Active:"
}

export -f mc96_status

# ── MC96 SEARCH ALIASES ────────────────────────────────────────────────────
alias mc96_search="bash $MC96_GOD/scripts/mc96_search.sh"
alias mc96_grep="bash $MC96_GOD/scripts/mc96_search.sh"
alias mc96_find="bash $MC96_GOD/scripts/mc96_search.sh --files"
alias mc96_ask="$MC96_GOD/mc96_venv/bin/python $MC96_GOD/scripts/mc96_ask.py"

echo "✅ MC96ECOUNIVERSE environment loaded"
echo "   Run: mc96_status | mc96_search | mc96_ask"
