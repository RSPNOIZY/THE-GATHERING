#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║    🚀 MASS IMPORT: ALL PROJECTS FROM DOWNLOADS + STAGING      ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

cd /Users/m2ultra/.claude-worktrees/NOIZYLAB/xenodochial-almeida

mkdir -p PROJECTS/{AI_ML,AUDIO,NETWORK,DATA,ARCHIVES,CORE}

echo "📥 IMPORTING FROM DOWNLOADS..."
cp -r ~/Downloads/aeon-v2-supreme* PROJECTS/AI_ML/ 2>/dev/null && echo "  ✅ AEON systems"
cp -r ~/Downloads/AEON-* PROJECTS/AI_ML/ 2>/dev/null && echo "  ✅ AEON MEGA"  
cp -r ~/Downloads/10CC-* PROJECTS/AUDIO/ 2>/dev/null && echo "  ✅ 10CC audio"
cp -r ~/Downloads/NOIZYLAB-TUNNEL PROJECTS/NETWORK/ 2>/dev/null && echo "  ✅ Network tunneling"
cp -r ~/Downloads/UNIVERSAL-* PROJECTS/DATA/ 2>/dev/null && echo "  ✅ Universal ingestion"
cp -r ~/Downloads/noizylab-ultimate PROJECTS/CORE/ 2>/dev/null && echo "  ✅ Ultimate core"
cp -r ~/Downloads/NOIZYLAB-FINAL* PROJECTS/ARCHIVES/ 2>/dev/null && echo "  ✅ Final archives"

echo ""
echo "📦 IMPORTING 32GB REPAIRROB (staging to background)..."
cp -r ~/NOIZYLAB_GIT_STAGING/repairrob PROJECTS/AI_ML/ 2>/dev/null &
echo "  ⏳ Background import started (PID: $!)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 IMPORT SUMMARY:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Project Structure:"
du -sh PROJECTS/* | sort -rh
echo ""
du -sh PROJECTS
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
