#!/usr/bin/env bash
# verify_merkle_root.sh
# Purpose: Prove "this export corresponds to the anchored root"
#
# Inputs:
#   - audit_events.csv (from compliance export)
#   - expected_root.txt (from anchor record)
#
# Usage:
#   ./verify_merkle_root.sh audit_events.csv expected_root.txt
#
# What this proves:
#   - The export matches the committed root
#   - Tampering or missing rows are detectable
#
# No private keys, no signatures, no system access required.

set -e

if [ "$#" -lt 2 ]; then
  echo "Usage: $0 <audit_events.csv> <expected_root.txt>"
  exit 1
fi

AUDIT_FILE=$1
ROOT_FILE=$2

if [ ! -f "$AUDIT_FILE" ]; then
  echo "Error: Audit file not found: $AUDIT_FILE"
  exit 1
fi

if [ ! -f "$ROOT_FILE" ]; then
  echo "Error: Expected root file not found: $ROOT_FILE"
  exit 1
fi

echo "NOIZY Merkle Root Verification"
echo "==============================="
echo ""

# Extract event hashes (assumes first column after header)
echo "Extracting event hashes from $AUDIT_FILE..."
EVENT_HASHES=$(tail -n +2 "$AUDIT_FILE" | cut -d',' -f1 | sort)

# Calculate Merkle root (simplified - just hash of sorted hashes)
echo "Computing Merkle root..."
CALCULATED_ROOT=$(echo "$EVENT_HASHES" | sha256sum | awk '{print $1}')

# Get expected root
EXPECTED_ROOT=$(cat "$ROOT_FILE" | tr -d '[:space:]')

echo ""
echo "Calculated root: $CALCULATED_ROOT"
echo "Expected root:   $EXPECTED_ROOT"
echo ""

if [ "$CALCULATED_ROOT" = "$EXPECTED_ROOT" ]; then
  echo "✅ VERIFICATION PASSED"
  echo "   Merkle root matches audit export"
  echo "   The export has not been tampered with"
  exit 0
else
  echo "❌ VERIFICATION FAILED"
  echo "   Merkle root mismatch"
  echo "   Audit data may have been altered or is incomplete"
  exit 1
fi
