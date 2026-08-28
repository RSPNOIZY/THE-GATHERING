# POPS — Archival Engine & Knowledge Graph MCP

**Version:** 1.0.0  
**Status:** Scaffolded & Ready for Development  
**Location:** `/mcp/pops-archival-mcp/`

## 🎯 Mission

POPS is the **permanent archive and knowledge graph** of the NOIZY Ecosystem.

- **Input:** Completed conversation threads from Gabriel/Lucy
- **Processing:** Extract concepts, relationships, patterns, rules
- **Output:** Searchable archive, knowledge graph, historical timeline
- **State:** Immutable records with full provenance and audit trail

**Key Philosophy:** *Conversations become knowledge. Knowledge becomes wisdom.*

---

## 📊 Tool Categories

### Archival Tools (8)

**Lifecycle:**

1. `pops_receive_thread` — Intake completed thread
2. `pops_process_content` — Extract knowledge
3. `pops_build_index` — Index for search
4. `pops_query` — Search archive
5. `pops_relationships` — Find connections
6. `pops_timeline` — Show evolution
7. `pops_export` — Export segment
8. `pops_stats` — Health metrics

### Knowledge Graph Tools (4)

1. `pops_concept_add` — Add entity
2. `pops_concept_relate` — Link concepts
3. `pops_concept_query` — Traverse paths
4. `pops_graph_visualize` — Render graph

---

## 📂 State Structure

```
~/NOIZYLAB/pops-state/
├── archive/             # Immutable records (1 JSON per thread)
├── index/               # Full-text search indices
├── graph/               # Knowledge graph nodes & edges
└── metadata.json        # Stats, version, health
```

---

## 🔄 Integration with Ecosystem

### Upstream (Input)

```
Gabriel (gabriel_cache_handoff)
        ↓
Lucy (lucy_intake_archive)
        ↓
POPS (pops_receive_thread) ← Thread lands here
```

### Downstream (Usage)

```
POPS queries ← Lucy, Gabriel, Agents can search
        ↓
Knowledge graph insights feed back into decisions
```

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd /Users/m2ultra/NOIZYANTHROPIC/mcp/pops-archival-mcp
npm install
```

### 2. Start the Server

```bash
npm start
```

Expected output:
```
[POPS] Archival engine started. Ready for incoming threads.
```

### 3. Register in `.mcp.json`

```json
{
  "mcpServers": {
    "pops-archival-mcp": {
      "command": "node",
      "args": ["/Users/m2ultra/NOIZYANTHROPIC/mcp/pops-archival-mcp/index.js"]
    }
  }
}
```

### 4. Test with MCP Client

```bash
# Example: Receive a thread
pops_receive_thread(
  thread_json='{"thread_id":"CONV_123","messages":[...]}',
  source="gabriel",
  priority="P1"
)

# Example: Query archive
pops_query(query="database performance", limit=10)

# Example: Check stats
pops_stats()
```

---

## 🛠️ Development Tasks

### Phase 1: Core Implementation ⏳ (Next)

- [ ] Full-text search indexing (implement real Sqlite/FTS5 or Meilisearch integration)
- [ ] Knowledge graph storage (migrate to graph DB or triple store)
- [ ] Timeline generation (temporal sequence analysis)
- [ ] Export formats (JSON, CSV, Markdown generation)

### Phase 2: Intelligence Layer

- [ ] Automatic rule extraction from threads
- [ ] Pattern detection (recurring problems, common solutions)
- [ ] Relationship strength calculation (co-occurrence, dependency analysis)
- [ ] Concept clustering (group related entities)

### Phase 3: Integration

- [ ] Webhook integration with Gabriel/Lucy handoff
- [ ] Batch import from existing archives
- [ ] Export to external tools (Obsidian, Notion, PKM systems)
- [ ] API for external query

### Phase 4: Advanced Features

- [ ] Semantic search (embedding-based)
- [ ] Knowledge graph visualization (web UI)
- [ ] Compliance & audit reporting
- [ ] Deduplication across archives

---

## 🔌 API Details

### `pops_receive_thread`

**Purpose:** Intake a completed conversation thread

**Input:**
```javascript
{
  thread_json: "...",        // Full thread JSON as string
  source: "gabriel" | "lucy" | "direct",
  priority: "P0" | "P1" | "P2" | "P3"
}
```

**Response:**
```
✓ Thread archived
Archive ID: ARCHIVE_20260707_abc123
Priority: P1
```

---

### `pops_query`

**Purpose:** Search archived threads

**Input:**
```javascript
{
  query: "database performance",
  limit: 20
}
```

**Response:**
```
**Search: "database performance"**

- Database Optimization Discussion (0.95)
  Query indexing strategy...

- Performance Investigation (0.82)
  N+1 problem led to architectural change...
```

---

### `pops_concept_add`

**Purpose:** Add concept to knowledge graph

**Input:**
```javascript
{
  name: "database_sharding",
  type: "rule",
  description: "Horizontal partitioning strategy for large tables"
}
```

**Response:**
```
✓ Concept added
ID: concept_a1b2c3
Name: database_sharding
```

---

## 🌍 Architecture Context

POPS is **Layer 2** in the NOIZY Ecosystem:

```
LAYER 1: Gabriel (Orchestration) + Lucy (Keeper) + Heaven (Consent)
LAYER 2: POPS (Archive) + Specialized Agents + Oracles ← YOU ARE HERE
LAYER 3: I/O Integration (Voice, Shortcuts, Desktop, etc.)
```

POPS provides **permanent knowledge storage** for the entire system.

---

## 📖 Next: Deep Dive

For complete technical spec, see: **`MCP-POPS-TECHNICAL-ANALYSIS.md`** (to be created)

Covers:
- Full tool schemas with examples
- State models and file formats
- Integration patterns with Gabriel/Lucy
- Knowledge graph data structures
- Performance optimization strategies

---

## 🚨 Known Limitations (v1.0)

- **Search:** Currently mock implementation (see Phase 1)
- **Graph DB:** File-based storage (scale to ~10k concepts)
- **Relationships:** No automatic strength calculation yet
- **Export:** Placeholder implementations

---

## ✅ Deployment Checklist

- [ ] Code review & testing
- [ ] Add to `.mcp.json`
- [ ] Deploy to production
- [ ] Connect to Gabriel/Lucy handoff
- [ ] Monitor archive growth
- [ ] Set up backup strategy

---

## 📞 Contact & Contributing

POPS is actively developed. To contribute:

1. Create feature branch: `feature/pops-xxx`
2. Implement tool + tests
3. Update documentation
4. Submit PR for integration

---

**POPS: Where conversations become permanent knowledge.**

*Scaffolded: 2026-07-07 by Copilot CLI*
