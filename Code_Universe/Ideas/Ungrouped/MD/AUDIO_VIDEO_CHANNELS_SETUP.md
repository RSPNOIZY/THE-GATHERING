# Audio + Video Channels · Setup & Cloudflare Products Fit Matrix

> How to turn real audio + video on, brand-by-brand, using Cloudflare as the fabric. Also: the full catalog of Cloudflare products scored for NOIZY.AI + each sub-brand, so nothing compliant goes unused.

**CF05 is live with 8 seeded channels.** See them:

```bash
curl https://cf05-stream.rsp-5f3.workers.dev/channels | jq .
```

Returns 8 persistent channels, one per brand:

| Channel name | Brand | Min tier | Kind |
|---|---|---|---|
| `noizyai-empire-status` | NOIZY.AI | free | audio |
| `noizyai-dreamchamber` | DREAMCHAMBER | artist | mixed |
| `noizyai-noizylab` | NOIZYLAB | free | mixed |
| `noizyai-noizyvox` | NOIZYVOX | artist | audio |
| `noizyai-fishmusicinc` | FISHMUSICINC | artist | audio |
| `noizyai-noizykidz` | NOIZYKIDZ | free | audio |
| `noizyai-artists-stage` | ARTISTS | free | mixed |
| `noizyai-family-voice` | FAMILY | guild | audio |

New endpoints on CF05:
- `GET  /channels` — list all (public, no auth, tier gate is at subscribe time)
- `POST /channels` — create a custom channel (auth-gated)
- `GET  /channels/:name` — one channel's metadata + active publishers
- `POST /channels/:name/publish` — start broadcasting (auth + consent token required)
- `POST /channels/:name/subscribe` — join as listener/viewer (auth + tier check)

Every publish + subscribe fires a HEAVEN ledger event.

---

## Part 1 — How to actually stream audio/video (step by step, with assistance)

### Step 1 · Provision Cloudflare Stream + Calls (your 6 dashboard clicks)

Per `ops/cloudflare-provision-checklist.md §1, §2` — the complete checklist is already written.

```
ACCOUNT:  NOIZYFISH (5f36aa9795348ea681d0b21910dfc82a)
WHERE:    dash.cloudflare.com → Stream, Calls
WHAT:     Subscribe to Stream → note customer subdomain
          Create Calls app "noizy-live" → note App ID + Secret
TOKENS:   CF_STREAM_TOKEN, CF_STREAM_SUBDOMAIN, CF_CALLS_APP_ID, CF_CALLS_APP_SECRET
```

### Step 2 · Install secrets on CF05

```bash
cd cloudflare/workers/cf05-stream
for s in CF_STREAM_TOKEN CF_STREAM_SUBDOMAIN CF_CALLS_APP_ID CF_CALLS_APP_SECRET NOIZY_API_KEY; do
  npx wrangler secret put $s
done
```

### Step 3 · Verify with a real consent token + publish

```bash
# Get a live consent token (Artist Zero's walkthrough produces one)
bash scripts/artist-zero-walkthrough.sh
# note the token_id

# Start broadcasting to DreamChamber channel
curl -X POST https://cf05-stream.rsp-5f3.workers.dev/channels/noizyai-dreamchamber/publish \
  -H "X-NOIZY-Key: $NOIZY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
        "consent_token": "<token-from-artist-zero>",
        "tier": "artist",
        "artist_id": "RSP_001"
      }'
```

Response contains a `signaling_url` — point a WebRTC client at it and audio flows.

### Step 4 · Studio-side (the NOIZYNET signal chain)

Per `NOIZYNET_AUDIO_CHAIN.md`:

```
Neumann U87 → Apollo Quad 2 preamp → MICKY-P (Thunderbolt)
     → NOIZYNET AES67 multicast (wired studio LAN, PTP clock)
         + WebRTC branch via CF05 publish → CF Calls → subscribers
```

**What you need on MICKY-P when it comes online:**
- UAD Console 2 (latest, drives the Apollo)
- Dante Virtual Soundcard (or equivalent AES67 bridge — Apple MacOS 15+ has native AES67)
- A small Node CLI that takes Dante/CoreAudio input and POSTs to CF05 publish

Initial rig-up is about 30 minutes once MICKY-P is on the LAN.

### Step 5 · Listener / viewer side

On iPad (LUCY), iPhone (any Siri Shortcut tap), or browser:

```
1. Subscriber app calls POST /channels/noizyai-dreamchamber/subscribe
   with X-NOIZY-Key and their current tier (free/artist/guild)
2. CF05 returns { publishers: [{ signaling_url, session_id }] }
3. Subscriber's WebRTC peer connects to each publisher signaling URL
4. Audio/video streams; HEAVEN ledger has a subscribe event attached
```

For Discord + Slack: CF01 / CF04 can post a "🔴 LIVE · DreamChamber" message with a one-tap subscribe button that fires the subscribe call.

### Step 6 · Recording (tier-dependent, needs R2)

Free tier: no recording.
Artist tier: 90-day recording retention, live writes to Cloudflare Stream.
Guild tier: 100-year OAIS archive, writes to R2 `noizy-voice-vault` after Stream retention ends.

Rob: enable R2 per `ops/cloudflare-provision-checklist.md §3`; I re-add the `RECORDINGS` binding on CF05 and recordings start auto-persisting.

---

## Part 2 — Complete Cloudflare products-fit matrix for NOIZY.AI + sub-brands

Every Cloudflare product scored for empire fit. **✅ using now · 🟡 scoped/queued · 🔵 proposed next · ⬜ not a fit yet**.

### Core compute + storage

| Product | Fit | Use in empire |
|---|---|---|
| **Workers** | ✅ | 10 Workers live (HEAVEN, mc96-follower, CF01-05, noizy-landing, noizy-mcp, metabeast-remote). Every brand reachable at edge. |
| **Pages** | 🟡 | `metabeast.noizy.ai` = DreamChamber UI shell (per mcp-builder rules). Once NS flips, attach Pages project. |
| **D1 (SQL)** | ✅ | `gabriel_db` (25 tables + 9 views), `agent-memory`, `noizyanthropic`. The empire's truth layer. |
| **KV** | ✅ | `GABRIEL_KV` (cache + rate-limit), `GABRIEL_VOICE` (voice asset refs), `FOLLOWER_KV`, `CF0X_KV`. |
| **R2** | 🟡 | Enable → `noizy-voice-vault` bucket for Voice DNA, session recordings, C2PA archives, 100-year estate OAIS mirror. **BLOCK 2 on roadmap.** |
| **Durable Objects** | 🔵 | Perfect fit for **agent state** — each of CF01, LUCY, GABRIEL as a DO with persistent state, addressable by name. Enables session stickiness without KV race conditions. |
| **Queues** | 🔵 | Decouple CF bot → HEAVEN writes. Every ledger event enqueued, Workflow processes. Makes writes durable through HEAVEN outages. |
| **Workflows** | 🔵 | Artist Zero end-to-end (register → VDNA → descendant → token → synth → license → revoke → verify) as a durable multi-step workflow. Replayable, debuggable, resumable. |
| **Hyperdrive** | ⬜ | Not needed until/unless we front Postgres externally. |
| **Containers** | ⬜ | Workers cover our needs; if we ever need longer-running compute, this is where Ollama-in-CF lives. |

### AI & inference

| Product | Fit | Use in empire |
|---|---|---|
| **Workers AI** | ✅ (Whisper) | CF01 uses `@cf/openai/whisper` for voice transcription. Next: `@cf/baai/bge-base-en-v1.5` for embeddings into Vectorize. Plus Llama variants, text classifiers, image gen. |
| **AI Gateway** | 🔵 **HIGH leverage** | **Single pane** for every LLM call — caching (up to 90% latency reduction + $$ savings), per-provider analytics, dynamic routing / fallback (Claude → Gemini → Gemma on outage), rate limiting, guardrails, DLP. Replaces LiteLLM's role for routing. Worth its own CF06. |
| **Vectorize** | 🔵 **HIGH leverage** | Native Cloudflare vector DB (edge-local, no separate infra). Index the 384 MB Claude Archive + MASTER_*.md corpus + session MDs. Binding right in each Worker. Replaces Wave 2 Qdrant plan. |
| **AI Search** | 🔵 | Semantic search over the empire doc corpus — an alternative to running Vectorize ourselves, fully managed. Good for NOIZY.AI public "ask the archive" feature. |
| **Workers AI Agents SDK** | 🔵 | Framework for stateful agents with Durable Object-backed state. **GABRIEL + LUCY could migrate from Node daemons to CF Agents** — survives reboots, globally addressable, HEAVEN-adjacent. |
| **Browser Rendering** | 🔵 | Perfect for: (1) C2PA PDF exports · (2) Protection Notice composition with screenshots of infringement · (3) NOIZYKIDZ visual lesson renders · (4) NOIZYLAB automated UI tests. |

### Streaming + media

| Product | Fit | Use in empire |
|---|---|---|
| **Stream** | 🟡 | CF05 wired, awaiting provision. HLS/DASH for on-demand DreamChamber sessions, NOIZYKIDZ lessons, FISHMUSICINC catalog previews. |
| **Calls** | 🟡 | CF05 wired, awaiting provision. WebRTC SFU for live channels — DreamChamber live, artist stage, family voice. Low-latency (< 250 ms). |
| **Images** | 🔵 | Image optimization for brand landing pages + artist cover art + NOIZYKIDZ visuals. Resize + format-convert at edge. |

### Network + security

| Product | Fit | Use in empire |
|---|---|---|
| **Tunnel (cloudflared)** | 🔵 **HIGH leverage** | Securely expose GOD.local services (DreamChamber `:7777`, GABRIEL daemon `:9777`, Ollama `:11434`, n8n `:5678`) through CF edge with Zero Trust auth. No port-forwarding, no DDNS. Reach from iPad on cellular. |
| **Zero Trust / Access** | 🔵 **HIGH leverage** | Gate internal tools by email identity (`rsp@noizy.ai` SSO). Replaces homegrown auth on all internal surfaces. Integrates with Google / M365 / GitHub identity providers. |
| **Turnstile** | 🔵 | Frictionless CAPTCHA replacement for public brand landing pages (NOIZY.AI, NOIZYVOX signup, NOIZYKIDZ parent signup, FISHMUSICINC licensee inquiry). |
| **WAF / Ruleset Engine** | 🟡 | Default protections are on. Custom rules queued for CF05 public endpoints + noizy-landing — block known-bad user agents, geo-rate-limit login surfaces. |
| **DDoS / Bot Management** | ✅ | Default Cloudflare protection is on. Paid Bot Management would be overkill for today's scale. |
| **Load Balancing** | ⬜ | Not needed — Workers distribute globally by default. |
| **Magic Transit / Magic WAN** | ⬜ | Enterprise tier, not needed. |

### Observability + Analytics

| Product | Fit | Use in empire |
|---|---|---|
| **Workers Observability** | ✅ | `observability.enabled: true · head_sampling_rate: 1.0` on every CF0X. Logs + traces available. |
| **Workers Analytics Engine** | 🔵 **HIGH leverage** | Custom per-request datapoints. Audit already flagged this. Each CF0X emits `{source, duration, tokens_in, tokens_out, model, tier}` per invocation. Empire-wide LLM observability. |
| **Radar / Observatory** | ⬜ | Global internet analytics — interesting, not load-bearing. |
| **Logpush** | 🔵 | Push Worker logs to R2 or external sink for 100-year audit trail + PREMIS compliance. |

### Identity, email, domain

| Product | Fit | Use in empire |
|---|---|---|
| **DNS + Registrar** | ✅ | NOIZYFISH zone has marek/tara assignments ready. Registrar NS flip is the blocker. |
| **Email Routing** | 🟡 | Pattern: `rsp@noizy.ai` → rsplowman@icloud.com, `contact@noizy.ai` → rsp@noizy.ai, per-brand `team@fishmusicinc.com`, `help@noizyvox.com`, etc. Runs on NOIZYFISH zone automatically after NS flip. |
| **Email Workers** | 🔵 | Process incoming email in a Worker — useful for `demo@noizyvox.com` auto-reply with onboarding flow, or `dmca@noizy.ai` → CF03 Linear issue auto-creation. |
| **SPF / DKIM / DMARC** | 🟡 | Standard setup, auto-enabled on Email Routing. |

### Agents + orchestration

| Product | Fit | Use in empire |
|---|---|---|
| **Agents SDK** | 🔵 | `@cloudflare/agents` — build agents with Durable-Object-backed state. Could replace GABRIEL's Node daemon with an edge-resident CF Agent. |
| **MCP hosting (via Agents)** | ✅ (scaffolded) | `metabeast-remote` worker is the shell. Extend into full Streamable HTTP MCP via Agents SDK. |

---

## Part 3 — Per-brand Cloudflare fit score

Which CF products each brand benefits from most:

### NOIZY.AI (parent + public face)
| Product | Why |
|---|---|
| Pages | Public landing, marketing site |
| Workers | noizy-landing Worker already live |
| Turnstile | Public signups, "get on the list" forms |
| Images | Brand visuals, 396 Hz animations |
| AI Gateway | Every external-facing AI call routed |
| Email Routing | rsp@ + contact@ + info@ |
| WAF | Public-facing protection |
| Analytics Engine | Funnel metrics, landing → token flow |

### DREAMCHAMBER (sacred creative space)
| Product | Why |
|---|---|
| Tunnel | Expose GOD.local port 7777 publicly for iPad reach |
| Zero Trust Access | Gate by `rsp@noizy.ai` SSO only |
| Calls | Live multi-model consultation via WebRTC |
| Durable Objects | Session state persists across model switches |
| Workers AI + AI Gateway | Unified LLM call surface across 11 providers |
| Vectorize | Retrieval over the 396 Hz creative corpus |

### NOIZYLAB (the lab)
| Product | Why |
|---|---|
| Workers | Dev experiments, quick-deploy test workers |
| Containers | Long-running ML / experiment runners |
| Queues | Background job processing for experiments |
| Analytics Engine | Lab telemetry dashboards |
| R2 | Experiment artifact storage |

### NOIZYVOX (consent-locked voice)
| Product | Why |
|---|---|
| Workers AI (Whisper, voice classifiers) | Consent check on voice samples |
| Vectorize | Voice DNA spectral fingerprint index |
| Stream | Voice-sample playback gallery |
| Calls | Live voice enrollment sessions with artists |
| R2 | Voice Vault (encrypted Voice DNA storage) |
| Turnstile | Artist onboarding signup protection |
| Queues | Synthesis requests → durable queue before processing |

### FISHMUSICINC (legacy rights + catalog)
| Product | Why |
|---|---|
| Stream | Catalog previews (HLS on-demand for masters, samples) |
| R2 | Master audio archive (multi-TB scale) |
| D1 | Rights + licensing metadata |
| Workers | Licensing-request processing |
| Email Routing | `rights@fishmusicinc.com`, `sync@fishmusicinc.com` |
| AI Gateway | Auto-draft license terms via routed LLM |
| Browser Rendering | Printable rights statements / C2PA PDF exports |

### NOIZYKIDZ (haptic education)
| Product | Why |
|---|---|
| Pages | Public curriculum landing, enrollment |
| Stream | Lesson videos (720p free tier is fine for education) |
| Images | Deaf-first visual design, high-contrast imagery |
| Turnstile | Parent signup protection (zero friction matters for this cohort) |
| Workers AI | Caption generation, visual-to-haptic translation |
| Email Workers | Auto-reply for educator inquiries → CF03 Linear ticket |
| R2 | Curriculum content archive |

### NOIZYCLOUDS (the fleet itself)
| Product | Why |
|---|---|
| Workers Analytics Engine | Per-Worker custom telemetry |
| AI Gateway | Unified LLM call observability |
| Workflows | Multi-step fleet operations (e.g., Artist Zero) |
| Durable Objects | Agent state for GABRIEL/LUCY DO migrations |
| Tunnel + Zero Trust | Internal tooling dashboards gated by SSO |
| Queues | Inter-worker durable messaging |

---

## Part 4 — Priority install order (when dashboard access returns)

Do these in order for maximum compounding benefit:

1. **R2** (unblocks BLOCK 2 + CF05 recordings + Voice Vault + catalog storage — one enable unlocks many features)
2. **Stream + Calls** (activates CF05 channels end-to-end; A/V channels go from scaffolded to functional)
3. **Turnstile** (add to noizy-landing + all brand signup pages, 5-min install each)
4. **AI Gateway** (create gateway "noizy-unified", route CF01 Whisper + future Claude/Gemini calls through it — caching turns on for free)
5. **Vectorize** (create `empire-corpus` index with 768-dim vectors, embed Claude Archive + MASTER docs)
6. **Durable Objects migration for CF01 + LUCY** (stateful agents)
7. **Tunnel + Zero Trust** (expose GOD.local DreamChamber + GABRIEL securely to iPad)
8. **Email Routing + Email Workers** (activates the per-brand mailbox fan-out after NS flip)
9. **Analytics Engine** (custom telemetry per CF0X)
10. **Queues + Workflows** (durability for Artist Zero, consent kernel writes, synth pipeline)

Cost footprint estimate at modest scale (2026 prices): Stream + Calls ~$5-20/mo, R2 ~$0-5/mo, Vectorize free tier covers empire, AI Gateway free tier covers empire, Workers + KV + D1 free tier covers empire. **Full stack is < $50/mo until real traffic.**

---

## Part 5 — What I can do next without your clicks

With all 8 channels seeded and CF05 live, I can ship (in rough priority):

1. **CF06 — AI Gateway bridge Worker** — scaffold now, auth-gated, awaiting your gateway ID. Routes all LLM calls through CF Gateway for caching + analytics + fallback.
2. **CF07 — Vectorize RAG Worker** — embeds the Claude Archive + MASTER docs into a new Vectorize index, exposes `POST /search` for semantic search across the empire.
3. **Update CF04 (Slack) + CF01 (Discord) to post "🔴 LIVE on noizyai-<brand>" when any channel starts publishing** — turns a publish into a cross-platform signal automatically.
4. **Integrate Turnstile verification into noizy-landing** — bot-proofs any signup form.
5. **Audit script extension** — scrape each CF0X's `/standards`, cross-check against which CF products it uses, produce a per-brand product-gap chart.

Say the word on any of these. The fleet is ready.

---

*One empire. Every Cloudflare seam lit up to the point it serves the doctrine. 396 Hz through every signal.*
