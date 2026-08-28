# NOIZY INFRASTRUCTURE MAP

**Snapshot date:** 2026-04-21
**Authority:** RSP_001 (Robert Stephen Plowman)
**Host:** GOD.local — M2 Ultra Mac Studio, 192 GB unified memory, 24 cores
**Status:** ✅ Local AI team fully operational · ⏳ Cloudflare = only remaining frontier

---

## 1. LOCAL AI TEAM (Done — all wins)

### 1.1 Inference engines
| Engine | Version | Binary | Notes |
|---|---|---|---|
| Ollama | service-managed | `/opt/homebrew/bin/ollama` | `OLLAMA_MODELS=/Volumes/6TB/NOIZY_MODELS/ollama` — models OFF system drive |
| MLX / MLX-LM | 0.29.3 | `/opt/homebrew/bin/mlx_lm.generate` | GPU device confirmed (M2 Ultra) — native Apple Silicon |
| llama.cpp | 8680 | `/opt/homebrew/bin/llama-cli`, `llama-server` | GGUF fallback + custom quant path |

### 1.2 Ollama service tuning (launchd plist)
```
OLLAMA_MAX_LOADED_MODELS   4
OLLAMA_NUM_PARALLEL        8
OLLAMA_FLASH_ATTENTION     1
OLLAMA_KEEP_ALIVE          24h
OLLAMA_HOST                0.0.0.0:11434   (LAN/Tailscale ready)
OLLAMA_MODELS              /Volumes/6TB/NOIZY_MODELS/ollama   (NEW)
```

### 1.3 Model fleet (34 models total)
**Generalist / base:** gemma4:31b · gemma4:26b · gemma4:e4b · gemma3 · dolphin-mixtral:8x7b · phi3:14b · phi3:fast · phi3:long
**Vision:** llava:34b
**Code:** codestral:22b · qwen2.5-coder:32b (partial)
**Reasoning:** deepseek-r1:70b (partial)
**Embeddings:** nomic-embed-text (768-dim) · bge-m3 (1024-dim) · snowflake-arctic-embed2:568m · mxbai-embed-large

**NOIZY custom personas (Gemma 3 base, 3.3 GB each):**
noizy-gabriel-mind · noizy-mission-control · noizy-consent-guardian · noizy-wisdom-scribe · noizy-family-keeper · noizy-dream-weaver · noizy-heaven-forger · noizy-vox-architect · noizy-fish-cataloguer · noizy-kidz-worldbuilder

**NOIZY custom personas (Gemma 4 e4b base, 9.6 GB each):**
Same 10 agents, all tagged `-g4:latest`. Higher capacity (3× params), ~30% slower.

### 1.4 Substrate layer
| Store | Purpose | State |
|---|---|---|
| Qdrant `noizy_knowledge` | 905 pts, 768-dim, Cosine — full NOIZY corpus | ✅ populated |
| Qdrant `voice_memory` / `dreamchamber_conversations` / `rspnoizy_projects` / `accessibility_patterns` | 4 namespaced collections ready for ingest | ⏳ 0 pts each |
| Neo4j Family Registry | 3 Humans · 7 Agents · 7 Brands · 10 D1 · 22 RoutingPhrases · 48 edges | ✅ populated |
| RabbitMQ | Inter-agent dispatch | ⏳ paused (no producers wired yet) |
| Grafana | Observability | ⏳ paused |
| ChromaDB 1.5.5 | In-process scratchpad | ✅ installed |
| LanceDB 0.30.2 | File-based Arrow store | ✅ installed |

### 1.5 Router (claude-hybrid v2)
- Location: `~/bin/claude-hybrid-v2`
- Flow: prompt → embed → qdrant top-k context → Neo4j Cypher for routing → dispatch to NOIZY Ollama persona
- Flags: `--agent CODE` · `--claude` · `--dry` · `--no-rag`
- Live tested: 6/6 routing decisions correct; 96 tok/s on RAG-augmented dispatch

### 1.6 Fine-tune pipeline
- Scaffold: `~/NOIZYANTHROPIC/tools/mlx_finetune/`
- Per-agent training data: `data/{gabriel,lucy,engr_keith,dream,cb01,shirl,pops}_training.jsonl` — 31 examples each, extracted from qdrant
- Config: `configs/lora_default.yaml` (Gemma 4 e4b base, 16 layers LoRA, 500 iters)
- Runner: `train.sh <agent>`

---

## 2. DATA & STORAGE LOCATIONS

| Path | Size | Role |
|---|---|---|
| `/Volumes/6TB/NOIZY_MODELS/ollama/` | 113 GB | Ollama model blobs (migrated from system drive) |
| `/Volumes/6TB/NOIZY_MODELS/chroma/` | reserved | ChromaDB persistent (future) |
| `/Volumes/6TB/NOIZY_MODELS/lance/` | reserved | LanceDB persistent (future) |
| `~/.ollama/` | 12 KB | Just keys + history (no blobs) |
| `~/qdrant_storage/` | 0 B | Unused (MC96ECO container has its own volume) |
| `/ (system drive)` | 1.0 TB free | Restored after migration |
| `/Volumes/6TB` | 710 GB free | 88% used — watch for pressure |

---

## 3. DOCKER LANDSCAPE (22 paused + 3 essential)

**Paused (state preserved, zero CPU):**
- MC96ECO stack: `mc96eco-qdrant-1` · `mc96eco-rabbitmq-1` · `mc96eco-grafana-1` · `mc96eco-neo4j-1`
- NOIZY ops stack: `noizy-n8n` · `noizy-n8n-postgres` · `noizy-nextcloud` · `noizy-nextcloud-db` · `noizy-litellm` · `noizy-nocodb` · `noizy-clickhouse` · `noizy-collabora` · `noizy-stirling-pdf` · `noizy-uptime-kuma` · `noizy-searxng` · `noizy-typesense` · `noizy-postgres` · `noizy-redis` · `noizy-minio` · `open-webui`
- Other: `zen_hodgkin` · `serene_mayer`

**Running (essential):** `kind-cloud-provider` · `kind-registry-mirror` · `desktop-control-plane`

**Unpause with:** `docker unpause <name>`

---

## 4. CLOUDFLARE (the one remaining frontier)

### 4.1 Known account IDs
| Account | ID | Status |
|---|---|---|
| NOIZYFISH (canonical) | `5f36aa9795348ea681d0b21910dfc82a` | USE THIS |
| Fishmusicinc (legacy) | `2446d788cc4280f5ea22a9948410c355` | DO NOT DEPLOY |

### 4.2 Auth gaps (user must complete)
- [ ] `wrangler login` — browser OAuth
- [ ] `cloudflared tunnel login` — creates cert.pem
- [ ] (optional) set `CLOUDFLARE_API_TOKEN` in env for scripted ops

### 4.3 Existing tunnel config (already written, needs credentials)
`~/.cloudflared/noizynet-tunnel.yml`:
```yaml
tunnel: noizynet
credentials-file: /Users/m2ultra/.cloudflared/noizynet-tunnel.json   # MISSING
ingress:
  - hostname: gabriel.noizy.ai   service: http://localhost:9099
  - hostname: n8n.noizy.ai       service: http://localhost:5678
  - hostname: heaven.noizy.ai    service: http://localhost:8787
  - hostname: ssh.noizy.ai       service: ssh://localhost:22
  - service: http_status:404
```

### 4.4 Known D1 databases (10, per FAMILY_TEAM_BRANDS.md)
| Name | UUID | Role |
|---|---|---|
| **noizy-prod** ⭐ | `cd6cae46-e5cd-42b6-a97a-5d0e576c1c2a` | CANONICAL CONSENT KERNEL |
| heaven-db | `04a826c2-e863-4264-8782-05496c6bb022` | TBD |
| gabriel_db | `a31d68e2-f2d4-4203-a803-8039fdff31cb` | agent DB (no actors) |
| agent-memory | `bc2f9abc-f49d-4818-9bde-8fc647c359e3` | memcells |
| noizyai-db | `0aa46990-f64e-40f9-8997-56c1bf6c34d3` | — |
| noisyproof | `d445d2d4-4486-4ead-8dbe-2ae27ddabcd9` | provenance |
| noizy-vox | `58480d28-2ecc-4566-b195-d9d3fe38ca08` | NOIZYVOX |
| aquarium-archive | `01212e89-5422-4e45-a03a-f0a54495674e` | archive |
| fishmusicinc-db | `b2c95b2a-f3f6-4626-ade0-62c9a3eb58e5` | FMI catalog |
| gabriel-db | `5dcc1a5e-aa8e-4097-b8bc-f34513305bdc` | secondary |

### 4.5 Planned hostname architecture (rules-locked)
```
mcp.noizy.ai          Worker Custom Domain  →  remote MCP server
metabeast.noizy.ai    Pages Custom Domain   →  UI shell
api.noizy.ai/*        Worker Routes         →  modular API workers
heaven.noizy.ai       Worker Custom Domain  →  Heaven API
dream.noizy.ai        Worker/tunnel         →  DreamChamber :7777
gabriel.noizy.ai      Tunnel                →  local GABRIEL :9099
n8n.noizy.ai          Tunnel                →  local n8n :5678
lucy.noizy.ai         Tunnel                →  local LUCY (next)
ssh.noizy.ai          Tunnel (CF Access)    →  local SSH
```

### 4.6 Cloudflare punch list
1. `wrangler login` → authenticate CLI
2. `cloudflared tunnel login` → get cert.pem
3. `cloudflared tunnel create noizynet` → creates credentials JSON
4. `cloudflared tunnel route dns noizynet gabriel.noizy.ai` (×5 hostnames)
5. `cloudflared service install` → persistent launchd agent
6. Deploy Heaven worker to `heaven.noizy.ai`
7. Deploy consent/mcp Workers to correct Custom Domains
8. Wire Email Routing for `rsp@noizy.ai`
9. Audit DNS on both accounts — confirm zone `noizy.ai` is on `5f36aa97…`
10. Set up `api.noizy.ai/*` Route pattern for modular workers

---

## 5. AGENT FAMILY (source of truth)

Humans: **RSP_001** (Robert Stephen Plowman) · **POPS_HUMAN** (R.K. Plowman) · **ALEX_WARD**
Agents: **GABRIEL** · **LUCY** · **ENGR_KEITH** · **DREAM** · **CB01** · **SHIRL** · **POPS**
Brands: **NOIZY_AI** · **NOIZYLAB** · **NOIZYVOX** · **NOIZYFISH** · **NOIZYKIDZ** · **FISHMUSICINC** · **DREAMCHAMBER**

Routing law → see qdrant.noizy_knowledge + Neo4j Cypher queries.

---

## 6. HEALTH CHECKS (canonical commands)

```bash
# Ollama alive?
curl -s http://localhost:11434/api/tags | jq '.models | length'

# Semantic router test
~/bin/claude-hybrid-v2 --dry "any prompt here"

# Neo4j query test
python3 -c "from neo4j import GraphDatabase; d=GraphDatabase.driver('bolt://localhost:7687', auth=('neo4j','noizy2026')); print(list(d.session().run('MATCH (a:Agent) RETURN a.code')))"

# Qdrant collections
curl -s http://localhost:6333/collections | jq '.result.collections[].name'

# Disk pressure
df -h / /Volumes/6TB

# Docker load
docker ps --format 'table {{.Names}}\t{{.Status}}' | head -20
```

---

*Generated 2026-04-21 during the "EVERYTHING!" session — after Phase C substrate feed, claude-hybrid v2 launch, and the 113 GB migration off the system drive.*
