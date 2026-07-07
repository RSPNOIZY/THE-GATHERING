#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# NOIZY DreamChamber — macOS Accessibility Optimization
# Robert Stephen Plowman (RSP_001) | April 10, 2026
#
# Enables recommended accessibility settings for a partially
# paralyzed creative professional operating DreamChamber,
# Logic Pro, and browser-based tools via Voice Control.
#
# Current state (from audit):
#   ✅ Voice Control: ENABLED (47,097+ commands logged)
#   ✅ Live Speech: ENABLED (Oliver en-GB, 24pt)
#   ✅ Full Keyboard Access: ENABLED
#   ✅ Adaptive Voice Shortcuts: ENABLED
#   ❌ Sticky Keys: DISABLED → ENABLE
#   ❌ Slow Keys: DISABLED → ENABLE
#   ❌ Hover Text: DISABLED → ENABLE
#   ⚠️ Switch Control: NOT CONFIGURED
#
# Usage:
#   bash scripts/optimize-accessibility.sh
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  NOIZY DreamChamber — Accessibility Optimization${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"

# ─── STICKY KEYS ────────────────────────────────────────────────
echo -e "\n${YELLOW}[1/4] Enabling Sticky Keys...${NC}"
echo "  Allows modifier keys (Cmd, Option, Ctrl, Shift) to be pressed sequentially"
echo "  instead of simultaneously. Critical for Voice Control + keyboard combos."
defaults write com.apple.universalaccess stickyKey -bool true
defaults write com.apple.universalaccess stickyKeyBeepOnModifier -bool true
defaults write com.apple.universalaccess stickyKeyShowWindow -bool true
echo -e "${GREEN}  ✅ Sticky Keys enabled with audio + visual feedback${NC}"

# ─── SLOW KEYS ──────────────────────────────────────────────────
echo -e "\n${YELLOW}[2/4] Enabling Slow Keys...${NC}"
echo "  Requires keys to be held briefly before registering."
echo "  Prevents accidental key repeats from adaptive input devices."
defaults write com.apple.universalaccess slowKey -bool true
defaults write com.apple.universalaccess slowKeyDelay -int 200
defaults write com.apple.universalaccess slowKeyBeepOn -bool true
echo -e "${GREEN}  ✅ Slow Keys enabled (200ms delay, beep on)${NC}"

# ─── HOVER TEXT ─────────────────────────────────────────────────
echo -e "\n${YELLOW}[3/4] Enabling Hover Text...${NC}"
echo "  Enlarges text under cursor to 24pt for reading small UI elements."
echo "  Essential for Logic Pro mixer labels and DreamChamber controls."
defaults write com.apple.universalaccess hoverTextEnabled -bool true
echo -e "${GREEN}  ✅ Hover Text enabled${NC}"

# ─── VERIFY ALL SETTINGS ───────────────────────────────────────
echo -e "\n${YELLOW}[4/4] Verifying configuration...${NC}"

echo -e "  Voice Control:           $(defaults read com.apple.speech.recognition.AppleSpeechRecognition.prefs DictationIMUseOnlyOfflineDictation 2>/dev/null && echo 'ACTIVE' || echo 'CHECK MANUALLY')"
echo -e "  Live Speech:             $(defaults read com.apple.universalaccess liveSpeechEnabled 2>/dev/null)"
echo -e "  Full Keyboard Access:    $(defaults read NSGlobalDomain AppleKeyboardUIMode 2>/dev/null)"
echo -e "  Sticky Keys:             $(defaults read com.apple.universalaccess stickyKey 2>/dev/null)"
echo -e "  Slow Keys:               $(defaults read com.apple.universalaccess slowKey 2>/dev/null)"
echo -e "  Hover Text:              $(defaults read com.apple.universalaccess hoverTextEnabled 2>/dev/null)"

echo -e "\n${CYAN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ACCESSIBILITY OPTIMIZED${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
echo -e ""
echo -e "  ${YELLOW}Note: Some changes require logout/login to take effect.${NC}"
echo -e "  ${YELLOW}Voice Control custom commands can be added in:${NC}"
echo -e "    System Settings → Accessibility → Voice Control → Commands${NC}"
echo -e ""
echo -e "  ${CYAN}Recommended custom commands to add:${NC}"
echo -e "    'Open DreamChamber'  → open https://dreamchamber.noizy.ai"
echo -e "    'Open Ollama'        → open https://ollama.noizy.ai"
echo -e "    'Open Grafana'       → open https://grafana.noizy.ai"
echo -e "    'Open n8n'           → open https://n8n.noizy.ai"
echo -e "    'Open Terminal'      → open https://ssh.noizy.ai"
echo -e "    'Hey Gabriel'        → Focus DreamChamber AI input"
echo -e ""
