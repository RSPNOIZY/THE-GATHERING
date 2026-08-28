# CB01 · Domain-Flip Runbook (smart path)

**Goal:** every NOIZY domain zone = `active` in NOIZYFISH CF account.
**Tool:** `ops/cb01-domain-ops.sh` (executor) + `cb01-mcp` (agent wrapper) — both shipped 2026-04-20.

---

## What the tool does (order of attempt)

1. **GoDaddy Management API** (`PATCH /v1/domains/{d}`) — flips NS in seconds if your account is on the Domain Pro Plan or has 1+ domain AND the Mgmt API is active.
2. **Cloudflare Registrar Transfer-In** (`POST /accounts/{id}/registrar/domains/{d}/transfer_in`) — moves the domain into NOIZYFISH; NS auto-flips as a side effect (5–7 day propagation).

Whichever works, the tool reports definitively.

---

## One-time setup (≤ 10 min, mostly browser)

### A. GoDaddy Production API key (if you want the instant path)

1. <https://developer.godaddy.com/keys> → **Create Production Key**
2. Copy Key + Secret immediately (shown once)
3. Add to shell env:
   ```bash
   export GODADDY_API_KEY="your_key"
   export GODADDY_API_SECRET="your_secret"
   ```
4. Save permanently — add those two lines to `~/.zprofile` (NOT committed to git).

### B. Cloudflare fine-grained Domain token (for Transfer-In fallback)

1. <https://dash.cloudflare.com/profile/api-tokens> → **Create Token** → **Custom token**
2. Token name: `noizy-cb01-domain-ops`
3. **Permissions:** `Account → Domain → Edit` + `Zone → Zone → Read`
4. **Account Resources:** Include → NOIZYFISH (`5f36aa9795348ea681d0b21910dfc82a`)
5. Create → copy token immediately.
6. Add to shell env:
   ```bash
   export CF_DOMAIN_TOKEN="your_token"
   ```

---

## Flip everything (once env is set)

```bash
cd /Users/m2ultra/NOIZYANTHROPIC
bash ops/cb01-domain-ops.sh audit                         # see what's pending
bash ops/cb01-domain-ops.sh flip noizy.ai
bash ops/cb01-domain-ops.sh flip fishmusicinc.com
bash ops/cb01-domain-ops.sh flip noizylab.ca
# noizyvox.com is at CF Registrar already — account-to-account transfer via dashboard
```

Or via the agent fleet (once `cb01-mcp` reload propagates to Claude Code):

- `cb01_domain_audit` — one call, full state
- `cb01_domain_flip` with `{"domain": "noizy.ai"}` — one call per domain

---

## If GoDaddy API rejects (Domain Pro not active)

The tool tells you exactly what to do next. Typical fallback:

1. At GoDaddy: unlock the domain + copy **EPP auth code**
2. Then:
   ```bash
   bash ops/cb01-domain-ops.sh transfer noizy.ai <EPP_CODE>
   ```
3. Approve the CF confirmation email → 5–7 days → NS auto-flip.

---

## Watch progress

```bash
bash ops/cb01-domain-ops.sh watch    # prints audit every 60s
```

When all 6 lines say GREEN → 100% DNS. Close the loop.
