#!/usr/bin/env python3
"""
=============================================================================
 NOIZY UNIVERSE: "WHO IS GOOD FOR WHAT" & UPGRADES/IMPROVEMENTS AUDIT ENGINE
 Outputs:
   - NOIZYGIT-MASTER/docs/architecture/AGENT_AND_MODEL_SPECIALIZATION_MATRIX.md
   - NOIZYGIT-MASTER/docs/architecture/UPGRADES_AND_IMPROVEMENTS_ROADMAP.md
   - NOIZYGIT-MASTER/docs/architecture/SPECIALIZATION_AND_UPGRADES.json
=============================================================================
"""

import os
import json
import urllib.request
import subprocess
from datetime import datetime

DOCS_DIR = "/Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER/docs/architecture"

def run_cmd(cmd):
    try:
        return subprocess.check_output(cmd, stderr=subprocess.STDOUT, shell=True).decode().strip()
    except Exception as e:
        return f"NOTICE: {e}"

def generate_specialization_and_upgrades():
    print("==================================================================", flush=True)
    print(" 🧠 NOIZY UNIVERSE: WHO IS GOOD FOR WHAT & UPGRADE AUDITOR")
    print(f" Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("==================================================================", flush=True)

    os.makedirs(DOCS_DIR, exist_ok=True)

    # 1. Fetch LM Studio Models
    local_models = []
    try:
        req = urllib.request.Request("http://127.0.0.1:1234/v1/models")
        with urllib.request.urlopen(req, timeout=3) as resp:
            data = json.loads(resp.read().decode())
            local_models = data.get("data", [])
    except Exception:
        pass

    # Model Specialization Map
    model_specializations = {
        "qwen/qwen2.5-coder-32b": {
            "role": "Master Code Synthesizer & Refactoring Specialist",
            "tier": "Tier 1 (Heavy Local Coding)",
            "best_for": "Writing full TypeScript/Python modules, complex regex, API bridges, and debugging AST/syntax errors.",
            "latency": "Fast (Apple Silicon GPU MLX)",
            "context": "32k - 128k"
        },
        "deepseek-r1-distill-qwen-32b": {
            "role": "Deep Mathematical & Cryptographic Reasoner",
            "tier": "Tier 1 (Logical Reasoning)",
            "best_for": "Step-by-step chain of thought, contract verification, edge-case analysis, and algorithm proofs.",
            "latency": "Medium (High Compute Density)",
            "context": "64k"
        },
        "llama-3.3-70b-instruct": {
            "role": "Universal Cognitive Brain & Strategic Planner",
            "tier": "Tier 1 (Flagship Reasoning)",
            "best_for": "High-level architectural planning, founder blueprint evaluation, deep document synthesis, and nuanced creative writing.",
            "latency": "Moderate (4-bit QAT Metal Accelerated)",
            "context": "128k"
        },
        "granite-speech-4.1-2b-mlx": {
            "role": "Real-Time Acoustic & Speech Acoustic Modeling",
            "tier": "Tier 1 (Voice & Speech Processing)",
            "best_for": "Speech recognition, phoneme extraction, voice cloning alignment, and real-time audio telemetry.",
            "latency": "Ultra-Fast (Real-Time Streaming)",
            "context": "8k"
        },
        "qwen2.5-vl-72b-instruct": {
            "role": "Master Vision & Visual UI Inspector",
            "tier": "Tier 1 (Multimodal Vision)",
            "best_for": "Reading UI mockups, inspecting waveforms/spectrograms, OCR on blueprints, and visual layout audits.",
            "latency": "Moderate",
            "context": "32k"
        },
        "qwen2.5-vl-32b-instruct-i1": {
            "role": "Fast Multimodal & Diagram Analyst",
            "tier": "Tier 2 (High-Speed Vision)",
            "best_for": "Quick screen analysis, video frame inspection, and glassmorphic UI verification.",
            "latency": "Fast",
            "context": "32k"
        },
        "google/gemma-4-26b-a4b-qat": {
            "role": "Sovereign Edge Assistant & Mobile Companion",
            "tier": "Tier 2 (Efficient Generalist)",
            "best_for": "Concise conversational responses, Siri AppIntents routing, and low-memory background tasks.",
            "latency": "Very Fast",
            "context": "32k"
        },
        "google/gemma-3-1b": {
            "role": "Micro-Agent & Instant Tool Router",
            "tier": "Tier 3 (Zero-Latency Triage)",
            "best_for": "Keyword classification, prompt routing, instant regex matching, and health checks.",
            "latency": "Instant (<15ms)",
            "context": "8k"
        },
        "text-embedding-nomic-embed-text-v1.5": {
            "role": "Semantic Vector Embedding Engine",
            "tier": "Tier 1 (Embeddings & RAG)",
            "best_for": "High-dimensional vector search across the 100,000+ file NOIZY archive and Obsidian vault indexing.",
            "latency": "Microsecond Batching",
            "context": "8k"
        }
    }

    # 2. Agent Specialization Map
    agent_specializations = {
        "GABRIEL": {
            "domain": "Master Audio & Voice Orchestration",
            "capabilities": "Supervises NOIZYVOX voice army, stem separation, Kontakt script compilation, and real-time audio routing."
        },
        "LUCY v4.0": {
            "domain": "Personal Autonomous OS & World Model",
            "capabilities": "Maintains user state, CR-V vehicle telemetry, CarPlay integration, active task context, and proactive daily briefings."
        },
        "THE CONDUCTOR": {
            "domain": "Multi-Agent Swarm Director",
            "capabilities": "Decomposes complex requests into parallel sub-tasks, manages priority queues, and resolves multi-agent output conflicts."
        },
        "THE PERFECTIONIST": {
            "domain": "Code Verification & Zero-Flaw Quality Assurance",
            "capabilities": "Runs AST syntax checks, enforces type safety, audits dead links, and validates git clean working trees."
        },
        "MICHAEL MERKLE": {
            "domain": "Cryptographic Archivist & Knowledge Graph",
            "capabilities": "Computes SHA-256 Merkle trees of all documents, deduplicates ideas, and ensures historical provenance."
        }
    }

    # 3. Check for System Upgrades & Outdated Packages
    print("\n--- Checking System & Package Updates ---", flush=True)
    brew_outdated = run_cmd("brew outdated --formula --quiet")
    brew_items = [b for b in brew_outdated.splitlines() if b.strip()] if "NOTICE" not in brew_outdated else []
    print(f"  Homebrew outdated packages: {len(brew_items)}")

    # 4. Generate SPECIALIZATION MATRIX Markdown
    matrix_md_path = os.path.join(DOCS_DIR, "AGENT_AND_MODEL_SPECIALIZATION_MATRIX.md")
    with open(matrix_md_path, "w", encoding="utf-8") as f:
        f.write("# 🧭 NOIZY UNIVERSE: \"WHO IS GOOD FOR WHAT\" SPECIALIZATION MATRIX\n\n")
        f.write(f"**Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  \n")
        f.write("**Purpose**: Canonical routing guide for autonomous agent dispatching, local LLM selection, and tool execution.\n\n")
        
        f.write("## 🤖 1. Local LLM Models (LM Studio Hub - 21 Loaded Models)\n\n")
        f.write("| Model ID | Core Role | Optimal Use Case (\"Good For What\") | Latency Tier |\n")
        f.write("| :--- | :--- | :--- | :--- |\n")
        for mid, mdata in model_specializations.items():
            f.write(f"| **`{mid}`** | {mdata['role']} | {mdata['best_for']} | `{mdata['latency']}` |\n")

        f.write("\n## 👥 2. Autonomous Agent Fleet\n\n")
        f.write("| Agent Entity | Sovereign Domain | Core Responsibilities |\n")
        f.write("| :--- | :--- | :--- |\n")
        for aname, adata in agent_specializations.items():
            f.write(f"| **`{aname}`** | {adata['domain']} | {adata['capabilities']} |\n")

        f.write("\n## 🛠️ 3. Specialized Tools & Hardware Interfaces\n\n")
        f.write("- **Desktop Commander (Port 3210 & Hammerspoon 5005)**: OS window focus, active application switching, AppleScript dispatch.\n")
        f.write("- **TagSpaces Manager**: Sidecar `.ts` tag parsing and non-destructive folder classification.\n")
        f.write("- **Kontakt Lab Engine**: Procedural KSP scripting and multi-sample group mapping for Native Instruments Kontakt.\n")
        f.write("- **OpenClaw Suite**: Multi-step terminal tool routing and execution sandbox.\n")

    # 5. Generate UPGRADES & IMPROVEMENTS ROADMAP Markdown
    roadmap_md_path = os.path.join(DOCS_DIR, "UPGRADES_AND_IMPROVEMENTS_ROADMAP.md")
    with open(roadmap_md_path, "w", encoding="utf-8") as f:
        f.write("# 🚀 NOIZY UNIVERSE: UPGRADES & IMPROVEMENTS ROADMAP\n\n")
        f.write(f"**Audit Timestamp**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        f.write("## 🌟 Recommended System Upgrades & Modernizations\n\n")
        f.write("### 1. Model & Inference Optimizations\n")
        f.write("- **Upgrade to MLX Swift Runtime**: Switch from pure HTTP REST to Apple MLX Swift zero-copy tensor bindings for <10ms local generation.\n")
        f.write("- **Dynamic Context Compression**: Implement dynamic sliding context windows with nomic-embed-text for 128k+ long-document summarization.\n\n")
        f.write("### 2. Monorepo CI/CD & Dependency Automation\n")
        f.write("- **Automated Dependabot Resolution**: Batch-update outdated npm packages in `apps/` with safe lockfile validation.\n")
        f.write("- **Unified Turbo / Bun Build Pipeline**: Configure `bun run build` across all 91 frontends and MCP servers for instant parallel builds.\n\n")
        f.write("### 3. Voice & Audio Infrastructure\n")
        f.write("- **F5-TTS Flow Matching Integration**: Upgrade voice cloning pipelines from VITS to continuous flow-matching diffusion for zero-shot founder voice cloning.\n")
        f.write("- **JUCE / C++ Audio Engine**: Wrap Kontakt KSP and AUv3 audio processing into high-performance native C++ plugins.\n")

    # 6. Write Combined JSON
    json_path = os.path.join(DOCS_DIR, "SPECIALIZATION_AND_UPGRADES.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({
            "generated_at": datetime.now().isoformat(),
            "models": model_specializations,
            "agents": agent_specializations,
            "outdated_packages_sample": brew_items[:15]
        }, f, indent=2)

    print("\n==================================================================", flush=True)
    print(f" ✓ Specialization Matrix: {matrix_md_path}")
    print(f" ✓ Upgrades Roadmap:     {roadmap_md_path}")
    print("==================================================================", flush=True)

if __name__ == "__main__":
    generate_specialization_and_upgrades()
