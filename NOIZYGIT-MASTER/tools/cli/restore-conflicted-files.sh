#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# NOIZY.AI — CONFLICTED FILE RESTORATION
# Safely renames duplicate files with " 2" or " (2)" suffix
# Author: Antigravity AI
# Date: 2026-06-01
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

DRY_RUN=true
if [[ "${1:-}" == "--apply" ]]; then
    DRY_RUN=false
fi

echo -e "═══════════════════════════════════════════════════════════"
echo -e "  ${BOLD}NOIZY.AI — CONFLICTED FILE RESTORATION${NC}"
echo -e "═══════════════════════════════════════════════════════════"
if [ "$DRY_RUN" = true ]; then
    echo -e "  ${YELLOW}Mode: DRY-RUN (No changes will be written).${NC}"
    echo -e "  To apply changes, run: ${BOLD}bash scripts/restore-conflicted-files.sh --apply${NC}"
else
    echo -e "  ${RED}Mode: APPLY (Renaming files live).${NC}"
fi
echo -e "═══════════════════════════════════════════════════════════\n"

RENAMED_COUNT=0
SKIPPED_COUNT=0
ERROR_COUNT=0

# Standardized list of targeted directories to scan (avoiding deep archives or external volumes)
TARGETS=(
    ".git"
    "landing"
    "heaven"
    "integration-plane"
    "RSP-NOIZY"
    "noizy-mcp-remote"
    "apps"
    "10_INFRASTRUCTURE"
    "_TOSORTOUT/HEAVEN_DEPLOY"
)

for dir in "${TARGETS[@]}"; do
    if [ ! -d "$dir" ]; then
        continue
    fi
    
    echo -e "${CYAN}Scanning directory: $dir...${NC}"
    
    # Find files containing " 2" in their base name
    # We use -print0 to handle spaces safely
    while IFS= read -r -d '' file; do
        # Extract directory and base name
        dirpart=$(dirname "$file")
        basepart=$(basename "$file")
        
        # Replace the " 2" pattern in the base name
        # Examples:
        # "package 2.json" -> "package.json"
        # "HEAD 2" -> "HEAD"
        # "postcss 2.config.js" -> "postcss.config.js"
        # "variables 2.tf" -> "variables.tf"
        new_basepart=$(echo "$basepart" | sed -E 's/ 2(\.[a-zA-Z0-9]+)$/\1/; s/ 2$//')
        new_file="$dirpart/$new_basepart"
        
        if [ "$file" = "$new_file" ]; then
            # Sed didn't modify it (e.g. " 2" is in the middle of a word not fitting the pattern)
            continue
        fi
        
        if [ -f "$new_file" ]; then
            echo -e "  ${YELLOW}⏭️  SKIP${NC} — Target file already exists: $new_basepart (Source: $basepart)"
            SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
        else
            if [ "$DRY_RUN" = true ]; then
                echo -e "  ${CYAN}📋 PLAN${NC} — Rename '$basepart' -> '$new_basepart'"
                RENAMED_COUNT=$((RENAMED_COUNT + 1))
            else
                if mv "$file" "$new_file"; then
                    echo -e "  ${GREEN}✅ RENAMED${NC} — '$basepart' -> '$new_basepart'"
                    RENAMED_COUNT=$((RENAMED_COUNT + 1))
                else
                    echo -e "  ${RED}❌ FAILED${NC} — Could not rename '$basepart'"
                    ERROR_COUNT=$((ERROR_COUNT + 1))
                fi
            fi
        fi
    done < <(find "$dir" -maxdepth 4 -type f -name "* 2*" -print0)
done

echo -e "\n═══════════════════════════════════════════════════════════"
if [ "$DRY_RUN" = true ]; then
    echo -e "  ${BOLD}DRY-RUN SUMMARY:${NC}"
    echo -e "  Files planned to rename: ${CYAN}$RENAMED_COUNT${NC}"
    echo -e "  Files skipped (dest exists): ${YELLOW}$SKIPPED_COUNT${NC}"
    echo -e "  To execute these renames, run:"
    echo -e "  ${BOLD}bash scripts/restore-conflicted-files.sh --apply${NC}"
else
    echo -e "  ${BOLD}RESTORATION COMPLETE SUMMARY:${NC}"
    echo -e "  Files successfully renamed: ${GREEN}$RENAMED_COUNT${NC}"
    echo -e "  Files skipped: ${YELLOW}$SKIPPED_COUNT${NC}"
    echo -e "  Errors: ${RED}$ERROR_COUNT${NC}"
fi
echo -e "═══════════════════════════════════════════════════════════\n"

if [ "$DRY_RUN" = false ] && [ $ERROR_COUNT -eq 0 ]; then
    echo -e "${GREEN}${BOLD}🎙️  SYSTEM RESTORED — GORUNFREE.${NC}\n"
fi
