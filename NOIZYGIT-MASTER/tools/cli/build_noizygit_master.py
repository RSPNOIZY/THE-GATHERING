#!/usr/bin/env python3
"""
=============================================================================
 NOIZYGIT-MASTER CANONICAL MONOREPO BUILDER & RE-ORGANIZATION ENGINE
 Target: /Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER
=============================================================================
"""

import os
import shutil
import json
from datetime import datetime

TARGET_ROOT = "/Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER"
GATHERING_ROOT = "/Users/m2ultra/THE-GATHERING"
NOIZYANTHROPIC_ROOT = "/Users/m2ultra/NOIZYANTHROPIC"
GDRIVE_MYDRIVE = os.path.expanduser("~/Library/CloudStorage/GoogleDrive-rspplowman@gmail.com/My Drive")
MARKDOWN_ARCHIVE = "/Users/m2ultra/Markdown_Archive"

STRUCTURE = {
    "apps": {
        "command-center": "Empire Core Control Center & Live Glassmorphic Operations Dashboard",
        "mission-control-96": "MC96 Fleet, Device, Vehicle & Agent Operations Hub",
        "noizylab-web": "Canonical NOIZYLAB Web Platform, Landing & App Suite",
        "noizy-ios-native": "Swift Native iOS / CarPlay AppIntents & Widget Hub",
        "operator-panel": "Sovereign Publisher, Audit Log & Consent Interface"
    },
    "agents": {
        "gabriel": "Gabriel Master Voice/Audio Orchestrator & Neural Hub",
        "lucy": "Lucy v4.0 Personal OS, World Model & Mobile Fleet Telemetry",
        "the-conductor": "Multi-Agent Symphony & Workflow Director",
        "the-perfectionist": "Autonomous Code Quality, Lint & Verification Specialist",
        "michael-merkle": "Merkle Archivist, Document Hash & Knowledge Graph Specialist",
        "swarms": "High-Speed Distributed Consensus & Worker Swarms"
    },
    "mcps": {
        "dream-mcp": "Audio Stems, Synthesis & Creative Asset MCP Server",
        "consent-oracle": "NOI-15 Cryptographic Consent & Policy MCP Server",
        "lucy-mcp": "Local Device, System & Telemetry MCP Server",
        "routes-mcp": "Google Routes & CarPlay Navigation MCP Server",
        "filesystem-mcp": "Omni-Accounting & Knowledge Retrieval MCP Server"
    },
    "packages": {
        "noizy-sdk-python": "Python SDK for Google Antigravity & Agent Tooling",
        "noizy-core-ts": "TypeScript Monorepo Core Schemas, Types & Telemetry",
        "hvs-sovereignty": "Hardware-Verified Sovereignty, Cryptographic Evidence & Contract Suite"
    },
    "audio_music": {
        "kontakt_lab": "Kontakt Script Generator 2.0 & Custom KSP Engines",
        "voice_army": "NOIZYVOX Multi-Voice Army Playbook & Voice Matrices",
        "sonic_branding": "Audio IDs, Stem Registries & Sound Design Manifests"
    },
    "docs": {
        "canonical": "The Noizy Bible, Founder Blueprint, Empire Map & Master Encyclopedias",
        "architecture": "AFVIS 2.0, Consent Architecture, World Model & Fleet Topologies",
        "guides": "Developer Setup, FOSS Media Stack, Deployment Playbooks",
        "research": "Wisdom Project, Dr. Benoit, Market Analysis, AI Competitive Audits"
    },
    "config": {
        "docker": "Hot Rod Docker Stacks & Microservice Compose Configs",
        "supabase": "Database Schemas, Row-Level Security & Edge Functions",
        "cloudflare": "Cloudflare Workers, D1 Databases & KV Registries",
        "workflows": "n8n Automation Workflows & GitHub Actions CI/CD"
    },
    "scripts": {
        "bootstrap": "Environment Provisioning & Dependency Bootstrap Scripts",
        "sync": "Cross-Device, Cloud & External Drive Reconciler Scripts",
        "verification": "Continuous Evidence, Safety Contracts & Audit Suites"
    }
}

def safe_copy_tree(src, dst):
    if not os.path.exists(src):
        return False
    try:
        if os.path.isdir(src):
            if os.path.exists(dst):
                shutil.rmtree(dst)
            shutil.copytree(src, dst, ignore=shutil.ignore_patterns('.git', 'node_modules', '__pycache__', '.DS_Store', '*.pyc', '.venv'))
            return True
        elif os.path.isfile(src):
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.copy2(src, dst)
            return True
    except Exception as e:
        print(f"Error copying {src} -> {dst}: {e}")
    return False

def build_monorepo():
    print("==================================================================", flush=True)
    print(" BUILDING NOIZYGIT-MASTER CANONICAL MONOREPO")
    print(f" Target: {TARGET_ROOT}")
    print("==================================================================", flush=True)

    os.makedirs(TARGET_ROOT, exist_ok=True)

    # 1. Create Structure & Write READMEs for all submodules
    manifest_entries = []

    for category, submodules in STRUCTURE.items():
        cat_dir = os.path.join(TARGET_ROOT, category)
        os.makedirs(cat_dir, exist_ok=True)
        
        cat_readme = os.path.join(cat_dir, "README.md")
        with open(cat_readme, "w", encoding="utf-8") as f:
            f.write(f"# NOIZYGIT-MASTER: `{category.upper()}`\n\n")
            f.write(f"This domain contains canonical `{category}` assets for the NOIZY ecosystem.\n\n")
            f.write("## Submodules & Components\n\n")
            for sub, desc in submodules.items():
                f.write(f"- **`{sub}`**: {desc}\n")
        
        for sub, desc in submodules.items():
            sub_dir = os.path.join(cat_dir, sub)
            os.makedirs(sub_dir, exist_ok=True)
            sub_readme = os.path.join(sub_dir, "README.md")
            with open(sub_readme, "w", encoding="utf-8") as f:
                f.write(f"# Component: `{sub}`\n\n")
                f.write(f"**Domain**: `{category}`  \n")
                f.write(f"**Role**: {desc}  \n")
                f.write("**Status**: Active Canonical  \n")
                f.write(f"**Updated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
                f.write("## Overview\n\n")
                f.write(f"This is the official, consolidated source for `{sub}` within the NOIZYGIT-MASTER monorepo.\n")

            manifest_entries.append({
                "category": category,
                "submodule": sub,
                "path": f"{category}/{sub}",
                "description": desc,
                "status": "active"
            })

    # 2. Ingest Apps
    print(">>> Ingesting Apps...", flush=True)
    # Command Center
    safe_copy_tree(os.path.join(GATHERING_ROOT, "command-center"), os.path.join(TARGET_ROOT, "apps/command-center"))
    safe_copy_tree(os.path.join(NOIZYANTHROPIC_ROOT, "command-center"), os.path.join(TARGET_ROOT, "apps/command-center"))
    # Mission Control
    safe_copy_tree(os.path.join(NOIZYANTHROPIC_ROOT, "mc96"), os.path.join(TARGET_ROOT, "apps/mission-control-96/mc96_core"))
    safe_copy_tree(os.path.join(NOIZYANTHROPIC_ROOT, "MC96ECO"), os.path.join(TARGET_ROOT, "apps/mission-control-96/mc96_eco"))
    # Noizylab Web
    safe_copy_tree(os.path.join(NOIZYANTHROPIC_ROOT, "landing"), os.path.join(TARGET_ROOT, "apps/noizylab-web/landing"))
    safe_copy_tree(os.path.join(NOIZYANTHROPIC_ROOT, "dashboards"), os.path.join(TARGET_ROOT, "apps/noizylab-web/dashboards"))
    # iOS Native
    safe_copy_tree(os.path.join(GATHERING_ROOT, "NOIZY-iOS-Native"), os.path.join(TARGET_ROOT, "apps/noizy-ios-native"))
    safe_copy_tree(os.path.join(NOIZYANTHROPIC_ROOT, "swift-library"), os.path.join(TARGET_ROOT, "apps/noizy-ios-native/swift-library"))
    # Operator Panel
    safe_copy_tree(os.path.join(NOIZYANTHROPIC_ROOT, "robotics-factory-control-panel"), os.path.join(TARGET_ROOT, "apps/operator-panel/robotics-panel"))

    # 3. Ingest Agents
    print(">>> Ingesting Agents...", flush=True)
    # Gabriel
    safe_copy_tree(os.path.join(GATHERING_ROOT, "gabriel"), os.path.join(TARGET_ROOT, "agents/gabriel/core"))
    safe_copy_tree(os.path.join(NOIZYANTHROPIC_ROOT, "gabriel-control-plane"), os.path.join(TARGET_ROOT, "agents/gabriel/control-plane"))
    safe_copy_tree(os.path.join(NOIZYANTHROPIC_ROOT, "gabriel-lucy-core"), os.path.join(TARGET_ROOT, "agents/gabriel/neural-core"))
    # Lucy
    safe_copy_tree(os.path.join(GATHERING_ROOT, "LUCY"), os.path.join(TARGET_ROOT, "agents/lucy/runtime"))
    safe_copy_tree(os.path.join(NOIZYANTHROPIC_ROOT, "lucy"), os.path.join(TARGET_ROOT, "agents/lucy/core"))
    # The Conductor & Perfectionist
    safe_copy_tree(os.path.join(GATHERING_ROOT, "the-conductor"), os.path.join(TARGET_ROOT, "agents/the-conductor"))
    safe_copy_tree(os.path.join(GATHERING_ROOT, "the-perfectionist"), os.path.join(TARGET_ROOT, "agents/the-perfectionist"))
    # Swarms & Core Agents
    safe_copy_tree(os.path.join(GATHERING_ROOT, "agents"), os.path.join(TARGET_ROOT, "agents/swarms/orchestrator"))
    safe_copy_tree(os.path.join(NOIZYANTHROPIC_ROOT, "agents"), os.path.join(TARGET_ROOT, "agents/swarms/hive"))

    # 4. Ingest MCPs
    print(">>> Ingesting MCP Servers...", flush=True)
    safe_copy_tree(os.path.join(GATHERING_ROOT, "mcps"), os.path.join(TARGET_ROOT, "mcps"))
    safe_copy_tree(os.path.join(NOIZYANTHROPIC_ROOT, "MCPs"), os.path.join(TARGET_ROOT, "mcps/servers-v2"))
    safe_copy_tree(os.path.join(NOIZYANTHROPIC_ROOT, "mcp"), os.path.join(TARGET_ROOT, "mcps/servers-v1"))

    # 5. Ingest Packages & Core
    print(">>> Ingesting Packages & HVS Sovereignty...", flush=True)
    safe_copy_tree(os.path.join(GATHERING_ROOT, "hvs-sovereignty"), os.path.join(TARGET_ROOT, "packages/hvs-sovereignty"))
    safe_copy_tree(os.path.join(GATHERING_ROOT, "core"), os.path.join(TARGET_ROOT, "packages/noizy-core-ts"))
    safe_copy_tree(os.path.join(GATHERING_ROOT, "control-plane"), os.path.join(TARGET_ROOT, "packages/noizy-sdk-python/control-plane"))
    safe_copy_tree(os.path.join(NOIZYANTHROPIC_ROOT, "contracts"), os.path.join(TARGET_ROOT, "packages/hvs-sovereignty/contracts"))
    safe_copy_tree(os.path.join(NOIZYANTHROPIC_ROOT, "governance"), os.path.join(TARGET_ROOT, "packages/hvs-sovereignty/governance"))

    # 6. Ingest Audio & Music IP
    print(">>> Ingesting Audio & Music Engineering...", flush=True)
    safe_copy_tree(os.path.join(GATHERING_ROOT, "06_AUDIO_MUSIC_IP"), os.path.join(TARGET_ROOT, "audio_music/sonic_branding"))
    safe_copy_tree(os.path.join(NOIZYANTHROPIC_ROOT, "voice-pipeline"), os.path.join(TARGET_ROOT, "audio_music/voice_army/pipeline"))
    safe_copy_tree(os.path.join(NOIZYANTHROPIC_ROOT, "musical-computing-machine"), os.path.join(TARGET_ROOT, "audio_music/kontakt_lab/computing_machine"))
    
    # Ingest Google Drive Docs & Audio Assets if present
    gdrive_audio_manifest = os.path.join(GDRIVE_MYDRIVE, "NOIZY_AUDIO_VIDEO_VAULT/MANIFEST_AUDIO_VIDEO_VAULT.json")
    if os.path.exists(gdrive_audio_manifest):
        safe_copy_tree(gdrive_audio_manifest, os.path.join(TARGET_ROOT, "audio_music/sonic_branding/MANIFEST_AUDIO_VIDEO_VAULT.json"))

    # 7. Ingest Canonical Documentation & Blueprints
    print(">>> Ingesting Canonical Documentation...", flush=True)
    # The Gathering docs
    safe_copy_tree(os.path.join(GATHERING_ROOT, "docs"), os.path.join(TARGET_ROOT, "docs/architecture"))
    # Anthropic docs
    safe_copy_tree(os.path.join(NOIZYANTHROPIC_ROOT, "docs"), os.path.join(TARGET_ROOT, "docs/canonical"))
    
    # Copy Core Master Markdown files
    for md_name in [
        "CLAUDE.md", "EMPIRE_MAP.md", "EMPIRE_UPGRADE.md", "FOSS_MEDIA_STACK.md",
        "HEAVEN_RECOVERY.md", "NEXT_25_MOVES.md", "NOIZYFISH_HARDENING.md",
        "NOIZY_MOBILE_DEMO_NETWORK.md", "README.md", "STACK_SETUP.md", "TASKS.md"
    ]:
        src_p = os.path.join(GATHERING_ROOT, md_name)
        if os.path.exists(src_p):
            safe_copy_tree(src_p, os.path.join(TARGET_ROOT, f"docs/canonical/{md_name}"))

    for md_name in [
        "NOIZY_AI_MASTER_BIBLE.md", "DREAMCHAMBER_EMPIRE_UNIFIED_2026-04-15.md",
        "GABRIEL_HIVE_STACK.md", "FAMILY_TEAM_BRANDS.md", "AGENT_STACK.md",
        "ARCHITECTURE.md", "MASTER_REGISTRY.md", "NOIZYARMY_DISCORD.md"
    ]:
        src_p = os.path.join(NOIZYANTHROPIC_ROOT, md_name)
        if os.path.exists(src_p):
            safe_copy_tree(src_p, os.path.join(TARGET_ROOT, f"docs/canonical/{md_name}"))

    # Copy Google Drive master blueprints
    for gfile in os.listdir(GDRIVE_MYDRIVE) if os.path.exists(GDRIVE_MYDRIVE) else []:
        if any(k in gfile for k in ["Blueprint", "Bible", "Architecture", "Operations", "Consent", "Playbook", "Master", "Audit"]):
            src_p = os.path.join(GDRIVE_MYDRIVE, gfile)
            if os.path.isfile(src_p):
                safe_copy_tree(src_p, os.path.join(TARGET_ROOT, f"docs/canonical/{gfile}"))

    # 8. Ingest Infrastructure & Config
    print(">>> Ingesting Config & Workflows...", flush=True)
    safe_copy_tree(os.path.join(GATHERING_ROOT, "config"), os.path.join(TARGET_ROOT, "config/infrastructure"))
    safe_copy_tree(os.path.join(GATHERING_ROOT, "supabase"), os.path.join(TARGET_ROOT, "config/supabase"))
    safe_copy_tree(os.path.join(NOIZYANTHROPIC_ROOT, "cloudflare"), os.path.join(TARGET_ROOT, "config/cloudflare"))
    safe_copy_tree(os.path.join(NOIZYANTHROPIC_ROOT, "workflows"), os.path.join(TARGET_ROOT, "config/workflows"))
    safe_copy_tree(os.path.join(GATHERING_ROOT, ".github"), os.path.join(TARGET_ROOT, ".github"))

    # 9. Ingest Scripts & Tests
    print(">>> Ingesting Scripts & Verification Tests...", flush=True)
    safe_copy_tree(os.path.join(GATHERING_ROOT, "scripts"), os.path.join(TARGET_ROOT, "scripts/verification"))
    safe_copy_tree(os.path.join(NOIZYANTHROPIC_ROOT, "scripts"), os.path.join(TARGET_ROOT, "scripts/sync"))
    safe_copy_tree(os.path.join(GATHERING_ROOT, "tests"), os.path.join(TARGET_ROOT, "packages/hvs-sovereignty/tests"))
    safe_copy_tree(os.path.join(NOIZYANTHROPIC_ROOT, "tests"), os.path.join(TARGET_ROOT, "packages/noizy-core-ts/tests"))

    # 10. Generate Master MONOREPO_INDEX.json
    print(">>> Generating Master Monorepo Index...", flush=True)
    index_data = {
        "monorepo_name": "NOIZYGIT-MASTER",
        "canonical_repository": "https://github.com/RSPNOIZY/THE-GATHERING/NOIZYGIT-MASTER",
        "generated_at": datetime.now().isoformat(),
        "architecture_version": "4.0.0-SOVEREIGN",
        "total_submodules": len(manifest_entries),
        "structure": STRUCTURE,
        "manifest": manifest_entries
    }
    with open(os.path.join(TARGET_ROOT, "MONOREPO_INDEX.json"), "w", encoding="utf-8") as f:
        json.dump(index_data, f, indent=2)

    # 11. Generate Master README.md
    print(">>> Generating Master README.md...", flush=True)
    master_readme_content = f"""# 🌐 NOIZYGIT-MASTER

**The Canonical Master Monorepo for the NOIZY Ecosystem**  
*Repository Origin: [`https://github.com/RSPNOIZY/THE-GATHERING`](https://github.com/RSPNOIZY/THE-GATHERING)*  
*Architecture: Sovereign Multi-Agent Substrate, Hardware-Verified Contracts, Voice & Sonic Computing*  
*Consolidated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*

---

## 🏛️ Monorepo Architecture Overview

`NOIZYGIT-MASTER` unifies all distributed repositories, agent swarms, MCP servers, audio-music IP, and sovereign blueprints into a single, cohesive, production-grade monorepo.

```
NOIZYGIT-MASTER/
├── apps/                    # User Interfaces, Dashboards & Client Applications
│   ├── command-center/      # Empire Core Control Center & Live Glassmorphic Operations
│   ├── mission-control-96/  # MC96 Fleet, Device & Agent Operations Hub
│   ├── noizylab-web/        # Canonical NOIZYLAB Web Platform & App Suite
│   ├── noizy-ios-native/    # Swift Native iOS / CarPlay AppIntents & Widget Hub
│   └── operator-panel/      # Sovereign Publisher, Audit Log & Consent Interface
├── agents/                  # Autonomous Multi-Agent Swarms & Cognitive Entities
│   ├── gabriel/             # Gabriel Master Voice/Audio Orchestrator & Neural Hub
│   ├── lucy/                # Lucy v4.0 Personal OS, World Model & Mobile Fleet
│   ├── the-conductor/       # Multi-Agent Symphony & Workflow Director
│   ├── the-perfectionist/   # Autonomous Code Quality, Lint & Verification Specialist
│   ├── michael-merkle/      # Merkle Archivist, Document Hash & Knowledge Graph
│   └── swarms/              # High-Speed Distributed Consensus & Worker Swarms
├── mcps/                    # Model Context Protocol Servers
│   ├── dream-mcp/           # Audio Stems, Synthesis & Creative Asset MCP
│   ├── consent-oracle/      # NOI-15 Cryptographic Consent & Policy MCP
│   ├── lucy-mcp/            # Local Device, System & Telemetry MCP
│   ├── routes-mcp/          # Google Routes & CarPlay Navigation MCP
│   └── filesystem-mcp/      # Omni-Accounting & Knowledge Retrieval MCP
├── packages/                # Shared SDKs, Core Libraries & Verification Engines
│   ├── noizy-sdk-python/    # Python SDK for Google Antigravity & Agent Tooling
│   ├── noizy-core-ts/       # TypeScript Monorepo Core Schemas, Types & Telemetry
│   └── hvs-sovereignty/     # Hardware-Verified Sovereignty, Cryptographic Evidence
├── audio_music/             # Audio Architecture, Instruments & Sound Design
│   ├── kontakt_lab/         # Kontakt Script Generator 2.0 & Custom KSP Engines
│   ├── voice_army/          # NOIZYVOX Multi-Voice Army Playbook & Voice Matrices
│   └── sonic_branding/      # Audio IDs, Stem Registries & Sound Design Manifests
├── docs/                    # Canonical Knowledge Base, Specs & Blueprints
│   ├── canonical/           # The Noizy Bible, Founder Blueprint, Empire Map
│   ├── architecture/        # AFVIS 2.0, Consent Architecture, World Model
│   ├── guides/              # Developer Setup, FOSS Media Stack, Deployment Playbook
│   └── research/            # Wisdom Project, Dr. Benoit, Market Analysis
├── config/                  # Unified Infrastructure & Deployment Configurations
│   ├── docker/              # Hot Rod Docker Stacks & Microservice Compose Configs
│   ├── supabase/            # Database Schemas, Row-Level Security, Edge Functions
│   ├── cloudflare/          # Cloudflare Workers, D1 Databases & KV Registries
│   └── workflows/           # n8n Automation Workflows & GitHub Actions CI/CD
└── scripts/                 # Operational, Sync & Verification Utilities
    ├── bootstrap/           # Environment Provisioning & Dependency Bootstrap
    ├── sync/                # Cross-Device & Cloud Sync Orchestrator
    └── verification/        # Continuous Evidence, Safety Contracts & Audit Suites
```

---

## ⚡ Core Systems & Domains

### 1. 📱 Applications (`apps/`)
- **Command Center**: Glassmorphic real-time interface visualizing telemetry, agent states, and network routing.
- **Mission Control 96**: Multi-device fleet manager, vehicle integration (CR-V Plowman Standard), and mobile telemetry.
- **NOIZY iOS Native**: Swift-based native iOS client featuring AppIntents, Siri integration, and Apple CarPlay bridge.

### 2. 🧠 Autonomous Agents (`agents/`)
- **Gabriel**: Neural voice synthesizer, audio orchestration engine, and high-level mission coordinator.
- **Lucy v4.0**: Personal OS, proactive world model, and distributed device runner.
- **The Conductor & The Perfectionist**: Dual-agent quality control and autonomous execution pipeline.

### 3. 🔌 Model Context Protocol (`mcps/`)
- Production-grade MCP implementations exposing filesystem, telemetry, voice routing, and consent oracle capabilities to AI models.

### 4. 🎵 Audio & Sonic Engineering (`audio_music/`)
- **Kontakt Lab**: High-precision Kontakt Script Processor (KSP) tooling, sound design automation, and synthesis engines.
- **NOIZYVOX**: 2026 Voice Army playbook, Kate & Gabriel neural voice matrix, and multi-track stem management.

### 5. 📜 Sovereign Governance & Documentation (`docs/`)
- Complete repository of canonical blueprints: The Noizy Bible, NOI-15 Consent Architecture, AFVIS 2.0, and Dr. Benoit's Wisdom Project.

---

## 🚀 Quickstart & Verification

```bash
# Verify monorepo integrity
python3 scripts/verification/verify-mc96-noizyworld.sh

# Inspect machine-readable index
cat MONOREPO_INDEX.json | jq .
```

*Maintained under the Sovereign NOIZY License & Governance Framework.*
"""
    with open(os.path.join(TARGET_ROOT, "README.md"), "w", encoding="utf-8") as f:
        f.write(master_readme_content)

    print("==================================================================", flush=True)
    print(" NOIZYGIT-MASTER BUILD COMPLETED SUCCESSFULLY!")
    print(f" Total submodules indexed: {len(manifest_entries)}")
    print("==================================================================", flush=True)

if __name__ == "__main__":
    build_monorepo()
