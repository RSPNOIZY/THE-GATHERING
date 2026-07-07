#!/bin/zsh

# Stability checker - returns 0 if stable, 1 if not

# Check CPU idle
CPU_IDLE=$(ps -A -o %cpu | awk '{s+=$1} END {print 100-s}')
if [ -z "$CPU_IDLE" ] || [ "$CPU_IDLE" -lt 60 ]; then
  exit 1
fi

# Check memory
MEMORY_FREE=$(memory_pressure 2>/dev/null | grep "System-wide memory free percentage" | awk '{print $5}' | sed 's/%//' || echo "100")
if [ -n "$MEMORY_FREE" ] && [ "$MEMORY_FREE" -lt 20 ]; then
  exit 1
fi

# Check for runaway processes
RUNAWAY=$(ps aux | awk 'NR>1 {if ($3 > 50.0 || $4 > 50.0) print $2}' | wc -l | tr -d ' ')
if [ "$RUNAWAY" -gt 3 ]; then
  exit 1
fi

# System is stable
exit 0

