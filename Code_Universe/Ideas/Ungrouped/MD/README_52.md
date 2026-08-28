# ⚡ THE GUARDIAN

**Real automation. Permanent. Local. Self-healing. Hands-free.**

---

## 🎯 What It Does

**THE GUARDIAN** is a local, permanent, auto-healing system maintenance daemon for macOS.

- **SCAN** - Monitors system health
- **HEAL** - Auto-fixes issues
- **OPTIMIZE** - Tunes performance
- **LOCAL** - All on your machine
- **PERMANENT** - Auto-runs on boot
- **HANDS-FREE** - Fully autonomous

---

## 🔧 Installation

```bash
cd ~/NOIZYLAB/GRF_BIGINSTALL
./install_guardian.sh
```

---

## 🧬 Fusion Mode Logic

**Safe → Balanced → Aggressive → Ultra (when stable)**

1. **SAFE** - Always runs (foundation)
2. **BALANCED** - Always runs (default)
3. **AGGRESSIVE** - Runs when issues detected
4. **ULTRA** - Runs only when system is stable

**Intelligent. Safe. Powerful.**

---

## 📊 Modules

- **safe_scan.sh** - Basic system scan
- **safe_optimize.sh** - Light cleanup
- **balanced_scan.sh** - Disk, RAM, CPU, Network check
- **balanced_fix.sh** - Fix minor issues
- **aggressive_clean.sh** - Deep cache cleaning
- **aggressive_repair.sh** - Rebuild Spotlight, kill stuck processes
- **ultra_boost.sh** - Maximum performance tuning
- **detect_issues.sh** - Issue detection logic
- **system_stable.sh** - Stability checker

---

## 📁 Structure

```
~/Library/SystemGuardian/
├── guardian_core.sh          # Main daemon
├── modules/                    # All modules
│   ├── safe_scan.sh
│   ├── safe_optimize.sh
│   ├── balanced_scan.sh
│   ├── balanced_fix.sh
│   ├── aggressive_clean.sh
│   ├── aggressive_repair.sh
│   ├── ultra_boost.sh
│   ├── detect_issues.sh
│   └── system_stable.sh
└── logs/                      # All logs
```

---

## 📊 Logs

All logs in `~/Library/SystemGuardian/logs/`:
- `guardian.log` - Main daemon log
- `safe.log` - Safe operations
- `balanced.log` - Balanced operations
- `aggressive.log` - Aggressive operations
- `ultra.log` - Ultra operations
- `output.log` - Standard output
- `error.log` - Standard error

---

## 🎮 Commands

```bash
# Check status
launchctl list | grep guardian

# View logs
tail -f ~/Library/SystemGuardian/logs/guardian.log

# Stop
launchctl unload ~/Library/LaunchAgents/com.noizylab.guardian.plist

# Start
launchctl load ~/Library/LaunchAgents/com.noizylab.guardian.plist
```

---

## 🛡️ Safety

- All operations are local
- No cloud dependency
- Comprehensive logging
- Intelligent mode selection
- Safe-first approach
- No destructive operations

---

**Built for Rob Plowman - NOIZYLAB & Fish Music Inc**  
**THE GUARDIAN - Self-Healing System**

*"Real automation. Permanent. Local. Self-healing. Hands-free."*

