# MC96ECO MORNING BRIEFING
## Monday, April 14, 2026 — DAZEFLOW v4.3 Active
### Signal for Robert Stephen Plowman

---

## SESSION SUMMARY — April 13/14 OVERNIGHT

This was a deep infrastructure session. The ARCHIVE (DreamChamber Swift Package) advanced through four version milestones in a single session. The NOIZYNET mesh is now fully operational — 13/13 services live and self-monitored. n8n authentication was solved after a multi-hour deep dive. The MCP bridge now has 16 tools.

---

## 1. ARCHIVE — DreamChamber Swift Package Progress

### v4.0 (baseline entering session)
- NOIZYNETMap established: 13 services registered in `NoisyBrand.swift`
- 87 XCTest tests, 0 failures
- 13 MCP tools in MCPBridge.swift

### v4.1 — Commit `df650f5`
**Two new MCP tools added:**

| Tool | What it does |
|------|-------------|
| `dreamchamber_service_health` | Concurrent HTTP probe of all 13 NOIZYNET services using `withTaskGroup`. Per-service 🟢/🔴 + latency ms. Fallback root path probe. |
| `dreamchamber_ollama` | 3 modes: `status` (loaded models + VRAM), `list` (all installed), `embed` (nomic-embed-text test with dims + L2 norm) |

**Also upgraded:**
- `executeUniverseSummary`: now includes NOIZYNET mesh block, machine IP/spec, tool count
- `executeNoizynetStatus`: full service table with host:port + status emoji

**Tests:** 87 → 95 (+8 new)  
**Total tools:** 13 → 15

---

### v4.2 — Commit `185e1e2`
**Two new operational services launched:**

| Service | Port | Purpose |
|---------|------|---------|
| `ops/noizynet/noizynet-daemon.py` | 9699 | NOIZYNET Signal Daemon — concurrent health probes, 10s TTL cache, aiohttp |
| `ops/engr-keith/engr-keith.py` | 7006 | ENGR_KEITH — machine stats, git log, docker, swift test runner |

**Bug fixes resolved:**
- NOIZYNET self-probe failure: changed `10.90.90.10 → localhost` in service registry
- RabbitMQ: changed from AMQP port `5672 → 15672` (management HTTP)

**NOIZYNET result: 13/13 services LIVE, 0 offline, 0 pending**

**Tests:** 95 (0 failures)

---

### v4.3 — Commit `b7f5c34`
**New MCP tool: `dreamchamber_n8n` (16th tool)**

```
mode=list    — All n8n workflows with 🟢 ACTIVE / ⚪ inactive status
mode=status  — n8n runtime health on :5678
mode=trigger — Find workflow by name substring, report active state
```

**Auth breakthrough:** n8n sets cookies with `Secure=true` even on localhost HTTP.
The standard `http.cookiejar.DefaultCookiePolicy` rejects Secure cookies over plain HTTP.
Fix: `AllowAllCookiePolicy` overrides `return_ok_secure` and `set_ok_secure` to return `True`.
This was the root cause of all previous 401/403 failures.

**n8n workflow created and activated:**
- Name: `NOIZYNET Health Monitor`
- ID: `4i4QBqyCyLGRzfBE`
- Schedule: every 5 minutes
- Logic: Probe `localhost:9699/status` → if `summary.offline > 0` → Log Alert node, else → Log Healthy node
- Status: 🟢 ACTIVE

**Tests:** 95 → 99 (+4 new tests for n8n tool)

---

## 2. NOIZYNET MESH STATUS

```
13/13 services LIVE | 0 offline | 0 pending
GOD (GABRIEL.local / 10.90.90.10 / M2 Ultra 192GB)

Service         Port    Status
──────────────────────────────
NOIZYNET        9699    🟢 LIVE  (aiohttp daemon, Python 3.14.3)
ENGR_KEITH      7006    🟢 LIVE  (engineering orchestrator)
DreamChamber    7777    🟢 LIVE  (Swift MCP bridge)
NOIZYSTREAM     7778    🟢 LIVE
Ollama          11434   🟢 LIVE  (gemma4:e4b 32GB, nomic-embed 0.6GB, gemma3 29.7GB = 62.3GB VRAM)
n8n             5678    🟢 LIVE  (v2.14.2, NOIZYNET Health Monitor ACTIVE)
OpenWebUI       3080    🟢 LIVE
Grafana         3000    🟢 LIVE
Neo4j           7474    🟢 LIVE
Qdrant          6333    🟢 LIVE
RabbitMQ        15672   🟢 LIVE  (management HTTP, was 5672 AMQP)
noizy-stt       8010    🟢 LIVE
Micky-P         peer    🟢 LIVE  (10.90.90.40)
```

---

## 3. MCP BRIDGE — 16 TOOLS

| # | Tool | Description |
|---|------|-------------|
| 1 | `dreamchamber_query` | Hybrid BM25 + semantic search |
| 2 | `dreamchamber_brand` | Brand metadata lookup |
| 3 | `dreamchamber_route` | Agent routing (Gabriel/Lucy/Claude) |
| 4 | `dreamchamber_invariants` | 75/25 split validation |
| 5 | `dreamchamber_universe` | Full MC96ECO universe summary |
| 6 | `dreamchamber_category` | Category-scoped search |
| 7 | `dreamchamber_ingest` | File ingestion pipeline |
| 8 | `dreamchamber_creative_intent` | Creative intent parsing |
| 9 | `dreamchamber_pipeline` | Creative production pipeline |
| 10 | `dreamchamber_inspire` | Inspiration generation |
| 11 | `dreamchamber_analytics` | Creative analytics |
| 12 | `dreamchamber_haptic` | HapticComposer status |
| 13 | `dreamchamber_noizynet` | NOIZYNET operational summary |
| 14 | `dreamchamber_service_health` | Live concurrent HTTP probe of all 13 services |
| 15 | `dreamchamber_ollama` | Ollama VRAM status + embedding test |
| 16 | `dreamchamber_n8n` | n8n workflow list + trigger + health |

**Tests:** 99 total, 0 failures, ~1.87s

---

## 4. N8N AUTHENTICATION — SOLVED

**Root cause analysis:**

| Attempt | Result | Root Cause |
|---------|--------|-----------|
| Raw DB API key as X-N8N-API-KEY | 403 | DB stores HASHED key, not plaintext |
| POST /rest/login with `email` field | 400 | n8n v2 uses `emailOrLdapLoginId` |
| POST /rest/login with `emailOrLdapLoginId` | ✅ | Correct field name |
| Using `n8n-auth` cookie over HTTP | 401 | `Secure=true` cookie rejected by http.cookiejar |
| AllowAllCookiePolicy override | ✅ | Bypasses Secure restriction for localhost HTTP |

**Working auth pattern (Python):**
```python
class AllowAllCookiePolicy(http.cookiejar.DefaultCookiePolicy):
    def return_ok_secure(self, cookie, request): return True
    def set_ok_secure(self, cookie, request): return True

jar = http.cookiejar.CookieJar()
jar.set_policy(AllowAllCookiePolicy())
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
# Login: POST {"emailOrLdapLoginId": "rsp@noizy.ai", "password": "..."}
# All subsequent requests through opener are authenticated
```

**n8n credentials:**
- URL: `http://localhost:5678`
- Email: `rsp@noizy.ai`
- Login endpoint: `POST /rest/login` with `emailOrLdapLoginId`
- Cookie: `n8n-auth` (JWT, Secure flag)
- API key creation requires: `{"label": "...", "scopes": [...53 scopes...], "expiresAt": null}`

---

## 5. SWIFT TEST PROGRESSION

```
Session start:    87 tests | v4.0
After v4.1:       95 tests | +8 (service_health, ollama tools + related)
After v4.2:       95 tests | 0 new (NOIZYNET/ENGR_KEITH daemon tests not needed)
After v4.3:       99 tests | +4 (n8n tool + NOIZYNETMap n8n assertions)
```

---

## 6. COMMITS THIS SESSION

| Hash | Version | Description |
|------|---------|-------------|
| `df650f5` | v4.1 | MCPBridge +2 tools (service_health, ollama), 15 total, 95 tests |
| `185e1e2` | v4.2 | NOIZYNET daemon + ENGR_KEITH LIVE, 13/13 services |
| `b7f5c34` | v4.3 | dreamchamber_n8n (16th tool), NOIZYNET Health Monitor ACTIVE, 99 tests |

---

## 7. PENDING ITEMS (NEXT SESSION PRIORITIES)

### High Priority
- [ ] **Cloudflare tunnel for n8n** — `n8n.noizy.ai` via `cloudflared tunnel route dns`
- [ ] **dreamchamber_n8n trigger mode** — Full webhook POST execution (currently reports workflow state only)
- [ ] **n8n API key for external use** — 53-scope key created, need plaintext (shown once at creation)

### Infrastructure
- [ ] **coreaudiod CPU spike** — `sudo killall coreaudiod` (user action required, was 187% CPU)
- [ ] **Docker memory** — Currently 7.65GB default, recommend 32GB+ (Docker Desktop → Resources)
- [ ] **`sudo bash ~/M2-ULTRA-100.sh`** — Full M2 Ultra optimization (requires sudo)

### ARCHIVE / DreamChamber
- [ ] **DreamChamber :7777 restart mechanism** — Currently manual, needs launchctl plist
- [ ] **NOIZYNET daemon auto-restart** — Add to launchctl on GOD
- [ ] **ENGR_KEITH `/build` endpoint** — Returns git log + swift test output, consider caching

### CLAUDE TODAY
- [ ] **Push this briefing** — `git add -A && git commit && git push origin NOIZY.AI`

---

## 8. MACHINE STATE

```
GOD (GABRIEL.local) — M2 Ultra 192GB — macOS Sequoia 15.7.6
IP: 10.90.90.10

Ollama VRAM:
  gemma4:e4b       32.0GB
  nomic-embed-text  0.6GB  ← Lucy's embedding engine
  gemma3           29.7GB
  ─────────────────────────
  Total:           62.3GB / 192GB

Docker: 10 containers running
  noizy-stt :8010, open-webui :3080 (healthy), rabbitmq, qdrant, grafana,
  neo4j, kind, serene_mayer (VSCode devcontainer)

Python: /opt/homebrew/bin/python3 v3.14.3
  aiohttp 3.13.2, httpx 0.28.1, uvicorn 0.43.0

Swap: ~370MB (healthy)
```

---

*Generated by GABRIEL/Claude — DreamChamber v4.3 — April 14, 2026*
