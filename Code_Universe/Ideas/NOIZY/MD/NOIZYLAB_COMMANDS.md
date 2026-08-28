#!/bin/bash
# 🌍 NOIZYLAB Global Operations - Command Reference
# Quick lookup for all commands

cat << 'EOF'

╔════════════════════════════════════════════════════════╗
║     🌍 NOIZYLAB Global Operations - Commands          ║
║     Run Your Entire ECOUniverse from Google Drive     ║
╚════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════
SETUP (One-Time)
═══════════════════════════════════════════════════════════

# 1. Run the setup script
chmod +x ~/SETUP_NOIZYLAB_GLOBAL.sh
~/SETUP_NOIZYLAB_GLOBAL.sh

# 2. Configure Google Drive (if not already)
rclone config create gdrive drive

# 3. Upload your existing code
rclone sync ~/myFamily.ai/ gdrive:NOIZYLAB_MASTER/OPS/CORE/ --progress


═══════════════════════════════════════════════════════════
MOUNT (Do This Each Time)
═══════════════════════════════════════════════════════════

# Mount Google Drive locally
~/.noizylab-mount.sh

# Verify mount is active
mountpoint ~/NOIZYLAB_OPS

# List files (should show CORE/, EXTENSIONS/, etc.)
ls -la ~/NOIZYLAB_OPS/


═══════════════════════════════════════════════════════════
LAUNCH (Start Your Ecosystem)
═══════════════════════════════════════════════════════════

# Start NOIZYLAB from Google Drive
~/NOIZYLAB_LAUNCH.sh

# Should output:
# ✓ Google Drive mounted
# ✓ Structure verified
# ✓ Dependencies ready
# ✓ Environment configured
# 🚀 Starting OCO Server...
# ✨ Ready for iPad connection on ws://localhost:3001


═══════════════════════════════════════════════════════════
STATUS & MONITORING
═══════════════════════════════════════════════════════════

# Check global status (all machines)
curl http://localhost:3001/api/global-status

# Get streaming status
curl http://localhost:3001/api/streaming-status

# View current sessions
curl http://localhost:3001/api/sessions

# View specific session
curl http://localhost:3001/api/session/SESSION_ID

# Check server logs (while running)
# Look at terminal where NOIZYLAB_LAUNCH.sh is running

# Check system logs
tail -f /var/log/noizylab-ecosystem.log
tail -f /var/log/noizylab-ecosystem-error.log


═══════════════════════════════════════════════════════════
FILE OPERATIONS
═══════════════════════════════════════════════════════════

# Edit code (automatically syncs to GD)
vim ~/NOIZYLAB_OPS/CORE/organicCreativeOrganism.js

# View all sessions saved to GD
ls ~/NOIZYLAB_OPS/SESSIONS/

# View config (global settings)
cat ~/NOIZYLAB_OPS/CONFIG/global-settings.json

# Edit config (changes propagate to all machines in 30s)
vim ~/NOIZYLAB_OPS/CONFIG/global-settings.json

# View machine profile
cat ~/NOIZYLAB_OPS/CONFIG/machine-profiles/$(hostname -s).json

# View version history (full audit trail)
cat ~/NOIZYLAB_OPS/SYNC/version-history.json

# View sync status
cat ~/NOIZYLAB_OPS/SYNC/last-sync.json


═══════════════════════════════════════════════════════════
SYNC OPERATIONS
═══════════════════════════════════════════════════════════

# Manual sync (if needed)
rclone sync gdrive:NOIZYLAB_MASTER/OPS ~/NOIZYLAB_OPS --progress

# Force upload to Google Drive
rclone sync ~/NOIZYLAB_OPS gdrive:NOIZYLAB_MASTER/OPS --progress

# Check what would sync (dry run)
rclone sync ~/NOIZYLAB_OPS gdrive:NOIZYLAB_MASTER/OPS --dry-run

# View sync conflicts
cat ~/NOIZYLAB_OPS/SYNC/conflict-log.json


═══════════════════════════════════════════════════════════
AUTO-START (Enable Startup)
═══════════════════════════════════════════════════════════

# Load auto-start service
launchctl load ~/Library/LaunchAgents/com.noizylab.ecosystem.plist

# Verify it's loaded
launchctl list | grep noizylab

# Disable auto-start
launchctl unload ~/Library/LaunchAgents/com.noizylab.ecosystem.plist

# View startup logs
log stream --predicate 'eventMessage contains[cd] "noizylab"'


═══════════════════════════════════════════════════════════
MULTI-DEVICE WORKFLOW
═══════════════════════════════════════════════════════════

# On Mac Studio:
~/.noizylab-mount.sh
~/NOIZYLAB_LAUNCH.sh
# → Server running on :3001
# → iPad connects

# On MacBook (later):
~/.noizylab-mount.sh
~/NOIZYLAB_LAUNCH.sh
# → Same code, same sessions, same state
# → iPad reconnects to macbook-ip:3001

# On Cloud Server:
~/.noizylab-mount.sh
PORT=443 ~/NOIZYLAB_LAUNCH.sh
# → Serves globally
# → Backup if local offline


═══════════════════════════════════════════════════════════
BACKUP & RESTORE
═══════════════════════════════════════════════════════════

# Create manual backup
tar -czf ~/NOIZYLAB_BACKUP_$(date +%Y%m%d).tar.gz ~/NOIZYLAB_OPS/
rclone copy ~/NOIZYLAB_BACKUP_*.tar.gz gdrive:NOIZYLAB_MASTER/BACKUPS/

# List backups on Google Drive
rclone ls gdrive:NOIZYLAB_MASTER/BACKUPS/

# Restore from backup
tar -xzf ~/NOIZYLAB_BACKUP_2025-11-06.tar.gz -C ~/


═══════════════════════════════════════════════════════════
TROUBLESHOOTING
═══════════════════════════════════════════════════════════

# Check if mount is active
mountpoint ~/NOIZYLAB_OPS
# Output: "/Users/rsp_ms/NOIZYLAB_OPS is a mount point"

# If not mounted, mount it:
~/.noizylab-mount.sh

# Check rclone configuration
rclone config show gdrive

# Test Google Drive connection
rclone ls gdrive:NOIZYLAB_MASTER/OPS

# Check process is running
ps aux | grep "node family_ai_server"

# Check port 3001 is listening
lsof -i :3001

# Kill and restart if needed
pkill -f "node family_ai_server"
~/NOIZYLAB_LAUNCH.sh

# View mount logs
cat ~/.noizylab-mount.log

# Check disk space
df -h ~/NOIZYLAB_OPS


═══════════════════════════════════════════════════════════
CONFIGURATION
═══════════════════════════════════════════════════════════

# Check global settings
cat ~/NOIZYLAB_OPS/CONFIG/global-settings.json

# Enable feature
# Edit: ~/NOIZYLAB_OPS/CONFIG/feature-flags.json
# Change: "feature_name": true
# Save & wait 30s for all machines to update

# Adjust sync interval
# Edit: ~/NOIZYLAB_OPS/CONFIG/machine-profiles/[hostname].json
# Change: "sync_interval_seconds": 300

# View all machine profiles
ls ~/NOIZYLAB_OPS/CONFIG/machine-profiles/


═══════════════════════════════════════════════════════════
CLEANUP & MAINTENANCE
═══════════════════════════════════════════════════════════

# Clear local rclone cache
rm -rf /tmp/rclone-cache/*

# Remove old logs (keeping 30 days)
find ~/NOIZYLAB_OPS/LOGS -name "*.log" -mtime +30 -delete

# Archive old sessions
rclone move ~/NOIZYLAB_OPS/SESSIONS gdrive:NOIZYLAB_MASTER/ARCHIVE/sessions

# Check disk usage
du -sh ~/NOIZYLAB_OPS
du -sh ~/NOIZYLAB_OPS/SESSIONS
du -sh ~/NOIZYLAB_OPS/LOGS


═══════════════════════════════════════════════════════════
PERFORMANCE TUNING
═══════════════════════════════════════════════════════════

# Increase cache performance
# Edit: ~/.noizylab-mount.sh
# Change: --vfs-cache-max-age to 2h

# Increase sync frequency
# Edit: machine profile
# Change: "sync_interval_seconds": 60 (or lower)

# Monitor sync performance
tail -f ~/.noizylab-mount.log

# Monitor network usage during sync
# Terminal 2: network monitor
# Terminal 1: rclone sync


═══════════════════════════════════════════════════════════
DOCUMENTATION
═══════════════════════════════════════════════════════════

# Read full implementation guide
cat ~/NOIZYLAB_GLOBAL_IMPLEMENTATION.md

# Read architecture design
cat ~/NOIZYLAB_GLOBAL_OPS_ARCHITECTURE.md

# Read quick start
cat ~/NOIZYLAB_QUICK_START.md

# Read visual guide
cat ~/NOIZYLAB_VISUAL_GUIDE.md

# Read complete solution
cat ~/NOIZYLAB_COMPLETE_SOLUTION.md


═══════════════════════════════════════════════════════════
QUICK REFERENCE
═══════════════════════════════════════════════════════════

Setup:        chmod +x SETUP_NOIZYLAB_GLOBAL.sh && ./SETUP_NOIZYLAB_GLOBAL.sh
Mount:        ~/.noizylab-mount.sh
Start:        ~/NOIZYLAB_LAUNCH.sh
Status:       curl http://localhost:3001/api/global-status
Sessions:     ls ~/NOIZYLAB_OPS/SESSIONS/
Logs:         tail -f /var/log/noizylab-ecosystem.log
Config:       vim ~/NOIZYLAB_OPS/CONFIG/global-settings.json


═══════════════════════════════════════════════════════════
COMMON WORKFLOWS
═══════════════════════════════════════════════════════════

MORNING - Start Ecosystem:
  ~/.noizylab-mount.sh
  ~/NOIZYLAB_LAUNCH.sh
  # Ready on :3001

CREATE SESSION:
  # iPad: tap "New Session"
  # Automatically saves to ~/NOIZYLAB_OPS/SESSIONS/
  # Auto-syncs to Google Drive

EDIT CODE:
  vim ~/NOIZYLAB_OPS/CORE/organicCreativeOrganism.js
  :w
  # Auto-syncs to Google Drive
  # MacBook sees change in 30s

SWITCH MACHINE:
  # On new machine:
  ~/.noizylab-mount.sh
  ~/NOIZYLAB_LAUNCH.sh
  # Loads exact same state as previous machine

VIEW STATUS:
  curl http://localhost:3001/api/global-status
  # See all machines and sessions


═══════════════════════════════════════════════════════════
SUPPORT
═══════════════════════════════════════════════════════════

If something doesn't work:

1. Check mount:
   mountpoint ~/NOIZYLAB_OPS

2. Remount if needed:
   ~/.noizylab-mount.sh

3. Check logs:
   tail -f ~/.noizylab-mount.log
   tail -f /var/log/noizylab-ecosystem.log

4. Restart:
   pkill -f "node family_ai_server"
   ~/NOIZYLAB_LAUNCH.sh

5. Read documentation:
   cat NOIZYLAB_GLOBAL_IMPLEMENTATION.md


═══════════════════════════════════════════════════════════

🌍 NOIZYLAB Global Operations
Run Your Entire ECOUniverse from Google Drive

Status:   ✅ Ready
Control:  🎛️  Yours
Simplicity: ✨ Maximum

═══════════════════════════════════════════════════════════

EOF
