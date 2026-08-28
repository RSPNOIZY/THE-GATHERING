# Cloudflare WAF + Rate Limiting — Canonical Consent Worker

Applied via Cloudflare dashboard (Security → WAF) or `wrangler` where supported.

## Rate Limiting

| Rule | Scope | Threshold | Action |
|------|-------|-----------|--------|
| General | Per-IP, all paths | 60 req/min | Block 10min |
| `/api/v1/synth` | Per-IP | 10 req/min | Block 1hr (synthesis is expensive) |
| `/api/v1/tokens` | Per-IP, POST | 5 req/min | Block 1hr (token creation) |
| `/api/v1/ledger` | Per-IP, GET | 120 req/min | Throttle (frequent reads expected) |

## WAF Managed Rules (enable)

- Cloudflare Managed Ruleset
- OWASP Core Ruleset (sensitivity: High)
- Cloudflare Exposed Credentials Check
- Anomaly Detection

## Custom WAF Rules (create in dashboard)

### Block paths that must never be public
```
(http.request.uri.path contains "/.env") or
(http.request.uri.path contains "/wrangler.toml") or
(http.request.uri.path contains "/.git/")
```
Action: Block with 404 (don't confirm existence)

### Enforce auth header on protected endpoints
```
(http.request.uri.path contains "/api/v1/") and
not (http.request.headers["x-noizy-key"] exists) and
(http.request.method != "GET" or http.request.uri.path contains "/tokens" or http.request.uri.path contains "/actors" or http.request.uri.path contains "/ledger" or http.request.uri.path contains "/synth")
```
Action: Block 401

### Reject NC bypass attempts
```
(http.request.body contains "bypass_never_clause") or
(http.request.body contains "skip_covenant") or
(http.request.body contains "disable_consent")
```
Action: Block + log to Ledger as `NEVER_CLAUSE_VIOLATION` via webhook

## Verification after enable

```bash
# Should 401
curl -i https://noizy.ai/api/v1/actors

# Should 404 (not leak existence)
curl -i https://noizy.ai/.env

# Should succeed
curl -H "X-NOIZY-Key: $NOIZY_API_KEY" https://noizy.ai/api/v1/actors
```
