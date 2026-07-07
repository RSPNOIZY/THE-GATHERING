#!/bin/bash
# ================================================================
# GABRIEL — TALESPIN AUDIO FINDER
# ================================================================
# Scans all mounted drives for WAV files called "TALESPIN"
# or inside folders called "TALESPIN"
#
# These are RSP_001's unreleased voice performances.
# TaleSpin never shipped. All sounds are Rob's IP.
# Perfect source material for NOIZY.AI web experience.
#
# Usage: bash talespin-finder.sh
# ================================================================

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_DIR="$HOME/Claude/TALESPIN_FOUND"
REPORT="$REPORT_DIR/talespin_report_${TIMESTAMP}.txt"
MANIFEST="$REPORT_DIR/talespin_manifest.csv"

mkdir -p "$REPORT_DIR"

echo "================================================================"
echo "  GABRIEL — TALESPIN AUDIO FINDER"
echo "  Scanning all mounted drives..."
echo "  $(date)"
echo "================================================================"
echo ""

# ── PHASE 1: Find all mounted volumes ──
echo "  PHASE 1: Detecting mounted drives..."
echo ""

SEARCH_PATHS=()

# Internal drive
SEARCH_PATHS+=("$HOME")

# All mounted volumes (Thunderbolt daisy chain + external)
if [ -d "/Volumes" ]; then
    for vol in /Volumes/*/; do
        if [ -d "$vol" ] && [ "$vol" != "/Volumes/Macintosh HD/" ]; then
            SEARCH_PATHS+=("$vol")
            echo "    Drive found: $vol"
        fi
    done
fi

# Claude workspace
if [ -d "$HOME/Claude" ]; then
    SEARCH_PATHS+=("$HOME/Claude")
fi

# Documents
if [ -d "$HOME/Documents" ]; then
    SEARCH_PATHS+=("$HOME/Documents")
fi

# Desktop
if [ -d "$HOME/Desktop" ]; then
    SEARCH_PATHS+=("$HOME/Desktop")
fi

echo ""
echo "  Total search locations: ${#SEARCH_PATHS[@]}"
echo ""

# ── PHASE 2: Search for TALESPIN ──
echo "  PHASE 2: Searching for TALESPIN audio..."
echo ""

# Initialize report
cat > "$REPORT" << EOF
================================================================
GABRIEL — TALESPIN AUDIO FINDER REPORT
================================================================
Date: $(date)
Creator: RSP_001 (Robert Stephen Plowman)
Purpose: Find all TaleSpin audio for NOIZY.AI web experience
IP Status: All TaleSpin audio is RSP_001's property
           (unreleased project — never shipped)
================================================================

EOF

# Initialize CSV manifest
echo "filepath,filename,extension,size_bytes,size_mb,modified_date,found_method" > "$MANIFEST"

TOTAL_FOUND=0
TOTAL_SIZE=0

# Function to log a found file
log_found() {
    local filepath="$1"
    local method="$2"

    if [ ! -f "$filepath" ]; then
        return
    fi

    local filename=$(basename "$filepath")
    local extension="${filename##*.}"
    local size_bytes=$(stat -f%z "$filepath" 2>/dev/null || stat --printf="%s" "$filepath" 2>/dev/null || echo "0")
    local size_mb=$(echo "scale=2; $size_bytes / 1048576" | bc 2>/dev/null || echo "?")
    local mod_date=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" "$filepath" 2>/dev/null || stat --printf="%y" "$filepath" 2>/dev/null || echo "unknown")

    echo "    FOUND: $filepath"
    echo "           Size: ${size_mb}MB | Modified: $mod_date | Method: $method"

    echo "$filepath" >> "$REPORT"
    echo "  Size: ${size_mb}MB | Modified: $mod_date | Method: $method" >> "$REPORT"
    echo "" >> "$REPORT"

    echo "\"$filepath\",\"$filename\",\"$extension\",\"$size_bytes\",\"$size_mb\",\"$mod_date\",\"$method\"" >> "$MANIFEST"

    TOTAL_FOUND=$((TOTAL_FOUND + 1))
    TOTAL_SIZE=$((TOTAL_SIZE + size_bytes))
}

echo "  --- Search Method 1: Files with 'talespin' in the name ---" | tee -a "$REPORT"
echo "" >> "$REPORT"

for search_path in "${SEARCH_PATHS[@]}"; do
    if [ ! -d "$search_path" ]; then
        continue
    fi

    find "$search_path" -maxdepth 10 -type f \( \
        -iname "*talespin*.wav" -o \
        -iname "*talespin*.aif" -o \
        -iname "*talespin*.aiff" -o \
        -iname "*talespin*.mp3" -o \
        -iname "*talespin*.m4a" -o \
        -iname "*talespin*.flac" -o \
        -iname "*talespin*.caf" -o \
        -iname "*tale_spin*.wav" -o \
        -iname "*tale-spin*.wav" -o \
        -iname "*tales_pin*.wav" \
    \) 2>/dev/null | while read -r filepath; do
        log_found "$filepath" "filename_match"
    done
done

echo ""
echo "  --- Search Method 2: Audio files inside 'talespin' folders ---" | tee -a "$REPORT"
echo "" >> "$REPORT"

for search_path in "${SEARCH_PATHS[@]}"; do
    if [ ! -d "$search_path" ]; then
        continue
    fi

    find "$search_path" -maxdepth 10 -type d -iname "*talespin*" 2>/dev/null | while read -r dir; do
        echo "    Folder found: $dir"
        echo "  FOLDER: $dir" >> "$REPORT"

        find "$dir" -type f \( \
            -iname "*.wav" -o \
            -iname "*.aif" -o \
            -iname "*.aiff" -o \
            -iname "*.mp3" -o \
            -iname "*.m4a" -o \
            -iname "*.flac" -o \
            -iname "*.caf" -o \
            -iname "*.ogg" \
        \) 2>/dev/null | while read -r filepath; do
            log_found "$filepath" "folder_match"
        done
    done
done

echo ""
echo "  --- Search Method 3: Spotlight index (fastest for indexed drives) ---" | tee -a "$REPORT"
echo "" >> "$REPORT"

mdfind -name "talespin" 2>/dev/null | grep -iE "\.(wav|aif|aiff|mp3|m4a|flac|caf)$" | while read -r filepath; do
    if [ -f "$filepath" ]; then
        log_found "$filepath" "spotlight"
    fi
done

echo ""
echo "  --- Search Method 4: Broader search for 'tale' in audio folders ---" | tee -a "$REPORT"
echo "" >> "$REPORT"

for search_path in "${SEARCH_PATHS[@]}"; do
    if [ ! -d "$search_path" ]; then
        continue
    fi

    find "$search_path" -maxdepth 8 -type d \( \
        -iname "*tale*spin*" -o \
        -iname "*talespin*" -o \
        -iname "*TALESPIN*" -o \
        -iname "*TaleSpin*" \
    \) 2>/dev/null | while read -r dir; do
        echo "    Related folder: $dir"
        echo "  RELATED FOLDER: $dir" >> "$REPORT"

        audio_count=$(find "$dir" -type f \( -iname "*.wav" -o -iname "*.aif" -o -iname "*.aiff" -o -iname "*.mp3" -o -iname "*.m4a" -o -iname "*.flac" \) 2>/dev/null | wc -l)
        echo "    Audio files inside: $audio_count"
        echo "  Audio files: $audio_count" >> "$REPORT"
        echo "" >> "$REPORT"

        find "$dir" -type f \( -iname "*.wav" -o -iname "*.aif" -o -iname "*.aiff" -o -iname "*.mp3" -o -iname "*.m4a" -o -iname "*.flac" \) 2>/dev/null | while read -r filepath; do
            log_found "$filepath" "broad_search"
        done
    done
done

# ── PHASE 3: Also search for ALL wav files on desktop/Claude folder ──
echo ""
echo "  --- Search Method 5: All WAV files in ~/Claude/ and ~/Desktop/ ---" | tee -a "$REPORT"
echo "" >> "$REPORT"

for search_path in "$HOME/Claude" "$HOME/Desktop" "$HOME/Documents"; do
    if [ ! -d "$search_path" ]; then
        continue
    fi

    wav_count=$(find "$search_path" -maxdepth 5 -type f -iname "*.wav" 2>/dev/null | wc -l)
    if [ "$wav_count" -gt 0 ]; then
        echo "    $search_path: $wav_count WAV files found"
        echo "  $search_path: $wav_count WAV files" >> "$REPORT"

        find "$search_path" -maxdepth 5 -type f -iname "*.wav" 2>/dev/null | head -20 | while read -r filepath; do
            log_found "$filepath" "local_wav_scan"
        done

        if [ "$wav_count" -gt 20 ]; then
            echo "    ... and $((wav_count - 20)) more WAV files"
            echo "  ... and $((wav_count - 20)) more" >> "$REPORT"
        fi
    fi
done

# ── PHASE 4: Summary ──
echo ""
echo "================================================================" | tee -a "$REPORT"
echo "  TALESPIN SEARCH COMPLETE" | tee -a "$REPORT"
echo "================================================================" | tee -a "$REPORT"

if [ -f "$MANIFEST" ]; then
    MANIFEST_COUNT=$(($(wc -l < "$MANIFEST") - 1))
else
    MANIFEST_COUNT=0
fi

echo "" | tee -a "$REPORT"
echo "  TaleSpin audio files found: $MANIFEST_COUNT" | tee -a "$REPORT"
echo "  Report saved: $REPORT" | tee -a "$REPORT"
echo "  CSV manifest: $MANIFEST" | tee -a "$REPORT"
echo "" | tee -a "$REPORT"
echo "  IP Status: All TaleSpin audio is RSP_001 property" | tee -a "$REPORT"
echo "  Purpose: Voice performances for NOIZY.AI web experience" | tee -a "$REPORT"
echo "  Next: Review manifest, select best takes, ingest into Gabriel" | tee -a "$REPORT"
echo "" | tee -a "$REPORT"

if [ "$MANIFEST_COUNT" -eq 0 ]; then
    echo "  No TaleSpin files found on currently mounted drives." | tee -a "$REPORT"
    echo "  Possible reasons:" | tee -a "$REPORT"
    echo "    - Files are on a drive not currently mounted" | tee -a "$REPORT"
    echo "    - Files use a different naming convention" | tee -a "$REPORT"
    echo "    - Files are on the Thunderbolt drives (connect and re-run)" | tee -a "$REPORT"
    echo "" | tee -a "$REPORT"
    echo "  Try:" | tee -a "$REPORT"
    echo "    1. Connect all Thunderbolt drives" | tee -a "$REPORT"
    echo "    2. Re-run: bash talespin-finder.sh" | tee -a "$REPORT"
    echo "    3. Or tell Gabriel what the drive/folder was called" | tee -a "$REPORT"
fi

echo ""
echo "  To copy TaleSpin files to NOIZY workspace:"
echo "    cp [file] ~/Claude/TALESPIN_FOUND/"
echo ""
echo "  To ingest into Gabriel audio pipeline:"
echo "    python gabriel-audio-inhaler.py --source ~/Claude/TALESPIN_FOUND"
echo ""
echo "================================================================"
