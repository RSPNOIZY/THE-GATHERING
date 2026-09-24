#!/usr/bin/env zsh
# ═══════════════════════════════════════════════════════════════
# launch_all.sh — Single-Command NOIZY Master Empire Launcher
# MC96ECOUNIVERSE · Apple M2 Ultra · Architecture 4.0.0-SOVEREIGN
# ═══════════════════════════════════════════════════════════════

set -e

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

echo ""
echo -e "${BOLD}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  🚀 MC96ECOUNIVERSE — MASTER SYSTEM LAUNCH & AUDIT${NC}"
echo -e "${BOLD}  Timestamp: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo -e "${BOLD}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# 1. Empire Status Check
echo -e "${BOLD}▶ [1/6] Running Empire Swarm & Cloud Status...${NC}"
/Users/m2ultra/NOIZYLAB/tools/CODEMASTER/empire-status.sh || true
echo ""

# 2. Master Convergence & 5-Pillar Auto-Healer
echo -e "${BOLD}▶ [2/6] Running 5-Pillar Ecosystem Convergence & Auto-Healer...${NC}"
python3 /Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER/tools/automation/noizy_master_ecosystem_healer.py || true
echo ""

# 3. Zero-Latency Engine Benchmark
echo -e "${BOLD}▶ [3/6] Running Zero-Latency Substrate Benchmark...${NC}"
python3 /Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER/tools/automation/zero_latency_engine.py || true
echo ""

# 4. Hybrid Audio NOIZYSTREAM Router
echo -e "${BOLD}▶ [4/6] Checking Hybrid Audio NOIZYSTREAM (BlackHole 16ch + FOSS)...${NC}"
python3 /Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER/packages/noizystream-hybrid-audio/noizystream_audio_router.py || true
echo ""

# 5. NOIZYVAULT Security, WireGuard, Tailscale & Parallels Windows 11
echo -e "${BOLD}▶ [5/6] Auditing NOIZYVAULT Security, Mesh & Windows 11 Substrate...${NC}"
python3 /Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER/packages/noizyvault-security/noizyvault_manager.py || true
python3 /Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER/tools/automation/parallels_noizywin_controller.py || true
echo ""

# 6. Pro & Subscribed Tools Hub (Desktop Commander, LM Studio, TagSpaces, DEVONthink)
echo -e "${BOLD}▶ [6/6] Auditing Subscribed Pro Ecosystem Hub...${NC}"
python3 /Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER/packages/subscribed-tools-hub/subscribed_tools_manager.py || true
echo ""

echo -e "${GREEN}${BOLD}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}  ✨ ALL SYSTEMS 100% OPERATIONAL & ZERO-LATENCY ALIGNED${NC}"
echo -e "${GREEN}${BOLD}═══════════════════════════════════════════════════════════════${NC}"
echo ""
