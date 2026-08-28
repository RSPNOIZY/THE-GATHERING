# Cloudflare Tunnel · Expose GOD.local through NOIZYCLOUDS

> Turns GOD.local's private services (DreamChamber :7777, GABRIEL daemon :9777, Ollama :11434, n8n :5678, etc.) into public HTTPS URLs on `*.noizy.ai`, gated by Cloudflare Zero Trust Access + CF10's NOIZY session cookie. No port forwarding, no DDNS, no opened inbound firewall.

**Prereqs:**

- `.ai` NS flip completed so `noizy.ai` is active on NOIZYFISH (so we can attach Custom Hostnames under that zone)
- `cloudflared` installed on GOD.local: `brew install cloudflared`
- CF10 SSO guard deployed (`cf10-sso-guard.rsp-5f3.workers.dev`) — the identity checkpoint every Tunnel route can route through

---

## Part 1 · Create the tunnel (one-time)

```bash
# Authenticate cloudflared with the NOIZYFISH account
cloudflared tunnel login
# (browser opens; select noizy.ai zone; cert saved to ~/.cloudflared/cert.pem)

# Create a named tunnel for GOD.local
cloudflared tunnel create god-local

# You'll get back a tunnel UUID. Note it — we reference it as <TUNNEL_ID>.
# Credentials file lands at ~/.cloudflared/<TUNNEL_ID>.json
```

---

## Part 2 · Ingress config · `~/.cloudflared/config.yml`

```yaml
tunnel: <TUNNEL_ID>
credentials-file: /Users/m2ultra/.cloudflared/<TUNNEL_ID>.json

# Ordered match — first hostname match wins. Catch-all at the bottom.
ingress:
  # DreamChamber multi-model creative space
  - hostname: dreamchamber.noizy.ai
    service: http://localhost:7777
    originRequest:
      noTLSVerify: true
      connectTimeout: 30s

  # GABRIEL orchestrator daemon
  - hostname: gabriel.noizy.ai
    service: http://localhost:9777
    originRequest:
      connectTimeout: 15s

  # Ollama — local LLM host (Gemma 3 27B / SHIRLEY + any pulled models)
  - hostname: ollama.noizy.ai
    service: http://localhost:11434
    originRequest:
      connectTimeout: 30s
      # Ollama streams SSE — keep connection alive
      keepAliveTimeout: 300s
      noHappyEyeballs: true

  # n8n Agentic Factory
  - hostname: n8n.noizy.ai
    service: http://localhost:5678

  # open-webui (multi-model chat UI)
  - hostname: webui.noizy.ai
    service: http://localhost:3080

  # Grafana metrics dashboard
  - hostname: grafana.noizy.ai
    service: http://localhost:3000

  # Qdrant (if direct access needed — usually prefer CF07 Vectorize)
  - hostname: qdrant.noizy.ai
    service: http://localhost:6333

  # Catch-all (404 anything unmatched so we don't accidentally expose services)
  - service: http_status:404
```

---

## Part 3 · DNS records

Point each subdomain at the tunnel UUID via CNAME:

```bash
cloudflared tunnel route dns god-local dreamchamber.noizy.ai
cloudflared tunnel route dns god-local gabriel.noizy.ai
cloudflared tunnel route dns god-local ollama.noizy.ai
cloudflared tunnel route dns god-local n8n.noizy.ai
cloudflared tunnel route dns god-local webui.noizy.ai
cloudflared tunnel route dns god-local grafana.noizy.ai
cloudflared tunnel route dns god-local qdrant.noizy.ai
```

Each one creates a CNAME to `<TUNNEL_ID>.cfargotunnel.com` on the noizy.ai zone. Proxied (orange cloud) automatically.

---

## Part 4 · Zero Trust Access (MANDATORY — NEVER expose GOD without it)

### 4.1 Set up the NOIZY Zero Trust team

1. <https://dash.cloudflare.com> → **NOIZYFISH** → **Zero Trust** (sidebar).
2. Choose team name: `noizy` → team domain becomes `noizy.cloudflareaccess.com`.
3. Pick Free plan (enough for solo use — 50 users).

### 4.2 Add identity providers

Zero Trust → Settings → Authentication → Login methods → Add:

1. **Google Workspace** — primary. OAuth client ID/secret from Workspace Admin → Security → API controls. Scope: `openid email profile`. Makes `rsp@noizy.ai` the SSO identity.
2. **GitHub (RSPNOIZY)** — secondary. For any tools that would rather auth via GitHub.
3. **One-time PIN to rsp@noizy.ai** — fallback. Always enabled so you can't lock yourself out.

### 4.3 Access policies per service

Zero Trust → Access → Applications → Add application → Self-hosted. One per tunnel hostname. Apply the same policy to each:

| Application  | Hostname                |
| ------------ | ----------------------- |
| DreamChamber | `dreamchamber.noizy.ai` |
| GABRIEL      | `gabriel.noizy.ai`      |
| Ollama       | `ollama.noizy.ai`       |
| n8n          | `n8n.noizy.ai`          |
| open-webui   | `webui.noizy.ai`        |
| Grafana      | `grafana.noizy.ai`      |
| Qdrant       | `qdrant.noizy.ai`       |

**Policy for each (same rule):**

- **Action:** Allow
- **Rules:**
  - Include: Emails → `rsp@noizy.ai` (ONLY)
- **Session duration:** 8 hours (matches CF10 cookie TTL)
- **Require:** MFA via Google Workspace 2FA

Deny-by-default is implicit — anyone else 403s.

### 4.4 Stamp CF10 NOIZY session cookie on Access pass

Zero Trust → Access → Applications → <each app> → **Policies** → **Edit** → **Additional settings** → **On success, send to**: `https://cf10-sso-guard.rsp-5f3.workers.dev/verify?return=<original_url>`.

Flow:

1. Rob's browser hits `dreamchamber.noizy.ai`
2. Access challenges — Rob logs in via Google SSO
3. Access passes → redirects through CF10 `/verify` with the JWT attached
4. CF10 verifies, stamps `NOIZY_SESSION` cookie, redirects to DreamChamber
5. DreamChamber + all future requests include the cookie; cheap downstream auth

### 4.5 Enable Access logs → CF09 Google Workspace relay

Zero Trust → Logs → Access → Connect a Logpush destination → CF04 `/webhook` (with `X-NOIZY-Key`). Every login attempt appears in `#noizyai-empire-status`.

---

## Part 5 · Run the tunnel as a service on GOD.local

```bash
# Install as LaunchAgent (runs on login, auto-restarts on crash)
sudo cloudflared service install

# Or manually for dev
cloudflared tunnel run god-local

# Verify
cloudflared tunnel info god-local
# Expect: <TUNNEL_ID>  god-local  <N> active connections
```

LaunchAgent plist lives at `/Library/LaunchDaemons/com.cloudflare.cloudflared.plist`. Logs at `/Library/Logs/com.cloudflare.cloudflared.log`.

---

## Part 6 · Verify + test

Before the tunnel starts, nothing on GOD is publicly reachable. After:

```bash
# From any network (cell phone data, coffee shop, etc)
curl -I https://dreamchamber.noizy.ai
# Expected: 302 Found (Cloudflare Access login page)

# After logging in via browser:
curl -I https://dreamchamber.noizy.ai \
  -H "Cookie: CF_Authorization=<jwt>" \
  -H "Cookie: NOIZY_SESSION=<cookie>"
# Expected: 200 OK (or whatever the app returns at /)
```

---

## Part 7 · Revocation · emergency close

```bash
# Instant: stop the tunnel process on GOD (breaks all exposed URLs immediately)
sudo launchctl unload /Library/LaunchDaemons/com.cloudflare.cloudflared.plist

# Surgical: remove a single service from public (edits config.yml + reload)
# e.g. to unexpose Ollama only:
cloudflared tunnel route dns --overwrite-dns god-local ollama.noizy.ai off
# Then remove the hostname block from config.yml and:
cloudflared tunnel run god-local   # or launchctl reload

# Nuclear: delete the tunnel entirely
cloudflared tunnel delete god-local
# (also deletes all CNAMEs that routed to it)
```

If Kill Switch for the empire fires, add this revocation script to the kill-switch-drill flow: CF04 `priority=critical` → LaunchAgent unload. 90-second empire lockdown.

---

## Part 8 · Why this is the right posture

- **No inbound port opened on GOD's router.** Tunnel is outbound-only; CF edge holds the public side.
- **Every internal surface is identity-gated at the edge.** GOD's services never see unauthenticated traffic — Access terminates auth before the request reaches `localhost:7777`.
- **Same SSO identity the rest of the empire uses.** `rsp@noizy.ai` via Google Workspace → one click in, same session cookie works against CF10, which means future Workers can cheaply verify "is this Rob?" without re-contacting Access.
- **Revocable instantly.** One `launchctl unload` and everything is offline. No propagation wait, no residual sessions once cookies expire (8h default).

---

## Cost footprint

Cloudflare Tunnel: **free** for any Cloudflare account. Unmetered.
Zero Trust Free plan: 50 users / unlimited policies.

Entire tunnel + ZT setup: $0/mo until the empire grows past 50 users. At that point the Teams Standard plan starts at ~$7/user/month.

---

_One tunnel, one identity, every GOD service reachable from the iPad in the coffee shop. Consent at the edge. 396 Hz._
