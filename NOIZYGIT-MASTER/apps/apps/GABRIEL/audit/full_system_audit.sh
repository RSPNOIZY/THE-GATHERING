#!/usr/bin/env bash
# =============================================================================
# NOIZY EMPIRE — Full M2 Ultra System Audit
# GABRIEL File Cataloger v1.0
# Generated: 2026-03-29
# Output: manifest_YYYYMMDD_HHMMSS.txt
# =============================================================================

set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUT_DIR="$(dirname "$0")"
MANIFEST="$OUT_DIR/manifest_${TIMESTAMP}.txt"
ERRORS="$OUT_DIR/errors_${TIMESTAMP}.log"

# Tags for GABRIEL taxonomy
PROJECTS=(
  "NOIZY" "NOIZYVOX" "NOIZYLAB" "NOIZYKIDZ" "NOIZYFISH" "NOIZYEMPIRE"
  "NOIZYINDIGENIOUS" "NOIZYANTHROPIC" "NOISYBOX" "NOISYPROOF" "NOISYVOX"
  "GABRIEL" "LIFELUV" "DREAMCHAMBER" "ROB_AVA" "ROB-AVA" "ROBA VA"
  "AQUARIUM" "GORUNFREE" "HOTROD" "METABEAST" "BEAST-IDE"
  "VR-DREAMCHAMBER" "HEAVEN" "SHIRL" "POPS" "LUCY" "ENGR_KEITH"
  "rsp001" "RSP001" "noizyvox" "noisyproof"
)

# Scan roots
SCAN_ROOTS=(
  "/Users"
  "/Volumes"
  "/Applications"
  "/opt/homebrew"
  "/usr/local"
  "/var"
  "/tmp"
  "/var/tmp"
  "/etc"
  "/Library"
)

# Skip these (Apple internals, crash dumps, devices, node_modules, .git internals)
PRUNE_DIRS=(
  "/System"
  "/Cores"
  "/dev"
  "/proc"
  "/Volumes/VM"
)

# File extensions to collect
EXTENSIONS="-name '*.md' -o -name '*.txt' -o -name '*.json' -o -name '*.yaml' -o -name '*.yml' -o -name '*.toml' -o -name '*.py' -o -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.jsx' -o -name '*.sh' -o -name '*.env' -o -name '*.cfg' -o -name '*.ini' -o -name '*.conf'"

echo "==============================================================================" | tee -a "$MANIFEST"
echo "NOIZY EMPIRE — M2 Ultra Full System Audit" | tee -a "$MANIFEST"
echo "Run: $TIMESTAMP" | tee -a "$MANIFEST"
echo "==============================================================================" | tee -a "$MANIFEST"
echo "" | tee -a "$MANIFEST"

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 1: NOIZY PROJECT FILES (path/name contains project keywords)
# ─────────────────────────────────────────────────────────────────────────────
echo "## SECTION 1: NOIZY PROJECT PATHS" | tee -a "$MANIFEST"
echo "─────────────────────────────────" | tee -a "$MANIFEST"

for ROOT in "${SCAN_ROOTS[@]}"; do
  [[ -d "$ROOT" ]] || continue
  echo "[scanning $ROOT for NOIZY paths...]" >&2
  find "$ROOT" \
    -path "/System" -prune -o \
    -path "/Cores" -prune -o \
    -path "*/node_modules" -prune -o \
    -path "*/.Trash" -prune -o \
    -path "*/Library/Caches" -prune -o \
    -path "*/.git/objects" -prune -o \
    \( \
      -iname "*noizy*" -o -iname "*noisy*" -o \
      -iname "*gabriel*" -o -iname "*lifeluv*" -o \
      -iname "*dreamchamber*" -o -iname "*rob_ava*" -o \
      -iname "*rsp001*" -o -iname "*metabeast*" -o \
      -iname "*gorunfree*" -o -iname "*aquarium*" -o \
      -ipath "*NOIZY*" -o -ipath "*NOISY*" -o \
      -ipath "*GABRIEL*" -o -ipath "*DREAMCHAMBER*" -o \
      -ipath "*LIFELUV*" -o -ipath "*rob_ava*" -o \
      -ipath "*rsp001*" \
    \) \
    -print 2>>"$ERRORS" | sort >> "$MANIFEST" || true
done

echo "" | tee -a "$MANIFEST"

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 2: ALL MARKDOWN FILES SYSTEM-WIDE
# ─────────────────────────────────────────────────────────────────────────────
echo "## SECTION 2: ALL MARKDOWN (.md, .mdx)" | tee -a "$MANIFEST"
echo "─────────────────────────────────────" | tee -a "$MANIFEST"

for ROOT in "${SCAN_ROOTS[@]}"; do
  [[ -d "$ROOT" ]] || continue
  echo "[scanning $ROOT for markdown...]" >&2
  find "$ROOT" \
    -path "/System" -prune -o \
    -path "/Cores" -prune -o \
    -path "*/node_modules" -prune -o \
    -path "*/.Trash" -prune -o \
    -path "*/Library/Caches" -prune -o \
    -path "*/.git/objects" -prune -o \
    \( -name "*.md" -o -name "*.mdx" \) \
    -print 2>>"$ERRORS" | sort >> "$MANIFEST" || true
done

echo "" | tee -a "$MANIFEST"

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 3: CONFIG & DATA FILES (.json, .yaml, .toml, .env, .conf)
# ─────────────────────────────────────────────────────────────────────────────
echo "## SECTION 3: CONFIG & DATA FILES" | tee -a "$MANIFEST"
echo "──────────────────────────────────" | tee -a "$MANIFEST"

for ROOT in "/Users" "/opt/homebrew" "/usr/local" "/etc"; do
  [[ -d "$ROOT" ]] || continue
  echo "[scanning $ROOT for configs...]" >&2
  find "$ROOT" \
    -path "*/node_modules" -prune -o \
    -path "*/.Trash" -prune -o \
    -path "*/Library/Caches" -prune -o \
    -path "*/.git/objects" -prune -o \
    -maxdepth 10 \
    \( -name "*.toml" -o -name "*.yaml" -o -name "*.yml" -o -name "wrangler.toml" -o -name ".env" -o -name "*.env" -o -name "*.conf" -o -name "*.cfg" -o -name "*.ini" \) \
    -print 2>>"$ERRORS" | sort >> "$MANIFEST" || true
done

echo "" | tee -a "$MANIFEST"

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 4: VOLUMES SCAN (AQUARIUM, 4TBSG, 6TB, etc.)
# ─────────────────────────────────────────────────────────────────────────────
echo "## SECTION 4: VOLUMES" | tee -a "$MANIFEST"
echo "──────────────────────" | tee -a "$MANIFEST"

if [[ -d "/Volumes" ]]; then
  for VOL in /Volumes/*/; do
    VOL_NAME=$(basename "$VOL")
    [[ "$VOL_NAME" == "Macintosh HD" ]] && continue
    [[ "$VOL_NAME" == "VM" ]] && continue
    echo "[scanning volume: $VOL_NAME]" >&2
    echo "### Volume: $VOL_NAME" >> "$MANIFEST"
    find "$VOL" \
      -path "*/node_modules" -prune -o \
      -path "*/.Trash" -prune -o \
      -path "*/.git/objects" -prune -o \
      \( -name "*.md" -o -name "*.mdx" -o -name "*.txt" -o -iname "*noizy*" -o -iname "*noisy*" -o -iname "*gabriel*" -o -iname "*lifeluv*" -o -iname "*dreamchamber*" \) \
      -print 2>>"$ERRORS" | sort >> "$MANIFEST" || true
    echo "" >> "$MANIFEST"
  done
fi

# ─────────────────────────────────────────────────────────────────────────────
# SECTION 5: SUMMARY STATS
# ─────────────────────────────────────────────────────────────────────────────
echo "" | tee -a "$MANIFEST"
echo "## SUMMARY" | tee -a "$MANIFEST"
echo "─────────────────────────────────────────────────────────────────────────────" | tee -a "$MANIFEST"
TOTAL=$(grep -c "^/" "$MANIFEST" 2>/dev/null || echo 0)
MD_COUNT=$(grep -c "\.md$\|\.mdx$" "$MANIFEST" 2>/dev/null || echo 0)
NOIZY_COUNT=$(grep -ic "noizy\|noisy\|gabriel\|lifeluv\|dreamchamber" "$MANIFEST" 2>/dev/null || echo 0)
echo "Total files cataloged : $TOTAL" | tee -a "$MANIFEST"
echo "Markdown files        : $MD_COUNT" | tee -a "$MANIFEST"
echo "NOIZY-tagged entries  : $NOIZY_COUNT" | tee -a "$MANIFEST"
echo "Errors logged         : $ERRORS" | tee -a "$MANIFEST"
echo "Manifest saved        : $MANIFEST" | tee -a "$MANIFEST"
echo "==============================================================================" | tee -a "$MANIFEST"

echo ""
echo "AUDIT COMPLETE → $MANIFEST"
