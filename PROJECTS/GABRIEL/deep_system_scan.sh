#!/bin/bash

###############################################################################
#
#  🔍 DEEP SYSTEM SCAN - M2 ULTRA COMPREHENSIVE CODE EXTRACTION
#  Extracts ALL code files (Shell, Python, JS, JSON, YAML)
#  Excludes OS system files, binaries, caches, node_modules
#
###############################################################################

set -e

OUTPUT_DIR="./COLLECTED_SOURCE_CODE"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo ""
echo "╔══════════════════════════════════════════════════════════════════════════╗"
echo "║                    🔍 DEEP SYSTEM SCAN - M2 ULTRA 🔍                    ║"
echo "║                    Comprehensive Code Extraction                         ║"
echo "╚══════════════════════════════════════════════════════════════════════════╝"
echo ""

# Create output directory structure
mkdir -p "$OUTPUT_DIR"/{SHELL,PYTHON,JAVASCRIPT,JSON,YAML,MIXED_PROJECTS,METADATA}

echo "📦 Organizing collected source code..."
echo ""

# ============================================================================
# 1. SHELL SCRIPTS
# ============================================================================
echo "▶ [1/6] Collecting SHELL SCRIPTS (.sh, .bash)..."

find ~ -type f \( -name "*.sh" -o -name "*.bash" \) ! -path "*/.*" ! -path "*/.cache/*" ! -path "*/Library/*" 2>/dev/null | while read file; do
  basename=$(basename "$file")
  cp "$file" "$OUTPUT_DIR/SHELL/${basename%.*}_$(md5 -q <(echo "$file") | cut -c1-4).sh" 2>/dev/null || true
done

SHELL_COUNT=$(find "$OUTPUT_DIR/SHELL" -type f | wc -l)
echo "  ✅ Collected $SHELL_COUNT shell scripts"
echo ""

# ============================================================================
# 2. PYTHON FILES
# ============================================================================
echo "▶ [2/6] Collecting PYTHON FILES (.py)..."

find ~ -type f -name "*.py" ! -path "*/.*" ! -path "*/__pycache__/*" ! -path "*/Library/*" 2>/dev/null | while read file; do
  basename=$(basename "$file")
  cp "$file" "$OUTPUT_DIR/PYTHON/${basename%.*}_$(md5 -q <(echo "$file") | cut -c1-4).py" 2>/dev/null || true
done

PYTHON_COUNT=$(find "$OUTPUT_DIR/PYTHON" -type f | wc -l)
echo "  ✅ Collected $PYTHON_COUNT Python files"
echo ""

# ============================================================================
# 3. JAVASCRIPT/TYPESCRIPT
# ============================================================================
echo "▶ [3/6] Collecting JAVASCRIPT/TYPESCRIPT (.js, .jsx, .ts, .tsx)..."

find ~ -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) ! -path "*/.*" ! -path "*/node_modules/*" ! -path "*/Library/*" 2>/dev/null | while read file; do
  basename=$(basename "$file")
  ext="${file##*.}"
  cp "$file" "$OUTPUT_DIR/JAVASCRIPT/${basename%.*}_$(md5 -q <(echo "$file") | cut -c1-4).$ext" 2>/dev/null || true
done

JS_COUNT=$(find "$OUTPUT_DIR/JAVASCRIPT" -type f | wc -l)
echo "  ✅ Collected $JS_COUNT JavaScript/TypeScript files"
echo ""

# ============================================================================
# 4. JSON CONFIGS
# ============================================================================
echo "▶ [4/6] Collecting JSON CONFIG FILES (.json)..."

find ~ -type f -name "*.json" ! -path "*/.*" ! -path "*/node_modules/*" ! -path "*/Library/*" 2>/dev/null | while read file; do
  basename=$(basename "$file")
  cp "$file" "$OUTPUT_DIR/JSON/${basename%.*}_$(md5 -q <(echo "$file") | cut -c1-4).json" 2>/dev/null || true
done

JSON_COUNT=$(find "$OUTPUT_DIR/JSON" -type f | wc -l)
echo "  ✅ Collected $JSON_COUNT JSON files"
echo ""

# ============================================================================
# 5. YAML CONFIGS
# ============================================================================
echo "▶ [5/6] Collecting YAML CONFIG FILES (.yaml, .yml)..."

find ~ -type f \( -name "*.yaml" -o -name "*.yml" \) ! -path "*/.*" ! -path "*/Library/*" 2>/dev/null | while read file; do
  basename=$(basename "$file")
  ext="${file##*.}"
  cp "$file" "$OUTPUT_DIR/YAML/${basename%.*}_$(md5 -q <(echo "$file") | cut -c1-4).$ext" 2>/dev/null || true
done

YAML_COUNT=$(find "$OUTPUT_DIR/YAML" -type f | wc -l)
echo "  ✅ Collected $YAML_COUNT YAML files"
echo ""

# ============================================================================
# 6. PROJECT DIRECTORIES (organize by source)
# ============================================================================
echo "▶ [6/6] Collecting COMPLETE PROJECT DIRECTORIES..."

# AEON Projects
if [ -d ~/Downloads/aeon-v2-supreme ]; then
  cp -r ~/Downloads/aeon-v2-supreme "$OUTPUT_DIR/MIXED_PROJECTS/aeon-v2-supreme-v1" 2>/dev/null && echo "  ✅ aeon-v2-supreme v1"
fi

if [ -d ~/Downloads/"aeon-v2-supreme 2" ]; then
  cp -r ~/Downloads/"aeon-v2-supreme 2" "$OUTPUT_DIR/MIXED_PROJECTS/aeon-v2-supreme-v2" 2>/dev/null && echo "  ✅ aeon-v2-supreme v2"
fi

if [ -d ~/Downloads/AEON-MEGA ]; then
  cp -r ~/Downloads/AEON-MEGA "$OUTPUT_DIR/MIXED_PROJECTS/AEON-MEGA" 2>/dev/null && echo "  ✅ AEON-MEGA"
fi

if [ -d ~/Downloads/"AEON-POWER-COMPLETE 2" ]; then
  cp -r ~/Downloads/"AEON-POWER-COMPLETE 2" "$OUTPUT_DIR/MIXED_PROJECTS/AEON-POWER-COMPLETE" 2>/dev/null && echo "  ✅ AEON-POWER-COMPLETE"
fi

# Audio Systems
if [ -d ~/Downloads/10CC-ROOM ]; then
  cp -r ~/Downloads/10CC-ROOM "$OUTPUT_DIR/MIXED_PROJECTS/10CC-ROOM-v1" 2>/dev/null && echo "  ✅ 10CC-ROOM v1"
fi

if [ -d ~/Downloads/"10CC-ROOM 2" ]; then
  cp -r ~/Downloads/"10CC-ROOM 2" "$OUTPUT_DIR/MIXED_PROJECTS/10CC-ROOM-v2" 2>/dev/null && echo "  ✅ 10CC-ROOM v2"
fi

# Network
if [ -d ~/Downloads/NOIZYLAB-TUNNEL ]; then
  cp -r ~/Downloads/NOIZYLAB-TUNNEL "$OUTPUT_DIR/MIXED_PROJECTS/NOIZYLAB-TUNNEL" 2>/dev/null && echo "  ✅ NOIZYLAB-TUNNEL"
fi

# Data
if [ -d ~/Downloads/UNIVERSAL-INGESTION ]; then
  cp -r ~/Downloads/UNIVERSAL-INGESTION "$OUTPUT_DIR/MIXED_PROJECTS/UNIVERSAL-INGESTION" 2>/dev/null && echo "  ✅ UNIVERSAL-INGESTION"
fi

# Core
if [ -d ~/Downloads/noizylab-ultimate ]; then
  cp -r ~/Downloads/noizylab-ultimate "$OUTPUT_DIR/MIXED_PROJECTS/noizylab-ultimate" 2>/dev/null && echo "  ✅ NOIZYLAB-ULTIMATE"
fi

# Archives
if [ -d ~/Downloads/NOIZYLAB-FINAL ]; then
  cp -r ~/Downloads/NOIZYLAB-FINAL "$OUTPUT_DIR/MIXED_PROJECTS/NOIZYLAB-FINAL" 2>/dev/null && echo "  ✅ NOIZYLAB-FINAL"
fi

# RepairRob
if [ -d ~/NOIZYLAB_GIT_STAGING/repairrob ]; then
  cp -r ~/NOIZYLAB_GIT_STAGING/repairrob "$OUTPUT_DIR/MIXED_PROJECTS/repairrob" 2>/dev/null && echo "  ✅ RepairRob"
fi

echo ""

# ============================================================================
# CREATE METADATA
# ============================================================================
echo "╔════════════════════════════════════════════════════════════════════════╗"
echo "║                       📊 GENERATING METADATA...                        ║"
echo "╚════════════════════════════════════════════════════════════════════════╝"
echo ""

# File count summary
cat > "$OUTPUT_DIR/METADATA/FILE_INVENTORY.txt" << 'METADATA'
M2 ULTRA SYSTEM - COMPREHENSIVE CODE INVENTORY
==============================================

Source: Deep system scan excluding OS files, binaries, caches
Date: $(date)
System: macOS M2 Ultra

STATISTICS:
===========
METADATA

echo "Shell Scripts:      $SHELL_COUNT files" >> "$OUTPUT_DIR/METADATA/FILE_INVENTORY.txt"
echo "Python Files:       $PYTHON_COUNT files" >> "$OUTPUT_DIR/METADATA/FILE_INVENTORY.txt"
echo "JavaScript/TS:      $JS_COUNT files" >> "$OUTPUT_DIR/METADATA/FILE_INVENTORY.txt"
echo "JSON Configs:       $JSON_COUNT files" >> "$OUTPUT_DIR/METADATA/FILE_INVENTORY.txt"
echo "YAML Configs:       $YAML_COUNT files" >> "$OUTPUT_DIR/METADATA/FILE_INVENTORY.txt"
echo "" >> "$OUTPUT_DIR/METADATA/FILE_INVENTORY.txt"
echo "TOTAL CODE FILES:   $((SHELL_COUNT + PYTHON_COUNT + JS_COUNT + JSON_COUNT + YAML_COUNT)) files" >> "$OUTPUT_DIR/METADATA/FILE_INVENTORY.txt"

# List all shell scripts
echo "Generating shell scripts list..."
find "$OUTPUT_DIR/SHELL" -type f | sort > "$OUTPUT_DIR/METADATA/SHELL_SCRIPTS.txt"

# List all python files
echo "Generating python files list..."
find "$OUTPUT_DIR/PYTHON" -type f | sort > "$OUTPUT_DIR/METADATA/PYTHON_FILES.txt"

# List all JS/TS files
echo "Generating JavaScript/TypeScript files list..."
find "$OUTPUT_DIR/JAVASCRIPT" -type f | sort > "$OUTPUT_DIR/METADATA/JAVASCRIPT_FILES.txt"

# List all JSON files
echo "Generating JSON files list..."
find "$OUTPUT_DIR/JSON" -type f | sort > "$OUTPUT_DIR/METADATA/JSON_FILES.txt"

# List all YAML files
echo "Generating YAML files list..."
find "$OUTPUT_DIR/YAML" -type f | sort > "$OUTPUT_DIR/METADATA/YAML_FILES.txt"

# Create summary report
cat > "$OUTPUT_DIR/METADATA/SCAN_SUMMARY.md" << 'SUMMARY'
# M2 Ultra Deep System Scan - Summary Report

## Overview
Complete extraction of all user-accessible code files from M2 Ultra system.

## Excluded Categories
- Operating system files (/System, /Library system paths)
- Binary executables
- Cache directories (.cache, __pycache__)
- Node modules
- Hidden system files

## Included Categories
- Shell scripts (.sh, .bash)
- Python files (.py)
- JavaScript/TypeScript (.js, .jsx, .ts, .tsx)
- JSON configurations (.json)
- YAML configurations (.yaml, .yml)
- Complete project directories (with all files)

## Directory Structure
```
COLLECTED_SOURCE_CODE/
├── SHELL/                 - Individual shell scripts
├── PYTHON/               - Individual Python files
├── JAVASCRIPT/           - Individual JS/TS files
├── JSON/                 - Individual JSON configs
├── YAML/                 - Individual YAML configs
├── MIXED_PROJECTS/       - Complete project directories
│   ├── aeon-v2-supreme-v1/
│   ├── aeon-v2-supreme-v2/
│   ├── AEON-MEGA/
│   ├── AEON-POWER-COMPLETE/
│   ├── 10CC-ROOM-v1/
│   ├── 10CC-ROOM-v2/
│   ├── NOIZYLAB-TUNNEL/
│   ├── UNIVERSAL-INGESTION/
│   ├── noizylab-ultimate/
│   ├── NOIZYLAB-FINAL/
│   └── repairrob/
└── METADATA/             - Inventory and reports
    ├── FILE_INVENTORY.txt
    ├── SHELL_SCRIPTS.txt
    ├── PYTHON_FILES.txt
    ├── JAVASCRIPT_FILES.txt
    ├── JSON_FILES.txt
    ├── YAML_FILES.txt
    └── SCAN_SUMMARY.md
```

## Statistics
- Total Code Files: (calculated)
- Source Locations: 40+ directories
- Coverage: All user-accessible code
- Deduplication: Hash-based naming for unique identification

## Next Steps
1. Review collected code
2. Identify critical components
3. Extract dependencies
4. Create integration plan
5. Build unified system

SUMMARY

# ============================================================================
# FINAL SUMMARY
# ============================================================================
echo "╔════════════════════════════════════════════════════════════════════════╗"
echo "║                   ✅ DEEP SCAN COMPLETE - SUMMARY                     ║"
echo "╚════════════════════════════════════════════════════════════════════════╝"
echo ""

TOTAL_FILES=$((SHELL_COUNT + PYTHON_COUNT + JS_COUNT + JSON_COUNT + YAML_COUNT))
TOTAL_SIZE=$(du -sh "$OUTPUT_DIR" | awk '{print $1}')

echo "📊 COLLECTED FILES BY TYPE:"
echo ""
echo "  Shell Scripts:        $SHELL_COUNT"
echo "  Python Files:         $PYTHON_COUNT"
echo "  JavaScript/TypeScript: $JS_COUNT"
echo "  JSON Configs:         $JSON_COUNT"
echo "  YAML Configs:         $YAML_COUNT"
echo ""
echo "  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  TOTAL:                $TOTAL_FILES files"
echo ""
echo "  Total Size:           $TOTAL_SIZE"
echo "  Location:             $OUTPUT_DIR/"
echo ""

echo "✅ Deep system scan COMPLETE!"
echo ""
