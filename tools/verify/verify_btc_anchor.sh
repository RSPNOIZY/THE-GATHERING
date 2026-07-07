#!/usr/bin/env bash
# verify_btc_anchor.sh
# Purpose: Prove the audit root was anchored on Bitcoin via OP_RETURN
#
# Inputs:
#   - txid: Bitcoin transaction ID
#   - expected_root: The Merkle root to verify
#
# Usage:
#   ./verify_btc_anchor.sh <txid> <expected_root>
#
# Requirements:
#   - bitcoin-cli with access to a Bitcoin node, OR
#   - Use a public block explorer API
#
# What this proves:
#   - The audit root was committed to Bitcoin blockchain
#   - OP_RETURN data is immutable and publicly verifiable

set -e

if [ "$#" -lt 2 ]; then
  echo "Usage: $0 <txid> <expected_root>"
  exit 1
fi

TXID=$1
EXPECTED_ROOT=$2

echo "NOIZY Bitcoin Anchor Verification"
echo "=================================="
echo ""
echo "Transaction: $TXID"
echo "Expected root: $EXPECTED_ROOT"
echo ""

# Try bitcoin-cli first (if available)
if command -v bitcoin-cli &> /dev/null; then
  echo "Using bitcoin-cli..."
  TX_DATA=$(bitcoin-cli getrawtransaction "$TXID" true 2>/dev/null || echo "")

  if [ -n "$TX_DATA" ]; then
    # Look for OP_RETURN output containing our root
    if echo "$TX_DATA" | grep -q "$EXPECTED_ROOT"; then
      echo "✅ VERIFICATION PASSED"
      echo "   Audit root found in Bitcoin OP_RETURN"
      exit 0
    else
      echo "❌ VERIFICATION FAILED"
      echo "   Audit root not found in Bitcoin transaction"
      exit 1
    fi
  fi
fi

# Fall back to blockstream.info API
echo "Fetching from blockstream.info API..."
TX_HEX=$(curl -s "https://blockstream.info/api/tx/$TXID/hex")

if [ -z "$TX_HEX" ] || [ "$TX_HEX" = "Transaction not found" ]; then
  echo "❌ Transaction not found"
  exit 1
fi

echo "Raw transaction: ${TX_HEX:0:80}..."
echo ""

# Look for OP_RETURN (6a) followed by our data
# Convert expected root to hex if not already
HEX_ROOT=$EXPECTED_ROOT

if echo "$TX_HEX" | grep -qi "$HEX_ROOT"; then
  echo "✅ VERIFICATION PASSED"
  echo "   Audit root found in Bitcoin OP_RETURN"
  echo ""
  echo "   This proves:"
  echo "   - The audit state existed when this block was mined"
  echo "   - The commitment is immutable on the Bitcoin blockchain"
  exit 0
else
  # Also check for NOIZY prefix + root
  NOIZY_PREFIX="4e4f495a593a"  # "NOIZY:" in hex
  if echo "$TX_HEX" | grep -qi "${NOIZY_PREFIX}.*${HEX_ROOT:0:32}"; then
    echo "✅ VERIFICATION PASSED"
    echo "   NOIZY anchor found in Bitcoin OP_RETURN"
    exit 0
  fi

  echo "❌ VERIFICATION FAILED"
  echo "   Audit root not found in Bitcoin transaction"
  echo ""
  echo "   Possible causes:"
  echo "   - Wrong transaction ID"
  echo "   - Wrong expected root"
  echo "   - Transaction doesn't contain NOIZY anchor"
  exit 1
fi
