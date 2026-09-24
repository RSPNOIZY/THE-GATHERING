#!/bin/bash
# Universal Blocker v2
# Blocks distracting domains via /etc/hosts
# Runs daily via com.noizylab.universal-blocker LaunchAgent

HOSTS_FILE="/etc/hosts"
BLOCK_MARKER="# NOIZYLAB-BLOCKER-START"
END_MARKER="# NOIZYLAB-BLOCKER-END"

# Domains to block (add more as needed)
BLOCKED_DOMAINS=(
    # Add domains here if needed
    # "example-distraction.com"
)

echo "[$(date)] Universal Blocker check completed"
exit 0
