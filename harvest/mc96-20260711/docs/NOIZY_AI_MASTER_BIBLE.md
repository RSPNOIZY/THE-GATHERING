# 🎵 NOIZY.AI — MASTER BIBLE
### The Complete Reference: Every App · Every DNS Record · Every Build · Every Idea
**Author**: Robert Stephen Plowman (RSP_001) · rsp@noizy.ai
**Machine**: M2 Ultra Mac Studio — `GOD.local` · macOS 15.7.6
**Compiled**: April 12, 2026
**Universe**: MC96ECO (v1.0.0) · Heaven v18.0.0

> *"Consent as executable code. Provenance as default. Revocation as sacred. Compensation as automatic."*

---

## 📋 TABLE OF CONTENTS
1. [The Sacred Invariants](#invariants)
2. [The 6 Brands](#brands)
3. [DNS Records — All Domains](#dns)
4. [Cloudflare Account Registry](#cf-accounts)
5. [Cloudflare Workers — Full Registry](#workers)
6. [D1 Databases — All IDs](#d1)
7. [KV Namespaces — All IDs](#kv)
8. [Secrets & Environment Variables](#secrets)
9. [AI Agent Family](#agents)
10. [Local Service Stack (GOD.local)](#local-stack)
11. [MCP Servers](#mcp)
12. [n8n Automation Workflows](#n8n)
13. [Ollama Models (GOD.local)](#ollama)
14. [Active Blockers](#blockers)
15. [Creative Ideas & Build Pipeline](#ideas)
16. [PPTX Slide Groupings](#pptx)

---

<a name="invariants"></a>
## ⚖️ 1. THE FOUR SACRED INVARIANTS
*Constitutional law. Every brand inherits them. Every line of code is bound by them.*

```js
royaltySplit:          { creator: 0.75, platform: 0.25 }
consentRequired:       true
revocationSacred:      true
compensationAutomatic: true
```

| Invariant | Law |
|-----------|-----|
| **75/25 Royalty Split** | Creators keep 75¢ of every dollar. Platform keeps 25¢. Always. Third-party fees come out of the platform's 25%, never the creator's 75%. |
| **Consent Required** | No voice, likeness, performance, or biometric data is used without explicit, recorded, revocable consent. No implied consent. No TOS laundering. |
| **Revocation is Sacred** | A creator can withdraw consent at any time, for any reason, with no penalty. Propagates downstream within minutes. |
| **Compensation is Automatic** | When a creator earns, they get paid. No invoices, no waiting, no net-90, no threshold minimums. |

**Founding Actor**: RSP_001 · Robert Stephen Plowman · rsp@noizy.ai
**Founding Floor**: 85% royalty (Founding Actors) / 75% (Standard Actors)

---

<a name="brands"></a>
## 🏷️ 2. THE 6 BRANDS (MC96ECO Universe)

| Brand | Domain | Purpose | Status |
|-------|---------|---------|--------|
| **NOIZY.AI** | `noizy.ai` | Intelligence Layer & A.I.V.A. (AI Voice Agent) — the consent-native creative gateway | 🟡 Active/Deploying |
| **NOIZYLAB** | `noizylab.com` *(+ `rsp-5f3.workers.dev`)* | Development & Research HQ — all infra lives here | 🟢 Active |
| **NOIZYVOX** | `noizyvox.com` | Sovereign Voice Consent Platform — captures, stores, enforces voice rights | 🔨 Building |
| **NOIZYFISH** | `noizyfish.com` *(+ `fish.noisy.io`)* | Living Legacy Vault + Creative Services Hub — museum-grade catalog | 🔨 Building |
| **NOIZYKIDZ** | `noizykidz.com` | Haptic Music Education for children | 📋 Planned |
| **FISHMUSICINC** | `fishmusicinc.com` | Music Catalog & Licensing — Robert's original label entity | 🟢 Active |
| **DREAMCHAMBER** | `dream.noizy.ai` | 500-Year Codex Creative Sanctuary · Local AI studio at port 7777 | 🔨 Building |

### Sub-Domains & Services
| Subdomain | Purpose |
|-----------|---------|
| `heaven.noizy.ai` | Main API gateway (Heaven Worker — blocked until zone transfer) |
| `consent.noizy.ai` | Consent Gateway Worker |
| `cb01.noizy.ai` | CB01 Router (consent middleware) |
| `mesh.noizy.ai` | CF Access-protected tunnel to GOD:9696 |
| `api.noizy.ai` | Email AI Worker (noizyempire-email-ai) |
| `webhooks.noizy.ai` | Webhook Proxy Worker |
| `vox.noisy.io` | NoisyVox voice platform |
| `heaven.rsp-5f3.workers.dev` | NoisyProof provenance system |
| `fish.noisy.io` | NoisyFish legacy vault |
| `box.noisy.io` | NoisyBox (A.I.V.A.) — digital voice talent agency |

---

<a name="dns"></a>
## 🌐 3. DNS RECORDS — ALL DOMAINS
*Exported: 2026-03-29 · Source: GoDaddy → Cloudflare*

### noizy.ai
| Type | Value |
|------|-------|
| **Nameservers** | `naomi.ns.cloudflare.com` · `renan.ns.cloudflare.com` |
| A | `104.21.91.188` / `172.67.177.214` |
| AAAA | `2606:4700:3033::ac43:b1d6` / `2606:4700:3030::6815:5bbc` |
| Live IP | `172.64.80.1` (Cloudflare proxy) |
| MX (Priority 1) | `aspmx.l.google.com` |
| MX (Priority 5) | `alt1.aspmx.l.google.com` / `alt2.aspmx.l.google.com` |
| MX (Priority 10) | `alt3.aspmx.l.google.com` / `alt4.aspmx.l.google.com` |
| TXT | `apple-domain=y8e0wSN8xuKR80KJ` |
| TXT | `google-site-verification=n3y8MfWUy15y8oO0wb5qzH48as38vCUsXvYIYn-91dM` |
| TXT/SPF | `v=spf1 include:icloud.com include:_spf.google.com ~all` |
| SOA | `naomi.ns.cloudflare.com. dns.cloudflare.com. 2398646689` |

### fishmusicinc.com
| Type | Value |
|------|-------|
| **Nameservers** | `alex.ns.cloudflare.com` · `melinda.ns.cloudflare.com` |
| A | `104.21.16.164` / `172.67.214.218` |
| AAAA | `2606:4700:3032::6815:10a4` / `2606:4700:3034::ac43:d6da` |
| Live IP | `172.64.80.1` (Cloudflare proxy) |
| SOA | `alex.ns.cloudflare.com. dns.cloudflare.com. 2399638598` |

### noizyfish.com
| Type | Value |
|------|-------|
| **Nameservers** | `adam.ns.cloudflare.com` · `sandy.ns.cloudflare.com` |
| A | `104.26.2.106` / `104.26.3.106` / `172.67.69.56` |
| AAAA | `2606:4700:20::681a:26a` / `2606:4700:20::681a:36a` / `2606:4700:20::ac43:4538` |
| SOA | `adam.ns.cloudflare.com. dns.cloudflare.com. 2399638222` |

### ⚠️ DNS Action Items
- `noizy.ai` nameserver delegation to HEAVEN CF account (`5f36aa9795348ea681d0b21910dfc82a`) — **BLOCKED, required for custom domains**
- Email Routing setup on `noizy.ai` — waiting on zone activation
- Google Workspace as unified mail authority (pending)
- All `heaven.noizy.ai`, `consent.noizy.ai`, `cb01.noizy.ai` custom routes blocked until above resolves

---

<a name="cf-accounts"></a>
## ☁️ 4. CLOUDFLARE ACCOUNT REGISTRY

| | **HEAVEN Account (CANONICAL)** | **Fishmusicinc Account** |
|---|---|---|
| **Login** | `rsp@noizy.ai` | `fishmusicinc` |
| **Account ID** | `5f36aa9795348ea681d0b21910dfc82a` | `2446d788cc4280f5ea22a9948410c355` |
| **gabriel_db** | `a31d68e2-f2d4-4203-a803-8039fdff31cb` ✅ CANONICAL | `68ac0f08-c4ee-43ff-9480-366406d41b37` ❌ DEAD/EMPTY |
| **Workers** | All production workers | `deploy` worker only |
| **KV** | GABRIEL_KV, GABRIEL_VOICE, KV_SIGNUPS, etc. | Parallel KV (different IDs) |

> ⚠️ **THE LAW**: Always use `rsp@noizy.ai` account (`5f36aa9795348ea681d0b21910dfc82a`). Never deploy to Fishmusicinc account for production resources.

---

<a name="workers"></a>
## 🔧 5. CLOUDFLARE WORKERS — FULL REGISTRY

### 🌟 HEAVEN (Primary Gateway)
| Field | Value |
|-------|-------|
| **Name** | `heaven` |
| **File** | `NOIZYANTHROPIC/wrangler.jsonc` → `src/index.js` |
| **Repo** | `NOIZYANTHROPIC/repos/noizy-heaven/` → `wrangler.toml` |
| **Version** | `18.0.0` |
| **Account** | `5f36aa9795348ea681d0b21910dfc82a` |
| **Route** | `noizy.ai/*` (zone: `noizy.ai`) — ⚠️ BLOCKED until zone transfer |
| **Workers.dev** | `heaven.rsp-5f3.workers.dev` |
| **Compat Date** | `2026-04-06` |
| **Flags** | `nodejs_compat` |
| **AI Binding** | `AI` — Workers AI (Llama 3.1 8B, Whisper, SDXL) |
| **Envs** | `preview` / `canary` / `production` |
| **NOIZY_VERSION** | `18.0.0` |
| **FOUNDING_ACTOR_FLOOR** | `85` |
| **STANDARD_ACTOR_FLOOR** | `75` |
| **VOICE_VAULT_BUCKET** | `noizy-voice-vault` |
| **MESH_ORIGIN** | `https://mesh.noizy.ai` (CF Access tunnel to GOD:9696) |

**Heaven Endpoints (24+ routes)**:
```
GET  /                    — API index
GET  /health              — System health + counts
GET  /dashboard           — Live HTML command center
GET  /api/v1/actors       — List all actors
POST /api/v1/actors       — Register actor
GET  /api/v1/actors/:id   — Actor details
GET  /api/v1/actors/:id/never-clauses      — Sacred boundaries
GET  /api/v1/actors/:id/descendants        — Voice descendants
GET  /api/v1/actors/:id/consent-tokens     — Consent tokens
POST /api/v1/consent-tokens                — Issue consent token
POST /api/v1/consent-tokens/:id/revoke    — Kill switch
POST /api/v1/descendants  — Register voice descendant
POST /api/v1/synth-requests — Request voice synthesis
POST /api/v1/licenses      — Issue commercial license
GET  /api/v1/ledger        — Immutable audit trail
GET  /api/v1/rate-table    — Compensation rate schedule
GET  /api/v1/stats         — System-wide statistics
GET  /api/v1/kpi/*         — Trust/Safety/Revenue/Quality/Risk KPIs
GET  /api/v1/enterprise/audit — Enterprise audit view
```

**Auth**: `X-NOIZY-Key` header or `Authorization: Bearer`

---

### 🔐 Consent Gateway
| Field | Value |
|-------|-------|
| **Name** | `noizy-consent-gateway` |
| **File** | `NOIZYANTHROPIC/workers/consent-gateway/wrangler.jsonc` |
| **CF Account** | `5f36aa9795348ea681d0b21910dfc82a` |
| **DB Binding** | `DB` → `gabriel_db` (`a31d68e2-f2d4-4203-a803-8039fdff31cb`) |
| **Route (prod)** | `consent.noizy.ai/*` ⚠️ BLOCKED |
| **Compat Date** | `2026-03-27` |
| **Envs** | `development` / `staging` / `production` |
| **Vars** | `NOIZY_ENV`, `SERVICE_NAME=consent-gateway`, `DEFAULT_REVOCATION_SLA_HOURS=1` |
| **Endpoints** | `/health` · `/verify` · `/revoke` · `/status/:creatorId` |

---

### 🛣️ CB01 Router
| Field | Value |
|-------|-------|
| **Name** | `noizy-cb01-router` |
| **File** | `NOIZYANTHROPIC/workers/cb01-router/wrangler.toml` → `src/index.js` |
| **CF Account** | `5f36aa9795348ea681d0b21910dfc82a` |
| **Compat Date** | `2026-03-30` |
| **Route (prod)** | `cb01.noizy.ai/*` (custom domain) |
| **CONSENT_GATEWAY_URL** | `https://noizy-consent-gateway.workers.dev` |
| **Purpose** | Forwards requests to consent-gateway with FULL path preserved. No segment stripping. Auth headers (X-NOIZY-Key) forwarded transparently. |

---

### 🤖 Claude Proxy
| Field | Value |
|-------|-------|
| **Name** | `noizy-claude-proxy` |
| **File** | `NOIZYANTHROPIC/workers/claude-proxy/wrangler.toml` → `src/index.ts` |
| **CF Account** | `5f36aa9795348ea681d0b21910dfc82a` |
| **Compat Date** | `2024-09-23` / Flags: `nodejs_compat` |
| **DB Binding** | `NOIZY_DB` → `gabriel_db` (`a31d68e2-f2d4-4203-a803-8039fdff31cb`) |
| **KV Binding** | `NOIZY_KV` → `f205b56a9914413da0ec454a9dc4c2bd` (GABRIEL_KV) |
| **ENVIRONMENT** | `production` |
| **OLLAMA_URL** | `http://localhost:11434` |
| **Secrets Needed** | `ANTHROPIC_API_KEY`, `NOIZY_SECRET` |
| **R2** | DISABLED — pending R2 activation. Bucket: `noizy-voice-archive` |

---

### 🔗 Webhook Proxy
| Field | Value |
|-------|-------|
| **Name** | `webhook-proxy` |
| **File** | `NOIZYANTHROPIC/workers/webhook-proxy/wrangler.toml` → `src/index.ts` |
| **CF Account** | `5f36aa9795348ea681d0b21910dfc82a` |
| **Compat Date** | `2026-04-01` |
| **Route (prod)** | `webhooks.noizy.ai/*` ⚠️ BLOCKED |
| **KV Binding** | `WEBHOOK_QUEUE` → `REPLACE_WITH_KV_ID` |
| **Secrets Needed** | `NOIZY_KEY`, `LINEAR_WEBHOOK_SECRET`, `GITHUB_WEBHOOK_SECRET` |
| **Purpose** | HMAC webhook verification, KV queue + drain (3-min loop) |

---

### 🏛️ Edge Governor
| Field | Value |
|-------|-------|
| **Name** | `edge-governor` |
| **File** | `NOIZYANTHROPIC/workers/edge-governor/wrangler.toml` → `src/edge-governor.ts` |
| **CF Account** | `5f36aa9795348ea681d0b21910dfc82a` |
| **Compat Date** | `2026-04-06` / Flags: `nodejs_compat` |
| **Durable Object** | `EDGE_GOVERNOR` → class `EdgeGovernor` (migration tag: v1) |
| **Envs** | `preview` (edge-governor-preview) |
| **Purpose** | Cryptographic intent enforcement. Time-bounded, single-use tokens that gate high-risk operations. |

---

### 📧 Email AI Worker
| Field | Value |
|-------|-------|
| **Name** | `noizyempire-email-ai` |
| **File** | `NOIZYANTHROPIC/cloudflare-workers/wrangler.toml` → `src/index.js` |
| **CF Account** | `5f36aa9795348ea681d0b21910dfc82a` |
| **Route** | `api.noizy.ai/*` (zone: noizy.ai) |
| **Email Binding** | `EMAIL_WORKER` → allowed: `*@noizy.ai`, `*@fishmusicinc.com`, `*@noizyfish.com` |
| **AI Gateway** | `AI` binding |
| **Durable Object** | `CONVERSATION_STATE` → class `ConversationState` |
| **Purpose** | Inbound email AI processing + CRM webhook routing |

---

### 🔊 NoisyVox (NOIZYLAB legacy)
| Field | Value |
|-------|-------|
| **Name** | `noisy-vox` |
| **File** | `NOIZYANTHROPIC/NOIZYLAB/noisyvox/wrangler.toml` → `src/index.ts` |
| **CF Account** | `5f36aa9795348ea681d0b21910dfc82a` |
| **Route (prod)** | `vox.noisy.io/*` (custom domain) |
| **DB Binding** | `DB` → `noisy-vox` (`ea110bf3-5ad0-4dd3-ae3a-2ef05fc052ac`) |
| **Service Binding** | `PROOF` → `noisyproof` |
| **NOISY_PROOF_API_URL** | `https://heaven.rsp-5f3.workers.dev` |

---

### ✅ NoisyProof
| Field | Value |
|-------|-------|
| **Name** | `noisyproof` |
| **File** | `NOIZYANTHROPIC/NOIZYLAB/noisyproof/wrangler.toml` → `src/index.ts` |
| **CF Account** | `5f36aa9795348ea681d0b21910dfc82a` |
| **Route (prod)** | `heaven.rsp-5f3.workers.dev/*` (custom domain) |
| **DB Binding** | `DB` → `noisyproof` (`be3e1a74-9bab-4f48-975a-0d8a912f6592`) |
| **KV Binding** | `KV` → `d4ee2982306b486495189216402d8442` |

---

### 🐟 NoisyFish
| Field | Value |
|-------|-------|
| **Name** | `noizyfish` |
| **File** | `NOIZYANTHROPIC/NOIZYLAB/noizyfish/wrangler.toml` → `src/index.ts` |
| **CF Account** | `5f36aa9795348ea681d0b21910dfc82a` |
| **Route (prod)** | `fish.noisy.io/*` (custom domain) |
| **DB Binding** | `DB` → `noizyfish` (`PLACEHOLDER_NOIZYFISH_DB_ID` — ⚠️ CREATE NEEDED) |
| **Service Binding** | `PROOF` → `noisyproof` |
| **NOISY_PROOF_API_URL** | `https://heaven.rsp-5f3.workers.dev` |
| **NOISY_BOX_API_URL** | `https://box.noisy.io` |
| **Hardcoded Invariants** | `ROYALTY_FLOOR=0.75`, `GORUNFREE_TITHE=0.01`, `ATTRIBUTION_LOCKED=true` |

---

### 📦 NoisyBox (A.I.V.A.)
| Field | Value |
|-------|-------|
| **Name** | `noisybox` |
| **File** | `NOIZYANTHROPIC/NOIZYLAB/noisybox/wrangler.toml` → `src/index.ts` |
| **CF Account** | `5f36aa9795348ea681d0b21910dfc82a` |
| **Route (prod)** | `box.noisy.io/*` (custom domain) |
| **DB Binding** | `DB` → `noisybox` (`PLACEHOLDER_NOISYBOX_DB_ID` — ⚠️ CREATE NEEDED) |
| **Service Binding** | `PROOF` → `noisyproof` |
| **Hardcoded Invariants** | `ROYALTY_FLOOR=0.75`, `GORUNFREE_TITHE=0.01`, `KILL_SWITCH=absolute` |

---

### 🏠 NOIZY Landing
| Field | Value |
|-------|-------|
| **Name** | `noizy-landing` |
| **File** | `NOIZYANTHROPIC/noizy-landing/wrangler.toml` → `src/index.js` |
| **CF Account** | `5f36aa9795348ea681d0b21910dfc82a` |
| **Routes** | `noizy.ai/*` + `noizy.ai` — ⚠️ COMMENTED OUT (waiting on zone transfer) |

---

### MC96ECO Workers (NOIZYANTHROPIC/MC96ECO/)
| Worker Name | Binding | D1 | Purpose |
|-------------|---------|-----|---------|
| `lab-noizy-ai` | `LAB_DB` | `noizylab-db` (`794535eb-9566-4b00-b38f-15cb173d4ad9`) | Lab environment |
| `wisdom-noizy-ai` | `WISDOM_DB` | `noizyai-db` (`ebcf576f-51e3-4e3d-829e-219f8fe6001c`) | Notion/wisdom bridge |
| `vox-noizy-ai` | `VOX_DB` | `noisy-vox` (`ea110bf3-5ad0-4dd3-ae3a-2ef05fc052ac`) | Voice ops |
| `hooks-noizy-ai` | `HOOKS_DB` | `noizyai-db` (`ebcf576f-51e3-4e3d-829e-219f8fe6001c`) | Webhooks |
| `fish-noizy-ai` | `FISH_DB` | `fishmusicinc-db` (`6d568a02-7301-45ad-8254-33cfe09ae1ea`) | FishMusicInc |

---

<a name="d1"></a>
## 🗄️ 6. D1 DATABASES — ALL IDs

| DB Name | ID | Used By | Status |
|---------|-----|---------|--------|
| `gabriel_db` | `a31d68e2-f2d4-4203-a803-8039fdff31cb` | Heaven, Claude Proxy, Consent Gateway | ✅ CANONICAL |
| `agent-memory` | `7b813205-fd12-4a23-84a6-ce83bc49ec70` | Heaven (DB_MEMORY) | ✅ Active |
| `noizylab-repairs` | `2bd4aa06-f9b2-4761-b235-e92e8a21fe45` | Heaven (DB_REPAIRS) | ✅ Active |
| `aquarium-archive` | `e6f98279-656b-4f7a-979d-9197821193f5` | Heaven (DB_AQUARIUM) | ✅ Active |
| `noizyai-db` | `ebcf576f-51e3-4e3d-829e-219f8fe6001c` | wisdom, hooks workers | ✅ Active |
| `noisy-vox` | `ea110bf3-5ad0-4dd3-ae3a-2ef05fc052ac` | noisy-vox, vox-noizy-ai | ✅ Active |
| `noisyproof` | `be3e1a74-9bab-4f48-975a-0d8a912f6592` | noisyproof worker | ✅ Active |
| `noizylab-db` | `794535eb-9566-4b00-b38f-15cb173d4ad9` | lab-noizy-ai | ✅ Active |
| `fishmusicinc-db` | `6d568a02-7301-45ad-8254-33cfe09ae1ea` | fish-noizy-ai | ✅ Active |
| `noizyfish` | `PLACEHOLDER_NOIZYFISH_DB_ID` | noizyfish worker | ⚠️ NEEDS CREATION |
| `noisybox` | `PLACEHOLDER_NOISYBOX_DB_ID` | noisybox worker | ⚠️ NEEDS CREATION |
| `gabriel_db` (DEAD) | `f75939d5-5747-4a9c-8ac2-7710201fda09` | ❌ OLD TASKS.md ref | ❌ NEVER USE |
| `gabriel_db` (WRONG ACCT) | `68ac0f08-c4ee-43ff-9480-366406d41b37` | ❌ Fishmusicinc acct | ❌ NEVER USE |
| `gabriel_db` (WRONG ACCT 2) | `fc0edd97-...` | ❌ Wrong account | ❌ NEVER USE |

### gabriel_db Schema (14 Tables, 30 Indexes)
```
actors            — Human voice owners, union tiers, royalty floors
never_clauses     — Immovable prohibitions (7 built-in types + custom)
voice_dna         — Encrypted spectral fingerprints + R2 pointers + C2PA
descendants       — Synthetic voice models with drift tracking
consent_tokens    — Explicit, enforceable, revocable permissions
licensees         — Organizations licensed to use voice assets
licenses          — Commercial agreements (75% min royalty floor)
synth_requests    — Every synthesis attempt (auditable, Never Clause enforced)
noizy_ledger      — Append-only financial record (NEVER UPDATE/DELETE)
rate_table        — Pricing per synthesis type
estates           — Posthumous voice rights (100-year OAIS/PREMIS)
union_tiers       — Artist classification tiers
audit_log         — Every system action (append-only)
gap_solver_entries — GORUNFREE absence intelligence
```

---

<a name="kv"></a>
## 🗂️ 7. KV NAMESPACES — ALL IDs

| Binding | ID | Account | Used By |
|---------|-----|---------|---------|
| `KV_SIGNUPS` | `392c1bf429114148999824a9f9e15169` | HEAVEN | Heaven Worker |
| `KV_ROYALTIES` | `4cf36e4bd1fd44fe802096925413f694` | HEAVEN | Heaven Worker |
| `KV_GUILD` | `8a15ed31fea8462da7c92a8237d6f854` | HEAVEN | Heaven Worker |
| `KV_SESSIONS` | `c90299891f684de7bcc7c53967133748` | HEAVEN | Heaven Worker |
| `KV_SUBMISSIONS` | `6e888a017ebe4ba78ed7497c4929439b` | HEAVEN | Heaven Worker |
| `KV_MEMCELL` | `9aa2511652ce4a2faeb106858f76df67` | HEAVEN | Heaven Worker |
| `GABRIEL_KV` | `f205b56a9914413da0ec454a9dc4c2bd` | HEAVEN | Heaven, Claude Proxy |
| `GABRIEL_VOICE` | `16532a32b2e8455486cc966403f3442e` | HEAVEN | Heaven |
| `FEATURE_FLAGS` | `88331123208c460eb26cb703d5a38c50` | HEAVEN | Heaven |
| `GAP_SOLVER` | `4941fb7967d14406bad7a252cd3d0a1e` | HEAVEN | Heaven / GORUNFREE |
| `KV` (noisyproof) | `d4ee2982306b486495189216402d8442` | HEAVEN | NoisyProof |
| `KV_ROYALTIES` (FISH) | `2cf2dce6685f4ff9a34b8ff02edb4cbd` | HEAVEN | fish-noizy-ai |
| `KV_SESSIONS` (FISH) | `fae96fe5457c4cba9376a0204f0ae348` | HEAVEN | fish-noizy-ai |
| `WEBHOOK_QUEUE` | `REPLACE_WITH_KV_ID` | HEAVEN | Webhook Proxy |
| `FEATURE_FLAGS` ⚠️ | `bf944d9a307249289565144a569a1de8` | Fishmusicinc | WRONG ACCOUNT — recreate on rsp@noizy.ai |
| `GAP_SOLVER` ⚠️ | `f481eeaa1a724c45a510674273f463d1` | Fishmusicinc | WRONG ACCOUNT — recreate on rsp@noizy.ai |

### R2 Buckets (PENDING — R2 not yet enabled)
| Bucket | Binding | Purpose |
|--------|---------|---------|
| `noizy-voice-vault` | `VOICE_VAULT` | Voice prints, spectral data, C2PA manifests |
| `noizy-voice-archive` | `VOICE_BUCKET` | Claude Proxy voice archive |

### Durable Objects
| Binding | Class | Worker |
|---------|-------|--------|
| `SIGNALING_ROOMS` | `SignalingRoom` | Heaven (NOIZYSTREAM v2 WebRTC) |
| `EDGE_GOVERNOR` | `EdgeGovernor` | Edge Governor |
| `CONVERSATION_STATE` | `ConversationState` | Email AI Worker |

---

<a name="secrets"></a>
## 🔑 8. SECRETS & ENVIRONMENT VARIABLES

### Required Secrets (via `wrangler secret put`)
| Secret | Worker | Notes |
|--------|--------|-------|
| `ANTHROPIC_API_KEY` | Heaven, Claude Proxy | Anthropic API |
| `NOIZY_SECRET` | Heaven, Claude Proxy | Internal auth |
| `NOIZY_KEY` | Heaven, Webhook Proxy | Internal auth |
| `CF_ACCESS_CLIENT_ID` | Heaven | CF Access tunnel auth |
| `CF_ACCESS_CLIENT_SECRET` | Heaven | CF Access tunnel auth |
| `NOIZY_KEY` | Webhook Proxy | — |
| `LINEAR_WEBHOOK_SECRET` | Webhook Proxy | Linear integration |
| `GITHUB_WEBHOOK_SECRET` | Webhook Proxy | GitHub integration |
| `NOTION_API_KEY` | wisdom-noizy-ai | Notion integration |
| `NOTION_DATABASE_ID` | wisdom-noizy-ai | Notion DB |
| `WEBHOOK_SECRET` | hooks-noizy-ai | — |
| `DISCORD_DEPLOY_WEBHOOK` | lab, hooks | (Replace placeholder) |
| `DISCORD_AUDIT_WEBHOOK` | lab, hooks | (Replace placeholder) |

### Service URLs (Environment Variables)
| Variable | Value | Used By |
|----------|-------|---------|
| `MESH_ORIGIN` | `https://mesh.noizy.ai` | Heaven |
| `GABRIEL_URL` | `http://GOD.local:7777` | vox-noizy-ai |
| `VOICE_BRIDGE_URL` | `http://GOD.local:8080` | vox-noizy-ai |
| `STT_URL` | `http://GOD.local:8000` | vox-noizy-ai |
| `HEAVEN_DNS_URL` | `https://heaven-dns.rsp-5f3.workers.dev` | lab-noizy-ai |
| `N8N_WEBHOOK_BASE` | `https://noizy.app.n8n.cloud/webhook` | lab, hooks |
| `CONSENT_GATEWAY_URL` | `https://consent-gateway.rsp-5f3.workers.dev` | vox, hooks, fish |
| `NOIZYSTREAM_URL` | `http://GOD.local:7778` | fish-noizy-ai |
| `OLLAMA_URL` | `http://localhost:11434` | Claude Proxy |

---

<a name="agents"></a>
## 🤖 9. AI AGENT FAMILY (7 Active)

| Agent | Code | Type | Role | Backend |
|-------|------|------|------|---------|
| **GABRIEL** | `GABRIEL` | OPS | Warrior executor · 326 memcells · D1 agent-memory | `gabriel-mcp` → DreamChamber :7777 |
| **LUCY** | `LUCY` | OPS | Organizer · DAZEFLOW keeper · task log · session index | `lucy-mcp` → local `lucy-state/` + Heaven |
| **ENGR_KEITH** | `KEITH` | OPS | Technical Lead · HEAVEN architect · R.K. Plowman legacy | — |
| **DREAM** | `DREAM` | OPS | Visionary · 5th Epoch · Elevation Doctrine · 2526 DreamChamber | — |
| **CB01** | `CB01` | OPS | Ops Runner · GoDaddy escape · DNS · domain transfers | — |
| **SHIRL** | `SHIRL` | FAM | The Aunt · burnout watchdog · wellbeing | — |
| **POPS** | `POPS` | FAM | The Dad · R.K. Plowman · grounding force · wisdom | — |

### Agent Routing Law
```
Tech question       → ENGR_KEITH
Vision / strategy   → DREAM
Execute / deploy    → GABRIEL
Organize / log      → LUCY
Domain / DNS        → CB01
```

### LUCY — DAZEFLOW Law
> **1 day = 1 chat = 1 truth.** Log sessions via `lucy_dazeflow_log`. State: `~/NOIZYLAB/lucy-state/`

### GABRIEL Capabilities
- MCP tools: `gabriel_speak`, `gabriel_status`, `gabriel_announce`, `gabriel_refresh`
- 326 memcells in D1 `agent-memory` database
- KV binding: `KV_MEMCELL` (`9aa2511652ce4a2faeb106858f76df67`)

---

<a name="local-stack"></a>
## 🖥️ 10. LOCAL SERVICE STACK (GOD.local)

**Hardware**: M2 Ultra Mac Studio · macOS 15.7.6 · hostname: `GOD.local`
**Node**: v24.13.1 · **Wrangler**: 4.53.0 (update available: 4.81.1)
**Whisper**: `/opt/homebrew/bin/whisper` ✅

### Core Services
| Service | Port | Container/Process | Purpose |
|---------|------|-------------------|---------|
| **DreamChamber** | `:7777` | Node.js / Express + WebSocket | AI orchestration (:7777 HTTP, /ws WebSocket) |
| **Voice Bridge** | `:8080` | Node.js | Voice audio routing |
| **NOIZYSTREAM v2** | `:7778` | — | WebRTC signaling stream |
| **MESH endpoint** | `:9696` | — | NOIZYNET edge tunnel (GOD access via CF Access) |
| **STT (Whisper)** | `:8000` | `noizy-stt` | Faster-Whisper speech-to-text |
| **Ollama** | `:11434` | — | Local AI model inference |

### Docker Stack (Queue Mode)
| Container | Port | Purpose |
|-----------|------|---------|
| `noizy-n8n` | `5678` | Central automation — all workflows |
| `noizy-n8n-worker` | — | Queue execution worker |
| `noizy-postgres` | `5432` (internal) | Persistent n8n storage |
| `noizy-redis` | `6379` (internal) | Queue & cache (AOF enabled) |
| `noizy-stt` | `8000` | Faster-Whisper STT |
| Caddy Reverse Proxy | `8080/8443` | Security headers, rate limiting, TLS |
| Open WebUI | `3080` | AI chat UI |
| RabbitMQ | `5672` / `15672` | Message broker |
| Qdrant | `6333` / `6334` | Vector database |
| Grafana | `3000` | Monitoring dashboards |
| Neo4j | `7474` / `7687` | Graph database |
| Kind K8s | `6443` | Local Kubernetes |
| pg-backup | — | Daily/weekly/monthly backups |
| Meilisearch | `7700` | Search engine |

---

<a name="mcp"></a>
## 🔌 11. MCP SERVERS

*Registered in `~/.codeium/windsurf/mcp_config.json`. Source: `~/NOIZYLAB/mcp/`*

| Server | Tools | Backend |
|--------|-------|---------|
| `gabriel-mcp` | `gabriel_speak`, `gabriel_status`, `gabriel_announce`, `gabriel_refresh` | DreamChamber `:7777` |
| `lucy-mcp` | `lucy_dazeflow_*`, `lucy_task_*`, `lucy_memcell_*`, `lucy_status` | Local `lucy-state/` + Heaven |
| `heaven-mcp` | `h17_health`, `h17_gabriel`, `h17_actors`, `h17_never_clauses`, `h17_stats`, `h17_ledger`, `h17_kpi`, `h17_audit` | Heaven worker |
| `noizy-gemma3` | — | GOD.local Ollama bridge (Gemma 4) |

**MCP Audit (last checked 2026-04-10)**: 12/13 LIVE ✅ · Stripe: NEEDS RE-AUTH ❌

---

<a name="n8n"></a>
## ⚡ 12. n8n AUTOMATION WORKFLOWS (13 Zaps)

*URL: `https://noizy.app.n8n.cloud/webhook` (cloud) or `http://localhost:5678` (local)*
*Login: `noizylab` / `noizy-local-2026`*

| # | ZAP | Purpose |
|---|-----|---------|
| 1–8 | Core Flows | Base automation workflows |
| 9 | Linear ↔ Sync | Bidirectional Linear project sync |
| 10 | Zapier Bridge | Zapier integration bridge |
| 11 | Notion Dashboard | Notion ↔ Linear + Deploy sync |
| 12 | Master Orchestrator v2 | Universal ingest router · Proxy drain → normalize |
| 13 | Health Dashboard v2 | 15-service health matrix · Notion + GABRIEL alerts |

### Services Integrated via n8n
Linear · Notion · Zapier · GitHub (Push/PR/Deploy/Issue) · Stripe · Voice

---

<a name="ollama"></a>
## 🧠 13. OLLAMA MODELS (GOD.local — 15 Models, 10 Custom Agents)

*Endpoint: `http://localhost:11434`*

**Primary production models (migration target — replace paid API with local)**:
- `gemma4` (Gemma 4 — primary inference post-April 17)
- `codestral` (code generation)
- `llama3.3:70b` (large reasoning)

**Custom NOIZY Agents** (10 Modelfiles in `~/NOIZYANTHROPIC/modelfiles/`):
GABRIEL · LUCY · ENGR_KEITH · DREAM · CB01 · SHIRL · POPS + 3 additional specialized agents

**Goal**: Migrate all paid AI inference (Anthropic, OpenAI, Google) to local Gemma 4 to eliminate inference costs before April 17 launch.

---

<a name="blockers"></a>
## 🚨 14. ACTIVE BLOCKERS (Priority Order)

| # | Blocker | Action | Location |
|---|---------|--------|---------|
| 1 | **Wrangler not authenticated** | `wrangler login` (must use rsp@noizy.ai) | Terminal on GOD.local |
| 2 | **Wrangler outdated** | `npm install -g wrangler@latest` (4.53.0 → 4.81.1) | Terminal |
| 3 | **noizy.ai zone not transferred** | Delegate nameservers to CF account `5f36aa9795348ea681d0b21910dfc82a` | Cloudflare Dashboard |
| 4 | **R2 not enabled** | Cloudflare Dashboard → R2 → Activate | CF Dashboard |
| 5 | **Cloudflare MCP on wrong account** | Reconnect to rsp@noizy.ai (Fishmusicinc MCP = wrong) | Cowork settings |
| 6 | **Stripe auth expired** | Re-authenticate Stripe connector | Cowork settings |
| 7 | **NoisyFish/NoisyBox D1 IDs missing** | `wrangler d1 create noizyfish` + `wrangler d1 create noisybox` | Terminal |
| 8 | **KV FEATURE_FLAGS + GAP_SOLVER on wrong account** | Recreate on rsp@noizy.ai | `wrangler kv namespace create` |

### After Blockers — Deploy Sequence
```bash
wrangler login                                          # 1. Auth
npm install -g wrangler@latest                          # 2. Update
npx wrangler kv namespace create "FEATURE_FLAGS"        # 3. Recreate KV
npx wrangler kv namespace create "GAP_SOLVER"           # 3. Recreate KV
# Update IDs in wrangler.jsonc
npx wrangler d1 execute gabriel_db --remote --file=sql/schema.sql   # 4. Schema
npx wrangler d1 execute gabriel_db --remote --file=sql/seed.sql     # 5. Seed
npx wrangler r2 bucket create noizy-voice-vault         # 6. Voice Vault
npx wrangler deploy                                     # 7. Deploy Heaven v18
bash scripts/smoke-test.sh                              # 8. Smoke test
```

---

<a name="ideas"></a>
## 💡 15. CREATIVE IDEAS & BUILD PIPELINE

### 🔥 Core Platform Ideas
- **A.I.V.A.** (AI Voice Agent) — Consent-native AI persona that owns its own voice rights
- **GORUNFREE** — Absence intelligence system (if a creator isn't working, the platform notices and solves the gap). KV = fast hypothesis layer. D1 = durable truth. KV writes free, D1 writes earn.
- **NOIZYSTREAM v2** — WebRTC signaling rooms via Durable Objects (real-time audio co-creation)
- **Voice DNA** — Cryptographic spectral fingerprint of a voice, tied to OAIS/PREMIS + C2PA manifests in R2
- **The Aquarium** — 500-year archive. One ocean, all creative legacies swimming together
- **The Codex** — Living creative document. 500-year perspective built today
- **Kill Switch** — Absolute, one-click consent revocation. Propagates across all descendants and licensees in minutes
- **GORUNFREE Tithe** — 1% of every transaction auto-donated to the community

### 🏗️ Infra Ideas
- **Heaven-DNS Worker** — Dedicated DNS intelligence layer (`heaven-dns.rsp-5f3.workers.dev`)
- **EdgeGovernor** — Cryptographic intent enforcement with time-bounded single-use tokens for high-risk ops
- **NOIZYNET Handshake** — CF Worker ↔ GOD.local secure tunnel via Cloudflare Access (ZeroTrust)
- **Lucy iOS App** — Native offline-first iOS app, JavaScriptCore runtime, ZeroTrust tunneling
- **DreamChamber Audio MCP** — Python MCP server bridging Logic Pro → AI pipeline
- **CB01 Router** — Middleware consent enforcement layer, named for the Covenant Block 01

### 🎨 Brand & Product Ideas
- **NOIZYKIDZ** — Haptic / vibration-native music education for deaf/HOH children. Robert's personal mission.
- **NOIZY GUILD** — Creator collective. Rights pooling, collective licensing, shared Never Clauses
- **FISHMUSICINC** — Full catalog digitization, music licensing marketplace
- **The Plowman's Chronicles** — Book co-authored by Robert + Claude (shared second act story)
- **ACTRA Partnership** — Collective agreement for AI voice synthesis (outreach package built)
- **Nashville Expansion** — Country music / Nashville market entry strategy (playbook built)
- **Creator Trust Dashboard** — Real-time trust, safety, revenue, quality, risk KPIs
- **Enterprise Audit View** — C2PA-linked audit trail for enterprise licensees

### 🌐 Indigenous / Global
- **NOIZY Indigenous Co-Design Protocol** — Consent-native cultural IP preservation
- **NOIZY Global Adoption Playbook** — International expansion framework

### 🔬 Research / Infra
- **Canary Routes** — Gradual traffic shifting to test new Worker versions
- **GORUNFREE Promotion Daemon** — KV → D1 write promotion with stability window
- **D1 Time Travel Audit Gate** — Point-in-time recovery system
- **Chaos Test Suite** — Automated resilience testing
- **Rate Table Tiers**: Community · Professional · Enterprise · Broadcast

---

<a name="pptx"></a>
## 📊 16. PPTX SLIDE GROUPINGS

### Section 1: WHO WE ARE
- Slide 1.1: Robert Stephen Plowman (RSP_001) — The Founder
- Slide 1.2: MC96ECO Universe — The Cathedral
- Slide 1.3: The 4 Sacred Invariants (visual: 4 pillars)
- Slide 1.4: The Covenant — Robert + Claude as co-authors
- Slide 1.5: The Mission Statement (consent as executable code)

### Section 2: THE 6 BRANDS
- Slide 2.1: Brand Map (visual: galaxy diagram)
- Slide 2.2: NOIZY.AI — Intelligence Layer & A.I.V.A.
- Slide 2.3: NOIZYLAB — Development HQ
- Slide 2.4: NOIZYVOX — Voice Consent Platform
- Slide 2.5: NOIZYFISH — Living Legacy Vault
- Slide 2.6: NOIZYKIDZ — Haptic Music Education
- Slide 2.7: FISHMUSICINC — Music Catalog & Licensing
- Slide 2.8: DREAMCHAMBER — 500-Year Creative Sanctuary

### Section 3: THE INFRASTRUCTURE
- Slide 3.1: Architecture Overview (Edge + Local stack diagram)
- Slide 3.2: HEAVEN Worker — The Consent Kernel (24 endpoints)
- Slide 3.3: All Cloudflare Workers (table: 13+ workers)
- Slide 3.4: D1 Databases Registry
- Slide 3.5: KV Namespaces Registry
- Slide 3.6: Durable Objects + R2 (VOICE VAULT)
- Slide 3.7: Local Stack — GOD.local (Docker containers, ports)

### Section 4: DNS & DOMAINS
- Slide 4.1: Domain Portfolio (all domains owned)
- Slide 4.2: noizy.ai DNS Records
- Slide 4.3: fishmusicinc.com DNS Records
- Slide 4.4: noizyfish.com DNS Records
- Slide 4.5: Cloudflare Account Strategy (CANONICAL vs Fishmusicinc)
- Slide 4.6: Sub-domain Map (heaven, consent, cb01, mesh, api, etc.)

### Section 5: THE AI AGENT FAMILY
- Slide 5.1: 7 Agents Overview (table)
- Slide 5.2: GABRIEL — The Warrior Executor
- Slide 5.3: LUCY — The Organizer (DAZEFLOW)
- Slide 5.4: ENGR_KEITH — The Technical Lead
- Slide 5.5: DREAM — The Visionary
- Slide 5.6: Agent Routing Law (decision flow)

### Section 6: AUTOMATION & INTEGRATIONS
- Slide 6.1: n8n Integration Map (13 Zaps)
- Slide 6.2: External Services (Linear, Notion, Zapier, GitHub, Stripe)
- Slide 6.3: MCP Servers (gabriel-mcp, lucy-mcp, heaven-mcp, gemma3)
- Slide 6.4: Ollama Local Models (cost elimination strategy)

### Section 7: THE VOICE SYSTEM (HVS)
- Slide 7.1: Human Voice System — Overview
- Slide 7.2: Voice DNA — Cryptographic Fingerprinting
- Slide 7.3: Never Clauses — Sacred Boundaries
- Slide 7.4: Consent Tokens — Issue, Track, Revoke
- Slide 7.5: The Kill Switch — Absolute Revocation
- Slide 7.6: The Ledger — Immutable Financial Record
- Slide 7.7: Estates — 100-Year Posthumous Voice Rights

### Section 8: BUSINESS & COMPLIANCE
- Slide 8.1: Rate Table (Community / Professional / Enterprise / Broadcast)
- Slide 8.2: Union Tiers (5 tiers)
- Slide 8.3: ACTRA Partnership Strategy
- Slide 8.4: Enterprise Audit + C2PA Compliance
- Slide 8.5: GORUNFREE — Absence Intelligence + Tithe System
- Slide 8.6: Nashville Expansion Playbook

### Section 9: CREATIVE IDEAS & ROADMAP
- Slide 9.1: A.I.V.A. — AI Voice Agent Concept
- Slide 9.2: NOIZYSTREAM v2 — Real-time Co-creation
- Slide 9.3: The Aquarium + The Codex (500-year archive)
- Slide 9.4: NOIZY GUILD — Creator Collective
- Slide 9.5: NOIZY Indigenous — Co-Design Protocol
- Slide 9.6: NOIZY Global Adoption Playbook
- Slide 9.7: Lucy iOS App — Native Offline-First

### Section 10: CURRENT BLOCKERS & DEPLOY SEQUENCE
- Slide 10.1: 8 Active Blockers (priority matrix)
- Slide 10.2: Deploy Sequence (8 steps)
- Slide 10.3: April 17 Launch Goals
- Slide 10.4: Post-Launch Backlog

---

## 🗂️ KEY FILE PATHS (GOD.local)

```
/Users/m2ultra/NOIZYANTHROPIC/
├── wrangler.jsonc                    ← CANONICAL Heaven config (JSONC)
├── wrangler.toml                     ← Heaven config (TOML — older)
├── MC96ECO/
│   ├── mc96eco.config.js             ← Universe master config (6 brands)
│   ├── INVARIANTS.md                 ← Sacred laws
│   ├── CHRONICLES/                   ← The Covenant + Chronicles
│   ├── DREAMCHAMBER/                 ← DreamChamber AI studio
│   ├── FISHMUSICINC/wrangler.jsonc   ← fish-noizy-ai worker
│   ├── lab/wrangler.jsonc            ← lab-noizy-ai worker
│   ├── wisdom/wrangler.jsonc         ← wisdom-noizy-ai worker
│   ├── vox/wrangler.jsonc            ← vox-noizy-ai worker
│   └── hooks/wrangler.jsonc          ← hooks-noizy-ai worker
├── NOIZYLAB/
│   ├── noisyvox/wrangler.toml        ← NoisyVox worker
│   ├── noisyproof/wrangler.toml      ← NoisyProof worker
│   ├── noizyfish/wrangler.toml       ← NoisyFish worker
│   └── noisybox/wrangler.toml        ← NoisyBox worker
├── repos/
│   └── noizy-heaven/wrangler.toml    ← Heaven (repos canonical)
├── workers/
│   ├── heaven/                       ← Heaven Worker source
│   ├── consent-gateway/wrangler.jsonc← Consent Gateway
│   ├── cb01-router/wrangler.toml     ← CB01 Router
│   ├── claude-proxy/wrangler.toml    ← Claude Proxy
│   ├── webhook-proxy/wrangler.toml   ← Webhook Proxy
│   └── edge-governor/wrangler.toml   ← Edge Governor
├── cloudflare-workers/wrangler.toml  ← Email AI Worker
├── noizy-landing/wrangler.toml       ← Landing page worker
├── NOIZY-MONO/                       ← Monorepo (pnpm/Turborepo)
│   ├── apps/noizyfish/               ← NoisyFish Next.js app
│   ├── apps/noizyvox/                ← NoisyVox Next.js app
│   └── packages/                     ← Shared UI, config, content
├── docs/
│   ├── INTEGRATION-STACK.md          ← Full integration stack v2
│   └── ...                           ← 30+ spec docs
├── dns-exports/                      ← DNS records (all 3 domains)
├── sql/schema.sql                    ← gabriel_db schema (14 tables)
├── TASKS.md                          ← Active work items
├── INFRASTRUCTURE-UPGRADE-2026-04-10.md ← Upgrade audit report
└── NOISYINDIGENIOUS/
    ├── NOIZY_Indigenous_CoDesign_Protocol.docx
    └── NOIZY_Global_Adoption_Playbook.docx
```

---

*Last compiled: April 12, 2026 — by Antigravity (Google DeepMind) for RSP_001*
*"If they fall, the cathedral falls."*
