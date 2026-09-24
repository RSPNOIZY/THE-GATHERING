#!/usr/bin/env zsh
# 🔥 PERFORMANCE TUNER — All optimizations in one shot
# macOS + Network + Storage + System
set -uo pipefail

ts=$(date +%Y%m%d-%H%M%S)
logdir="$HOME/noizylab-tuning-logs"
mkdir -p "$logdir"
logfile="$logdir/tune-$ts.log"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log() { echo -e "${CYAN}[$(date +%H:%M:%S)]${NC} $1" | tee -a "$logfile"; }
ok() { echo -e "${GREEN}[✓]${NC} $1" | tee -a "$logfile"; }
warn() { echo -e "${YELLOW}[!]${NC} $1" | tee -a "$logfile"; }

echo -e "${GREEN}"
cat << 'EOF'
╔═══════════════════════════════════════════════════════════════╗
║   🔥 NOIZYLAB PERFORMANCE TUNER                               ║
║   Maximum Optimization — All Systems                          ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

log "=== PERFORMANCE TUNING STARTED — $ts ==="

# ═══════════════════════════════════════════════════════════════
# 1. NETWORK OPTIMIZATIONS
# ═══════════════════════════════════════════════════════════════
log "SECTION 1: Network Optimizations"

# Set MTU to 9000 on all interfaces
log "Setting MTU 9000 on Ethernet..."
sudo networksetup -setMTU Ethernet 9000 2>&1 | tee -a "$logfile" && ok "Ethernet MTU = 9000" || warn "Failed to set Ethernet MTU"

log "Setting MTU 9000 on Thunderbolt Bridge..."
sudo networksetup -setMTU 'Thunderbolt Bridge' 9000 2>&1 | tee -a "$logfile" && ok "Thunderbolt Bridge MTU = 9000" || warn "Failed to set TB MTU"

# Flush DNS
log "Flushing DNS caches..."
sudo dscacheutil -flushcache 2>&1 | tee -a "$logfile"
sudo killall -HUP mDNSResponder 2>&1 | tee -a "$logfile"
ok "DNS caches flushed"

# Optimize network buffers
log "Optimizing network buffers..."
sudo sysctl -w net.inet.tcp.sendspace=262144 2>&1 | tee -a "$logfile" || true
sudo sysctl -w net.inet.tcp.recvspace=262144 2>&1 | tee -a "$logfile" || true
sudo sysctl -w net.inet.tcp.autorcvbufmax=33554432 2>&1 | tee -a "$logfile" || true
sudo sysctl -w net.inet.tcp.autosndbufmax=33554432 2>&1 | tee -a "$logfile" || true
ok "Network buffers optimized"

# ═══════════════════════════════════════════════════════════════
# 2. STORAGE OPTIMIZATIONS
# ═══════════════════════════════════════════════════════════════
log "SECTION 2: Storage Optimizations"

# Disable Spotlight on external volumes
log "Disabling Spotlight on external volumes..."
for v in /Volumes/*; do
  if [[ "$v" != "/Volumes/Macintosh HD"* ]]; then
    sudo mdutil -i off "$v" 2>&1 | tee -a "$logfile" || true
    ok "Spotlight disabled: $v"
  fi
done

# Enable TRIM (if SSD)
log "Checking TRIM status..."
if system_profiler SPStorageDataType 2>/dev/null | grep -q "TRIM Support: Yes"; then
  ok "TRIM enabled"
else
  warn "TRIM may not be supported on this storage"
fi

# ═══════════════════════════════════════════════════════════════
# 3. SYSTEM OPTIMIZATIONS
# ═══════════════════════════════════════════════════════════════
log "SECTION 3: System Optimizations"

# Disable App Nap for performance
log "Disabling App Nap..."
defaults write NSGlobalDomain NSAppSleepDisabled -bool YES 2>&1 | tee -a "$logfile"
ok "App Nap disabled"

# Disable automatic termination
defaults write NSGlobalDomain NSDisableAutomaticTermination -bool YES 2>&1 | tee -a "$logfile"
ok "Automatic termination disabled"

# Reduce motion for snappier UI
defaults write com.apple.universalaccess reduceMotion -bool true 2>&1 | tee -a "$logfile"
ok "Reduce motion enabled"

# Show all file extensions
defaults write NSGlobalDomain AppleShowAllExtensions -bool true 2>&1 | tee -a "$logfile"
ok "File extensions visible"

# Disable disk sleep
sudo pmset -a disksleep 0 2>&1 | tee -a "$logfile"
ok "Disk sleep disabled"

# ═══════════════════════════════════════════════════════════════
# 4. MEMORY OPTIMIZATIONS
# ═══════════════════════════════════════════════════════════════
log "SECTION 4: Memory Optimizations"

# Purge inactive memory
log "Purging inactive memory..."
sudo purge 2>&1 | tee -a "$logfile"
ok "Memory purged"

# ═══════════════════════════════════════════════════════════════
# 5. DEVELOPER OPTIMIZATIONS
# ═══════════════════════════════════════════════════════════════
log "SECTION 5: Developer Optimizations"

# Clear derived data
if [[ -d ~/Library/Developer/Xcode/DerivedData ]]; then
  log "Clearing Xcode derived data..."
  rm -rf ~/Library/Developer/Xcode/DerivedData/* 2>&1 | tee -a "$logfile"
  ok "Xcode derived data cleared"
fi

# Clear npm cache
if command -v npm >/dev/null 2>&1; then
  log "Cleaning npm cache..."
  npm cache clean --force 2>&1 | tee -a "$logfile"
  ok "npm cache cleaned"
fi

# Clear Homebrew cache
if command -v brew >/dev/null 2>&1; then
  log "Cleaning Homebrew cache..."
  brew cleanup 2>&1 | tee -a "$logfile"
  ok "Homebrew cache cleaned"
fi

# ═══════════════════════════════════════════════════════════════
# 6. VERIFICATION
# ═══════════════════════════════════════════════════════════════
log "SECTION 6: Verification"

log "Current MTU settings:"
networksetup -getMTU Ethernet 2>&1 | tee -a "$logfile"
networksetup -getMTU 'Thunderbolt Bridge' 2>&1 | tee -a "$logfile"
ifconfig en0 2>&1 | grep mtu | tee -a "$logfile"

log "System memory:"
vm_stat 2>&1 | head -5 | tee -a "$logfile"

log "Disk usage:"
df -h / 2>&1 | tee -a "$logfile"

# ═══════════════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════════════
echo -e "${GREEN}"
cat << 'EOF'
╔═══════════════════════════════════════════════════════════════╗
║   ✅ PERFORMANCE TUNING COMPLETE                              ║
║                                                               ║
║   Optimized:                                                  ║
║   • Network: MTU 9000, buffers, DNS                          ║
║   • Storage: Spotlight disabled, TRIM checked                ║
║   • System: App Nap off, no disk sleep, reduced motion       ║
║   • Memory: Purged inactive                                  ║
║   • Developer: Caches cleaned                                ║
║                                                               ║
║   Recommended: Restart for full effect                       ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

log "Logs saved to: $logfile"
log "=== PERFORMANCE TUNING COMPLETED ==="
