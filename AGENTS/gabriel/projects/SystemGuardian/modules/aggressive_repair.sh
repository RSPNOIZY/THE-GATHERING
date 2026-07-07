#!/bin/zsh
echo "AGGRESSIVE: Rebuilding Spotlight..."

# Rebuild Spotlight
sudo mdutil -E / 2>/dev/null || true

# Rebuild Launch Services
/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -kill -r -domain local -domain system -domain user 2>/dev/null || true

# Kill stuck processes (non-critical)
ps aux | awk 'NR>1 {if ($3 > 80.0 || $4 > 80.0) print $2}' | while read pid; do
  PROC_NAME=$(ps -p "$pid" -o comm= 2>/dev/null)
  if [ -n "$PROC_NAME" ] && [[ ! "$PROC_NAME" =~ ^(kernel_task|WindowServer|launchd)$ ]]; then
    kill -TERM "$pid" 2>/dev/null || true
  fi
done

exit 0

