#!/bin/bash
# Safe deletion of empty folders in user directories
# Created: March 21, 2026

set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "=== Empty Folder Cleanup ==="
echo ""

# Define safe directories to clean
SAFE_DIRS=(
    "/Users/m2ultra/Desktop"
    "/Users/m2ultra/Documents"
    "/Users/m2ultra/Downloads"
    "/Users/m2ultra/NOIZYLAB"
    "/Users/m2ultra/NOIZYANTHROPIC"
    "/Users/m2ultra/noizy"
    "/Users/m2ultra/Music"
)

# Count empty folders first
total=0
for dir in "${SAFE_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        count=$(find "$dir" -type d -empty -not -path "*/.*" 2>/dev/null | wc -l | tr -d ' ')
        echo -e "${YELLOW}$dir${NC}: $count empty folders"
        total=$((total + count))
    fi
done

echo ""
echo -e "Total empty folders in safe directories: ${YELLOW}$total${NC}"
echo ""

# Dry run mode by default
if [ "${1:-dry}" = "dry" ]; then
    echo -e "${YELLOW}DRY RUN MODE${NC} - Showing what would be deleted:"
    echo ""
    
    for dir in "${SAFE_DIRS[@]}"; do
        if [ -d "$dir" ]; then
            find "$dir" -type d -empty -not -path "*/.*" 2>/dev/null | head -20
        fi
    done
    
    echo ""
    echo "To actually delete these folders, run:"
    echo -e "${GREEN}bash delete_empty_folders.sh delete${NC}"
    
elif [ "$1" = "delete" ]; then
    echo -e "${RED}DELETING EMPTY FOLDERS${NC}"
    echo ""
    
    deleted=0
    for dir in "${SAFE_DIRS[@]}"; do
        if [ -d "$dir" ]; then
            # Delete empty folders bottom-up
            while IFS= read -r empty_dir; do
                if rmdir "$empty_dir" 2>/dev/null; then
                    echo -e "${GREEN}✓${NC} Deleted: $empty_dir"
                    deleted=$((deleted + 1))
                fi
            done < <(find "$dir" -type d -empty -not -path "*/.*" 2>/dev/null | sort -r)
        fi
    done
    
    echo ""
    echo -e "${GREEN}Successfully deleted $deleted empty folders${NC}"
    
else
    echo "Usage: bash delete_empty_folders.sh [dry|delete]"
    echo "  dry    - Show what would be deleted (default)"
    echo "  delete - Actually delete empty folders"
fi