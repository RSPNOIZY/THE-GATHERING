# MC96ECO Cloudflare Workers Registry

> GABRIEL Self-Healing Loop Knowledge Base
> Last updated: 2026-04-03

---

## Account Context

NOIZY.AI operates across two Cloudflare accounts. Workers are deployed to specific accounts based on their function.

| Account | Account ID | Purpose |
|---------|-----------|---------|
| HEAVEN / noizy.ai | `2446d788cc4280f5ea22a9948410c355` | Production workers, routes, KVs |
| NOIZY.ai consent | `5f36aa9795348ea681d0b21910dfc82a` | Consent gateway, wrangler auth |

**Critical:** Always verify which account you are deploying to before running `npx wrangler deploy`. The wrong account will bind to the wrong D1/KV resources and silently fail.

---

## 1. heaven (heaven.rsp-5f3.workers.dev)

**Account:** HEAVEN / noizy.ai (`2446d788cc4280f5ea22a9948410c355`)
**Route:** `noizy.ai/*`
**Version:** v17.7.0
**Source:** `~/Desktop/HEAVEN/`
**Config:** `~/Desktop/HEAVEN/wrangler.toml`

Heaven is the consent kernel — the public-facing Cloudflare Worker that handles all traffic to noizy.ai. It enforces NCP (NOIZY Consent Protocol) at the edge before any request reaches origin services.

**40+ endpoints include:**

| Category | Endpoints | Purpose |
|----------|-----------|---------|
| Auth | `/auth/login`, `/auth/signup`, `/auth/verify`, `/auth/logout` | User authentication flow |
| Consent | `/consent/grant`, `/consent/revoke`, `/consent/status`, `/consent/audit` | NCP consent management |
| Voice | `/voice/list`, `/voice/license`, `/voice/revoke`, `/voice/genome` | Voice marketplace API |
| Artist | `/artist/register`, `/artist/profile`, `/artist/royalties`, `/artist/dashboard` | Artist portal |
| Royalty | `/royalty/calculate`, `/royalty/distribute`, `/royalty/history` | 75/25 royalty engine |
| Guild | `/guild/join`, `/guild/members`, `/guild/vote` | Artist guild governance |
| Health | `/health`, `/version`, `/status` | Operational health |
| Admin | `/admin/metrics`, `/admin/audit`, `/admin/kv-stats` | Internal admin (auth-gated) |
| Submissions | `/submit/track`, `/submit/voice`, `/submit/review` | Content submission pipeline |
| Sessions | `/session/create`, `/session/validate`, `/session/destroy` | Session management |

**Bindings:**

| Type | Binding | Resource |
|------|---------|----------|
| D1 | DB_MEMORY | agent-memory (`7b813205-fd12-4a23-84a6-ce83bc49ec70`) |
| D1 | DB_REPAIRS | noizylab-repairs (`2bd4aa06-f9b2-4761-b235-e92e8a21fe45`) |
| D1 | DB_AQUARIUM | aquarium-archive (`e6f98279-656b-4f7a-979d-9197821193f5`) |
| KV | KV_SIGNUPS | `392c1bf429114148999824a9f9e15169` |
| KV | KV_ROYALTIES | `4cf36e4bd1fd44fe802096925413f694` |
| KV | KV_GUILD | `8a15ed31fea8462da7c92a8237d6f854` |
| KV | KV_SESSIONS | `c90299891f684de7bcc7c53967133748` |
| KV | KV_SUBMISSIONS | `6e888a017ebe4ba78ed7497c4929439b` |
| KV | KV_MEMCELL | `9aa2511652ce4a2faeb106858f76df67` |

**Deploy:**
```bash
cd ~/Desktop/HEAVEN && npx wrangler deploy
```

**Verify:**
```bash
curl https://heaven.rsp-5f3.workers.dev/health
```

---

## 2. consent-gateway (staging)

**Account:** NOIZY.ai consent (`5f36aa9795348ea681d0b21910dfc82a`)
**Route:** Staging only (not yet on production route)
**Source:** `~/.gemini/antigravity/scratch/noizy-workers/consent-gateway/`

The consent-gateway is the NCP enforcement layer. It sits in front of any service that handles personal or biometric data and runs a 10-check decision matrix before allowing the request through.

**10-Check Decision Matrix:**

| Check | Pass Condition | Fail Action |
|-------|---------------|-------------|
| 1. Auth Token Valid | JWT not expired, signature valid | 401 Unauthorized |
| 2. User Exists | User ID found in D1 | 401 Unauthorized |
| 3. Consent Granted | Active consent token for requested scope | 403 Forbidden |
| 4. Consent Not Expired | Consent token TTL not exceeded | 403 Forbidden + revoke |
| 5. Scope Match | Requested action within consented scope | 403 Forbidden |
| 6. Rate Limit | Under rate limit threshold (KV counter) | 429 Too Many Requests |
| 7. Biometric Gate | Biometric data requests require elevated consent | 403 Forbidden |
| 8. Revocation Check | No active revocation for this user+scope | 403 Forbidden |
| 9. Provenance Chain | Request includes valid provenance header | 400 Bad Request |
| 10. Creator Split | Any financial operation respects 75/25 minimum | 403 Forbidden |

**All 10 checks must pass.** Any failure returns the corresponding HTTP error with a machine-readable error body:
```json
{
  "error": "CONSENT_CHECK_FAILED",
  "check": 3,
  "check_name": "consent_granted",
  "message": "No active consent for scope: voice_clone",
  "revocation_url": "/consent/revoke"
}
```

---

## 3. cb01-router

**Account:** HEAVEN / noizy.ai (`2446d788cc4280f5ea22a9948410c355`)
**Route:** Traffic routing layer
**Source:** `~/.gemini/antigravity/scratch/noizy-workers/cb01-router/`

cb01-router handles traffic routing with full path forwarding. It inspects incoming requests and routes them to the appropriate upstream worker or origin based on path, headers, and consent status.

**Routing rules:**
- `/api/*` → heaven worker (consent-gated API)
- `/voice/*` → NOIZYVOX origin (via Cloudflare Tunnel or direct)
- `/stream/*` → NOIZYSTREAM origin
- `/admin/*` → Requires admin auth header, routes to heaven admin endpoints
- `/*` (default) → noizy-landing worker (static landing page)

**Full path forwarding:** The original request path, query parameters, headers, and body are preserved and forwarded to the upstream. No path rewriting unless explicitly configured.

---

## 4. claude-proxy

**Account:** HEAVEN / noizy.ai (`2446d788cc4280f5ea22a9948410c355`)
**Source:** `~/.gemini/antigravity/scratch/noizy-workers/claude-proxy/`
**Schema:** `noizy-workers/claude-proxy/schema.sql`

The claude-proxy worker provides API routing between GABRIEL's 10 towers and the hybrid local/cloud inference stack. When a tower needs intelligence beyond local Ollama models, it routes through claude-proxy to Anthropic's API.

**Routing logic:**
1. Request arrives from GABRIEL tower with `X-Tower-ID` header
2. Check if query can be handled locally (Ollama models)
3. If local: proxy to `http://10.90.90.10:11434` (Ollama on GOD)
4. If cloud needed: proxy to Anthropic API with appropriate model selection
5. Log request/response metadata to D1 (no content logging for privacy)

**Tower-to-model mapping:**

| Tower | Local Model | Cloud Fallback |
|-------|------------|----------------|
| Tower 1 (VOICE) | — | Claude (voice pipeline orchestration) |
| Tower 2 (MEMORY) | gemma3 | Claude (complex recall) |
| Tower 3 (CONSENT) | mistral | Claude (legal reasoning) |
| Tower 4 (MUSIC) | — | Claude (composition assistance) |
| Tower 5 (VISION) | llava:34b | Claude (vision analysis) |
| Tower 6 (CODEX) | llama3.1:70b | Claude (complex queries) |
| Tower 7 (GUARDIAN) | llama3.2 | — (never cloud for security) |
| Tower 8 (STREAM) | — | — (no LLM needed) |
| Tower 9 (HEAL) | qwen2.5-coder | Claude (complex diagnostics) |
| Tower 10 (DREAM) | llama3.1:70b | Claude (career engine) |

**Auth:** `ANTHROPIC_API_KEY` stored as Worker secret (never in wrangler.toml)

---

## 5. noizy-landing

**Account:** HEAVEN / noizy.ai (`2446d788cc4280f5ea22a9948410c355`)
**Route:** Default route for noizy.ai (non-API paths)

Static landing page worker. Serves the 396Hz universe — the public face of NOIZY.AI.

**Features:**
- Static HTML/CSS/JS served from Worker
- 396Hz audio frequency integration (liberation frequency)
- Artist signup form (posts to heaven `/auth/signup`)
- Consent-first messaging
- Mobile-optimized, voice-first design philosophy

**No bindings required** — purely static content served at the edge.

---

## Worker Deployment Checklist

Before deploying any worker:

1. **Verify account context:** `npx wrangler whoami` — confirm correct account
2. **Check wrangler.toml:** Ensure all D1 and KV bindings reference the correct IDs for the target account
3. **Test locally:** `npx wrangler dev` — verify endpoints work
4. **Deploy:** `npx wrangler deploy`
5. **Verify:** `curl <worker-url>/health`
6. **Monitor:** Check Cloudflare dashboard for error rates in first 5 minutes

**Rollback:** `npx wrangler rollback` (reverts to previous deployment)
