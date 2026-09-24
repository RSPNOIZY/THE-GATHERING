#!/bin/zsh
echo "BALANCED: Disk, RAM, CPU, Network check..."

# Disk usage
df -h | grep -E "^/dev/" | awk '{print $1, $5, $9}'

# Memory pressure
memory_pressure 2>/dev/null | grep "System-wide memory free percentage" || true

# CPU check
top -l 1 | grep "CPU usage" || true

# Network check
ping -c 1 -W 2 8.8.8.8 >/dev/null 2>&1 && echo "Network: OK" || echo "Network: Issue"

exit 0

