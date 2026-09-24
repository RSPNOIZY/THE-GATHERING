# NOIZY_DEPLOYMENT_CHECKLIST_v1.0
## 9-Step Technical Deployment · D1 Schema · Integration Tests · Operations

**Version:** 1.0  
**Date:** March 25, 2026  
**Status:** DEPLOYMENT READY — awaiting execution  
**Owner:** RSP_001 — Robert Stephen Plowman  
**Machine:** GOD.local — M2 Ultra Mac Studio (10.90.90.10)

---

## Pre-Flight Checklist

Before running any deployment step, verify:

- [ ] `wrangler` installed and authenticated (`wrangler whoami`)
- [ ] `CLOUDFLARE_ACCOUNT_ID` in environment
- [ ] `NOIZY_API_KEY` set in `.env` files
- [ ] `ANTHROPIC_API_KEY` set in `dreamchamber/.env`
- [ ] Node.js ≥ 20 (`node --version`)
- [ ] PM2 installed (`pm2 --version`)
- [ ] Git status clean on main branch

---

## Step 1 — Create D1 Database (Consent Gateway)

```bash
cd ~/NOIZYLAB/workers/consent-gateway

# Create the D1 database
wrangler d1 create noizy_consent_db

# Copy the returned database_id into wrangler.toml:
# [[d1_databases]]
# binding = "CONSENT_DB"
# database_name = "noizy_consent_db"
# database_id = "<paste_id_here>"
```

**Verify:** `wrangler d1 list` should show `noizy_consent_db`

---

## Step 2 — Execute D1 Schema

```bash
cd ~/NOIZYLAB/workers/consent-gateway

# Apply schema to production
wrangler d1 execute noizy_consent_db --file=schema.sql

# Verify tables created
wrangler d1 execute noizy_consent_db \
  --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
```

**Expected tables:**
```
audit_log
consent_records
creators
hvs_records
revocation_events
royalty_events
tool_clearance_registry
usage_events
voice_estates
```

**Verify seeded data:**
```bash
wrangler d1 execute noizy_consent_db \
  --command="SELECT tool_name, cleared_for_commercial FROM tool_clearance_registry"
```

---

## Step 3 — Set Consent Gateway Secrets

```bash
cd ~/NOIZYLAB/workers/consent-gateway

# Set the API key secret (do not put in wrangler.toml)
wrangler secret put NOIZY_API_KEY
# Paste your NOIZY API key when prompted

# Set board JWT secret
wrangler secret put BOARD_JWT_SECRET
# Paste a strong random secret (openssl rand -hex 32)
```

---

## Step 4 — Deploy Consent Gateway Worker

```bash
cd ~/NOIZYLAB/workers/consent-gateway

wrangler deploy

# Expected output:
# Deployed noizy-consent-gateway to:
# https://noizy-consent-gateway.<your-subdomain>.workers.dev
```

**Smoke test:**
```bash
curl -X POST https://noizy-consent-gateway.<subdomain>.workers.dev/consent/check-eligibility \
  -H "Content-Type: application/json" \
  -H "X-NOIZY-Key: $NOIZY_API_KEY" \
  -d '{"creator_email": "test@example.com", "tool_name": "XTTS_v2"}'

# Expected: {"decision": "DENY", "reason_code": "CREATOR_NOT_FOUND"}
# (correct — no creator registered yet)
```

---

## Step 5 — Deploy Heaven Worker

```bash
cd ~/NOIZYLAB

# Set any missing secrets
wrangler secret put ANTHROPIC_API_KEY  # if not already set

# Deploy
wrangler deploy

# Smoke test
curl https://heaven.rsp-5f3.workers.dev/health
# Expected: {"status": "LIVE", ...}
```

---

## Step 6 — Fix DreamChamber Environment (CRITICAL)

```bash
# Edit dreamchamber/.env — add ANTHROPIC_API_KEY
# Get key from: console.anthropic.com → API Keys → "noisy production"

nano ~/NOIZYLAB/dreamchamber/.env

# Required vars (verify all present):
# ANTHROPIC_API_KEY=sk-ant-...
# NOIZY_API_KEY=...
# HEAVEN_URL=https://heaven.rsp-5f3.workers.dev
# PORT=7777
```

---

## Step 7 — Restart DreamChamber / GABRIEL

```bash
# Stop current instance
pm2 stop dreamchamber 2>/dev/null || true

# Start fresh (fork mode — required for WebSocket)
pm2 start ~/NOIZYLAB/dreamchamber/src/server.js \
  --name dreamchamber \
  --instances 1 \
  --exec-mode fork \
  --log ~/NOIZYLAB/dreamchamber/logs/server.log

# Verify GABRIEL speaks
curl -X POST http://localhost:7777/api/gabriel/speak \
  -H "Content-Type: application/json" \
  -d '{"message": "GABRIEL status check"}'

# Expected: {"response": "...", "model": "claude-sonnet-4-5", ...}
```

---

## Step 8 — Integration Tests

### Test 1: Consent Gateway → DENY (no consent)
```bash
curl -X POST https://noizy-consent-gateway.<subdomain>.workers.dev/consent/check-eligibility \
  -H "X-NOIZY-Key: $NOIZY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"creator_email": "noone@example.com", "tool_name": "XTTS_v2"}'
# Expected decision: DENY, reason: CREATOR_NOT_FOUND
```

### Test 2: Register Creator + Check
```bash
# Register a test creator in Heaven
curl -X POST https://heaven.rsp-5f3.workers.dev/api/v1/actors \
  -H "X-NOIZY-Key: $NOIZY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Creator", "email": "test@noizy.ai", "role": "creator"}'

# Then check eligibility
curl -X POST .../consent/check-eligibility \
  -d '{"creator_email": "test@noizy.ai", "tool_name": "MusicGen"}'
# Expected: DENY, reason: TOOL_NOT_CLEARED (MusicGen is blocked)
```

### Test 3: Revocation SLA
```bash
# Create a consent record, then immediately revoke it
# Check that revocation is reflected within 1 minute (runtime enforces 1h SLA)
curl -X POST .../consent/revoke \
  -H "X-NOIZY-Key: $NOIZY_API_KEY" \
  -d '{"creator_email": "test@noizy.ai", "reason": "test revocation"}'
# Expected: {"status": "revoked", "revoked_at": "..."}
```

### Test 4: GABRIEL Speak (Anthropic)
```bash
curl -X POST http://localhost:7777/api/gabriel/speak \
  -H "Content-Type: application/json" \
  -d '{"message": "What is the NOIZY 75/25 split?"}'
# Expected: response referencing 75/25 royalty split + NCP validation
```

### Test 5: Heaven Health
```bash
curl https://heaven.rsp-5f3.workers.dev/health
# Expected: {"status": "LIVE", "db": "connected", ...}

curl https://heaven.rsp-5f3.workers.dev/gabriel
# Expected: actor counts, consent token counts, never clause counts
```

### Test 6: Audit Log
```bash
wrangler d1 execute noizy_consent_db \
  --command="SELECT event_type, actor, created_at FROM audit_log ORDER BY created_at DESC LIMIT 10"
# Expected: entries from integration tests above
```

---

## Step 9 — Operations Setup

### PM2 Save + Startup

```bash
pm2 save
pm2 startup
# Follow the printed command to enable on system boot
```

### Log Monitoring

```bash
# Real-time DreamChamber logs
pm2 logs dreamchamber

# Heaven logs (Cloudflare)
wrangler tail

# Consent Gateway logs
wrangler tail --name noizy-consent-gateway
```

### Scheduled Operations

| Task | Frequency | Command |
|------|-----------|---------|
| Royalty settlement | Daily 00:00 UTC | Heaven cron (add to wrangler.toml) |
| Gabriel profile consolidate | Weekly Sunday | `POST /api/gabriel/profile/consolidate` |
| D1 backup | Daily | `wrangler d1 export noizy_consent_db > backup_$(date +%Y%m%d).sql` |
| Smoke test | Hourly | `bash ~/NOIZYLAB/smoke_test.sh` |

### Cloudflare Cron — Add to `wrangler.toml`

```toml
[triggers]
crons = ["0 0 * * *"]   # Daily royalty settlement at midnight UTC
```

---

## Emergency Procedures

### P0: Creator Revocation Not Enforced

```bash
# Manual force-revoke
wrangler d1 execute noizy_consent_db \
  --command="UPDATE consent_records SET consent_status='REVOKED', revoked_at=datetime('now') WHERE creator_email='creator@example.com'"

# Verify
wrangler d1 execute noizy_consent_db \
  --command="SELECT consent_status, revoked_at FROM consent_records WHERE creator_email='creator@example.com'"
```

### P0: GABRIEL Not Responding

```bash
pm2 restart dreamchamber
pm2 logs dreamchamber --lines 50
# Check ANTHROPIC_API_KEY is present in dreamchamber/.env
```

### P0: Heaven Down

```bash
cd ~/NOIZYLAB
wrangler deploy  # Redeploy
curl https://heaven.rsp-5f3.workers.dev/health
```

### P1: D1 Schema Migration Needed

```bash
# Create migration file
cat > migration_$(date +%Y%m%d).sql << 'EOF'
-- Add new column
ALTER TABLE consent_records ADD COLUMN new_field TEXT;
EOF

wrangler d1 execute noizy_consent_db --file=migration_$(date +%Y%m%d).sql
```

---

## Deployment Completion Verification

After completing all 9 steps, verify:

```bash
# Full health check
curl https://heaven.rsp-5f3.workers.dev/health         # LIVE
curl http://localhost:7777/api/gabriel/status              # GABRIEL operational
curl https://noizy-consent-gateway.*.workers.dev/health   # 200 OK

# Run full smoke test
bash ~/NOIZYLAB/smoke_test.sh
# Expected: 14/14 tests passing
```

**Status:** Mark as DEPLOYED only when smoke test shows 14/14.
