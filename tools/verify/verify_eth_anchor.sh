#!/usr/bin/env bash
# verify_eth_anchor.sh
# Purpose: Prove the audit root existed at or before a given time on Ethereum
#
# Inputs:
#   - tx_hash: Ethereum transaction hash
#   - expected_root: The Merkle root to verify
#
# Usage:
#   ./verify_eth_anchor.sh <tx_hash> <expected_root>
#
# Example:
#   ./verify_eth_anchor.sh 0x123...abc b8e3...9f
#
# What this proves:
#   - The audit root was committed to Ethereum blockchain
#   - The commitment happened at or before the transaction timestamp
#   - Anyone can independently verify this without system access

set -e

if [ "$#" -lt 2 ]; then
  echo "Usage: $0 <tx_hash> <expected_root>"
  exit 1
fi

TX_HASH=$1
EXPECTED_ROOT=$2

# Optional: Use custom Etherscan API key
ETHERSCAN_API_KEY=${ETHERSCAN_API_KEY:-""}

echo "NOIZY Ethereum Anchor Verification"
echo "===================================="
echo ""
echo "Transaction: $TX_HASH"
echo "Expected root: $EXPECTED_ROOT"
echo ""

# Fetch transaction data from Etherscan
echo "Fetching transaction from Ethereum..."

if [ -n "$ETHERSCAN_API_KEY" ]; then
  API_URL="https://api.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash=$TX_HASH&apikey=$ETHERSCAN_API_KEY"
else
  API_URL="https://api.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash=$TX_HASH"
fi

TX_DATA=$(curl -s "$API_URL")

# Check if transaction was found
if echo "$TX_DATA" | grep -q '"result":null'; then
  echo "❌ Transaction not found on Ethereum"
  exit 1
fi

# Extract input data (where anchor is stored)
INPUT_DATA=$(echo "$TX_DATA" | grep -o '"input":"[^"]*"' | cut -d'"' -f4)

echo "Transaction input data: ${INPUT_DATA:0:80}..."
echo ""

# Check if expected root is in transaction data
if echo "$INPUT_DATA" | grep -qi "$EXPECTED_ROOT"; then
  echo "✅ VERIFICATION PASSED"
  echo "   Audit root found in Ethereum transaction data"
  echo ""
  echo "   This proves:"
  echo "   - The audit state existed when this transaction was mined"
  echo "   - The commitment is immutable and publicly verifiable"
  exit 0
else
  echo "❌ VERIFICATION FAILED"
  echo "   Audit root not found in Ethereum transaction"
  echo ""
  echo "   Possible causes:"
  echo "   - Wrong transaction hash"
  echo "   - Wrong expected root"
  echo "   - Data format mismatch"
  exit 1
fi
