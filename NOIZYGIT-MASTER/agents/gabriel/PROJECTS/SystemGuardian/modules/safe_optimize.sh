#!/bin/zsh
echo "SAFE: Light cleanup (caches, temp files)..."

# Memory purge
/usr/bin/purge 2>/dev/null || true

# Clear old temp files (7+ days)
find /tmp -type f -mtime +7 -delete 2>/dev/null || true
find ~/tmp -type f -mtime +7 -delete 2>/dev/null || true

exit 0

