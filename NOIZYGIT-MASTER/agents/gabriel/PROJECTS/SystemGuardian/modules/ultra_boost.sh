#!/bin/zsh
echo "ULTRA: Maximum performance tuning..."

# Memory optimization
purge 2>/dev/null || true

# System optimization
sudo sysctl -w vm.compressor=2 2>/dev/null || true

# DNS refresh
dscacheutil -flushcache
killall -HUP mDNSResponder 2>/dev/null || true

# Vacuum SQLite databases
find ~/Library -name "*.db" -o -name "*.sqlite" -o -name "*.sqlite3" | while read db; do
  if command -v sqlite3 >/dev/null 2>&1; then
    sqlite3 "$db" "VACUUM;" 2>/dev/null || true
  fi
done

exit 0

