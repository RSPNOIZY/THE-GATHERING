#!/bin/bash
# ============================================================
# NOIZYLAB-io GitHub Organization Script
# Consolidates GABRIEL into CODEMASTER for clean GitHub push
# ============================================================

set -e

GABRIEL_ROOT="/Users/m2ultra/NOIZYLAB/GABRIEL"
CODEMASTER="$GABRIEL_ROOT/CODEMASTER"
ORGANIZED="$CODEMASTER/_ORGANIZED"

echo "🚀 NOIZYLAB-io GitHub Organization Script"
echo "=========================================="
echo ""

# ============================================================
# STEP 1: Consolidate root-level Python files into 01_CORE
# ============================================================
echo "📁 Step 1: Consolidating root Python files to 01_CORE..."

ROOT_PY_FILES=(
    "GABRIEL_AI.py"
    "GABRIEL_DEEPDIVE.py"
    "GABRIEL_INHALE.py"
    "GABRIEL_PERFECT.py"
    "GABRIEL_SCANNER.py"
    "GABRIEL_TURBO.py"
    "GORUNFREEX1000.py"
    "gabriel_brain.py"
    "gabriel_indexer.py"
    "gabriel_player.py"
    "gabriel_preacher.py"
    "gabriel_producer.py"
    "gabriel_sonic.py"
    "gabriel_spirit.py"
    "gabriel_status.py"
    "gabriel_system_guardian.py"
    "gabriel_vision.py"
    "autonomous_learning.py"
    "audio_alias_manager.py"
    "warp_drive.py"
    "the_fishnet.py"
    "noizylab_cleaner.py"
)

mkdir -p "$ORGANIZED/01_CORE/gabriel_main"
for file in "${ROOT_PY_FILES[@]}"; do
    if [ -f "$GABRIEL_ROOT/$file" ]; then
        cp "$GABRIEL_ROOT/$file" "$ORGANIZED/01_CORE/gabriel_main/"
        echo "  ✓ $file"
    fi
done

# ============================================================
# STEP 2: Consolidate MCP servers to 04_MCP
# ============================================================
echo ""
echo "📁 Step 2: Consolidating MCP servers to 04_MCP..."

MCP_FILES=(
    "gabriel_mcp_server.py"
    "noizylab_mcp_server.py"
    "dreamchamber_mcp.py"
)

mkdir -p "$ORGANIZED/04_MCP/servers"
for file in "${MCP_FILES[@]}"; do
    if [ -f "$GABRIEL_ROOT/$file" ]; then
        cp "$GABRIEL_ROOT/$file" "$ORGANIZED/04_MCP/servers/"
        echo "  ✓ $file"
    fi
done

# Copy MCP directories
[ -d "$GABRIEL_ROOT/gabriel_mcp" ] && cp -r "$GABRIEL_ROOT/gabriel_mcp" "$ORGANIZED/04_MCP/" && echo "  ✓ gabriel_mcp/"
[ -d "$GABRIEL_ROOT/UNIFIED_MCP" ] && cp -r "$GABRIEL_ROOT/UNIFIED_MCP" "$ORGANIZED/04_MCP/" && echo "  ✓ UNIFIED_MCP/"
[ -d "$GABRIEL_ROOT/mcp_servers" ] && cp -r "$GABRIEL_ROOT/mcp_servers" "$ORGANIZED/04_MCP/" && echo "  ✓ mcp_servers/"

# ============================================================
# STEP 3: Consolidate Agents to 02_AGENTS
# ============================================================
echo ""
echo "📁 Step 3: Consolidating Agents to 02_AGENTS..."

[ -d "$GABRIEL_ROOT/AGENTS" ] && cp -r "$GABRIEL_ROOT/AGENTS" "$ORGANIZED/02_AGENTS/AGENTS_ROOT" && echo "  ✓ AGENTS/"
[ -d "$GABRIEL_ROOT/AI_COMMAND_CENTER" ] && cp -r "$GABRIEL_ROOT/AI_COMMAND_CENTER" "$ORGANIZED/02_AGENTS/" && echo "  ✓ AI_COMMAND_CENTER/"
[ -d "$GABRIEL_ROOT/velvet_sojourner" ] && cp -r "$GABRIEL_ROOT/velvet_sojourner" "$ORGANIZED/02_AGENTS/" && echo "  ✓ velvet_sojourner/"
[ -d "$GABRIEL_ROOT/MC96_MISSION_CONTROL" ] && cp -r "$GABRIEL_ROOT/MC96_MISSION_CONTROL" "$ORGANIZED/02_AGENTS/" && echo "  ✓ MC96_MISSION_CONTROL/"

# ============================================================
# STEP 4: Consolidate Scripts to 03_SCRIPTS
# ============================================================
echo ""
echo "📁 Step 4: Consolidating Scripts to 03_SCRIPTS..."

SHELL_SCRIPTS=(
    "MASTER_ACTIVATE.sh"
    "tighten_all.sh"
    "NOIZYLAB_CLEANER.sh"
    "install-claude-mac.sh"
    "install-claude-wsl.sh"
)

mkdir -p "$ORGANIZED/03_SCRIPTS/shell"
for file in "${SHELL_SCRIPTS[@]}"; do
    if [ -f "$GABRIEL_ROOT/$file" ]; then
        cp "$GABRIEL_ROOT/$file" "$ORGANIZED/03_SCRIPTS/shell/"
        echo "  ✓ $file"
    fi
done

[ -d "$GABRIEL_ROOT/scripts" ] && cp -r "$GABRIEL_ROOT/scripts" "$ORGANIZED/03_SCRIPTS/" && echo "  ✓ scripts/"
[ -d "$GABRIEL_ROOT/gemini_scripts" ] && cp -r "$GABRIEL_ROOT/gemini_scripts" "$ORGANIZED/03_SCRIPTS/" && echo "  ✓ gemini_scripts/"
[ -d "$GABRIEL_ROOT/bin" ] && cp -r "$GABRIEL_ROOT/bin" "$ORGANIZED/03_SCRIPTS/" && echo "  ✓ bin/"

# ============================================================
# STEP 5: Consolidate Tools to 05_TOOLS
# ============================================================
echo ""
echo "📁 Step 5: Consolidating Tools to 05_TOOLS..."

[ -d "$GABRIEL_ROOT/NATIVE" ] && cp -r "$GABRIEL_ROOT/NATIVE" "$ORGANIZED/05_TOOLS/" && echo "  ✓ NATIVE/"
[ -d "$GABRIEL_ROOT/POLYGLOT" ] && cp -r "$GABRIEL_ROOT/POLYGLOT" "$ORGANIZED/05_TOOLS/" && echo "  ✓ POLYGLOT/"
[ -d "$GABRIEL_ROOT/TURBO" ] && cp -r "$GABRIEL_ROOT/TURBO" "$ORGANIZED/05_TOOLS/" && echo "  ✓ TURBO/"
[ -d "$GABRIEL_ROOT/OMEGA" ] && cp -r "$GABRIEL_ROOT/OMEGA" "$ORGANIZED/05_TOOLS/" && echo "  ✓ OMEGA/"
[ -d "$GABRIEL_ROOT/utils" ] && cp -r "$GABRIEL_ROOT/utils" "$ORGANIZED/05_TOOLS/" && echo "  ✓ utils/"
[ -d "$GABRIEL_ROOT/packages" ] && cp -r "$GABRIEL_ROOT/packages" "$ORGANIZED/05_TOOLS/" && echo "  ✓ packages/"
[ -d "$GABRIEL_ROOT/scratch_tools" ] && cp -r "$GABRIEL_ROOT/scratch_tools" "$ORGANIZED/05_TOOLS/" && echo "  ✓ scratch_tools/"

# ============================================================
# STEP 6: Consolidate Config to 06_CONFIG
# ============================================================
echo ""
echo "📁 Step 6: Consolidating Config to 06_CONFIG..."

mkdir -p "$ORGANIZED/06_CONFIG"
[ -d "$GABRIEL_ROOT/config" ] && cp -r "$GABRIEL_ROOT/config" "$ORGANIZED/06_CONFIG/" && echo "  ✓ config/"
[ -d "$GABRIEL_ROOT/.vscode" ] && cp -r "$GABRIEL_ROOT/.vscode" "$ORGANIZED/06_CONFIG/" && echo "  ✓ .vscode/"
[ -d "$GABRIEL_ROOT/.claude" ] && cp -r "$GABRIEL_ROOT/.claude" "$ORGANIZED/06_CONFIG/" && echo "  ✓ .claude/"
[ -f "$GABRIEL_ROOT/config.json" ] && cp "$GABRIEL_ROOT/config.json" "$ORGANIZED/06_CONFIG/" && echo "  ✓ config.json"
[ -f "$GABRIEL_ROOT/claude_desktop_config.json" ] && cp "$GABRIEL_ROOT/claude_desktop_config.json" "$ORGANIZED/06_CONFIG/" && echo "  ✓ claude_desktop_config.json"
[ -f "$GABRIEL_ROOT/Makefile" ] && cp "$GABRIEL_ROOT/Makefile" "$ORGANIZED/06_CONFIG/" && echo "  ✓ Makefile"

# ============================================================
# STEP 7: Consolidate Legacy/Archive to 07_LEGACY
# ============================================================
echo ""
echo "📁 Step 7: Consolidating Legacy to 07_LEGACY..."

[ -d "$GABRIEL_ROOT/legacy" ] && cp -r "$GABRIEL_ROOT/legacy" "$ORGANIZED/07_LEGACY/" && echo "  ✓ legacy/"
[ -d "$GABRIEL_ROOT/archive_recovered" ] && cp -r "$GABRIEL_ROOT/archive_recovered" "$ORGANIZED/07_LEGACY/" && echo "  ✓ archive_recovered/"
[ -d "$GABRIEL_ROOT/deep_archive" ] && cp -r "$GABRIEL_ROOT/deep_archive" "$ORGANIZED/07_LEGACY/" && echo "  ✓ deep_archive/"
[ -d "$GABRIEL_ROOT/text_vault" ] && cp -r "$GABRIEL_ROOT/text_vault" "$ORGANIZED/07_LEGACY/" && echo "  ✓ text_vault/"

# ============================================================
# STEP 8: Consolidate Docs to 08_DOCS
# ============================================================
echo ""
echo "📁 Step 8: Consolidating Docs to 08_DOCS..."

mkdir -p "$ORGANIZED/08_DOCS"
[ -d "$GABRIEL_ROOT/docs" ] && cp -r "$GABRIEL_ROOT/docs" "$ORGANIZED/08_DOCS/" && echo "  ✓ docs/"
[ -d "$GABRIEL_ROOT/docs_legacy" ] && cp -r "$GABRIEL_ROOT/docs_legacy" "$ORGANIZED/08_DOCS/" && echo "  ✓ docs_legacy/"

MD_DOCS=(
    "README.md"
    "README_REAL.md"
    "CLAUDE.md"
    "DEVICE-SYNC.md"
    "ERROR_FIXES.md"
    "GORUNFREE-QUICKREF.md"
    "IOS-SETUP.md"
    "MULTI_MACHINE_SYNC.md"
    "GABRIEL_MCP_SIMPLE_POINTS.md"
)

mkdir -p "$ORGANIZED/08_DOCS/root_docs"
for file in "${MD_DOCS[@]}"; do
    if [ -f "$GABRIEL_ROOT/$file" ]; then
        cp "$GABRIEL_ROOT/$file" "$ORGANIZED/08_DOCS/root_docs/"
        echo "  ✓ $file"
    fi
done

# ============================================================
# STEP 9: Consolidate Apps & Web to new categories
# ============================================================
echo ""
echo "📁 Step 9: Consolidating Apps & Web..."

mkdir -p "$ORGANIZED/09_APPS"
[ -d "$GABRIEL_ROOT/apps" ] && cp -r "$GABRIEL_ROOT/apps" "$ORGANIZED/09_APPS/" && echo "  ✓ apps/"
[ -d "$GABRIEL_ROOT/web" ] && cp -r "$GABRIEL_ROOT/web" "$ORGANIZED/09_APPS/" && echo "  ✓ web/"
[ -d "$GABRIEL_ROOT/PORTAL" ] && cp -r "$GABRIEL_ROOT/PORTAL" "$ORGANIZED/09_APPS/" && echo "  ✓ PORTAL/"
[ -d "$GABRIEL_ROOT/mission_portal" ] && cp -r "$GABRIEL_ROOT/mission_portal" "$ORGANIZED/09_APPS/" && echo "  ✓ mission_portal/"
[ -d "$GABRIEL_ROOT/mc96_portal" ] && cp -r "$GABRIEL_ROOT/mc96_portal" "$ORGANIZED/09_APPS/" && echo "  ✓ mc96_portal/"

# ============================================================
# STEP 10: Infrastructure & Hardware
# ============================================================
echo ""
echo "📁 Step 10: Consolidating Infrastructure..."

mkdir -p "$ORGANIZED/10_INFRA"
[ -d "$GABRIEL_ROOT/hardware" ] && cp -r "$GABRIEL_ROOT/hardware" "$ORGANIZED/10_INFRA/" && echo "  ✓ hardware/"
[ -d "$GABRIEL_ROOT/workers" ] && cp -r "$GABRIEL_ROOT/workers" "$ORGANIZED/10_INFRA/" && echo "  ✓ workers/"
[ -d "$GABRIEL_ROOT/integrations" ] && cp -r "$GABRIEL_ROOT/integrations" "$ORGANIZED/10_INFRA/" && echo "  ✓ integrations/"
[ -d "$GABRIEL_ROOT/bridges" ] && cp -r "$GABRIEL_ROOT/bridges" "$ORGANIZED/10_INFRA/" && echo "  ✓ bridges/"
[ -d "$GABRIEL_ROOT/vpn" ] && cp -r "$GABRIEL_ROOT/vpn" "$ORGANIZED/10_INFRA/" && echo "  ✓ vpn/"
[ -f "$GABRIEL_ROOT/zero_latency_core.js" ] && cp "$GABRIEL_ROOT/zero_latency_core.js" "$ORGANIZED/10_INFRA/" && echo "  ✓ zero_latency_core.js"

# ============================================================
# STEP 11: Brain & AI Core
# ============================================================
echo ""
echo "📁 Step 11: Consolidating Brain & AI Core..."

mkdir -p "$ORGANIZED/11_BRAIN"
[ -d "$GABRIEL_ROOT/brain" ] && cp -r "$GABRIEL_ROOT/brain" "$ORGANIZED/11_BRAIN/" && echo "  ✓ brain/"
[ -d "$GABRIEL_ROOT/brain_core" ] && cp -r "$GABRIEL_ROOT/brain_core" "$ORGANIZED/11_BRAIN/" && echo "  ✓ brain_core/"
[ -d "$GABRIEL_ROOT/unified_consciousness" ] && cp -r "$GABRIEL_ROOT/unified_consciousness" "$ORGANIZED/11_BRAIN/" && echo "  ✓ unified_consciousness/"
[ -d "$GABRIEL_ROOT/MEMCELL" ] && cp -r "$GABRIEL_ROOT/MEMCELL" "$ORGANIZED/11_BRAIN/" && echo "  ✓ MEMCELL/"
[ -d "$GABRIEL_ROOT/memcell_data" ] && cp -r "$GABRIEL_ROOT/memcell_data" "$ORGANIZED/11_BRAIN/" && echo "  ✓ memcell_data/"
[ -d "$GABRIEL_ROOT/ai_lifeluv" ] && cp -r "$GABRIEL_ROOT/ai_lifeluv" "$ORGANIZED/11_BRAIN/" && echo "  ✓ ai_lifeluv/"
[ -d "$GABRIEL_ROOT/evolution" ] && cp -r "$GABRIEL_ROOT/evolution" "$ORGANIZED/11_BRAIN/" && echo "  ✓ evolution/"

# ============================================================
# STEP 12: Special Projects
# ============================================================
echo ""
echo "📁 Step 12: Consolidating Special Projects..."

mkdir -p "$ORGANIZED/12_PROJECTS"
[ -d "$GABRIEL_ROOT/titanhive" ] && cp -r "$GABRIEL_ROOT/titanhive" "$ORGANIZED/12_PROJECTS/" && echo "  ✓ titanhive/"
[ -d "$GABRIEL_ROOT/mc96_projects" ] && cp -r "$GABRIEL_ROOT/mc96_projects" "$ORGANIZED/12_PROJECTS/" && echo "  ✓ mc96_projects/"
[ -d "$GABRIEL_ROOT/golang" ] && cp -r "$GABRIEL_ROOT/golang" "$ORGANIZED/12_PROJECTS/" && echo "  ✓ golang/"
[ -d "$GABRIEL_ROOT/gemini_workspace" ] && cp -r "$GABRIEL_ROOT/gemini_workspace" "$ORGANIZED/12_PROJECTS/" && echo "  ✓ gemini_workspace/"
[ -d "$GABRIEL_ROOT/voice_ai" ] && cp -r "$GABRIEL_ROOT/voice_ai" "$ORGANIZED/12_PROJECTS/" && echo "  ✓ voice_ai/"
[ -d "$GABRIEL_ROOT/optimizations" ] && cp -r "$GABRIEL_ROOT/optimizations" "$ORGANIZED/12_PROJECTS/" && echo "  ✓ optimizations/"
[ -f "$GABRIEL_ROOT/AeonCompanion.swift" ] && cp "$GABRIEL_ROOT/AeonCompanion.swift" "$ORGANIZED/12_PROJECTS/" && echo "  ✓ AeonCompanion.swift"
[ -f "$GABRIEL_ROOT/aeon_pmic.kicad_sch" ] && cp "$GABRIEL_ROOT/aeon_pmic.kicad_sch" "$ORGANIZED/12_PROJECTS/" && echo "  ✓ aeon_pmic.kicad_sch"
[ -f "$GABRIEL_ROOT/enclosure.scad" ] && cp "$GABRIEL_ROOT/enclosure.scad" "$ORGANIZED/12_PROJECTS/" && echo "  ✓ enclosure.scad"

echo ""
echo "=========================================="
echo "✅ Organization Complete!"
echo ""
echo "📊 Structure:"
echo "   CODEMASTER/_ORGANIZED/"
echo "   ├── 01_CORE/        - Core Gabriel Infrastructure"
echo "   ├── 02_AGENTS/      - AI Agents & Mission Control"
echo "   ├── 03_SCRIPTS/     - Shell & Python Scripts"
echo "   ├── 04_MCP/         - Model Context Protocol"
echo "   ├── 05_TOOLS/       - Development Tools"
echo "   ├── 06_CONFIG/      - Configuration & Settings"
echo "   ├── 07_LEGACY/      - Archived & Historical"
echo "   ├── 08_DOCS/        - Documentation"
echo "   ├── 09_APPS/        - Applications & Web"
echo "   ├── 10_INFRA/       - Infrastructure & Hardware"
echo "   ├── 11_BRAIN/       - Brain & AI Core"
echo "   └── 12_PROJECTS/    - Special Projects"
echo ""
echo "🔗 Ready to push to: https://github.com/NOIZYLAB-io"
echo ""
