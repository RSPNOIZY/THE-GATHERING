# LUCY MESH — DEPLOYMENT RUNBOOK

**Architect:** Robert Stephen Plowman
**Charter:** `00-LUCY-MESH-CHARTER.md`
**Status:** Phase 1 → Phase 2 executable runbook

All commands assume you're on the **M2 Ultra** in this folder:
`/10_INFRASTRUCTURE/cloudflare-workers/lucy-mesh/`

---

## PHASE 1 — UNBLOCK CLOUDFLARE, DEPLOY WORKER + D1

### 1.1 Upgrade Workers plan (browser, once)

1. Open Cloudflare dashboard → **Workers & Pages → Plans**.
2. Select **Workers Paid ($5/month)**. This unlocks 10 GB D1 and removes
   the 100k/day read/write blocker.

### 1.2 Rotate the API token (browser, once)

1. Cloudflare dashboard → **My Profile → API Tokens → Create Token**.
2. Use **Custom token** with permissions:
   - Account · **Workers Scripts** · **Edit**
   - Account · **D1** · **Edit**
   - Account · **Account Settings** · **Read**
3. Scope to your account. Create. **Copy the token** — you see it once.

### 1.3 Re-authenticate wrangler (Terminal)

```bash
# kill the stale creds
wrangler logout

# sign in with the new token
wrangler login
```

Verify:

```bash
wrangler whoami
```

### 1.4 Verify (or create) the D1 database

```bash
# If this 404s, the DB doesn't exist yet — create it.
wrangler d1 info agent-memory-783205

# Create path:
wrangler d1 create agent-memory-783205
```

Copy the `database_id` UUID from the output. Paste it into
`wrangler.toml` → `database_id = "..."`.

### 1.5 Deploy the schema

```bash
wrangler d1 execute agent-memory-783205 \
  --file=./d1schema.sql \
  --remote
```

Confirm seed rows:

```bash
wrangler d1 execute agent-memory-783205 \
  --remote \
  --command "SELECT agent_id, surface, status FROM device_status;"
```

You should see Gabriel, Shell, Keith, Dream, Pops.

### 1.6 Inject secrets

```bash
# Anthropic API key (required for /api/chat)
wrangler secret put ANTHROPIC_API_KEY

# Shared secret for PWA → Worker auth.
# Generate a strong one first:
#   openssl rand -hex 32
wrangler secret put LUCY_SHARED_SECRET
```

**Save the LUCY_SHARED_SECRET value somewhere you can retrieve it** — the
PWA needs the exact same string at build time (`VITE_LUCY_AUTH`).

### 1.7 Deploy the worker

```bash
wrangler deploy
```

Wrangler prints a URL like:
`https://lucy-worker.<your-subdomain>.workers.dev`

### 1.8 Smoke-test Phase 1

```bash
# Health check (no auth)
curl https://lucy-worker.<your-subdomain>.workers.dev/api/health

# Mesh read (no auth, returns 5 agents, none live yet)
curl https://lucy-worker.<your-subdomain>.workers.dev/api/mesh

# Chat round-trip (REQUIRES auth header)
curl -X POST https://lucy-worker.<your-subdomain>.workers.dev/api/chat \
  -H "Content-Type: application/json" \
  -H "x-lucy-auth: <your LUCY_SHARED_SECRET>" \
  -d '{"session_id":"test-001","device_id":"m2ultra-shell","agent_id":"Shell","message":"Hello Lucy, are you alive?"}'
```

**Phase 1 gate passes** when that POST returns JSON containing `response`
with a Claude-generated string, AND a follow-up:

```bash
wrangler d1 execute agent-memory-783205 \
  --remote \
  --command "SELECT role, substr(content,1,60) FROM messages WHERE session_id='test-001' ORDER BY timestamp;"
```

…shows both the user message and the assistant reply persisted.

---

## PHASE 2 — IPAD PWA LIVE

### 2.1 Configure the PWA build

```bash
cd pwa
cp .env.example .env.local
# Edit .env.local:
#   VITE_LUCY_API   = your worker URL from 1.7
#   VITE_LUCY_AUTH  = the LUCY_SHARED_SECRET from 1.6
#   VITE_DEVICE_ID  = ipad-primary
#   VITE_AGENT_ID   = Dream
```

### 2.2 Install + build

```bash
npm install
npm run build
# dist/ now contains the deployable PWA
```

### 2.3 Deploy to Cloudflare Pages

Two paths. Pick one.

**A. Dashboard upload (fastest first time).**
Cloudflare dashboard → **Workers & Pages → Create → Pages → Upload assets**.
Drop the `dist/` folder. Name the project `lucy-pwa`.

**B. Wrangler deploy.**
```bash
wrangler pages deploy dist --project-name=lucy-pwa
```

### 2.4 Point `lucy.noizy.ai` at it

Cloudflare dashboard → the `lucy-pwa` Pages project → **Custom domains**
→ Set up `lucy.noizy.ai`. Cloudflare handles SSL automatically if
`noizy.ai` is on your account.

### 2.5 Install on iPad

1. Open Safari on iPad → navigate to `https://lucy.noizy.ai`.
2. Share sheet → **Add to Home Screen** → "Lucy".
3. Launch from the home-screen icon. It opens standalone, no browser chrome.

**Phase 2 gate passes** when:
- iPad home-screen icon launches Lucy standalone.
- The MESH_NETWORK panel shows 5 agents, Dream marked live (green pulse).
- Sending a message produces a Claude response.
- Killing wifi, reopening the app from home screen, shows the last
  conversation from cache (the shell loads offline; API calls will fail
  until reconnected, which is expected).

---

## PHASE 3 — IPHONE GABRIEL NODE

Repeat **2.1–2.5** with a second `.env.local`:
```
VITE_DEVICE_ID=iphone-gabriel
VITE_AGENT_ID=Gabriel
```
Build again, deploy as a second Pages project (`lucy-gabriel`) or a
second custom domain (`gabriel.noizy.ai`). Install on iPhone the same
way. Gabriel now heartbeats whenever the iPhone PWA is open.

Voice input: start with Safari's built-in `<input>` dictation (mic key
on keyboard). Phase 3.1 can swap to Web Speech API for push-to-talk.

---

## PHASE 4 — M2 ULTRA IN THE MESH

Small local daemon, on the M2 Ultra, hits `/api/ping` every 30s as
`Shell`. Cron entry or a `launchd` agent. Example one-liner for testing:

```bash
while true; do
  curl -s -X POST "$LUCY_API/api/ping" \
    -H "Content-Type: application/json" \
    -H "x-lucy-auth: $LUCY_AUTH" \
    -d '{"agent_id":"Shell","status":"idle","current_task":"M2U standby"}' > /dev/null
  sleep 30
done
```

**Phase 4 gate passes** when the mesh panel shows all three of
Gabriel, Dream, and Shell live at the same time.

---

## ROLLBACK NOTES

- `wrangler rollback` reverts the worker to the previous deploy.
- D1 has no native rollback; schema is idempotent (`IF NOT EXISTS`,
  `ON CONFLICT DO NOTHING`), so re-running it is safe.
- If you ever need to wipe state: `DELETE FROM messages; DELETE FROM sessions;`
  (leave `device_status` seeded).

---

## SECURITY REMINDERS

- Never commit `.env.local` or the real `database_id`.
- Rotate `LUCY_SHARED_SECRET` any time you suspect compromise; update
  both `wrangler secret put` and every PWA `.env.local`.
- All consequential actions go into the `events` table — review it.

*End of runbook v1.0.*
