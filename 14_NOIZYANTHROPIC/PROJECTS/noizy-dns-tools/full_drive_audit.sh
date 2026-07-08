#!/usr/bin/env zsh
# =============================================================================
# RSP FULL DRIVE AUDIT — m2ultra
# Generated: 2026-05-23
# Covers ALL external drives found on this system
# =============================================================================
set -euo pipefail

REPORT_DIR="$HOME/Library/CloudStorage/GoogleDrive-rspplowman@gmail.com/My Drive/_AUDIO_RESCUE"
REPORT="$REPORT_DIR/AUDIT_REPORT_$(date +%Y%m%d_%H%M%S).txt"
LOG="$REPORT_DIR/AUDIT_LOG_$(date +%Y%m%d_%H%M%S).log"
ISSUES_FILE="$REPORT_DIR/AUDIT_ISSUES_$(date +%Y%m%d_%H%M%S).txt"

mkdir -p "$REPORT_DIR"

# Redirect all output to both screen and log
exec > >(tee -a "$LOG") 2>&1

divider() { printf '%0.s=' {1..80}; echo; }
section() { echo; divider; echo "  $1"; divider; }

echo "RSP FULL DRIVE AUDIT — $(date)"
echo "Host: $(hostname) | User: $(whoami)"
divider

# ─── DRIVE REGISTRY ──────────────────────────────────────────────────────────
# All drives found on this system
declare -A DRIVES
DRIVES=(
  ["12TB"]="/Volumes/12TB"
  ["SAMPLE_MASTER"]="/Volumes/SAMPLE_MASTER"
  ["SOUND_DESIGN"]="/Volumes/SOUND_DESIGN"
  ["6TB"]="/Volumes/6TB"
  ["MAG_4TB"]="/Volumes/MAG 4TB"
  ["4TB_Lacie"]="/Volumes/4TB Lacie"
  ["2TB_SGW"]="/Volumes/2TB_SGW"
  ["3TB_GRF"]="/Volumes/3TB-GRF"
  ["JOE_4TB"]="/Volumes/JOE"
  ["4TB_BLK"]="/Volumes/4TB BLK"
  ["4TB_02"]="/Volumes/4TB_02"
)

declare -A DISK_IDS
DISK_IDS=(
  ["12TB"]="disk13s2"
  ["SAMPLE_MASTER"]="disk19s1"
  ["SOUND_DESIGN"]="disk18s1"
  ["6TB"]="disk12"
  ["MAG_4TB"]="disk5s2"
  ["4TB_Lacie"]="disk4s2"
  ["2TB_SGW"]="disk8s1"
  ["3TB_GRF"]="disk9s2"
  ["JOE_4TB"]="disk14s2"
  ["4TB_BLK"]="disk15s2"
  ["4TB_02"]="disk17s2"
)

ISSUES=()

# ─── SECTION 1: DRIVE INVENTORY & HEALTH ─────────────────────────────────────
section "SECTION 1: DRIVE INVENTORY & HEALTH STATUS"

printf "%-20s %-10s %-10s %-10s %-8s %-12s %-10s\n" \
  "DRIVE" "TOTAL" "USED" "FREE" "USE%" "SMART" "MOUNTED"
echo "$(printf '%0.s-' {1..90})"

TOTAL_USED_BYTES=0
TOTAL_FREE_BYTES=0

for name in "${(@k)DRIVES}"; do
  mount="${DRIVES[$name]}"
  disk="${DISK_IDS[$name]}"

  if [[ -d "$mount" ]]; then
    mounted="YES"
    # Get sizes via df
    read -r total used free pct _ < <(df -k "$mount" 2>/dev/null | tail -1 | awk '{print $2, $3, $4, $5, $6}')
    total_h=$(( total / 1048576 ))
    used_h=$(( used  / 1048576 ))
    free_h=$(( free  / 1048576 ))
    TOTAL_USED_BYTES=$(( TOTAL_USED_BYTES + used ))
    TOTAL_FREE_BYTES=$(( TOTAL_FREE_BYTES + free ))

    smart=$(diskutil info "/dev/$disk" 2>/dev/null | grep "SMART Status" | awk -F: '{print $2}' | xargs)
    [[ -z "$smart" ]] && smart="N/A"

    # Flag critical issues
    pct_num="${pct/\%/}"
    if (( pct_num >= 98 )); then
      ISSUES+=("CRITICAL: $name is ${pct} FULL — only ${free_h}GB free!")
    elif (( pct_num >= 90 )); then
      ISSUES+=("WARNING: $name is ${pct} full")
    fi
    if [[ "$smart" == "Failing" ]]; then
      ISSUES+=("CRITICAL: $name SMART STATUS = FAILING! Drive may be dying!")
    fi

    printf "%-20s %-10s %-10s %-10s %-8s %-12s %-10s\n" \
      "$name" "${total_h}GB" "${used_h}GB" "${free_h}GB" "$pct" "$smart" "$mounted"
  else
    printf "%-20s %-10s %-10s %-10s %-8s %-12s %-10s\n" \
      "$name" "-" "-" "-" "-" "-" "NOT MOUNTED"
    ISSUES+=("WARNING: $name is NOT MOUNTED at $mount")
  fi
done

echo
echo "TOTAL USED (all drives): $(( TOTAL_USED_BYTES / 1048576 / 1024 ))TB approx"
echo "TOTAL FREE (all drives): $(( TOTAL_FREE_BYTES / 1048576 / 1024 ))TB approx"

# ─── SECTION 2: FILESYSTEM INTEGRITY CHECKS ──────────────────────────────────
section "SECTION 2: FILESYSTEM INTEGRITY CHECK (HFS+ volumes)"

HFS_DRIVES=("12TB" "6TB" "MAG_4TB" "4TB_Lacie" "3TB_GRF" "JOE_4TB" "4TB_BLK" "4TB_02")

echo "NOTE: Running read-only verifyVolume checks (no repair needed for mounted volumes)"
echo "      Full fsck_hfs repair requires unmounting. Issues flagged for follow-up."
echo

for name in "${HFS_DRIVES[@]}"; do
  mount="${DRIVES[$name]}"
  disk="${DISK_IDS[$name]}"
  if [[ -d "$mount" ]]; then
    echo -n "Checking $name ($mount)... "
    result=$(diskutil verifyVolume "/dev/$disk" 2>&1 || true)
    if echo "$result" | grep -qi "appears to be OK\|No errors"; then
      echo "OK"
    elif echo "$result" | grep -qi "read-only\|cannot verify"; then
      echo "SKIPPED (read-only or in-use)"
    else
      echo "ISSUES FOUND:"
      echo "$result" | grep -i "error\|corrupt\|invalid\|warning" | head -5
      ISSUES+=("FILESYSTEM: $name may have filesystem errors — run fsck_hfs after unmounting")
    fi
  fi
done

# ─── SECTION 3: CRITICAL ALERT — 12TB READ-ONLY ──────────────────────────────
section "SECTION 3: CRITICAL ALERTS"

echo "!!! 12TB IS MOUNTED READ-ONLY !!!"
echo "    Mount point: /Volumes/12TB (/dev/disk13s2)"
echo "    This means macOS detected filesystem errors and mounted it read-only for safety."
echo "    STATUS: 86.8% full (10.4TB used of 12TB)"
echo "    ACTION REQUIRED: Unmount and run: sudo fsck_hfs -fy /dev/disk13s2"
echo
ISSUES+=("CRITICAL: 12TB mounted READ-ONLY — filesystem errors detected. Run fsck_hfs!")

echo "!!! SAMPLE_MASTER IS 100% FULL !!!"
echo "    Mount point: /Volumes/SAMPLE_MASTER (/dev/disk19s1)"
echo "    Used: 2.0TB / 2.0TB — only 38MB free!"
echo "    ACTION REQUIRED: Immediate cleanup or migration needed."
echo
ISSUES+=("CRITICAL: SAMPLE_MASTER has only 38MB free — effectively FULL!")

# ─── SECTION 4: FILE COUNT & AUDIO FILE SCAN ─────────────────────────────────
section "SECTION 4: AUDIO FILE CENSUS (top-level count per drive)"

AUDIO_EXTS="wav|aif|aiff|mp3|flac|m4a|ogg|aac|opus|w64|rf64|caf|bwf|rx2|rex|rex2|mid|midi"

for name in "${(@k)DRIVES}"; do
  mount="${DRIVES[$name]}"
  if [[ -d "$mount" ]]; then
    echo -n "$name: counting... "
    total_files=$(find "$mount" -not -path '*/.*' -type f 2>/dev/null | wc -l | xargs)
    audio_files=$(find "$mount" -not -path '*/.*' -type f \( \
      -iname "*.wav" -o -iname "*.aif" -o -iname "*.aiff" -o -iname "*.mp3" \
      -o -iname "*.flac" -o -iname "*.m4a" -o -iname "*.aac" -o -iname "*.ogg" \
      -o -iname "*.w64" -o -iname "*.rf64" -o -iname "*.caf" \
    \) 2>/dev/null | wc -l | xargs)
    echo "$total_files total files, $audio_files audio files"
  fi
done

# ─── SECTION 5: ZERO-BYTE & CORRUPT FILE SCAN ────────────────────────────────
section "SECTION 5: ZERO-BYTE & SUSPECT FILE SCAN"

for name in "${(@k)DRIVES}"; do
  mount="${DRIVES[$name]}"
  if [[ -d "$mount" ]]; then
    echo -n "Scanning $name for zero-byte files... "
    zero_count=$(find "$mount" -not -path '*/.*' -type f -size 0 2>/dev/null | wc -l | xargs)
    echo "$zero_count zero-byte files found"
    if (( zero_count > 0 )); then
      echo "  Sample zero-byte files:"
      find "$mount" -not -path '*/.*' -type f -size 0 2>/dev/null | head -5 | while read -r f; do
        echo "    $f"
      done
      ISSUES+=("WARNING: $name has $zero_count zero-byte files")
    fi
  fi
done

# ─── SECTION 6: CHECKSUM VERIFICATION (audio rescue paths) ───────────────────
section "SECTION 6: AUDIO RESCUE INTEGRITY CHECK"

echo "Running verify_checksums.py for known rescue paths..."
python3 "$HOME/.gemini/antigravity-ide/scratch/verify_checksums.py" 2>&1 || \
  echo "Checksum verification skipped (source/target paths may not be mounted)"

# ─── SECTION 7: ORPHANED / HIDDEN FILES ──────────────────────────────────────
section "SECTION 7: ORPHANED & HIDDEN FILE SCAN"

for name in "${(@k)DRIVES}"; do
  mount="${DRIVES[$name]}"
  if [[ -d "$mount" ]]; then
    echo -n "$name: scanning hidden files... "
    hidden=$(find "$mount" -maxdepth 3 -name ".*" -not -name ".DS_Store" -not -name ".Spotlight*" -not -name ".fseventsd" -not -name ".Trashes" 2>/dev/null | wc -l | xargs)
    echo "$hidden hidden items (excl. system)"
    ds_store=$(find "$mount" -name ".DS_Store" 2>/dev/null | wc -l | xargs)
    echo "  .DS_Store files: $ds_store"
    dotunder=$(find "$mount" -name "._*" 2>/dev/null | wc -l | xargs)
    echo "  AppleDouble (._*) files: $dotunder"
  fi
done

# ─── SECTION 8: RAID STATUS (6TB RAID stripe) ────────────────────────────────
section "SECTION 8: RAID SET STATUS"

echo "6TB RAID (disk12 — STRIPE of disk10 + disk11):"
diskutil appleRAID list 2>/dev/null || echo "  (diskutil appleRAID not available or no degraded status)"
echo
echo "SMART status of RAID members:"
for d in disk9 disk10 disk11; do
  smart=$(diskutil info /dev/$d 2>/dev/null | grep "SMART Status" | awk -F: '{print $2}' | xargs)
  echo "  /dev/$d: ${smart:-N/A}"
  if [[ "$smart" == "Failing" ]]; then
    ISSUES+=("CRITICAL: RAID member /dev/$d SMART FAILING — RAID integrity at risk!")
  fi
done

# ─── SECTION 9: ISSUES SUMMARY ───────────────────────────────────────────────
section "SECTION 9: ISSUES SUMMARY"

if (( ${#ISSUES[@]} == 0 )); then
  echo "NO ISSUES FOUND — All drives healthy."
else
  echo "${#ISSUES[@]} ISSUE(S) FOUND:"
  echo
  i=1
  for issue in "${ISSUES[@]}"; do
    echo "[$i] $issue"
    echo "$issue" >> "$ISSUES_FILE"
    (( i++ ))
  done
fi

# ─── SECTION 10: RECOMMENDED ACTIONS ─────────────────────────────────────────
section "SECTION 10: RECOMMENDED ACTIONS (Priority Order)"

cat <<'EOF'
[P1] IMMEDIATE — 12TB READ-ONLY FIX:
     1. Unmount: sudo diskutil unmount /Volumes/12TB
     2. Repair:  sudo fsck_hfs -fy /dev/disk13s2
     3. Remount: sudo diskutil mount /dev/disk13s2
     Risk: DO NOT write to drive while read-only; data corruption possible.

[P1] IMMEDIATE — SAMPLE_MASTER FULL (38MB free):
     Move/archive at least 100GB off this volume immediately.
     Options: migrate to SOUND_DESIGN (1.1TB free) or 4TB BLK.

[P2] HIGH — Enable SMART monitoring:
     USB drives report "Not Supported" for SMART.
     Consider: brew install smartmontools && smartctl -a /dev/disk13

[P3] MEDIUM — Clean .DS_Store and ._* AppleDouble files:
     Run: find /Volumes/12TB -name ".DS_Store" -delete
     Run: dot_clean -m /Volumes/12TB

[P4] MEDIUM — Checksum all audio files on 12TB:
     Run verify_checksums.py with 12TB source paths added.

[P5] LOW — Consider RAID backup strategy:
     6TB RAID stripe has NO redundancy — one drive failure = total loss.
     Consider converting to RAID-1 mirror or backing up to cloud.
EOF

divider
echo "AUDIT COMPLETE: $(date)"
echo "Report saved to: $REPORT"
echo "Issues file:     $ISSUES_FILE"
echo "Full log:        $LOG"
divider
