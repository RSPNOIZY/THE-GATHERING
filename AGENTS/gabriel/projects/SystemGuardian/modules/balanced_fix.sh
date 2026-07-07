#!/bin/zsh
echo "BALANCED: Fixing minor issues..."

# Flush DNS
dscacheutil -flushcache
killall -HUP mDNSResponder 2>/dev/null || true

# Clear user caches (smart - only old)
find ~/Library/Caches -type f -atime +7 -delete 2>/dev/null || true

# Rebuild Launch Services
/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -kill -r -domain local -domain system -domain user 2>/dev/null || true

exit 0

