#!/bin/bash
set -euo pipefail

# NOIZYLAB Media Sync - Audio/Video to active media vault
# Code → GitHub | Media → configurable storage
#
# Preferred override:
#   export NOIZY_MEDIA_DRIVE="/Users/m2ultra/Library/CloudStorage/GoogleDrive-rsplowman@icloud.com/My Drive"
#
# Legacy rp@fishmusicinc.com mount is NOT used by default.
# To intentionally allow it for one run:
#   export NOIZY_ALLOW_LEGACY_RP_DRIVE=1

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=AGENTS/lib/noizy-media-drive.sh
source "$SCRIPT_DIR/lib/noizy-media-drive.sh"

NOIZYLAB="${NOIZYLAB_ROOT:-/Users/m2ultra/NOIZYLAB}"
MEDIA_DRIVE="$(noizy_resolve_media_drive)"
GDRIVE="$MEDIA_DRIVE/NOIZYLAB_MEDIA"
RECEIPT_DIR="${NOIZY_RECEIPT_DIR:-$HOME/NOIZY_AI/_RECEIPTS}"
RECEIPT_FILE="$RECEIPT_DIR/media-sync.jsonl"
RSYNC_FLAGS=(-avh --progress)

if [[ "${NOIZY_DRY_RUN:-}" == "1" ]]; then
  RSYNC_FLAGS+=(--dry-run)
fi

mkdir -p "$GDRIVE/Audio" "$GDRIVE/Video" "$NOIZYLAB/media" "$RECEIPT_DIR"

emit_receipt() {
  local action="$1"
  local status="$2"
  python3 - <<PY >> "$RECEIPT_FILE"
import json, os, datetime
print(json.dumps({
  "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
  "tool": "AGENTS/sync-media.sh",
  "action": "$action",
  "status": "$status",
  "source": "$NOIZYLAB",
  "target": "$GDRIVE",
  "dry_run": os.environ.get("NOIZY_DRY_RUN") == "1",
  "canonical_contact": "rsp@fishmusicinc.com",
  "legacy_alias": "rp@fishmusicinc.com",
  "legacy_drive_enabled": os.environ.get("NOIZY_ALLOW_LEGACY_RP_DRIVE") == "1",
}, ensure_ascii=False))
PY
}

print_header() {
  echo "🎵 NOIZYLAB Media Sync"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Source: $NOIZYLAB"
  echo "Target: $GDRIVE"
  noizy_print_media_identity
  if [[ "${NOIZY_DRY_RUN:-}" == "1" ]]; then
    echo "Mode: DRY RUN"
  fi
  echo ""
}

require_source() {
  if [[ ! -d "$NOIZYLAB" ]]; then
    echo "❌ Source missing: $NOIZYLAB" >&2
    emit_receipt "${1:-unknown}" "source_missing"
    exit 2
  fi
}

print_header

case "${1:-}" in
  push)
    require_source push
    echo "📤 Pushing media to active media vault..."
    rsync "${RSYNC_FLAGS[@]}" --include='*.wav' --include='*.mp3' --include='*.flac' \
          --include='*.aif' --include='*.aiff' --include='*.m4a' --include='*.ogg' \
          --include='*/' --exclude='*' "$NOIZYLAB/" "$GDRIVE/Audio/"
    rsync "${RSYNC_FLAGS[@]}" --include='*.mov' --include='*.mp4' --include='*.avi' \
          --include='*.mkv' --include='*.webm' --include='*/' --exclude='*' \
          "$NOIZYLAB/" "$GDRIVE/Video/"
    emit_receipt push ok
    echo "✅ Media pushed to active media vault"
    ;;
  pull)
    echo "📥 Pulling media from active media vault..."
    rsync "${RSYNC_FLAGS[@]}" "$GDRIVE/" "$NOIZYLAB/media/"
    emit_receipt pull ok
    echo "✅ Media pulled from active media vault"
    ;;
  status)
    echo "📊 NOIZYLAB_MEDIA:"
    du -sh "$GDRIVE"/* 2>/dev/null || echo "  (empty or not synced)"
    emit_receipt status ok
    ;;
  doctor)
    echo "🩺 Media sync doctor"
    echo "Resolved media drive: $MEDIA_DRIVE"
    echo "Resolved target: $GDRIVE"
    echo "Receipt file: $RECEIPT_FILE"
    echo "Candidates:"
    noizy_media_candidates | sed 's/^/  - /'
    emit_receipt doctor ok
    ;;
  *)
    echo "Usage: $0 {push|pull|status|doctor}"
    echo ""
    echo "  push   - Send local audio/video to active media vault"
    echo "  pull   - Get audio/video from active media vault"
    echo "  status - Show active media vault stats"
    echo "  doctor - Show resolved paths and identity state"
    echo ""
    echo "Environment:"
    echo "  NOIZY_MEDIA_DRIVE=/path/to/active/drive"
    echo "  NOIZY_DRY_RUN=1"
    echo "  NOIZY_ALLOW_LEGACY_RP_DRIVE=1   # explicit legacy-only escape hatch"
    exit 1
    ;;
esac
