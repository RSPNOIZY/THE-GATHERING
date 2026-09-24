#!/bin/bash
# Shared NOIZY media-drive resolver.
# Canonical FISHMUSICINC public contact: rsp@fishmusicinc.com
# Legacy alias: rp@fishmusicinc.com (audit-only; disabled by default)

set -euo pipefail

noizy_expand_path() {
  local raw="$1"
  echo "${raw/#\~/$HOME}"
}

noizy_media_candidates() {
  if [[ -n "${NOIZY_MEDIA_DRIVE:-}" ]]; then
    noizy_expand_path "$NOIZY_MEDIA_DRIVE"
  fi

  cat <<EOF
$HOME/Library/CloudStorage/GoogleDrive-rsplowman@icloud.com/My Drive
$HOME/Library/CloudStorage/GoogleDrive-rsp@fishmusicinc.com/My Drive
$HOME/Library/CloudStorage/GoogleDrive-rsp@noizy.ai/My Drive
$HOME/NOIZY_AI/_MEDIA_VAULT
EOF

  if [[ "${NOIZY_ALLOW_LEGACY_RP_DRIVE:-}" == "1" ]]; then
    cat <<EOF
$HOME/Library/CloudStorage/GoogleDrive-rp@fishmusicinc.com/My Drive
$HOME/Library/CloudStorage/GoogleDrive-rp@fishmusicinc.com/Shared Drives
EOF
  fi
}

noizy_resolve_media_drive() {
  local candidate
  while IFS= read -r candidate; do
    [[ -z "$candidate" ]] && continue
    if [[ -d "$candidate" ]]; then
      echo "$candidate"
      return 0
    fi
  done < <(noizy_media_candidates)

  # Last resort: create local safe vault.
  local fallback="$HOME/NOIZY_AI/_MEDIA_VAULT"
  mkdir -p "$fallback"
  echo "$fallback"
}

noizy_print_media_identity() {
  cat <<EOF
NOIZY media identity:
  canonical_contact: rsp@fishmusicinc.com
  legacy_alias: rp@fishmusicinc.com (audit-only)
  legacy_drive_enabled: ${NOIZY_ALLOW_LEGACY_RP_DRIVE:-0}
  explicit_drive: ${NOIZY_MEDIA_DRIVE:-}
EOF
}
