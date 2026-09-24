#!/bin/zsh
echo "SAFE: Basic system scan running..."

# Basic health checks
df -h | head -2
memory_pressure 2>/dev/null | head -1 || true

exit 0

