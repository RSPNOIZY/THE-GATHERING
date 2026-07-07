#!/bin/zsh
echo "AGGRESSIVE: Deep cleaning caches..."

# Deep cache clean
rm -rf ~/Library/Caches/* 2>/dev/null || true

# Clear system logs (old)
find ~/Library/Logs -name "*.log.*" -mtime +7 -delete 2>/dev/null || true

# Clear temp files
rm -rf /tmp/* 2>/dev/null || true
rm -rf ~/tmp/* 2>/dev/null || true

exit 0

