#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# NOIZY SAFE RECOVERY v3 (DreamChamber)
# Default: audit (non-destructive)
# Commands: audit | extract-code | copy-media | copy-plugins | verify | cleanup | keith | report
#
# DOCTRINE: MICKY-P is a mine, not a migration casualty.
#   Pass 1 — Discover + Copy (never delete)
#   Pass 2 — Verify + Classify (hashes + manifests)
#   Pass 3 — Selective migration (manual only)
# ============================================================

CMD="${1:-audit}"
shift || true

# ── CONFIG (override via env) ─────────────────────────────────
MICKY_HOST="${MICKY_HOST:-10.0.0.100}"
MICKY_SSH_USER="${MICKY_SSH_USER:-rsp}"
USERS_TO_SCAN="${USERS_TO_SCAN:-fish RSP}"

OUTROOT="${OUTROOT:-$HOME/Recovered}"
RUN_ID="${RUN_ID:-$(date +%Y%m%d_%H%M%S)}"
RUN_DIR="$OUTROOT/runs/$RUN_ID"
MAN_DIR="$RUN_DIR/manifests"
LOG_DIR="$RUN_DIR/logs"
EVENTS="$RUN_DIR/events.jsonl"

CODE_DEST="$OUTROOT/code-gold/$RUN_ID"
MEDIA_DEST="$OUTROOT/media/$RUN_ID"
PLUGIN_DEST="$OUTROOT/plugins-quarantine/$RUN_ID"

mkdir -p "$RUN_DIR" "$MAN_DIR" "$LOG_DIR" "$CODE_DEST" "$MEDIA_DEST" "$PLUGIN_DEST"

# ── Logging ───────────────────────────────────────────────────

log_event() {
  local event="$1"; shift
  printf '{"ts":"%s","event":"%s","meta":%s}\n' \
    "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$event" "${1:-{}}" >> "$EVENTS"
}

die() { echo "ERROR: $*" >&2; log_event "ERROR" "{\"msg\":\"$*\"}"; exit 1; }

need_cmd() { command -v "$1" >/dev/null 2>&1 || die "Missing required command: $1"; }

need_cmd ssh
need_cmd scp
need_cmd rsync
need_cmd shasum
need_cmd find
need_cmd awk
need_cmd sed

# ── Remote helpers ────────────────────────────────────────────

remote_exec() {
  ssh -o BatchMode=yes -o ConnectTimeout=8 "${MICKY_SSH_USER}@${MICKY_HOST}" "$@"
}

remote_inventory_script() {
  cat <<'REMOTE'
set -euo pipefail
RUN_ID="$1"
OUT="$HOME/mickyp_recovery_$RUN_ID"
mkdir -p "$OUT"
EVENTS="$OUT/events.jsonl"

log() { printf '{"ts":"%s","event":"%s","meta":%s}\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$1" "${2:-{}}" >> "$EVENTS"; }

PLUGIN_DIRS=(
  "/Library/Audio/Plug-Ins/Components"
  "/Library/Audio/Plug-Ins/VST"
  "/Library/Audio/Plug-Ins/VST3"
  "/Library/Application Support/Avid/Audio/Plug-Ins"
)

# Global apps
{
  echo "scope,path"
  find /Applications -maxdepth 2 -type d -name "*.app" 2>/dev/null | sed 's/^/global,/' || true
} > "$OUT/inventory_apps.csv"

# User apps
{
  echo "scope,path"
  for u in fish RSP; do
    if [ -d "/Users/$u/Applications" ]; then
      find "/Users/$u/Applications" -maxdepth 2 -type d -name "*.app" 2>/dev/null | sed "s/^/$u,/" || true
    fi
  done
} >> "$OUT/inventory_apps.csv"

# Plugin inventory (NO copy/install)
{
  echo "scope,type,path"
  for d in "${PLUGIN_DIRS[@]}"; do
    if [ -d "$d" ]; then
      find "$d" -type f \( -name "*.component" -o -name "*.vst" -o -name "*.vst3" -o -name "*.aaxplugin" \) 2>/dev/null \
        | awk -v scope="global" '{ext=$0; sub(/^.*\./,"",ext); print scope "," ext "," $0}'
    fi
  done
  for u in fish RSP; do
    base="/Users/$u/Library/Audio/Plug-Ins"
    for sub in "Components" "VST" "VST3"; do
      p="$base/$sub"
      if [ -d "$p" ]; then
        find "$p" -type f \( -name "*.component" -o -name "*.vst" -o -name "*.vst3" \) 2>/dev/null \
          | awk -v scope="$u" '{ext=$0; sub(/^.*\./,"",ext); print scope "," ext "," $0}'
      fi
    done
  done
} > "$OUT/inventory_plugins.csv"

# Code-gold inventory (narrow allow-list)
{
  echo "scope,path"
  for u in fish RSP; do
    home="/Users/$u"
    [ -d "$home" ] || continue
    find "$home" \
      -type d \( -name ".git" -o -name "node_modules" -o -name ".cache" -o -name "DerivedData" \) -prune -o \
      -type f \( \
        -name "package.json" -o -name "wrangler.toml" -o -name "wrangler.jsonc" -o -name "docker-compose.yml" \
        -o -name "*.xcodeproj" -o -name "*.xcworkspace" \
        -o -name "*.swift" -o -name "*.ts" -o -name "*.js" -o -name "*.py" -o -name "*.md" -o -name "*.sh" \
        -o -name "*.yml" -o -name "*.yaml" -o -name "*.toml" \
      \) -print 2>/dev/null | sed "s/^/$u,/" || true
  done
} > "$OUT/inventory_code.csv"

# Media inventory (NO copies)
{
  echo "scope,path"
  for u in fish RSP; do
    home="/Users/$u"
    [ -d "$home" ] || continue
    find "$home" \
      -type d \( -name ".git" -o -name "node_modules" -o -name ".cache" -o -name "DerivedData" \) -prune -o \
      -type f \( \
        -name "*.logicx" -o -name "*.band" -o -name "*.aif" -o -name "*.aiff" -o -name "*.wav" -o -name "*.mp3" \
        -o -name "*.m4a" -o -name "*.flac" -o -name "*.mid" -o -name "*.midi" \
      \) -print 2>/dev/null | sed "s/^/$u,/" || true
  done
} > "$OUT/inventory_media.csv"

# Disk usage
du -sh /Applications /Library/Audio /Library/Application\ Support /Users/fish /Users/RSP 2>/dev/null | sort -hr > "$OUT/disk_usage_summary.txt" || true

log "AUDIT_DONE" "{\"out\":\"$OUT\"}"
echo "$OUT"
REMOTE
}

# ── Preflight ─────────────────────────────────────────────────

preflight() {
  echo "== Preflight =="
  echo "  Target: ${MICKY_SSH_USER}@${MICKY_HOST}"
  remote_exec "echo ok" >/dev/null || die "Cannot reach MICKY-P via SSH (${MICKY_SSH_USER}@${MICKY_HOST})"
  log_event "PREFLIGHT_OK" "{\"host\":\"$MICKY_HOST\"}"
  echo "  ✅ SSH connected"
}

# ── Commands ──────────────────────────────────────────────────

cmd_audit() {
  preflight
  echo "== AUDIT (non-destructive) =="
  OUT_REMOTE=$(remote_exec "bash -s -- $RUN_ID" <<<"$(remote_inventory_script)")
  echo "  Remote audit: $OUT_REMOTE"
  echo "  Copying inventories back..."
  scp -r "${MICKY_SSH_USER}@${MICKY_HOST}:${OUT_REMOTE}/"* "$MAN_DIR/" >/dev/null
  log_event "AUDIT_COPIED" "{\"dest\":\"$MAN_DIR\"}"

  # Print summary
  echo ""
  echo "  ✅ Audit complete: $MAN_DIR"
  for csv in "$MAN_DIR"/inventory_*.csv; do
    [[ -f "$csv" ]] || continue
    count=$(($(wc -l < "$csv") - 1))
    echo "     $(basename "$csv"): $count items"
  done
}

copy_list_via_rsync() {
  local list_csv="$1"
  local dest_root="$2"
  local kind="$3"
  mkdir -p "$dest_root"

  local tmp="$LOG_DIR/${kind}_paths.txt"
  awk -F, 'NR>1 {print $NF}' "$list_csv" > "$tmp"

  rsync -a --files-from="$tmp" --relative \
    "${MICKY_SSH_USER}@${MICKY_HOST}:/" "$dest_root/" \
    2>&1 | tee "$LOG_DIR/rsync_${kind}.log" || true

  log_event "COPY_${kind^^}_DONE" "{\"dest\":\"$dest_root\",\"list\":\"$list_csv\"}"
}

cmd_extract_code() {
  preflight
  [[ -f "$MAN_DIR/inventory_code.csv" ]] || die "Run 'audit' first (missing inventory_code.csv)"
  echo "== EXTRACT-CODE (copy only, no deletes) =="
  copy_list_via_rsync "$MAN_DIR/inventory_code.csv" "$CODE_DEST" "code"
  echo "  ✅ Code-gold copied to: $CODE_DEST"
}

cmd_copy_media() {
  preflight
  [[ -f "$MAN_DIR/inventory_media.csv" ]] || die "Run 'audit' first (missing inventory_media.csv)"
  echo "== COPY-MEDIA (copy only, no deletes) =="
  copy_list_via_rsync "$MAN_DIR/inventory_media.csv" "$MEDIA_DEST" "media"
  echo "  ✅ Media copied to: $MEDIA_DEST"
}

cmd_copy_plugins() {
  preflight
  [[ -f "$MAN_DIR/inventory_plugins.csv" ]] || die "Run 'audit' first (missing inventory_plugins.csv)"
  echo "== COPY-PLUGINS (quarantine only, NO installs) =="
  local tmpcsv="$LOG_DIR/plugins_paths.csv"
  { echo "scope,path"; awk -F, 'NR>1 {print $1 "," $3}' "$MAN_DIR/inventory_plugins.csv"; } > "$tmpcsv"
  copy_list_via_rsync "$tmpcsv" "$PLUGIN_DEST" "plugins"
  echo "  ✅ Plugins quarantined to: $PLUGIN_DEST"
  echo "  ⚠️  No plugins installed. Vendor review required."
}

cmd_verify() {
  echo "== VERIFY (hash + counts, non-destructive) =="
  local hashfile="$MAN_DIR/manifest_hashes.txt"
  : > "$hashfile"

  for dir in "$CODE_DEST" "$MEDIA_DEST" "$PLUGIN_DEST"; do
    [[ -d "$dir" ]] || continue
    echo "# HASHES for $dir" >> "$hashfile"
    (cd "$dir" && find . -type f -maxdepth 6 -print0 | sort -z | xargs -0 shasum -a 256) >> "$hashfile" || true
    echo "" >> "$hashfile"
  done

  {
    echo "category,count"
    echo "code_files,$(find "$CODE_DEST" -type f 2>/dev/null | wc -l | tr -d ' ')"
    echo "media_files,$(find "$MEDIA_DEST" -type f 2>/dev/null | wc -l | tr -d ' ')"
    echo "plugin_files,$(find "$PLUGIN_DEST" -type f 2>/dev/null | wc -l | tr -d ' ')"
  } > "$MAN_DIR/verify_counts.csv"

  log_event "VERIFY_DONE" "{\"hashes\":\"$hashfile\"}"
  echo "  ✅ Hashes: $hashfile"
  echo "  ✅ Counts: $MAN_DIR/verify_counts.csv"
}

cmd_cleanup() {
  echo "== CLEANUP =="
  echo "  SAFE MODE: cleanup is intentionally disabled by default."
  echo "  Do it manually after review."
  log_event "CLEANUP_SKIPPED" "{}"
}

cmd_keith() {
  echo "== KEITH (opt-in) =="
  echo "  SAFE MODE: ENGR_KEITH installation is not executed here."
  echo "  Run the dedicated keith installer after extraction + verify + manual validation."
  log_event "KEITH_SKIPPED" "{}"
}

cmd_report() {
  echo "╔══════════════════════════════════════════════╗"
  echo "║  NOIZY SAFE RECOVERY v3 — REPORT            ║"
  echo "╠══════════════════════════════════════════════╣"
  echo "║  Run ID:    $RUN_ID"
  echo "║  Target:    ${MICKY_SSH_USER}@${MICKY_HOST}"
  echo "║  Manifests: $MAN_DIR"
  echo "║  Code-gold: $CODE_DEST"
  echo "║  Media:     $MEDIA_DEST"
  echo "║  Plugins:   $PLUGIN_DEST"
  echo "║  Events:    $EVENTS"
  echo "╚══════════════════════════════════════════════╝"
  log_event "REPORT" "{\"run\":\"$RUN_ID\"}"
}

# ── Dispatch ──────────────────────────────────────────────────

case "$CMD" in
  audit)         cmd_audit ;;
  extract-code)  cmd_extract_code ;;
  copy-media)    cmd_copy_media ;;
  copy-plugins)  cmd_copy_plugins ;;
  verify)        cmd_verify ;;
  cleanup)       cmd_cleanup ;;
  keith)         cmd_keith ;;
  report)        cmd_report ;;
  *)
    echo "NOIZY SAFE RECOVERY v3"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  audit          Inventory MICKY-P (default, non-destructive)"
    echo "  extract-code   Copy code-gold to GOD"
    echo "  copy-media     Copy audio/sessions to GOD"
    echo "  copy-plugins   Quarantine plugins (no installs)"
    echo "  verify         SHA-256 hash + count all copied artifacts"
    echo "  cleanup        Disabled (manual only)"
    echo "  keith          ENGR_KEITH (opt-in only)"
    echo "  report         Print run info"
    exit 1
    ;;
esac
