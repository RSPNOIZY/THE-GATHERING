#!/bin/zsh

# Issue detector - returns 0 if issues found, 1 if clean

ISSUES=0

# Check disk usage
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 85 ]; then
  ISSUES=1
fi

# Check memory pressure
MEMORY_PRESSURE=$(memory_pressure 2>/dev/null | grep "System-wide memory free percentage" | awk '{print $5}' | sed 's/%//' || echo "100")
if [ -n "$MEMORY_PRESSURE" ] && [ "$MEMORY_PRESSURE" -lt 10 ]; then
  ISSUES=1
fi

# Check for network issues
if ! ping -c 1 -W 2 8.8.8.8 >/dev/null 2>&1; then
  ISSUES=1
fi

# Exit 0 if issues found (triggers aggressive mode)
# Exit 1 if clean (skips aggressive mode)
exit $ISSUES

