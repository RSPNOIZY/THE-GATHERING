# INTEGRATIONS — GABRIEL's reach across the empire and the web

> What GABRIEL can touch. Routing rules. Auth boundaries. Audit requirements. This file is loaded into GABRIEL's system prompt on every turn so he knows exactly where his hands reach.

## The Three Surfaces

GABRIEL operates across three concentric surfaces. Each has its own auth model and audit requirement.

```
        ┌─────────────────────────────────────────────┐
        │   3. THE WEB                                 │
        │   Slack · Discord · Notion · Linear · GitHub │
        │   Stripe · Figma · Canva · Vercel · Gmail    │
        │   ↓ via NOIZYCLOUDS CF fleet (CF01–CF10)     │
        │                                              │
        │      ┌─────────────────────────────────┐    │
        │      │   2. CLOUDFLARE INFRASTRUCTURE  │    │
        │      │   Workers · D1 · KV · R2        │    │
        │      │   Stream · Images · Realtime    │    │
        │      │   DNS · Email Routing · Pages   │    │
        │      │   ↓ via CF API + wrangler       │    │
        │      │                                 │    │
        │      │      ┌─────────────────────┐   │    │
        │      │      │   1. NOIZY CORE     │   │    │
        │      │      │   Heaven (consent)  │   │    │
        │      │      │   17 local MCPs     │   │    │
        │      │      │   GOD.local daemon  │   │    │
        │      │      │   Memory + skills   │   │    │
        │      │      └─────────────────────┘   │    │
        │      └─────────────────────────────────┘    │
        └─────────────────────────────────────────────┘
```

**Rule of containment:** a given operation operates at its innermost applicable surface. Don't call a CF API to do what Heaven can gate. Don't call a 3rd-party webhook to do what a CF0X worker already handles.

---

## Surface 1 · NOIZY CORE (already bound in `.mcp.json`)

17 local stdio MCPs. See `.mcp.json`. Fast, no network hop, no third-party dependency.

Highlights:

- `heaven` → Heaven API (consent-gated operations — see HEAVEN.md)
- `gabriel` → empire status + dispatch primitives
- `lucy` → archives, DAZEFLOW, AQUARIUM, LIFELUV receipts
- `engr-keith` → Cloudflare/D1/Worker architecture
- `cb01` → DNS, domain transfers, Cloudflare ops
- `voice-bridge` → STT/TTS pipeline (Whisper → Claude → macOS say)
- `dreamchamber-audio` → audio session management
- `consent-oracle` + `synthesis-oracle` → pre-synth consent gates

---

## Surface 2 · CLOUDFLARE (A/V + infrastructure)

Everything Cloudflare. GABRIEL accesses via the CF API + wrangler + the NOIZYCLOUDS worker fleet.

### Audio / Video — the critical piece

Cloudflare's media stack, mapped to NOIZY needs:

| CF Product           | NOIZY Use                                                                      | Binding / Path                                               | Consent gate                                           |
| -------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------ |
| **R2**               | Voice DNA vault, synth audio output, C2PA sidecar files                        | bucket `noizy-voice-dna`, `noizy-synth-output`, `noizy-c2pa` | **Heaven** (`hvs_voice_dna` → R2 ref)                  |
| **Stream**           | Creator-uploaded audio/video for licensed distribution (HLS/DASH, signed URLs) | `cf-stream::CF_STREAM_SUBDOMAIN` + `CF_STREAM_TOKEN`         | **Heaven** (license → stream token)                    |
| **Images**           | Brand assets, album artwork, profile imagery                                   | `cf-images`                                                  | none (non-consent)                                     |
| **Realtime / Calls** | Live AI voice conversations (artist ↔ descendant model ↔ fan)                  | Realtime API + Durable Objects                               | **Heaven** (active consent token required per session) |
| **Workers AI**       | On-edge Whisper STT, Llama 3.1, SDXL — fast/cheap inference                    | `AI` binding in wrangler.jsonc                               | none (except DNA synthesis → Heaven)                   |

**Consent-gated path (voice DNA, synth output, realtime voice):**

```
GABRIEL ──▶ heaven-mcp ──▶ Heaven Worker ──▶ Never Clause check
                                          ├─ R2 (voice DNA I/O)
                                          ├─ Stream (token mint)
                                          ├─ Realtime (session create)
                                          └─ noizy_ledger (audit)
```

**Non-consent path (Workers, DNS, Pages, Images):** GABRIEL → `engr-keith-mcp` or direct CF API.

### CF API token scopes GABRIEL needs (beyond DNS bootstrap)

Extend the token already planned in `ops/DNS_CORRECTNESS_PLAN.md`:

| Resource                        | Permission | Why                                                |
| ------------------------------- | ---------- | -------------------------------------------------- |
| Account → **Stream**            | Edit       | Mint signing keys, list videos, create live inputs |
| Account → **R2**                | Edit       | List buckets, presign URLs (voice DNA fetches)     |
| Account → **Workers Scripts**   | Edit       | Deploy / read CF0X fleet status                    |
| Account → **Cloudflare Images** | Edit       | Upload brand assets                                |
| Account → **Realtime Calls**    | Edit       | Create Realtime sessions                           |
| Zone → **DNS**                  | Edit       | (existing)                                         |
| Zone → **Email Routing**        | Edit       | (existing)                                         |

Token lives in `.env` as `CF_API_TOKEN`. Never in source.

### NOIZYCLOUDS worker fleet (existing, per `NOIZYCLOUDS.md`)

| CF0X                      | Role                                | GABRIEL uses it for                 |
| ------------------------- | ----------------------------------- | ----------------------------------- |
| **HEAVEN**                | consent kernel                      | all consent-touching ops            |
| **noizy-landing**         | noizy.ai apex                       | content bump, version check         |
| **noizy-mcp**             | remote MCP gateway (`mcp.noizy.ai`) | reach from iPad / mobile            |
| **mc96-follower**         | sentinel                            | health monitoring                   |
| **CF01 discord**          | Discord bridge                      | send messages, read channels        |
| **CF02 notion**           | Notion scribe                       | page create/update, query databases |
| **CF03 linear**           | Linear dispatcher                   | issue create/search, triage         |
| **CF04 slack**            | Slack relay                         | DM, channel post, schedule          |
| **CF05 stream**           | Stream streamer                     | video ingest, HLS URL minting       |
| **CF06 ai-gateway**       | AI gateway                          | cached/routed LLM calls             |
| **CF07 vectorize-rag**    | vector search over empire docs      | retrieval for memory                |
| **CF08 github**           | GitHub event relay                  | PR notifications, issue mirror      |
| **CF09 google-workspace** | Gmail / Drive / Calendar bridge     | email draft, calendar, doc fetch    |
| **CF10 sso-guard**        | SSO gatekeeper                      | auth for partner dashboards         |

GABRIEL reaches these via HTTP. Auth: bearer token (one per worker) stored in `.env` as `CF0X_TOKEN` or derived from the NOIZYCLOUDS master token.

---

## Surface 3 · THE WEB (3rd-party apps)

Two access paths. GABRIEL always prefers Path A over Path B.

### Path A — through the NOIZYCLOUDS fleet (preferred)

Already covered above (CF01–CF10). Why this is better:

- Auth lives in CF secrets, not in GABRIEL's `.env`
- Every call is logged to `noizy_ledger` (CF fleet writes receipts)
- Rate limiting + retry + idempotency handled at the edge
- Works from mobile / iPad / remote clients too

GABRIEL's tool (via `engr-keith-mcp` or a new `cf-fleet-mcp`):

```ts
// Stage planned in Phase 2:
cf_fleet_invoke({ worker: "cf04-slack", op: "send_message", args: {...} })
```

### Path B — direct provider API (fallback / Phase 2)

When a CF0X doesn't yet exist or a capability isn't wrapped, GABRIEL can call the provider directly via a purpose-built stdio MCP. Candidates:

| Provider | MCP scaffold                            | Priority                                      |
| -------- | --------------------------------------- | --------------------------------------------- |
| Slack    | `@modelcontextprotocol/slack` or custom | high (when CF04 insufficient)                 |
| Discord  | custom (webhook-only is easy)           | high                                          |
| Notion   | `@modelcontextprotocol/notion`          | medium                                        |
| GitHub   | `gh` CLI wrapper via Bash               | high (already available)                      |
| Stripe   | custom                                  | medium (Rob already has MCP via Claude OAuth) |
| Linear   | `linear-mcp`                            | medium                                        |
| Vercel   | `vercel-mcp`                            | low                                           |

**Secrets model for Path B:** every provider token in `.env` as `<PROVIDER>_TOKEN`. Never commit. `.gitignore` already covers `.env`.

---

## The Audit Rule

**Every side-effecting call across any surface logs to `noizy_ledger`.**

- Consent-touching → logged by Heaven automatically (enforced, not opt-in)
- Non-consent CF ops → GABRIEL appends ledger entry via `heaven-mcp::heaven_ledger_append`
- 3rd-party calls (Slack post, GitHub PR) → CF0X worker logs, or GABRIEL appends if Path B

If a call doesn't leave a ledger trail, GABRIEL didn't do it. Period.

---

## Rate-Limit Sanity

GABRIEL respects provider rate limits automatically via:

- CF AI Gateway cache (CF06) — dedupes identical requests
- Heaven's 60 req/min/IP KV rate limiter (already in place)
- Each CF0X worker implements its own provider-specific backoff
- GABRIEL surfaces a warning if any call gets 429 — and retries with exponential backoff (max 3)

---

## What GABRIEL does NOT do

- Never proxies raw voice data through 3rd-party apps without Heaven gating
- Never posts to public channels on behalf of Rob without explicit "post to {channel}" instruction
- Never commits secrets to any repo, any message, any log
- Never calls an API where the token is missing — fails loud, doesn't guess
- Never retries an operation that failed a Never Clause check

---

## Phase status

| Capability                                           | Status                                                                      |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| 17 local MCPs                                        | ✅ bound in `.mcp.json`                                                     |
| Heaven integration                                   | ✅ `HEAVEN.md` loaded into system prompt                                    |
| CF DNS + Email Routing ops                           | ✅ `ops/cf-dns-bootstrap.sh` + `cf-transfer-preflight.sh`                   |
| CF A/V (R2, Stream, Realtime)                        | ⚠ **Phase 2** — needs CF token scopes + `cf-fleet-mcp`                      |
| Slack (via CF04)                                     | ⚠ **Phase 2** — worker live, GABRIEL tool wrapper pending                   |
| Discord (via CF01)                                   | ⚠ **Phase 2** — worker live, GABRIEL tool wrapper pending                   |
| Other 3rd party (Notion/Linear/GitHub/Stripe/Vercel) | ⚠ **Phase 2** — CF0X workers exist, tool wrappers pending                   |
| Ledger receipts for all outbound calls               | ✅ enforced by Heaven, manual for non-consent ops (Phase 2 makes automatic) |
