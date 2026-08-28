# NOIZYLAB-io GitHub Organization Structure

**Organization URL:** https://github.com/NOIZYLAB-io
**Last Updated:** 2025-12-28

---

## 📁 Repository Structure

```
NOIZYLAB-io/
├── GABRIEL-CORE           # Core infrastructure (01_CORE)
├── GABRIEL-AGENTS         # AI Agents & Mission Control (02_AGENTS)
├── GABRIEL-MCP            # Model Context Protocol servers (04_MCP)
├── GABRIEL-TOOLS          # Development tools (05_TOOLS)
├── GABRIEL-BRAIN          # AI Brain & Consciousness (11_BRAIN)
├── MC96-MISSION-CONTROL   # Mission Control Dashboard
├── VELVET-SOJOURNER       # Velvet Sojourner AI System
├── NOIZYLAB-PORTAL        # Web Portals & Apps (09_APPS)
├── NOIZYLAB-INFRA         # Infrastructure & Workers (10_INFRA)
├── NOIZYLAB-DOCS          # Documentation (08_DOCS)
└── NOIZYLAB-ARCHIVE       # Legacy & Archive (07_LEGACY)
```

---

## 🚀 Recommended Repository Split

### Primary Repositories (Public)

| Repository | Contents | Description |
|------------|----------|-------------|
| `GABRIEL-CORE` | 01_CORE | Main Gabriel AI framework |
| `GABRIEL-MCP` | 04_MCP | MCP servers for Claude/AI integration |
| `MC96-MISSION-CONTROL` | 02_AGENTS/mc96* | Mission Control dashboard |
| `NOIZYLAB-PORTAL` | 09_APPS | Web applications and portals |

### Private Repositories

| Repository | Contents | Description |
|------------|----------|-------------|
| `GABRIEL-BRAIN` | 11_BRAIN | AI consciousness & memory systems |
| `NOIZYLAB-CONFIG` | 06_CONFIG | Sensitive configurations |
| `NOIZYLAB-INFRA` | 10_INFRA | Infrastructure secrets |

---

## 📊 Current CODEMASTER Structure

```
CODEMASTER/_ORGANIZED/
├── 01_CORE/           (15+ items) - Core Gabriel Infrastructure
│   ├── cli.py
│   ├── daily_intel.py
│   ├── gabriel_main/      <- Root Python files
│   ├── gabriel_core_main/
│   ├── gabriel_memcell/
│   ├── gabriel_root/
│   └── ...
│
├── 02_AGENTS/         (20+ items) - AI Agents & Mission Control
│   ├── AI_COMPLETE_BRAIN/
│   ├── AI_COMMAND_CENTER/
│   ├── MC96_MISSION_CONTROL/
│   ├── velvet_sojourner/
│   ├── gabriel_brain/
│   └── ...
│
├── 03_SCRIPTS/        (17+ items) - Shell & Python Scripts
│   ├── shell/             <- Root shell scripts
│   ├── bin/
│   ├── scripts/
│   └── gemini_scripts/
│
├── 04_MCP/            (5+ items) - Model Context Protocol
│   ├── servers/           <- Root MCP servers
│   ├── mcp_servers/
│   ├── UNIFIED_MCP/
│   ├── gabriel_mcp/
│   └── noizylab_unified_mcp/
│
├── 05_TOOLS/          (19+ items) - Development Tools
│   ├── NATIVE/
│   ├── POLYGLOT/
│   ├── TURBO/
│   ├── OMEGA/
│   ├── anthropic_tools/
│   └── ...
│
├── 06_CONFIG/         (12+ items) - Configuration & Settings
│   ├── config/
│   ├── .vscode/
│   ├── .claude/
│   ├── config.json
│   └── Makefile
│
├── 07_LEGACY/         (13+ items) - Archived & Historical
│   ├── legacy/
│   ├── archive_recovered/
│   ├── deep_archive/
│   └── text_vault/
│
├── 08_DOCS/           (8+ items) - Documentation
│   ├── docs/
│   ├── docs_legacy/
│   └── root_docs/         <- Root markdown files
│
├── 09_APPS/           (NEW) - Applications & Web
│   ├── apps/
│   ├── web/
│   ├── PORTAL/
│   ├── mission_portal/
│   └── mc96_portal/
│
├── 10_INFRA/          (NEW) - Infrastructure & Hardware
│   ├── hardware/
│   ├── workers/
│   ├── integrations/
│   ├── bridges/
│   └── vpn/
│
├── 11_BRAIN/          (NEW) - Brain & AI Core
│   ├── brain/
│   ├── brain_core/
│   ├── unified_consciousness/
│   ├── MEMCELL/
│   ├── ai_lifeluv/
│   └── evolution/
│
└── 12_PROJECTS/       (NEW) - Special Projects
    ├── titanhive/
    ├── mc96_projects/
    ├── golang/
    ├── voice_ai/
    ├── AeonCompanion.swift
    └── aeon_pmic.kicad_sch
```

---

## 🔧 GitHub Actions

### Push to NOIZYLAB-io

```bash
cd /Users/m2ultra/NOIZYLAB/GABRIEL/CODEMASTER

# Initialize as new repo for NOIZYLAB-io
git init
git add .
git commit -m "🚀 GABRIEL CODEMASTER - Organized Structure"

# Push to NOIZYLAB-io organization
git remote add origin https://github.com/NOIZYLAB-io/GABRIEL-CODEMASTER.git
git branch -M main
git push -u origin main
```

### Or Push Individual Components

```bash
# Example: Push just MCP servers
cd _ORGANIZED/04_MCP
git init
git add .
git commit -m "🔌 GABRIEL MCP Servers"
git remote add origin https://github.com/NOIZYLAB-io/GABRIEL-MCP.git
git push -u origin main
```

---

## 🏷️ Recommended Topics/Tags

- `gabriel-ai`
- `noizylab`
- `mcp-server`
- `claude-integration`
- `ai-agents`
- `mission-control`
- `mc96`

---

## 📋 File Counts Summary

| Category | Python | JS/TS | Shell | Total |
|----------|--------|-------|-------|-------|
| 01_CORE | 500+ | 50 | 30 | 580+ |
| 02_AGENTS | 800+ | 200+ | 50 | 1050+ |
| 03_SCRIPTS | 200+ | 10 | 300+ | 510+ |
| 04_MCP | 100+ | 50 | 20 | 170+ |
| 05_TOOLS | 300+ | 100+ | 50 | 450+ |
| **Total** | **6,500+** | **2,100+** | **525+** | **~30,000** |

---

**Signature:** MC96DIGIUNIVERSE AI LIFELUV INFINITE ENERGY ⚡
