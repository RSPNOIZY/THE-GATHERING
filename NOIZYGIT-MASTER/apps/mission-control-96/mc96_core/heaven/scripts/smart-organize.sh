#!/usr/bin/env bash
# ============================================================
# NOIZY ORGANIZER v3 — System-Wide Smart File Intelligence
# 
# Not just Downloads anymore. Desktop, Documents, everywhere.
# Context-aware. NOIZY-aware. Date-bucketed. Duplicate hunter.
# Watch mode. Auto-schedule. Browser dedup. Full undo.
#
# Usage:
#   organize                              # organize ~/Downloads (default)
#   organize --all                        # Downloads + Desktop + Documents
#   organize --path ~/Desktop             # specific folder
#   organize --report                     # intelligence report only
#   organize --dry-run                    # preview, move nothing
#   organize --undo                       # reverse last run  
#   organize --watch                      # live watcher (auto-sorts new files)
#   organize --install                    # install to PATH + optional auto-schedule
#   organize --deep                       # also process subfolders (careful!)
#   organize --archive 90                 # compress files older than 90 days
#   organize --large 100                  # isolate files > 100MB
# ============================================================

set -euo pipefail

VERSION="3.0.0"
SCRIPT_PATH="$(cd "$(dirname "$0")" && pwd)/$(basename "$0")"

# ─── Config ───────────────────────────────────────────────────
TARGETS=("${HOME}/Downloads")
DRY_RUN=false
UNDO_MODE=false
REPORT_ONLY=false
WATCH_MODE=false
INSTALL_MODE=false
DEEP_MODE=false
ARCHIVE_DAYS=0
LARGE_THRESHOLD_MB=0
LOG_DIR="${HOME}/.noizy/organize"
UNDO_LOG=""
MAX_DEPTH=1

# ─── Parse Args ───────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --all)       TARGETS=("${HOME}/Downloads" "${HOME}/Desktop" "${HOME}/Documents"); shift ;;
    --path)      TARGETS=("$2"); shift 2 ;;
    --dry-run)   DRY_RUN=true; shift ;;
    --undo)      UNDO_MODE=true; shift ;;
    --report)    REPORT_ONLY=true; shift ;;
    --watch)     WATCH_MODE=true; shift ;;
    --install)   INSTALL_MODE=true; shift ;;
    --deep)      DEEP_MODE=true; MAX_DEPTH=3; shift ;;
    --archive)   ARCHIVE_DAYS="$2"; shift 2 ;;
    --large)     LARGE_THRESHOLD_MB="$2"; shift 2 ;;
    --version)   echo "NOIZY Organizer v${VERSION}"; exit 0 ;;
    --help|-h)   head -20 "$0" | tail -16; exit 0 ;;
    *)           echo "Unknown option: $1 (try --help)"; exit 1 ;;
  esac
done

mkdir -p "$LOG_DIR"

# ─── Colors ───────────────────────────────────────────────────
if [[ -t 1 ]]; then
  RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
  BLUE='\033[0;34m'; PURPLE='\033[0;35m'; CYAN='\033[0;36m'
  BOLD='\033[1m'; DIM='\033[2m'; NC='\033[0m'
else
  RED=''; GREEN=''; YELLOW=''; BLUE=''; PURPLE=''
  CYAN=''; BOLD=''; DIM=''; NC=''
fi

# ─── Install Mode ────────────────────────────────────────────
if $INSTALL_MODE; then
  echo -e "${BOLD}⚡ Installing NOIZY Organizer v${VERSION}${NC}"
  
  # Symlink to /usr/local/bin
  INSTALL_TARGET="/usr/local/bin/organize"
  if [[ -L "$INSTALL_TARGET" ]] || [[ -f "$INSTALL_TARGET" ]]; then
    echo -e "  ${YELLOW}↻${NC} Updating existing install..."
    sudo ln -sf "$SCRIPT_PATH" "$INSTALL_TARGET"
  else
    sudo ln -sf "$SCRIPT_PATH" "$INSTALL_TARGET"
  fi
  echo -e "  ${GREEN}✅${NC} Installed → ${BOLD}organize${NC} (available everywhere)"
  
  # Offer launchd auto-schedule
  echo ""
  read -p "  Set up daily auto-organize at 3am? [y/N] " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    PLIST_DIR="${HOME}/Library/LaunchAgents"
    PLIST_FILE="${PLIST_DIR}/com.noizy.organize.plist"
    mkdir -p "$PLIST_DIR"
    
    cat > "$PLIST_FILE" << PLISTEOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.noizy.organize</string>
  <key>ProgramArguments</key>
  <array>
    <string>${SCRIPT_PATH}</string>
    <string>--all</string>
  </array>
  <key>StartCalendarInterval</key>
  <dict>
    <key>Hour</key>
    <integer>3</integer>
    <key>Minute</key>
    <integer>0</integer>
  </dict>
  <key>StandardOutPath</key>
  <string>${LOG_DIR}/auto-organize.log</string>
  <key>StandardErrorPath</key>
  <string>${LOG_DIR}/auto-organize.err</string>
</dict>
</plist>
PLISTEOF
    
    launchctl unload "$PLIST_FILE" 2>/dev/null || true
    launchctl load "$PLIST_FILE"
    echo -e "  ${GREEN}✅${NC} Auto-organize scheduled daily at 3:00 AM"
    echo -e "  ${DIM}   Plist: ${PLIST_FILE}${NC}"
    echo -e "  ${DIM}   To disable: launchctl unload ${PLIST_FILE}${NC}"
  fi
  exit 0
fi

# ─── Undo Mode ────────────────────────────────────────────────
if $UNDO_MODE; then
  LAST_LOG=$(ls -t "$LOG_DIR"/undo_*.log 2>/dev/null | head -1)
  if [[ -z "${LAST_LOG:-}" ]]; then
    echo -e "${RED}No undo log found.${NC}"
    exit 1
  fi
  
  total_lines=$(wc -l < "$LAST_LOG" | tr -d ' ')
  echo -e "${YELLOW}⏪ UNDOING: $(basename "$LAST_LOG") ($total_lines moves)${NC}"
  echo ""
  
  restored=0
  while IFS='|' read -r dest src; do
    if [[ -f "$dest" ]]; then
      parent_dir=$(dirname "$src")
      mkdir -p "$parent_dir"
      mv "$dest" "$src"
      echo -e "  ${GREEN}↩${NC} $(basename "$src")"
      restored=$((restored + 1))
    else
      echo -e "  ${DIM}⊘ $(basename "${dest}") — already moved/deleted${NC}"
    fi
  done < "$LAST_LOG"
  
  # Clean up empty dirs left behind
  for target in "${TARGETS[@]}"; do
    find "$target" -mindepth 1 -type d -empty -delete 2>/dev/null || true
  done
  
  rm "$LAST_LOG"
  echo ""
  echo -e "${GREEN}✅ Restored $restored files. Undo log removed.${NC}"
  exit 0
fi

# ─── Extension + Category Map ─────────────────────────────────
declare -A EXT_MAP

# Images
for e in jpg jpeg png gif svg webp heic heif ico bmp tiff tif avif raw cr2 cr3 nef arw dng orf rw2 pef; do EXT_MAP[$e]="Images"; done
# Documents
for e in pdf doc docx xls xlsx ppt pptx txt rtf odt ods odp pages numbers keynote md csv tsv log; do EXT_MAP[$e]="Documents"; done
# Audio
for e in mp3 wav flac aac m4a ogg opus aif aiff wma mid midi bwf ac3 dts amr; do EXT_MAP[$e]="Audio"; done
# Video
for e in mp4 mov avi mkv wmv flv webm m4v mpg mpeg 3gp ts vob mts m2ts; do EXT_MAP[$e]="Video"; done
# Archives
for e in zip tar gz bz2 xz 7z rar sit sitx lz lzma zst; do EXT_MAP[$e]="Archives"; done
# Installers
for e in dmg pkg exe msi deb rpm appimage snap flatpak; do EXT_MAP[$e]="Installers"; done
# Code
for e in py js ts jsx tsx json html css scss less sh bash zsh fish rb go rs java c cpp h hpp swift kt kts toml yaml yml xml sql r m mm pl pm lua dart v zig nim; do EXT_MAP[$e]="Code"; done
# Fonts
for e in ttf otf woff woff2 eot; do EXT_MAP[$e]="Fonts"; done
# Design
for e in psd ai sketch fig xd eps indd blend afdesign afphoto afpub; do EXT_MAP[$e]="Design"; done
# 3D / CAD
for e in stl obj fbx glb gltf step stp iges dwg dxf blend; do EXT_MAP[$e]="3D-Models"; done
# Data
for e in db sqlite sqlite3 parquet ndjson jsonl arrow feather; do EXT_MAP[$e]="Data"; done
# Disk / VM Images
for e in iso img vmdk vdi qcow2 ova ovf vhd; do EXT_MAP[$e]="Disk-Images"; done
# Books
for e in epub mobi azw azw3 djvu; do EXT_MAP[$e]="Books"; done
# Calendar/Contacts
for e in ics vcf vcard; do EXT_MAP[$e]="Contacts-Calendar"; done

# ─── Smart Category Engine ───────────────────────────────────
get_smart_category() {
  local filename="$1"
  local lower="${filename,,}"
  local ext="${filename##*.}"
  ext="${ext,,}"

  # ── macOS Screenshots (highest priority — very common) ──
  [[ "$lower" == screenshot* || "$lower" == "screen shot"* || "$lower" == "screen recording"* || "$lower" == cleanshot* ]] && { echo "Screenshots"; return; }

  # ── Incomplete downloads ──
  [[ "$ext" == "download" || "$ext" == "crdownload" || "$ext" == "part" || "$ext" == "partial" ]] && { echo "Incomplete"; return; }

  # ── Browser duplicate pattern: "file (1).pdf", "file-1.pdf", "file copy.pdf" ──
  # Just categorize normally but we'll clean the name

  # ── NOIZY Project ──
  [[ "$lower" == *noizy* || "$lower" == *dreamchamber* || "$lower" == *mc96* || \
     "$lower" == *gorunfree* || "$lower" == *noizyfish* || "$lower" == *noizylab* || \
     "$lower" == *noizykidz* || "$lower" == *noizyvox* || "$lower" == *aquarium* || \
     "$lower" == *metabeast* || "$lower" == *hvs_* || "$lower" == *rsp_001* || \
     "$lower" == *rsp001* ]] && { echo "NOIZY-Project"; return; }

  # ── Identity / Sensitive ──
  [[ "$lower" == *passport* || "$lower" == *visa_* || "$lower" == *"id card"* || \
     "$lower" == *"driver"*"licen"* || "$lower" == *"social insurance"* || \
     "$lower" == *sin_* || "$lower" == *"birth cert"* ]] && { echo "Identity-SENSITIVE"; return; }

  # ── Finance ──
  [[ "$lower" == *invoice* || "$lower" == *receipt* || "$lower" == *statement* || \
     "$lower" == *"t4"* || "$lower" == *"t5"* || "$lower" == *tax* || \
     "$lower" == *payslip* || "$lower" == *paystub* || "$lower" == *"bank"* || \
     "$lower" == *expense* || "$lower" == *"pay stub"* ]] && { echo "Finance"; return; }

  # ── Contracts / Legal ──
  [[ "$lower" == *contract* || "$lower" == *agreement* || "$lower" == *"terms of"* || \
     "$lower" == *consent* || "$lower" == *nda* || "$lower" == *"non-disclosure"* || \
     "$lower" == *"privacy policy"* || "$lower" == *signed* || \
     "$lower" == *lease* || "$lower" == *waiver* ]] && { echo "Contracts"; return; }

  # ── Career ──
  [[ "$lower" == *resume* || "$lower" == *"c.v."* || "$lower" == *"cover letter"* || \
     "$lower" == *"cover_letter"* || "$lower" == *curriculum* || \
     "$lower" == *portfolio* ]] && { echo "Career"; return; }

  # ── Wallpapers ──
  [[ "$lower" == *wallpaper* || "$lower" == *"desktop bg"* || "$lower" == *"desktop_bg"* ]] && { echo "Wallpapers"; return; }

  # ── Zoom / Meeting recordings ──
  [[ "$lower" == *zoom_* || "$lower" == *"zoom "* || "$lower" == *"gmt-"*"recording"* || \
     "$lower" == *"meet_"* || "$lower" == *"teams_"* ]] && { echo "Meetings"; return; }

  # ── Chat exports ──
  [[ "$lower" == *"whatsapp"* || "$lower" == *"telegram"* || "$lower" == *"slack_export"* || \
     "$lower" == *"discord"* ]] && { echo "Chat-Exports"; return; }

  # ── Torrents ──
  [[ "$ext" == "torrent" || "$ext" == "magnet" ]] && { echo "Torrents"; return; }

  # Extension fallback
  [[ -n "${EXT_MAP[$ext]:-}" ]] && { echo "${EXT_MAP[$ext]}"; return; }

  echo "Other"
}

# ─── Date Subfolder ───────────────────────────────────────────
get_date_subfolder() {
  local file="$1"
  if [[ "$(uname)" == "Darwin" ]]; then
    stat -f "%Sm" -t "%Y-%m" "$file" 2>/dev/null || echo "unknown"
  else
    date -r "$file" "+%Y-%m" 2>/dev/null || echo "unknown"
  fi
}

# ─── Human-Readable Size ─────────────────────────────────────
human_size() {
  local bytes=${1:-0}
  if (( bytes >= 1073741824 )); then echo "$((bytes / 1073741824)).$(( (bytes % 1073741824) * 10 / 1073741824 ))GB"
  elif (( bytes >= 1048576 )); then echo "$((bytes / 1048576))MB"
  elif (( bytes >= 1024 )); then echo "$((bytes / 1024))KB"
  else echo "${bytes}B"
  fi
}

# ─── Duplicate Detection ─────────────────────────────────────
declare -A SEEN_HASHES

check_duplicate() {
  local file="$1"
  local size
  size=$(stat -f "%z" "$file" 2>/dev/null || stat -c "%s" "$file" 2>/dev/null || echo "0")
  
  # Skip tiny files (not worth hashing)
  (( size < 100 )) && return 1
  
  local fingerprint="${size}_$(head -c 8192 "$file" 2>/dev/null | shasum -a 256 2>/dev/null | cut -d' ' -f1)"
  
  if [[ -n "${SEEN_HASHES[$fingerprint]:-}" ]]; then
    echo "${SEEN_HASHES[$fingerprint]}"
    return 0
  fi
  
  SEEN_HASHES[$fingerprint]="$file"
  return 1
}

# ─── Browser Dedup Name Cleaner ───────────────────────────────
clean_browser_dups() {
  local filename="$1"
  # Remove " (1)", " (2)", etc.
  local cleaned
  cleaned=$(echo "$filename" | sed -E 's/ \([0-9]+\)(\.[^.]+)$/\1/')
  # Remove " copy", " copy 2", etc.
  cleaned=$(echo "$cleaned" | sed -E 's/ copy( [0-9]+)?(\.[^.]+)$/\2/')
  # Remove "-1", "-2" at end before extension (but not timestamps)
  cleaned=$(echo "$cleaned" | sed -E 's/-([0-9]{1,2})(\.[^.]+)$/\2/')
  echo "$cleaned"
}

# ─── Report Mode ──────────────────────────────────────────────
if $REPORT_ONLY; then
  echo ""
  echo -e "${BOLD}📊 NOIZY ORGANIZER — INTELLIGENCE REPORT v${VERSION}${NC}"
  echo "================================================"
  
  for target in "${TARGETS[@]}"; do
    [[ ! -d "$target" ]] && continue
    
    target_name=$(basename "$target")
    echo ""
    echo -e "${CYAN}📁 ${BOLD}~/${target_name}/${NC}"
    echo -e "${DIM}   ${target}${NC}"
    
    total_files=$(find "$target" -maxdepth 1 -type f -not -name ".*" 2>/dev/null | wc -l | tr -d ' ')
    total_size=$(find "$target" -maxdepth 1 -type f -not -name ".*" -exec stat -f "%z" {} + 2>/dev/null | awk '{s+=$1}END{print s+0}')
    
    echo -e "   Files:  ${BOLD}${total_files}${NC}"
    echo -e "   Size:   ${BOLD}$(human_size $total_size)${NC}"
    
    if (( total_files == 0 )); then
      echo -e "   ${GREEN}✨ Already clean!${NC}"
      continue
    fi
    
    # Age distribution
    echo ""
    echo -e "   ${YELLOW}📅 Age:${NC}"
    ancient=$(find "$target" -maxdepth 1 -type f -not -name ".*" -mtime +365 2>/dev/null | wc -l | tr -d ' ')
    old=$(find "$target" -maxdepth 1 -type f -not -name ".*" -mtime +90 -mtime -365 2>/dev/null | wc -l | tr -d ' ')
    medium=$(find "$target" -maxdepth 1 -type f -not -name ".*" -mtime +30 -mtime -90 2>/dev/null | wc -l | tr -d ' ')
    recent=$(find "$target" -maxdepth 1 -type f -not -name ".*" -mtime +7 -mtime -30 2>/dev/null | wc -l | tr -d ' ')
    fresh=$(find "$target" -maxdepth 1 -type f -not -name ".*" -mtime -7 2>/dev/null | wc -l | tr -d ' ')
    echo -e "      > 1 year:    ${ancient}"
    echo -e "      3-12 months: ${old}"
    echo -e "      1-3 months:  ${medium}"
    echo -e "      1-4 weeks:   ${recent}"
    echo -e "      < 1 week:    ${fresh}"
    
    # Top 5 largest
    echo ""
    echo -e "   ${YELLOW}📦 Largest:${NC}"
    find "$target" -maxdepth 1 -type f -not -name ".*" -exec stat -f "%z %N" {} + 2>/dev/null | sort -rn | head -5 | while read -r sz fp; do
      echo -e "      $(human_size $sz)\t$(basename "$fp")"
    done
    
    # Category prediction
    echo ""
    echo -e "   ${YELLOW}🏷️  Would sort into:${NC}"
    find "$target" -maxdepth 1 -type f -not -name ".*" 2>/dev/null | while read -r file; do
      get_smart_category "$(basename "$file")"
    done | sort | uniq -c | sort -rn | while read -r count cat; do
      case "$cat" in
        NOIZY-Project)      icon="🐟" ;;
        Identity-SENSITIVE) icon="🔒" ;;
        Finance)            icon="💰" ;;
        Screenshots)        icon="📸" ;;
        Images)             icon="🖼️ " ;;
        Documents)          icon="📄" ;;
        Audio)              icon="🎵" ;;
        Video)              icon="🎬" ;;
        Archives)           icon="📦" ;;
        Code)               icon="💻" ;;
        Installers)         icon="⬇️ " ;;
        Duplicates)         icon="♊" ;;
        *)                  icon="📁" ;;
      esac
      printf "      %s %-22s %s\n" "$icon" "$cat" "$count files"
    done
  done
  
  echo ""
  echo -e "${DIM}Run without --report to organize. Use --dry-run to preview first.${NC}"
  exit 0
fi

# ─── Watch Mode (live auto-organize) ─────────────────────────
if $WATCH_MODE; then
  if ! command -v fswatch &>/dev/null; then
    echo -e "${RED}fswatch not found. Install: brew install fswatch${NC}"
    exit 1
  fi
  
  echo -e "${BOLD}👁️  WATCH MODE — Auto-organizing in real-time${NC}"
  echo -e "${DIM}   Watching: ${TARGETS[*]}${NC}"
  echo -e "${DIM}   Press Ctrl+C to stop${NC}"
  echo ""
  
  fswatch -0 --event Created --event MovedTo "${TARGETS[@]}" | while IFS= read -r -d '' file; do
    # Skip directories and hidden files
    [[ -d "$file" ]] && continue
    [[ "$(basename "$file")" == .* ]] && continue
    
    # Wait a moment for file to finish writing
    sleep 1
    [[ ! -f "$file" ]] && continue
    
    filename=$(basename "$file")
    parent=$(dirname "$file")
    category=$(get_smart_category "$filename")
    date_sub=$(get_date_subfolder "$file")
    
    # Don't re-sort files already in category folders
    parent_name=$(basename "$parent")
    [[ "$parent_name" != "Downloads" && "$parent_name" != "Desktop" && "$parent_name" != "Documents" ]] && continue
    
    target_dir="${parent}/${category}/${date_sub}"
    target_file="${target_dir}/${filename}"
    
    mkdir -p "$target_dir"
    if mv "$file" "$target_file" 2>/dev/null; then
      echo -e "  ${GREEN}⚡${NC} ${filename} → ${BOLD}${category}${NC}/${date_sub}/"
    fi
  done
  exit 0
fi

# ─── Archive Mode ─────────────────────────────────────────────
if (( ARCHIVE_DAYS > 0 )); then
  echo -e "${BOLD}📦 ARCHIVE MODE — Compressing files older than ${ARCHIVE_DAYS} days${NC}"
  echo ""
  
  for target in "${TARGETS[@]}"; do
    archive_dir="${target}/Archive"
    mkdir -p "$archive_dir"
    
    find "$target" -maxdepth "$MAX_DEPTH" -type f -not -name ".*" -mtime +"$ARCHIVE_DAYS" \
      -not -path "${archive_dir}/*" 2>/dev/null | while read -r file; do
      filename=$(basename "$file")
      date_sub=$(get_date_subfolder "$file")
      
      dest="${archive_dir}/${date_sub}"
      mkdir -p "$dest"
      
      if $DRY_RUN; then
        echo -e "  ${DIM}→ ${filename} → Archive/${date_sub}/${NC}"
      else
        mv "$file" "${dest}/${filename}"
        echo -e "  ${CYAN}📦${NC} ${filename} → Archive/${date_sub}/"
      fi
    done
  done
  
  # Compress each month folder
  if ! $DRY_RUN; then
    for target in "${TARGETS[@]}"; do
      archive_dir="${target}/Archive"
      find "$archive_dir" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | while read -r month_dir; do
        month_name=$(basename "$month_dir")
        zip_path="${archive_dir}/${month_name}.zip"
        if [[ ! -f "$zip_path" ]]; then
          cd "$archive_dir"
          zip -r -q "$zip_path" "$month_name" && rm -rf "$month_dir"
          echo -e "  ${GREEN}🗜️${NC} Compressed: ${month_name}.zip"
        fi
      done
    done
  fi
  exit 0
fi

# ─── Main Organize Loop ──────────────────────────────────────
UNDO_LOG="${LOG_DIR}/undo_$(date +%Y%m%d_%H%M%S).log"
touch "$UNDO_LOG"

echo ""
echo -e "${BOLD}🧹 NOIZY ORGANIZER v${VERSION}${NC}"
echo "================================"
$DRY_RUN && echo -e "${YELLOW}   MODE: DRY RUN (preview only)${NC}"
echo -e "${DIM}   Targets: ${TARGETS[*]}${NC}"
echo ""

grand_moved=0
grand_dupes=0
grand_errors=0
grand_bytes=0

for target in "${TARGETS[@]}"; do
  [[ ! -d "$target" ]] && { echo -e "${RED}⊘ $target not found${NC}"; continue; }
  
  target_name=$(basename "$target")
  total=$(find "$target" -maxdepth 1 -type f -not -name ".*" -not -name "*.sh" 2>/dev/null | wc -l | tr -d ' ')
  
  echo -e "${CYAN}━━━ ~/${target_name}/ (${total} files) ━━━${NC}"
  
  (( total == 0 )) && { echo -e "  ${GREEN}✨ Already clean!${NC}"; echo ""; continue; }
  
  moved=0
  dupes=0
  
  find "$target" -maxdepth 1 -type f -not -name ".*" -not -name "*.sh" 2>/dev/null | sort | while read -r file; do
    filename=$(basename "$file")
    filesize=$(stat -f "%z" "$file" 2>/dev/null || echo "0")
    
    # Smart category
    category=$(get_smart_category "$filename")
    
    # Large file isolation
    if (( LARGE_THRESHOLD_MB > 0 )) && (( filesize > LARGE_THRESHOLD_MB * 1048576 )); then
      category="Large-Files"
    fi
    
    # Duplicate check
    dup_of=""
    if dup_of=$(check_duplicate "$file"); then
      category="Duplicates"
    fi
    
    # Date subfolder
    date_sub=$(get_date_subfolder "$file")
    
    # Clean browser dedup names
    clean_name=$(clean_browser_dups "$filename")
    
    # Build target path
    dest_dir="${target}/${category}/${date_sub}"
    dest_file="${dest_dir}/${clean_name}"
    
    # Handle collisions
    if [[ -e "$dest_file" ]]; then
      base="${clean_name%.*}"
      ext_part="${clean_name##*.}"
      counter=1
      if [[ "$clean_name" == "$ext_part" ]]; then
        while [[ -e "${dest_dir}/${base}_${counter}" ]]; do ((counter++)); done
        dest_file="${dest_dir}/${base}_${counter}"
      else
        while [[ -e "${dest_dir}/${base}_${counter}.${ext_part}" ]]; do ((counter++)); done
        dest_file="${dest_dir}/${base}_${counter}.${ext_part}"
      fi
    fi
    
    # Category styling
    case "$category" in
      NOIZY-Project)       icon="🐟"; color=$PURPLE ;;
      Identity-SENSITIVE)  icon="🔒"; color=$RED ;;
      Finance)             icon="💰"; color=$YELLOW ;;
      Contracts)           icon="📜"; color=$YELLOW ;;
      Screenshots)         icon="📸"; color=$CYAN ;;
      Images)              icon="🖼️ "; color=$GREEN ;;
      Documents)           icon="📄"; color=$GREEN ;;
      Audio)               icon="🎵"; color=$BLUE ;;
      Video)               icon="🎬"; color=$BLUE ;;
      Archives)            icon="📦"; color=$GREEN ;;
      Code)                icon="💻"; color=$CYAN ;;
      Installers)          icon="⬇️ "; color=$GREEN ;;
      Duplicates)          icon="♊"; color=$DIM ;;
      Large-Files)         icon="🏋️"; color=$YELLOW ;;
      Meetings)            icon="📹"; color=$BLUE ;;
      Career)              icon="💼"; color=$GREEN ;;
      Books)               icon="📚"; color=$GREEN ;;
      *)                   icon="📁"; color=$NC ;;
    esac
    
    size_label="$(human_size $filesize)"
    rename_note=""
    [[ "$clean_name" != "$filename" ]] && rename_note=" ${DIM}(cleaned name)${NC}"
    
    if $DRY_RUN; then
      echo -e "  ${color}${icon}${NC} ${filename} → ${BOLD}${category}${NC}/${date_sub}/ ${DIM}(${size_label})${NC}${rename_note}"
      [[ -n "$dup_of" ]] && echo -e "     ${DIM}♊ duplicate of: $(basename "$dup_of")${NC}"
    else
      mkdir -p "$dest_dir"
      if mv "$file" "$dest_file" 2>/dev/null; then
        echo -e "  ${color}${icon} ✅${NC} ${filename} → ${BOLD}${category}${NC}/${date_sub}/${rename_note}"
        echo "${dest_file}|${file}" >> "$UNDO_LOG"
      else
        echo -e "  ${RED}❌${NC} ${filename}"
      fi
    fi
  done
  
  echo ""
done

# ─── Summary ─────────────────────────────────────────────────
echo "================================"
if $DRY_RUN; then
  echo -e "${YELLOW}🔍 DRY RUN COMPLETE${NC} — run without --dry-run to execute"
else
  undo_count=$(wc -l < "$UNDO_LOG" 2>/dev/null | tr -d ' ')
  echo -e "${GREEN}✅ ORGANIZED — ${undo_count} files moved${NC}"
  echo -e "${DIM}   Undo: organize --undo${NC}"
  
  # Clean empty undo log
  [[ "${undo_count}" == "0" ]] && rm -f "$UNDO_LOG"
fi
echo ""

# Show result tree
echo -e "${BOLD}📁 Result:${NC}"
for target in "${TARGETS[@]}"; do
  [[ ! -d "$target" ]] && continue
  target_name=$(basename "$target")
  echo -e "  ${BOLD}~/${target_name}/${NC}"
  find "$target" -mindepth 1 -maxdepth 1 -type d -not -name ".*" 2>/dev/null | sort | while read -r dir; do
    count=$(find "$dir" -type f 2>/dev/null | wc -l | tr -d ' ')
    size=$(find "$dir" -type f -exec stat -f "%z" {} + 2>/dev/null | awk '{s+=$1}END{print s+0}')
    dirname=$(basename "$dir")
    case "$dirname" in
      NOIZY-Project)      icon="🐟" ;;
      Identity-SENSITIVE) icon="🔒" ;;
      Finance)            icon="💰" ;;
      Contracts)          icon="📜" ;;
      Screenshots)        icon="📸" ;;
      Images)             icon="🖼️ " ;;
      Documents)          icon="📄" ;;
      Audio)              icon="🎵" ;;
      Video)              icon="🎬" ;;
      Archives)           icon="📦" ;;
      Code)               icon="💻" ;;
      Installers)         icon="⬇️ " ;;
      Duplicates)         icon="♊" ;;
      Large-Files)        icon="🏋️" ;;
      Meetings)           icon="📹" ;;
      Career)             icon="💼" ;;
      Books)              icon="📚" ;;
      *)                  icon="📁" ;;
    esac
    printf "    %s %-24s %3s files  (%s)\n" "$icon" "${dirname}/" "$count" "$(human_size $size)"
  done
  echo ""
done

echo -e "${DIM}NOIZY Organizer v${VERSION} — GORUNFREE. 🐟${NC}"
