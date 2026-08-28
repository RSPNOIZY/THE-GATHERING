# NOIZY Release Runbook
**Protocol > Promises. Inventory before deploy. No assumptions.**

*M2 Ultra GOD.local | RSP_001 | Updated 2026-03-30*

---

## PRE-FLIGHT GATE (all must PASS before production)

| Gate | Check | Command |
|---|---|---|
| Config format | wrangler.jsonc exists + valid | `cat workers/<name>/wrangler.jsonc` |
| Env bindings | KV/D1 IDs are real, not placeholders | `npx wrangler whoami && npx wrangler d1 list` |
| Placeholder scan | Zero hits | `grep -R "PLACEHOLDER\|REPLACE_ME\|TODO_ID" workers/` |
| Tests | All pass | `npm test` in each worker dir |
| Proof bundle | Generated + has bundle_hash | Check `artifacts/proof/` |
| Route integrity | Paths forward without stripping | Smoke test staging |
| Consent auth/authz | 401 missing, 403 unauthorized | `curl -X POST .../revoke` w/o key → 401 |
| Secrets present | CLOUDFLARE_API_TOKEN in CI, NOIZY_API_KEY in env | GitHub secrets + `wrangler secret list` |

**No production deploy unless every gate is ✅ PASS.**

---

## A. Identify Workers
```bash
find ~/NOIZYLAB/workers -name "wrangler.toml" -o -name "wrangler.jsonc" | grep -v node_modules
# Also check root — Heaven deploys from ~/NOIZYLAB/ not ~/NOIZYLAB/workers/
```

## B. Authenticate Wrangler
```bash
npx wrangler whoami
# Expected: rsp@noizyfish.com | Account: NOIZY.ai | 5f36aa9795348ea681d0b21910dfc82a
# If BLOCKED: npx wrangler login  (browser required)
```

## C. Verify Live Resources
```bash
npx wrangler d1 list
# Must contain: gabriel_db fc0edd97 | agent-memory 7b813205

npx wrangler kv namespace list 2>/dev/null | python3 -c "import sys,json; [print(d['id'],d['title']) for d in json.load(sys.stdin)]"
# Must contain: 6fe434a8 (GABRIEL_KV) | afef27e69 (GABRIEL_VOICE)
```

## D. Placeholder Scan
```bash
grep -rn "PLACEHOLDER\|REPLACE_WITH\|REPLACE_ME\|TODO_ID" ~/NOIZYLAB/workers/ --include="*.toml" --include="*.jsonc" --include="*.json"
# Expected: zero hits
```

## E. Run Tests
```bash
cd ~/NOIZYLAB/workers/consent-gateway && npm test
# Expected: 9/9 passing

cd ~/NOIZYLAB/workers/cb01-router && npm test
# Expected: 7/7 passing
```

## F. Deploy Sequence

### Heaven (from ROOT — not workers/heaven/)
```bash
cd ~/NOIZYLAB
npx wrangler whoami                          # confirm auth
npx wrangler deploy                          # deploys to heaven.rsp-5f3.workers.dev
sleep 5
curl -s https://heaven.rsp-5f3.workers.dev/health | python3 -m json.tool
curl -s https://heaven.rsp-5f3.workers.dev/webhooks/status
```

### Consent Gateway — staging first
```bash
cd ~/NOIZYLAB/workers/consent-gateway
npx wrangler deploy --env staging
sleep 3
curl -s https://noizy-consent-gateway-staging.workers.dev/health
```

### Consent Gateway — production (ONLY after staging PASS)
```bash
npx wrangler deploy --env production
sleep 3
curl -s https://noizy-consent-gateway.workers.dev/health
```

### CB01 Router — staging
```bash
cd ~/NOIZYLAB/workers/cb01-router
npx wrangler deploy --env staging
curl -s https://noizy-cb01-router-staging.workers.dev/health
```

## G. Post-Deploy Verification
```bash
export API_KEY="$(grep NOIZY_API_KEY ~/NOIZYLAB/.env | cut -d= -f2)"

# Test 401 (no key)
curl -s -X POST https://noizy-consent-gateway.workers.dev/verify \
  -H "Content-Type: application/json" \
  -d '{"creator_id":"test","asset_id":"a1","action_type":"synth"}' | grep "401\|Unauthorized"

# Test 200 (with key)
curl -s -X POST https://noizy-consent-gateway.workers.dev/verify \
  -H "X-NOIZY-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"creator_id":"test","asset_id":"a1","action_type":"synth"}' | python3 -m json.tool

# Proof endpoint
curl -s -H "X-NOIZY-Key: $API_KEY" https://noizy-consent-gateway.workers.dev/__proof | python3 -m json.tool

# Webhook status (Heaven)
curl -s https://heaven.rsp-5f3.workers.dev/webhooks/status
```

## H. Tail Logs (Workers Observability)
```bash
npx wrangler tail heaven --format=pretty
# In another terminal:
npx wrangler tail noizy-consent-gateway --format=pretty
```

---

## KNOWN BLOCKERS (as of 2026-03-30)

| Blocker | Status | Manual Action Required |
|---|---|---|
| Wrangler OAuth expired | 🔴 BLOCKED | `npx wrangler login` — browser required |
| CF email change | 🔴 BLOCKED | dash.cloudflare.com → Profile → Email → rsp@noizy.ai |
| consent.noizy.ai route commented out | 🟡 PENDING | Uncomment in wrangler.jsonc after CF email change |
| GitHub Actions secrets | 🟡 UNKNOWN | Add CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID to repo secrets |
| Workers Vitest runtime upgrade | 🟡 IN PROGRESS | @cloudflare/vitest-pool-workers install |

---

## ARCHITECTURE CHEATSHEET

| Worker | Source | Deploy From | wrangler.json | D1 Binding |
|---|---|---|---|---|
| Heaven v17.7.0 | `~/NOIZYLAB/src/index.js` | `~/NOIZYLAB/` | root `wrangler.toml` | gabriel_db / fc0edd97 |
| consent-gateway | `workers/consent-gateway/index.ts` | `workers/consent-gateway/` | `wrangler.jsonc` | agent-memory / 7b813205 |
| cb01-router | `workers/cb01-router/src/index.js` | `workers/cb01-router/` | `wrangler.toml` | none |
| claude-proxy | `workers/claude-proxy/src/index.ts` | `workers/claude-proxy/` | `wrangler.toml` | agent-memory / 7b813205 |

**⚠️ workers/heaven/ = DEAD STUB. Do not deploy from there.**

---

## GOVERNANCE DOCTRINE

- **Plowman Standard**: 75/25 creator split — never negotiable
- **NCP Protocol**: every data flow answers "who owns this?"
- **Revocation is sacred**: POST /revoke enforces caller == owner (403 otherwise)
- **Status is sanitized**: GET /status returns only {creator_id, status, updated_at}
- **Proof before prod**: proof bundle must be generated before every production deploy
