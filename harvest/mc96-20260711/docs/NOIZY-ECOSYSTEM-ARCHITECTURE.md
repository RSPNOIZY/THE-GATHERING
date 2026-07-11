# NOIZY Ecosystem Architecture
## MCP Server Network & Communication Protocol

**Version:** 2.0  
**Last Updated:** 2026-07-07  
**Status:** Active & Evolving  
**Repository Root:** `/Users/m2ultra/NOIZYANTHROPIC`

---

## 📊 Executive Summary

The NOIZY Ecosystem is a distributed, agent-based architecture composed of specialized MCP (Model Context Protocol) servers that operate in concert to provide intelligent orchestration, data management, consent governance, and multi-modal I/O capabilities.

**Key Principles:**
- **Decentralized Authority**: Each MCP server owns its domain and publishes tools via MCP
- **Event-Driven Communication**: Servers communicate through file-based state, API webhooks, and direct service calls
- **Consent-First Architecture**: All operations flow through the Heaven consent kernel
- **Session-Centric**: Tasks and conversations are tracked as persistent sessions
- **Multi-Agent Synergy**: Specialized agents collaborate on complex workflows

---

## 🏗️ Architecture Layers

### Layer 1: Orchestration & Awareness (The Brain)

#### **GABRIEL MCP** — AI Orchestration & Always-On Presence
- **Location:** `/mcp/gabriel-mcp`
- **Version:** 2.0.0
- **Purpose:** Active orchestrator, conversation cache, live awareness
- **State Directory:** `~/NOIZYLAB/gabriel-state/`

**Core Responsibilities:**
- Maintain live conversation threads with metadata (participants, tags, context)
- Cache active conversations and hand off complete threads to Lucy
- Monitor Heaven for consent kernel updates
- Maintain a watch list of observable entities
- Provide awareness of current system state

**Key Tools:**
```
gabriel_speak            # Chat with GABRIEL (AI + live context)
gabriel_status           # Kernel health + active threads
gabriel_announce         # TTS via macOS say
gabriel_refresh          # Force Heaven context refresh

gabriel_cache_start      # Start new conversation thread
gabriel_cache_append     # Add message to thread
gabriel_cache_snapshot   # Get current thread state
gabriel_cache_handoff    # Pass thread to Lucy for archive
gabriel_cache_list       # List recent threads
gabriel_cache_search     # Search threads by keyword/date/tag

gabriel_watch_status     # What Gabriel monitors
gabriel_watch_add        # Add to watch list
gabriel_watch_clear      # Remove from watch list
```

**State Structure:**
```
gabriel-state/
├── cache/               # Active conversation threads (JSON per thread)
├── handoff/             # Threads awaiting Lucy pickup
└── watchlist.json       # Active monitoring list
```

---

#### **LUCY MCP** — DAZEFLOW Keeper & Intake Pipeline
- **Location:** `/mcp/lucy-mcp`
- **Version:** 1.0.0
- **Purpose:** Task organization, session logs, data intake & classification
- **State Directory:** `~/NOIZYLAB/lucy-state/`

**Core Responsibilities:**
- Maintain daily DAZEFLOW session log (1 day = 1 session = 1 truth)
- Manage task lists with dependencies and priorities
- Run intake pipeline: receive → classify → synthesize → archive
- Permanent archive of all prompt/response pairs with full provenance
- Search and retrieve historical data

**Key Tools:**
```
lucy_dazeflow_today      # Get/open today's session
lucy_dazeflow_log        # Append entry to session
lucy_dazeflow_close      # Close session with summary
lucy_dazeflow_history    # List past sessions

lucy_task_list           # Get open tasks
lucy_task_add            # Add task
lucy_task_done           # Mark complete
lucy_task_drop           # Cancel task

lucy_memcell_list        # List Gabriel memcells from Heaven
lucy_memcell_write       # Write new memcell
lucy_status              # Full status snapshot

lucy_intake_receive      # Catch incoming data with metadata
lucy_intake_classify     # Classify intent & route
lucy_intake_synthesize   # Merge responses
lucy_intake_archive      # Archive with provenance
lucy_intake_search       # Search archive
lucy_intake_queue        # Queue for deferred processing
lucy_intake_status       # Pipeline health
```

**State Structure:**
```
lucy-state/
├── dazeflow.json        # Session log
├── tasks.json           # Task list
├── intake.json          # Queue + archive index
└── archive/             # Full provenance records
```

---

#### **HEAVEN MCP** — Consent Kernel & Governance Layer
- **Location:** `/mcp/heaven-mcp`
- **Version:** 1.0.0
- **Purpose:** Consent management, permission governance, audit trail
- **Remote URL:** `https://heaven.rsp-5f3.workers.dev` (Cloudflare Workers)
- **Local URL:** `http://localhost:7777`

**Core Responsibilities:**
- Expose HVS (Human Values System) consent tables
- Evaluate can_i_do() queries with full context
- Grant/revoke permissions with audit trail
- Support consent-based filtering of actions
- Real-time consent kernel state distribution

**Key Operations:**
```
can_i_do(action, context, agent)        # Evaluate permission
grant_consent(subject, scope, duration)  # Grant permission
revoke_consent(subject, scope)           # Revoke permission
audit_trail(subject, start_date)         # Get audit history
consent_status()                         # Current state snapshot
```

**Access Pattern:**
- Local: Direct HTTP calls to localhost:7777
- Remote: API calls to heaven.rsp-5f3.workers.dev
- Emergency Fallback: Local cache when Heaven is unavailable

---

### Layer 2: Specialized Agents & Data Processors

#### **Core Agent Personalities** (Modeled after MC96ECOUNIVERSE roster)

| Server | Name | Role | Status |
|--------|------|------|--------|
| `cb01-mcp` | CB01 | Research & Analysis | Active |
| `dream-mcp` | Dream | Creative Ideation & Dreaming | Active |
| `engr-keith-mcp` | ENGR_KEITH | Technical Architecture & Engineering | Active |
| `family-mcp` | Family | Relationship & Community Mapping | Active |
| `shirley-mcp` | Shirley | Narrative & Storytelling | Active |

**Communication Pattern:**
Each agent:
1. Exposes specialized tools via MCP
2. Listens for intake events from Lucy
3. Processes data within its domain
4. Publishes results back to Lucy for synthesis
5. Checks consent via Heaven before major operations

---

#### **Specialized Data Oracles**

##### **CONSENT ORACLE** — Permission Evaluation
- **Purpose:** Wraps Heaven HVS tables, exposes consent queries
- **Tools:**
  - `can_i_do()` — Evaluate action permission
  - `grant_consent()` — Grant permission with metadata
  - `revoke_consent()` — Revoke permission
  - `audit_trail()` — Retrieve audit history

##### **SYNTHESIS ORACLE** — Voice & Media Synthesis
- **Purpose:** Voice synthesis pipeline with quality validation
- **Components:**
  - Whisper STT (speech-to-text)
  - XTTS-v2 (multi-lingual TTS)
  - RVC (voice conversion)
  - C2PA (provenance signing)
- **Validation:** Spectral & emotional threshold checks
- **Output:** Production-ready audio with verified provenance

##### **MC96 METRICS** — Telemetry & Analytics
- **Purpose:** System metrics collection and analysis
- **Metrics:**
  - MCP server health & latency
  - Task completion rates
  - Cache hit ratios
  - Consent grant/deny ratios
  - Session duration & activity patterns

---

### Layer 3: I/O Integration & External Connections

#### **Voice & Audio**

##### **VOICE BRIDGE** — Multi-Modal Voice Interface
- **Purpose:** Voice commands, Claude towers, webhook routing
- **Capabilities:**
  - Real-time voice input capture
  - Command routing to appropriate agents
  - Response voice synthesis
  - Webhook integration for external systems

##### **DREAMCHAMBER AUDIO** — Audio Processing Pipeline
- **Purpose:** Advanced audio analysis and processing
- **Used By:** Synthesis Oracle, Voice Bridge

##### **AUDIO** — General Audio Handler
- **Purpose:** Audio codec handling and transformation

---

#### **Desktop & System Control**

##### **SHORTCUTS MCP** — macOS Automation
- **Purpose:** Universal control surface for audio apps
- **Integrations:**
  - Audio Hijack (audio routing)
  - Loopback (virtual audio)
  - SoundSource (audio switching)
  - Airfoil (wireless audio)
  - Logic Pro (DAW)
- **Use Case:** Automated audio production workflows

##### **DESKTOP COMMANDER** — Terminal & File Operations
- **Purpose:** Terminal operations and file system manipulation
- **Capabilities:**
  - Command execution
  - File creation/editing/deletion
  - Directory navigation
  - Process monitoring

---

#### **Knowledge & Note Systems**

##### **DEVONTHINK MCP** — Note-Taking Integration
- **Purpose:** Integration with DEVONthink knowledge base
- **Use Case:** Persistent note storage and retrieval

##### **TAGSPACES MCP** — Tagging System
- **Purpose:** Cross-platform tagging and organization
- **Use Case:** Organize resources by semantic tags

---

#### **Remote & External Systems**

##### **METABEAST REMOTE** — Remote Operations
- **Purpose:** Execute operations on remote systems
- **Use Case:** Multi-machine orchestration

##### **GEMMA3** — Agentic Task Runner
- **Purpose:** GOD.local task execution
- **Use Case:** Local ML model inference and setup

---

### Layer 4: Configuration & Bootstrap

#### **MCP Configuration** (`.mcp.json`)

```json
{
  "mcpServers": {
    "gabriel-mcp": {
      "command": "node",
      "args": ["/path/to/gabriel-mcp/index.js"]
    },
    "lucy-mcp": {
      "command": "node",
      "args": ["/path/to/lucy-mcp/index.js"]
    },
    "heaven-mcp": {
      "command": "node",
      "args": ["/path/to/heaven-mcp/index.js"]
    },
    ...
  }
}
```

---

## 🔄 Communication Patterns

### Pattern 1: Request-Response (Synchronous)

```
Client → Gabriel (gabriel_speak) → [AI Processing] → Response
         ↓
         [Optional] Query Heaven (can_i_do)
         ↓
         [Optional] Query Lucy (lucy_status)
```

### Pattern 2: Intake Pipeline (Asynchronous)

```
External Input → Lucy (lucy_intake_receive)
    ↓
Lucy (lucy_intake_classify) → Route to Agent
    ↓
Agent Processing → Lucy (lucy_intake_synthesize)
    ↓
Lucy (lucy_intake_archive) → Permanent Archive
```

### Pattern 3: Conversation Handoff

```
Gabriel (gabriel_cache_start) → Collect messages
    ↓
[Conversation Active] gabriel_cache_append
    ↓
Gabriel (gabriel_cache_handoff) → Lucy/Pops
    ↓
Lucy (lucy_dazeflow_log) → Permanent Session Log
```

### Pattern 4: Consent-Gated Actions

```
Agent → Heaven (can_i_do) → Permission Check
    ↓ [Granted]
Execute Action → Log to Heaven (audit trail)
    ↓ [Denied]
Return Permission Denied Error
```

---

## 🚀 Startup & Initialization

### Bootstrap Order

1. **Heaven MCP** (Consent Kernel) — Must be first
   - Initialize HVS tables
   - Load consent policies
   - Expose consent evaluation endpoints

2. **Gabriel MCP** (Orchestrator)
   - Initialize state directories
   - Connect to Heaven
   - Load watch list

3. **Lucy MCP** (Keeper)
   - Initialize state directories
   - Load dazeflow session
   - Connect to Heaven & Gabriel

4. **All Other MCPs** (Agents & Utilities)
   - Connect to Heaven for consent checks
   - Register tools
   - Initialize domain-specific state

---

## 📡 State Management & Synchronization

### Shared State Locations

```
~/NOIZYLAB/
├── gabriel-state/         # Active conversations, watch list
├── lucy-state/            # Sessions, tasks, intake archive
└── heaven-state/          # Consent policies (local cache)
```

### State Synchronization Strategy

1. **Local First**: All servers cache relevant state locally
2. **Eventual Consistency**: Background sync with authoritative sources
3. **Conflict Resolution**: Heaven is source of truth for consent
4. **Fallback Mode**: Work offline with local cache if needed

---

## 🔐 Security & Consent Model

### Three-Layer Consent

1. **Agent Consent** (Heaven)
   - Can agent X perform action Y on resource Z?
   - Evaluated before every significant operation
   - Audited in Heaven

2. **User Consent** (HVS Tables)
   - User-defined policies in Human Values System
   - Dynamic consent based on context (time, domain, precedent)

3. **System Consent** (Gabriel)
   - Operational limits (rate limits, resource caps)
   - Maintained in Gabriel state

---

## 🛠️ Extension Points

### Adding a New MCP Server

1. **Create Directory Structure**
   ```
   /mcp/new-server-mcp/
   ├── index.js           # MCP implementation
   ├── package.json       # Dependencies
   └── README.md          # Documentation
   ```

2. **Implement MCP Protocol**
   ```javascript
   import { Server } from "@modelcontextprotocol/sdk/server/index.js";
   import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
   
   const server = new Server(
     { name: "new-server-mcp", version: "1.0.0" },
     { capabilities: { tools: {} } }
   );
   // Define tools...
   server.connect(new StdioServerTransport());
   ```

3. **Register in `.mcp.json`**
   ```json
   {
     "new-server-mcp": {
       "command": "node",
       "args": ["/path/to/new-server-mcp/index.js"]
     }
   }
   ```

4. **Implement Consent Checks** (required)
   ```javascript
   const can = await checkConsent(action, context);
   if (!can) throw new Error("Consent denied");
   ```

5. **Document Tools** in README.md

---

## 📊 Current Ecosystem Map

```
┌─────────────────────────────────────────────────────────────────┐
│                   HEAVEN (Consent Kernel)                       │
│                  Source of Truth for Permissions                │
└────────────────────────────────────────────┬────────────────────┘
                                             │
              ┌──────────────────────────────┼──────────────────────────┐
              │                              │                          │
     ┌────────▼────────┐          ┌─────────▼─────────┐     ┌──────────▼────────┐
     │  GABRIEL MCP    │          │   LUCY MCP        │     │ SPECIALIZED AGENTS│
     │  (Orchestrator) │          │   (Keeper)        │     │ (CB01, Dream, etc)│
     │                 │          │                   │     │                   │
     │ - Conversations │          │ - Tasks           │     │ - Research       │
     │ - Watch List    │          │ - Sessions        │     │ - Ideas          │
     │ - Cache         │          │ - Archive         │     │ - Engineering    │
     │ - Handoff       │          │ - Intake          │     │ - Narrative      │
     └────────┬────────┘          └─────────┬─────────┘     └──────────┬────────┘
              │                             │                          │
              └─────────────────┬───────────┴──────────────┬───────────┘
                                │                          │
                    ┌───────────┴────────┐    ┌──────────┴────────┐
                    │  ORACLES           │    │  I/O Integration │
                    │                    │    │                  │
                    │ - Consent Oracle   │    │ - Voice Bridge  │
                    │ - Synthesis Oracle │    │ - Shortcuts     │
                    │ - MC96 Metrics     │    │ - Desktop Cmdr  │
                    │                    │    │ - Devonthink    │
                    └────────────────────┘    │ - Audio Systems │
                                              └──────────────────┘
```

---

## 🎯 Mission-Critical Workflows

### 1. **User Request → Response** (Real-time Chat)

```
1. User Input
   ↓
2. Gabriel (gabriel_speak)
   ├─ Check Heaven (can_i_do)
   ├─ Generate Response (AI)
   └─ Cache Conversation
   ↓
3. Optional: Voice Output (gabriel_announce)
```

### 2. **Daily Session Management** (DAZEFLOW)

```
1. Lucy (lucy_dazeflow_today) → Open today's session
   ↓
2. Throughout day:
   Lucy (lucy_dazeflow_log) → Append entries
   ↓
3. End of day:
   Lucy (lucy_dazeflow_close) → Summarize & archive
```

### 3. **Batch Data Processing** (Intake Pipeline)

```
1. Receive raw data → Lucy (lucy_intake_receive)
   ↓
2. Classify & route → Lucy (lucy_intake_classify)
   ↓
3. Process by agent → Specialized MCP Tool
   ↓
4. Synthesize results → Lucy (lucy_intake_synthesize)
   ↓
5. Archive forever → Lucy (lucy_intake_archive)
```

### 4. **Multi-Modal Audio Workflow** (Voice + Synthesis)

```
1. Voice Input → Voice Bridge
   ↓
2. STT → Synthesis Oracle (Whisper)
   ↓
3. Route to Agent → Process
   ↓
4. Generate Response → Synthesis Oracle (XTTS-v2)
   ↓
5. Voice Output → Voice Bridge or Shortcuts MCP
```

---

## 📈 Scalability & Performance

### Horizontal Scaling

**Add New Agent:**
- Deploy new MCP server on any machine
- Register in central `.mcp.json`
- No changes to other servers needed

**Add New I/O Integration:**
- Create new MCP wrapper around external service
- Register tool schema
- Automatic availability to all agents

### Performance Optimization

1. **Gabriel Cache**: Hold active conversations in memory
2. **Lucy Archive Index**: Fast lookup in massive archives
3. **Heaven Consent Cache**: Local policies with eventual sync
4. **Agent Specialization**: Small focused MCPs vs monolithic servers

---

## 🔍 Monitoring & Health

### Health Check Query

```
gabriel_status → 
  ├─ Active threads: N
  ├─ Cache size: M
  ├─ Heaven connection: OK/FAIL
  ├─ Watch list: [items...]
  └─ Last refresh: timestamp

lucy_status →
  ├─ Today's session: OPEN/CLOSED
  ├─ Open tasks: N
  ├─ Intake queue depth: M
  ├─ Archive size: G GB
  └─ Last backup: timestamp
```

### Alerting

- Heaven unavailable → All MCPs fall back to local consent cache
- Lucy intake queue > 1000 items → Alert ops team
- Gabriel cache hit ratio < 60% → Review conversation patterns
- Agent tools timing out → Scale agent horizontally

---

## 🚦 Version & Stability

| Component | Version | Status | Last Update |
|-----------|---------|--------|-------------|
| Gabriel MCP | 2.0.0 | Stable | 2024-06 |
| Lucy MCP | 1.0.0 | Stable | 2024-06 |
| Heaven MCP | 1.0.0 | Stable | 2024-06 |
| Specialized Agents | 1.0.0 | Active | 2024-06 |
| Oracles | 1.0.0 | Active | 2024-06 |
| I/O Integration | 1.0.0 | Active | 2024-06 |

---

## 📖 Documentation Index

### Per-Server Documentation
- `/mcp/gabriel-mcp/README.md` — Gabriel operations guide
- `/mcp/lucy-mcp/README.md` — Lucy task management guide
- `/mcp/heaven-mcp/README.md` — Heaven consent kernel guide

### Specialized Servers
- `/mcp/shortcuts-mcp/README.md` — macOS Automation
- `/mcp/dreamchamber-audio/README.md` — Audio Processing
- `/mcp/DesktopCommanderMCP/README.md` — Terminal Operations

---

## 🎓 Quick Start for Developers

### 1. Understand the Stack

Read this document top-to-bottom first.

### 2. Explore Active Agents

```bash
# Check which servers are running
cat ~/.mcp.json

# View Gabriel status
# (via any MCP client)
gabriel_status
```

### 3. Try the Intake Pipeline

```bash
# Send data through Lucy
lucy_intake_receive(...) →
lucy_intake_classify(...) →
lucy_intake_synthesize(...) →
lucy_intake_archive(...)
```

### 4. Add a New Tool

Edit the relevant MCP server's `index.js`, add tool definition under `ListToolsRequestSchema` handler, implement handler logic, test with MCP client.

### 5. Deploy as New MCP

Follow "Adding a New MCP Server" section above.

---

## 🔗 Related Resources

- **Project Root:** `/Users/m2ultra/NOIZYANTHROPIC`
- **MCP Directory:** `/mcp/`
- **Configuration:** `/.mcp.json`
- **State Directory:** `~/NOIZYLAB/`
- **Heaven Remote:** `https://heaven.rsp-5f3.workers.dev`

---

**Mission Control Report:** The NOIZY Ecosystem is a fully operational, consent-governed, multi-agent orchestra. All nodes report nominal. Ready for expansion.

---

*Generated: 2026-07-07 by Copilot CLI*
