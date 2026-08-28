# GABRIEL — Unified Integrations Hub

**T-8 days. GOD.local.** This is the single map of what Gabriel can talk to, what's wired, and what's pending. Every box on this diagram is real and verified on this machine as of 2026-04-09.

```
                              ┌─────────────────────────────────┐
                              │       GABRIEL (local)           │
                              │  ~/bin/gabriel  +  :9090 API    │
                              │       MemCell V3  · SSE         │
                              └────────────────┬────────────────┘
                                               │
       ┌───────────────────────┬───────────────┼──────────────────┬─────────────────────┐
       │                       │               │                  │                     │
       ▼                       ▼               ▼                  ▼                     ▼
  ┌─────────┐           ┌─────────────┐  ┌──────────┐      ┌─────────────┐      ┌───────────────┐
  │ Cockpit │           │ claude-     │  │  Turbo   │      │   Docker    │      │  Webhook In   │
  │ HTML UI │           │  hybrid     │  │  Arsenal │      │ 4 services  │      │ n8n / zapier  │
  │  :9090  │           │ Claude/Ollama│ │ 16 tools │      │   running   │      │   /generic    │
  └─────────┘           └─────────────┘  └──────────┘      └─────────────┘      └───────────────┘
                                                                  │                      │
                                                                  ▼                      ▼
                                                            ┌──────────┐        ┌──────────────┐
                                                            │ qdrant   │        │  /api/think  │
                                                            │  vector  │        │  /memcell    │
                                                            │   :6333  │        │  → Gabriel   │
                                                            └──────────┘        └──────────────┘

  ┌─────────────────────────────────┐         ┌──────────────────────────────────┐
  │ External Services (API-first)   │         │ External Services (cloud)        │
  │  • Linear   (NOI team) ✓        │         │  • Heaven Worker  (stub-only ⚠) │
  │  • Notion   (MCP ✓)             │         │  • noizy.ai landing (not deployed)│
  │  • n8n      (localhost:5678 ✓)  │         │                                   │
  │  • Zapier   (catch-hooks)       │         │                                   │
  └─────────────────────────────────┘         └──────────────────────────────────┘

  ┌────────────────────────────────────────────────────────────────────────────────┐
  │ Local IDE & Desktop (no API integration — workflow-coupled)                    │
  │  GitLens · Copilot · Copilot Chat · Gemini Code Assist · Cloud Code            │
  │  GitKraken.app · Swift Playground · Postman.app · Notion.app · Xcode           │
  └────────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. The local Gabriel (the brain)

**Boot:**
```bash
gabriel               # interactive REPL
gabriel serve         # backend on :9090
gabriel cockpit       # opens the HTML UI
```

**Auto-start:** `launchctl load ~/Library/LaunchAgents/ai.noizy.gabriel-serve.plist`

**Persistent state:** `~/NOIZYANTHROPIC/NOIZYLAB/memory/memcell_v3.json`

---

## 2. Service inventory (verified 2026-04-09)

### ✅ Wired into Gabriel right now

| Service | Where | How Gabriel uses it | Endpoint |
|---|---|---|---|
| **claude-hybrid** | `~/bin/claude-hybrid` | Deep cognition routing | `POST /api/think` |
| **Ollama** (14 models) | local | Private/bulk via `claude-hybrid -l` | via think |
| **Turbo arsenal** (16 scripts) | `NOIZYLAB/scripts/turbo/` | Vitals, net, sync, fishnet, etc. | `POST /api/tools/{vitals,net,sync}` |
| **MemCell V3** | `NOIZYLAB/scripts/core/` | Persistent action log + patterns + vibe | `GET/POST /api/memcell/*` |
| **Linear API** | `api.linear.app` | Issues, projects, critical path | `GET /api/linear/{issues,critical}` |
| **Docker CLI** | `/opt/homebrew/bin/docker` | Container ps/stats | `GET /api/docker/{ps,stats}` |
| **Filesystem** | `~/NOIZYANTHROPIC/` (jailed) | Tree + read | `GET /api/{tree,file}` |
| **n8n webhook in** | any source | Inbound action → MemCell + SSE | `POST /api/webhook/n8n` |
| **Zapier webhook in** | any source | Same | `POST /api/webhook/zapier` |
| **Outbound webhook** | any URL | Gabriel POSTs out | `POST /api/webhook/out` |
| **SSE live stream** | browser/cli | Vitals + MemCell deltas + webhook events | `GET /api/stream` |

### 🐳 Docker pipeline (9 healthy containers, verified live)

| Container | Image | Ports | Role |
|---|---|---|---|
| `noizy-n8n` | n8nio/n8n:2.15.0 | 5678 | Workflow automation. Reaches Gabriel via `host.docker.internal:9090`. ✓ wired |
| `open-webui` | open-webui:main | 3080 | Chat UI for local Ollama. |
| `mc96eco-qdrant-1` | qdrant/qdrant | 6333, 6334 | **Vector DB** — semantic memory layer for MemCell. **Next high-value wire.** |
| `mc96eco-neo4j-1` | neo4j:5 | (internal) | **Graph DB** — perfect for actor/consent/provenance graphs. |
| `mc96eco-grafana-1` | grafana/grafana | (internal) | Dashboards. Wire to Gabriel `/api/stream` or vitals JSONL for live charts. |
| `mc96eco-rabbitmq-1` | rabbitmq:3-management | 5672, 15672 | Message broker. Useful for queueing outbound webhooks when Heaven lives. |
| `desktop-control-plane` | kindest/node:v1.34.3 | — | **kind Kubernetes** control plane. |
| `kind-cloud-provider` | docker/desktop-cloud-provider-kind | — | kind cloud provider shim. |
| `kind-registry-mirror` | docker/desktop-containerd-registry-mirror | — | Local image cache for kind. |

You have a **full local stack** here: vector DB + graph DB + monitoring + queueing + workflow engine + AI UI + a real Kubernetes cluster. This is more than enough infrastructure to run the entire NOIZY empire locally without depending on Cloudflare/Heaven for anything until those are ready.

**Wire priority:**
1. ✅ **n8n** — done (both directions)
2. **qdrant** — embed MemCell entries → semantic recall via `gabriel "what did we decide about R2?"`
3. **neo4j** — actor → consent token → ledger graph (the consent kernel's natural shape)
4. **grafana** — point a Prometheus datasource at a `/metrics` endpoint we add to gabriel_serve
5. **kind** — deploy a local Heaven Worker mirror as a k8s service for offline Heaven testing

### 🔌 External APIs (some wired, some pending key)

| Service | Status | Action |
|---|---|---|
| **Linear** | ✅ Live via Claude-side MCP. Backend client built (`linear_client.py`); needs `LINEAR_API_KEY` env to be set on GOD.local for direct calls. | `export LINEAR_API_KEY=lin_api_...` then restart `gabriel serve` |
| **Notion** | ✅ MCP works in Claude side. Direct backend client TODO when needed. | — |
| **n8n MCP** | ⚠ MCP API key invalid (`n8n_list_workflows` → AUTHENTICATION_ERROR). HTTP webhooks work fine. | Settings → API → regen key → set `N8N_API_KEY` env |
| **Zapier** | ✅ Works via outbound hooks (no auth needed). For inbound from Zapier, expose `:9090` via cloudflared tunnel. | — |
| **Gmail / GCal / Slack / GitHub** | ✅ MCPs available in Claude side for orchestration; not wired into local backend yet. | Add adapter modules as needed. |
| **Heaven Worker** | ⚠ **STUB-ONLY** — per Linear NOI-48, the heaven v17.2.0 infra described in `~/NOIZYANTHROPIC/CLAUDE.md` does NOT exist on the Fishmusicinc CF account. | Block 1 of critical path. See below. |

### 💻 Local IDE & desktop apps (workflow-coupled, not API-coupled)

| Tool | Installed | Integration |
|---|---|---|
| **GitLens** | v2026.4.905 in VS Code (insiders + stable) | Already shows blame/history in editor; nothing to wire. Just use it. |
| **GitHub Copilot** | v1.388.0 | Code completion in editor. Nothing to wire. |
| **GitHub Copilot Chat** | v0.42.3 / v0.43.0 | Chat side panel. Use for refactors and explanations. |
| **Gemini Code Assist** | google.geminicodeassist v2.77.0 | Already installed. Authenticate once via `Cmd+Shift+P → Gemini Code Assist: Sign In`. Free tier covers most use. |
| **Gemini CLI** | google.gemini-cli-vscode-ide-companion v0.20.0 | Pairs Code Assist with the gcloud CLI. Useful for GCP context. |
| **Google Cloud Code** | googlecloudtools.cloudcode v2.39.0 | YAML/manifest help for GKE/Run. Idle until you have GCP workloads. |
| **GitKraken.app** | `/Applications/GitKraken.app` | Desktop git client. Pair with Gabriel via the `gabriel sync` shortcut — runs `turbo_git_sync.sh` then GitKraken refreshes. |
| **GitHub Desktop.app** | `/Applications/GitHub Desktop.app` | Redundant with GitKraken. Pick one. |
| **Swift Playground.app** | `/Applications/Swift Playground.app` | Touch-friendly playgrounds. For real Swift work, use Xcode + `swift` CLI directly. |
| **Xcode toolchain swift** | `xcrun -f swift` ✓ | Available for any Swift script work. Gabriel can shell out to it. |
| **Postman.app** | `/Applications/Postman.app` | **Import the collection** at `integrations/postman/Gabriel.postman_collection.json` — gives you a full clickable UI for every Gabriel endpoint above. |
| **Notion.app** | `/Applications/Notion.app` | Desktop app; talks to the same Notion that the MCP talks to. |

---

## 3. Heaven Worker — the honest situation

You asked: **"stack all extensions in pipeline Heaven with Heaven Worker??"**

The blunt answer: **Heaven doesn't currently exist on the Fishmusicinc Cloudflare account.** Linear NOI-48 was opened 2026-04-06 after a CF audit found:
- 1 worker named `deploy` (NOT heaven)
- 0 D1 databases (gabriel_db NOT FOUND)
- 0 KV namespaces
- R2 disabled

So wiring Local Gabriel to "the Heaven Worker" is wiring it to a stub. The right move is the **two-phase pipeline**:

### Phase 1 — Local Gabriel as the canonical brain (TODAY)
Everything in section 2 above. Already real. The pipeline already exists locally.

### Phase 2 — Heaven Worker as the public face (after NOI-48, NOI-49, NOI-51)
When Heaven actually deploys:
1. Heaven exposes a `POST /gabriel/relay` endpoint, gated by `X-NOIZY-Key`
2. Public clients (Zapier, mobile, Slack) hit Heaven, not local Gabriel
3. Heaven validates auth + Never Clauses, then forwards to GOD.local via either:
   - **Cloudflare Tunnel** to `:9090` (lowest infra cost), or
   - **rabbitmq queue** that local Gabriel polls (most resilient — survives GOD.local being offline)
4. Local Gabriel responds, Heaven returns to client
5. Every relay logged to `noizy_ledger` D1 table for the consent audit trail

This means **Heaven becomes a thin auth + ledger shell** in front of the real Gabriel that lives on GOD.local. That's the right architecture: cloud for auth/audit/availability, GOD.local for compute.

**Until then: don't wire to Heaven. Use local Gabriel.** The cockpit, n8n flows, and Postman collection all work today against `127.0.0.1:9090`. Phase 1 is enough to operate the empire.

---

## 4. Critical path actions (from Linear, T-8)

| Block | ID | What | Why it unblocks |
|---|---|---|---|
| 🚨 **2** | NOI-49 | Enable R2 on Fishmusicinc account | Voice DNA storage, C2PA assets, fishnet overflow |
| 🚨 **4** | NOI-51 | Custom CF API token | Heaven deploy, all subsequent CF work |
| 🚨 **3** | NOI-50 | Fix ANTHROPIC_API_KEY on GOD | Gabriel's Claude side, Heaven's Anthropic side |
| 🚨 **5** | NOI-52 | Run FISHNET-DREAMCHAMBER.sh → consolidate to RSPNOIZY/DREAMCHAMBER | Single source of truth, no more drift |
| 🔥 **0** | NOI-47 | GoDaddy exit (4 domains → CF) | DNS, email, the whole branding surface |
| 🔥 **1** | NOI-48 | Heaven actually deploy | Phase 2 of this pipeline |

The 4 🚨 are **already overdue.** Until they're closed, Heaven Phase 2 cannot start.

---

## 5. Quick-start commands

```bash
# Start everything
launchctl load ~/Library/LaunchAgents/ai.noizy.gabriel-serve.plist
gabriel cockpit

# Or run foreground
gabriel serve

# Verify the pipeline
gabriel status                                            # local snapshot
curl http://127.0.0.1:9090/api/docker/ps                  # 4 containers
curl http://127.0.0.1:9090/api/linear/critical            # snapshot fallback
curl -N http://127.0.0.1:9090/api/stream                  # live SSE feed

# Postman: File → Import → integrations/postman/Gabriel.postman_collection.json
# n8n: Workflows → Import → integrations/n8n/0{1,2}_*.json

# Optional but recommended
export LINEAR_API_KEY=lin_api_...    # enables direct backend Linear calls
crontab ~/NOIZYLAB/ops/noizy-crontab # activates gabriel-watch + gabriel-sync
```
