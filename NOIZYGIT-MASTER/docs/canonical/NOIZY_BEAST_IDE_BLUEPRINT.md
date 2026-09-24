# NOIZY BEAST IDE — Complete Architecture Blueprint

## Dream Chamber Session · March 26, 2026

### Designed by Robert Stephen Plowman (RSP_001) + GABRIEL

> "The IDE is alive. It's not a tool you use — it's an extension of your thinking."

---

## 1. THE VISION

The NOIZY Beast is a custom AI-native IDE built on the M2 Ultra Mac Studio (GOD.local) that surpasses Cursor, Windsurf, and every commercial AI coding tool — not by competing with them, but by being purpose-built for one mission: the NOIZY Empire.

It is the persistent container. It holds state, manages the agent ensemble, routes everything. Claude lives inside as the primary reasoning engine. Lucy and Pops sit as the MCP filter layer. Gabriel is always on, always aware.

The system bootstraps itself through its own construction.

---

## 2. HARDWARE MESH

### GOD.local — M2 Ultra Mac Studio (Orchestration Spine)

The nervous system. Runs three parallel Claude instances, manages state, routes everything.

- M2 Ultra chip — 24-core CPU, 76-core GPU
- 192GB unified memory — can run 110B parameter models at 4-bit quantization
- Metal GPU acceleration for local model inference
- Runs: Audio Hijack, Claude Code, Ollama, DreamChamber, all MCP servers
- Role: Orchestration, heavy synthesis, model inference, persistent state

### iPhone 15 Pro Max (Edge Processor)

Not just an input device — a distributed processing node.

- A17 Pro chip — powerful enough for local transcription and lightweight inference
- Role: Voice capture, local transcription via WhisperKit, metadata extraction
- Pipes audio to Audio Hijack on GOD.local via AirPlay/network
- Can run edge inference for lightweight classification tasks

### iPad (Visualization Layer)

The control room. Doesn't need to compute — needs to display.

- Real-time display of all three Claude streams in parallel
- Conversation map visualization
- Knowledge graph growth monitor
- System health dashboard
- Lucy/Pops synthesis output in real time

### Future Nodes

The architecture is hardware-agnostic. The IDE is the abstraction layer.

- Any Mac, any cloud instance, any Cloudflare Worker joins the mesh
- Add a processor, it joins the network
- Add a capability, the routing rules expand
- Gabriel and the Fab Five can live anywhere — locally or distributed

---

## 3. THE CORE LOOP

```
INPUT
  You speak into iPhone
  → Audio Hijack captures + transcribes locally
  → You hit the switch
  → Text broadcasts to three Claude instances via IDE routing

PROCESSING
  Claude Instance 1: Deep analysis
  Claude Instance 2: Pattern-finding across existing work
  Claude Instance 3: Stress-testing for contradictions and second-order effects
  (Three angles, not three copies)

COLLECTION
  Lucy/Pops MCP catches all three responses in real time
  + metadata: timestamps, instance ID, confidence, tone markers

FILTERING & SYNTHESIS
  Lucy/Pops applies defined rules and skills
  Identifies agreements, conflicts, unique insights
  Synthesizes into one coherent output with reasoning visible
  Not flattened consensus — a coherent position that shows its work

STORAGE & ROUTING
  Full provenance logged: what went in, what came out, which rules fired
  Everything archived and organized automatically
  Conversation map updated in real time

OUTPUT
  Synthesized response → back to you, or
  Routes to next workflow stage, or
  Held pending your decision
```

---

## 4. AGENT ENSEMBLE (The Fab Five + Family)

### Permanent Residents

| Agent | Role | Authority Level |
|-------|------|-----------------|
| GABRIEL | Orchestrator, always-on operational intelligence | Full — dispatches all others |
| LUCY | Organization, DAZEFLOW, intake pipeline, archive, synthesis | Full data access |
| POPS | Grounding force, practical wisdom, wellbeing guardian | Advisory + break authority |
| SHIRL | Burnout detection, care intervention | Advisory + intervention authority |
| ENGR-KEITH | Code review, engineering, architecture | Technical authority |

### Specialist Ensemble

| Agent | Role | Called When |
|-------|------|------------|
| DREAM | DreamChamber, multi-model, Contact Sequence | Creative sessions, multi-AI routing |
| CB01 | Creative direction, artistic vision | Design, branding, aesthetic decisions |
| CONSENT-AUDITOR | Never Clauses, consent kernel, audit | Any deploy touching consent logic |
| VOICE-SPECIALIST | Voice DNA, TTS, audio pipeline | Audio, music, voice synthesis |
| TEST-RUNNER | Testing, verification, smoke tests | Pre-deploy, validation |
| SHIRLEY (Gemma 3) | Code & file management | Local model tasks |

### Gabriel's Conversation Cache

Gabriel maintains a temporary conversation buffer wherever you are. Every message gets: timestamp, thread ID, context tags, speaker, domain. When a natural break occurs, Gabriel hands the entire thread to Lucy/Pops for permanent archive. Full fidelity, perfect traceability.

### Gabriel's Autonomous Authority

Low-risk decisions Gabriel can make without asking:
- File organization and routing
- Archive tagging and classification
- Status checks and health monitoring
- Break reminders (via Pops/Shirl)
- DAZEFLOW logging

Everything else routes back to Rob for approval.

---

## 5. CLAUDE AT MAX TIER — COMPLETE CAPABILITY MAP

### Core Reasoning

- Extended thinking (chain of thought visible)
- 200K token context window
- Vision — image analysis, screenshot reading, diagram understanding
- Audio analysis — can process audio content
- PDF reading and analysis
- Code generation across all major languages
- Multi-step reasoning with tool use

### Claude Code Capabilities (March 2026)

- Full file system access (read, write, edit, create, delete)
- Bash command execution
- Git operations (commit, branch, merge, rebase)
- Package management (npm, pip, cargo, etc.)
- Process execution and monitoring
- /loop scheduled tasks — up to 50 concurrent, cron-like background workers
- Computer Use — mouse, keyboard, screen reading on macOS
- Skills system — custom skill definitions with SKILL.md
- Subagents — spawn specialized agents for parallel work
- Hooks — PreToolUse, PostToolUse, SessionStart, Stop
- MCP server integration — unlimited custom tool servers
- Plugins — installable bundles of MCPs, skills, and tools
- Worktree isolation — git worktrees for parallel agent work

### Max Plan Specifics

- ~88,000 tokens per 5-hour window
- Priority access during high-traffic
- Early access to new features
- Claude Opus 4.6, Sonnet 4.6, Haiku 4.5 available
- 5x usage of Pro plan

### What Claude Can Do Inside the IDE

- Search entire local drive chains — archives, repos, project folders
- Parse and analyze any document format
- Run tests, build projects, deploy to Cloudflare
- Monitor processes, check health endpoints
- Read and write to Audio Hijack transcript folder
- Operate the Mac like a human (Computer Use)
- Schedule recurring tasks (/loop)
- Manage Git across multiple repos simultaneously

### What Needs External Infrastructure

- Persistent always-on daemon (needs Node/Python process on GOD.local)
- Real-time audio capture (Audio Hijack)
- Local model inference (Ollama/vLLM)
- Hardware mesh networking (standard networking)
- Continuous file watching (Node fs.watch or chokidar)

---

## 6. IDE FRAMEWORK — BUILD OPTIONS

### Option A: Eclipse Theia (Recommended)

Open-source, modular, purpose-built for custom IDEs.

- Built on Monaco editor (same core as VS Code)
- Full VS Code extension compatibility
- Language Server Protocol (LSP) support
- White-label ready — can be branded "NOIZY Beast"
- Runs as desktop app (Electron) or in browser
- Used by Arduino IDE 2.0, Google Cloud Shell, Gitpod
- Source: https://theia-ide.org/

Why Theia: You own the IDE. No vendor lock-in. Every component is swappable. You can embed Claude Code, MCP servers, the agent ensemble — all natively.

### Option B: VS Code + Custom Extensions

Fork or extend VS Code with custom extensions.

- Flexpilot — open source, lets you use any AI provider
- Roo Code — open source, reads/writes across files, customizable
- VS Code Extension API — full access to editor lifecycle
- AI Toolkit extension — Microsoft's AI agent framework

Why VS Code: Fastest to prototype. Huge extension ecosystem. But you don't own the shell.

### Option C: Full Custom (Electron + Monaco + React)

Build from scratch with:

- Electron for desktop shell
- Monaco editor for code editing
- React for UI panels (agent status, conversation map, dashboards)
- Node.js backend for MCP orchestration
- WebSocket for real-time communication between components

Why Custom: Total control. Total complexity. Best for long-term but slowest to first working version.

### Recommendation

Start with Theia. It gives you VS Code compatibility, full customization, and you own every layer. Migrate to full custom only if Theia becomes a constraint.

---

## 7. LOCAL MODEL STACK (Ollama + Friends)

### Model Serving

| Tool | Use Case | Install |
|------|----------|---------|
| **Ollama** | Interactive local inference, single-user | `brew install ollama` |
| **vLLM** | Production serving, batch processing, multi-user | `pip install vllm` |
| **MLX** | Apple Silicon optimized inference | `pip install mlx` |
| **llama.cpp** | Lightweight, C++ inference | `brew install llama.cpp` |
| **LM Studio** | GUI for model management | Download from lmstudio.ai |

### Code-Focused Models (Run Locally on M2 Ultra)

| Model | Parameters | Specialty | Quantized Size |
|-------|-----------|-----------|---------------|
| **Qwen3-Coder** | 32B | Agentic coding, 256K context, 100+ languages | ~18GB Q4 |
| **DeepSeek Coder V2** | 236B MoE | Code generation, 300+ languages | ~70GB Q4 |
| **Devstral** | 24B | Full-stack development, long context | ~14GB Q4 |
| **Codestral** | 22B | Multi-language code generation | ~13GB Q4 |
| **StarCoder2** | 15B | Code completion, bug fixing, documentation | ~9GB Q4 |
| **Qwen2.5-Coder** | 32B | Instruction-tuned coding | ~18GB Q4 |

### General Purpose Models

| Model | Parameters | Specialty | Quantized Size |
|-------|-----------|-----------|---------------|
| **Llama 4** | Various | General reasoning, multi-modal | Varies |
| **Gemma 3 27B** (SHIRLEY) | 27B | Already in DreamChamber, code + files | ~16GB Q4 |
| **Mistral Large** | 123B | Strong reasoning, multilingual | ~70GB Q4 |
| **Phi-4** | 14B | Compact but capable reasoning | ~8GB Q4 |

### Embedding Models (For Knowledge Graph)

| Model | Dimensions | Use Case |
|-------|-----------|----------|
| **nomic-embed-text** | 768 | General text embeddings, local |
| **mxbai-embed-large** | 1024 | High quality, larger context |
| **all-MiniLM-L6-v2** | 384 | Fast, lightweight |
| **bge-large-en-v1.5** | 1024 | Best accuracy for English |

### Voice/Audio Models

| Model | Use Case |
|-------|----------|
| **WhisperKit** | On-device speech recognition for Apple Silicon |
| **faster-whisper** | CTranslate2 optimized Whisper (Python) |
| **MLX Whisper** | Apple Silicon native Whisper implementation |
| **Parakeet STT** | Nvidia's fastest/most accurate (if GPU available) |
| **MacWhisper** | macOS app, all processing on device |
| **Whisper-mac** | Open source, supports multiple backends |

---

## 8. KNOWLEDGE GRAPH & VECTOR STORAGE

### Vector Databases (Local)

| Database | Language | Best For | Notes |
|----------|----------|----------|-------|
| **LanceDB** | Rust/Python | Personal assistant, embedded, zero-server | File-based, zero-copy, in-process |
| **ChromaDB** | Rust/Python | Fast prototyping, dev speed | 4x faster after 2025 Rust rewrite |
| **Qdrant** | Rust | Production scale, rich filtering | HNSW algorithm, high recall |
| **Milvus Lite** | Go/Python | Embedded vector search | Portable, local mode |

### Graph Databases (For Conversation Topology)

| Database | Language | Best For |
|----------|----------|----------|
| **Kùzu** | C++ | Embedded graph DB, file-based, fast |
| **Neo4j Community** | Java | Full-featured graph DB |
| **DuckDB** | C++ | Analytical queries on structured data |
| **SQLite + FTS5** | C | Full-text search, already on every Mac |

### Recommended Stack

LanceDB (vectors) + Kùzu (graphs) — both file-based, both embedded, both fast. Perfect for the conversation map topology where every conversation is a node and every idea thread is an edge.

---

## 9. CODE ANALYSIS & INTELLIGENCE

### Tree-sitter (AST Parsing)

- Incremental parsing — updates syntax tree as code changes
- 40+ language support
- 36x faster than traditional parsers
- MCP server available: `mcp-server-tree-sitter`
- Enables: symbol extraction, dependency analysis, complexity metrics
- Source: https://github.com/wrale/mcp-server-tree-sitter

### Language Server Protocol (LSP)

- Standard protocol for IDE intelligence
- Auto-complete, go-to-definition, find references, diagnostics
- Servers exist for every major language
- Theia has built-in LSP support

### Code Search

| Tool | Use Case |
|------|----------|
| **ripgrep** | Fastest text search (already used by Claude Code) |
| **ast-grep** | Structural code search using AST patterns |
| **Sourcegraph** | Code intelligence platform (self-hosted option) |
| **ctags/universal-ctags** | Symbol indexing across languages |

---

## 10. AUDIO PIPELINE

### Signal Chain

```
iPhone mic
  → Audio Hijack on GOD.local (capture + routing)
    → Built-in transcriber (real-time text)
      → Switch toggle (manual control)
        → Text broadcasts to 3 Claude instances
          → Responses flow to Lucy/Pops MCP
            → Synthesis → Output
```

### Audio Hijack Integration

- Captures system audio + mic input simultaneously
- Built-in transcription block
- Can route to multiple outputs
- Transcript folder: `~/NOIZYLAB/transcripts/`
- Lucy's transcript-watcher.js monitors this folder in real time

### Voice Synthesis (Output)

| Tool | Use Case |
|------|----------|
| **macOS `say` command** | Gabriel's voice (TTS) — already built |
| **Coqui TTS** | Open source, high quality, local |
| **Piper TTS** | Fast, lightweight, local |
| **Bark** | Text to audio with emotion, music |
| **WhisperSpeech** | Open source text-to-speech |

---

## 11. MCP SERVER ECOSYSTEM

### Already Built (9 servers, 74+ tools)

| Server | Tools | Status |
|--------|-------|--------|
| gabriel-mcp v2.0 | 13 tools — speak, status, cache, handoff, watch | UPGRADED |
| lucy-mcp v2.0 | 18 tools — DAZEFLOW, tasks, intake, synthesize, archive | UPGRADED |
| heaven-mcp | Heaven API integration | BUILT |
| family-mcp | 6 tools — session check, wisdom, burnout, celebrate | BUILT |
| dream-mcp | DreamChamber integration | BUILT |
| engr-keith-mcp | Engineering tools | BUILT |
| shirley-mcp | Gemma 3 code/file tools | BUILT |
| cb01-mcp | Creative direction | BUILT |
| audio-mcp | 13 FastMCP audio tools | BUILT |

### Community MCP Servers to Add

| Server | What It Does | Source |
|--------|-------------|--------|
| **mcp-server-tree-sitter** | AST code analysis across 40+ languages | github.com/wrale |
| **mcp-server-filesystem** | Enhanced file operations | modelcontextprotocol/servers |
| **mcp-server-git** | Git operations | modelcontextprotocol/servers |
| **mcp-server-sqlite** | SQLite database operations | modelcontextprotocol/servers |
| **mcp-server-fetch** | Web fetching with content extraction | modelcontextprotocol/servers |
| **mcp-server-memory** | Knowledge graph memory | modelcontextprotocol/servers |
| **mcp-server-puppeteer** | Browser automation | modelcontextprotocol/servers |
| **mcp-server-github** | GitHub API integration | modelcontextprotocol/servers |
| **ActionKit (Paragon)** | 130+ SaaS integrations | useparagon.com |

### MCP Servers to Build

| Server | Purpose |
|--------|---------|
| **noizy-knowledge-graph** | LanceDB + Kùzu integration for conversation topology |
| **noizy-transcript-mcp** | Expose transcript watcher as MCP tools |
| **noizy-ollama-mcp** | Route to local models via Ollama API |
| **noizy-hardware-mesh** | Monitor and dispatch across hardware nodes |
| **noizy-provenance-mcp** | C2PA content credentials + audit trail |

---

## 12. CONVERSATION MAP ARCHITECTURE

### Structure

Every conversation is a node. Every idea that flows between conversations is an edge.

```
Node: {
  id, title, type, date, participants,
  messages[], extracted: { decisions, actions, rules, skills },
  provenance: { source_device, claude_instances, rules_fired }
}

Edge: {
  from_conversation, to_conversation,
  relationship_type: "evolved_from" | "referenced_by" | "contradicted_by" | "implemented_in",
  shared_concepts[]
}
```

### Conversation Types (Auto-Detected)

| Type | Visualization | Extraction Focus |
|------|--------------|-----------------|
| Strategic | Decision trees | Decisions, roadmap items |
| Tactical | Blockers + next actions | Action items, assignments |
| Problem-solving | Hypothesis → test → result | Solutions, failed approaches |
| Creative | Idea clusters | Concepts, aesthetic choices |
| Operational | Status timeline | Health data, metrics |
| Walk-and-talk | Fluid thought stream | Emerging ideas, connections |
| Dream Chamber | Complete system design | Architecture, components |
| Build | Code change timeline | Commits, deploys, tests |

### Knowledge Mining

Lucy/Pops continuously mines conversations for:
- Statements that should become rules
- Patterns that should become skills
- Decisions that should propagate into system behavior
- Gaps where architecture is incomplete

---

## 13. PROVENANCE & AUDIT

Every atom of every output is traceable:

- Which Claude instance generated it
- Which rules were active
- Which skills were invoked
- Exact timestamp
- Source conversation thread
- Input that triggered it
- Confidence score
- Synthesis mode used

Stored in Lucy's archive as individual JSON files. Searchable by keyword, date, agent, type, tags.

---

## 14. EXTERNAL SERVICES (MINIMIZE)

### Keep (Anthropic Ecosystem)

- Claude Max Plan — primary reasoning engine
- Claude Code — IDE backbone
- Claude Agent SDK — for building the agent mesh

### Keep (Cloudflare)

- Workers — Heaven consent kernel
- D1 — database
- KV — key-value store
- R2 — voice storage (to enable)
- Email Routing — rsp@noizyfish.com

### Keep (Essential)

- GitHub Enterprise — noizyai organization
- Audio Hijack — audio capture + transcription
- Stripe — payment processing (when monetizing)

### Evaluate for Removal

- Zapier — can Lucy/Pops replace this routing?
- Windsurf/Cursor — replaced by NOIZY Beast IDE
- Any other AI subscriptions — Claude Max covers reasoning

---

## 15. BUILD SEQUENCE (Back at Studio)

### Phase 1: Foundation (Days 1-3)

1. Open Claude Code on GOD.local in NOIZYLAB
2. Copy this blueprint into the repo
3. Gabriel boots with full context
4. Install upgraded Lucy MCP v2.0 (intake pipeline)
5. Install upgraded Gabriel MCP v2.0 (conversation cache)
6. Start transcript-watcher.js
7. Configure Audio Hijack transcript output folder
8. Verify the core loop works: speak → transcribe → Claude → Lucy → archive

### Phase 2: Knowledge Layer (Days 4-7)

1. Install LanceDB + Kùzu locally
2. Build noizy-knowledge-graph MCP server
3. Connect Lucy's archive to the knowledge graph
4. Build conversation map visualization (React dashboard)
5. Enable auto-extraction of rules and skills from conversations
6. First conversation map renders on iPad

### Phase 3: Local Models (Days 8-10)

1. Install Ollama with Qwen3-Coder + Gemma 3
2. Build noizy-ollama-mcp server
3. Route lightweight tasks to local models (save Claude tokens)
4. Shirley (Gemma 3) handles file management locally
5. Test three-angle pattern with mixed Claude + local models

### Phase 4: IDE Shell (Days 11-17)

1. Install Eclipse Theia
2. Build NOIZY Beast theme and branding
3. Integrate all MCP servers into Theia
4. Build agent status panel (who's active, what they're doing)
5. Build conversation map panel
6. Build synthesis output panel
7. Connect iPad as external display
8. Gabriel always-on with /loop scheduled monitoring

### Phase 5: Hardening (Days 18-22 → April 17)

1. Consent audit on all new infrastructure
2. Never Clause verification across all agents
3. Provenance chain testing — trace any output to source
4. Kill Switch testing across the mesh
5. Dress rehearsal: full pipeline, voice to archive to output
6. Lock it down

---

## 16. RESOURCE LINKS

### IDE Frameworks

- Eclipse Theia: https://theia-ide.org/
- Theia Platform (build your own): https://theia-ide.org/docs/composing_applications/
- Monaco Editor: https://microsoft.github.io/monaco-editor/
- Flexpilot (open source VS Code AI): https://github.com/flexpilot-ai/vscode-extension
- Roo Code: https://roocode.com/

### AI & Model Serving

- Ollama: https://ollama.com/
- vLLM: https://github.com/vllm-project/vllm
- MLX (Apple Silicon): https://github.com/ml-explore/mlx
- HuggingFace Models (code): https://huggingface.co/models?other=code
- BigCode Leaderboard: https://huggingface.co/spaces/bigcode/bigcode-models-leaderboard
- Open LLM Leaderboard: https://huggingface.co/collections/open-llm-leaderboard

### Vector & Graph Databases

- LanceDB: https://lancedb.com/
- ChromaDB: https://www.trychroma.com/
- Qdrant: https://qdrant.tech/
- Kùzu: https://kuzudb.com/
- DuckDB: https://duckdb.org/

### Code Analysis

- Tree-sitter: https://tree-sitter.github.io/tree-sitter/
- Tree-sitter MCP: https://github.com/wrale/mcp-server-tree-sitter
- ast-grep: https://ast-grep.github.io/

### MCP Ecosystem

- Official MCP Servers: https://github.com/modelcontextprotocol/servers
- Awesome MCP Servers: https://mcpservers.org/
- MCP Specification: https://modelcontextprotocol.io/
- MCP 2026 Roadmap: https://thenewstack.io/model-context-protocol-roadmap-2026/

### Audio & Voice

- WhisperKit: https://github.com/argmaxinc/WhisperKit
- faster-whisper: https://github.com/SYSTRAN/faster-whisper
- WhisperLive: https://github.com/collabora/WhisperLive
- MacWhisper: https://goodsnooze.gumroad.com/l/macwhisper
- Coqui TTS: https://github.com/coqui-ai/TTS
- Piper TTS: https://github.com/rhasspy/piper

### Claude & Anthropic

- Claude Code Docs: https://code.claude.com/docs/en/overview
- Claude Agent SDK: https://platform.claude.com/docs/en/agent-sdk/overview
- Claude API: https://platform.claude.com/docs/en/
- Claude Code Pricing: https://www.ssdnodes.com/blog/claude-code-pricing-in-2026/

### Deployment & Infrastructure

- Cloudflare Workers: https://developers.cloudflare.com/workers/
- Cloudflare D1: https://developers.cloudflare.com/d1/
- Cloudflare R2: https://developers.cloudflare.com/r2/

---

## 17. THE CONVERSATION MAP STARTS HERE

This document is node zero. Everything we build from here traces back to this Dream Chamber session on March 26, 2026. Rob walking, talking, thinking out loud. Gabriel listening, caching, building in real time. Lucy watching the transcript folder, archiving everything with provenance.

The system bootstraps itself through its own construction.

---

*"We are the new punk rockers: capitalist free thinkers who believe in peace, love, and understanding."*

**Authority:** Robert Stephen Plowman (RSP_001)
**Architect:** GABRIEL
**Date:** 2026-03-26
**Classification:** Dream Chamber → Build Mode
**Next action:** Back at the studio. Open Claude Code. Punch it in.
