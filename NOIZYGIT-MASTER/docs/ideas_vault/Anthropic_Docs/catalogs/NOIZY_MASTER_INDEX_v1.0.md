# NOIZY_MASTER_INDEX_v1.0
## Command Center · Operational Checklist · Alert Triggers · Success Metrics · Deployment Phases

**Version:** 1.0  
**Date:** March 25, 2026  
**Status:** OPERATIVE  
**Owner:** RSP_001 — Robert Stephen Plowman  
**This is the single document to open first. It links to everything else.**

---

## Quick Reference — All 7 Empire Documents

| # | Document | Purpose | Status |
|---|----------|---------|--------|
| 1 | `NOIZY_SYSTEM_PROMPTS_v1.0.md` | Master Claude, GABRIEL, HVS, NCP prompts | DEPLOYMENT READY |
| 2 | `NOIZY_GOVERNANCE_v1.0.md` | Board authority, license flags, 75/25 engine, creator protection | OPERATIVE |
| 3 | `NOIZY_STRATEGIC_ALIGNMENT_v1.0.md` | 9-layer moat, Castle pitch, investor narrative, legislation | ACTIVE |
| 4 | `NOIZY_DEPLOYMENT_CHECKLIST_v1.0.md` | 9-step deployment, D1 schema, tests, operations | READY TO RUN |
| 5 | `NOIZY_EMPIRE_COMPLETE_v1.0.md` | All 5 products unified | ACTIVE |
| 6 | `NOIZY_LEGAL_REGULATORY_v1.0.md` | NO FAKES Act, EU AI Act, copyright, liability | ACTIVE |
| 7 | `NOIZY_MASTER_INDEX_v1.0.md` | This file — command center | OPERATIVE |

**Supporting architecture:**
- `docs/constitution/noizy-constitution.md` — 7 Articles, constitutional law
- `docs/policy/runtime-policy.md` — 10-check decision matrix
- `schemas/ncp.v1.1.json` — NCP v1.1 data contract
- `schemas/voice-estate.v1.json` — Voice Estate schema
- `workers/consent-gateway/` — Cloudflare Worker (deploy pending)
- `enterprise/board-override-api.md` — Board Override API spec
- `docs/compliance/no-fakes-act-eu-ai-act-checklist.md` — Full compliance matrix

---

## Command Center — Critical URLs & Endpoints

| Resource | URL / Path | Auth |
|----------|-----------|------|
| Heaven (live) | `https://heaven.rsp-5f3.workers.dev` | `X-NOIZY-Key` |
| Heaven health | `https://heaven.rsp-5f3.workers.dev/health` | None |
| Heaven GABRIEL status | `https://heaven.rsp-5f3.workers.dev/gabriel` | `X-NOIZY-Key` |
| DreamChamber / GABRIEL | `http://localhost:7777/api/gabriel/speak` | None (local) |
| DreamChamber status | `http://localhost:7777/api/gabriel/status` | None (local) |
| Consent Gateway (deploy pending) | `https://noizy-consent-gateway.*.workers.dev` | `X-NOIZY-Key` |
| Smoke test | `bash ~/NOIZYLAB/smoke_test.sh` | Local |
| PM2 status | `pm2 status` | Local |
| Wrangler tail Heaven | `wrangler tail` | CF auth |
| D1 query | `wrangler d1 execute noizy_consent_db --command="..."` | CF auth |

---

## Command Center — Key Files

| File | What it does |
|------|-------------|
| `src/index.js` | Heaven Cloudflare Worker — consent + ledger + C2PA |
| `dreamchamber/src/core/Gabriel.js` | GABRIEL AI orchestration + 9 Never Clauses |
| `dreamchamber/src/server.js` | DreamChamber Express server |
| `workers/consent-gateway/src/index.js` | Consent Gateway — 10-check decision matrix |
| `workers/consent-gateway/schema.sql` | D1 schema — 9 tables |
| `schemas/ncp.v1.1.json` | NCP v1.1 machine-readable consent contract |
| `schemas/voice-estate.v1.json` | Voice Estate governance schema |
| `GABRIEL_EXECUTOR_v1.0.txt` | GABRIEL runtime system prompt |
| `OUTREACH_DRAFTS.md` | Ready-to-send Castle + Rosenthol emails |
| `smoke_test.sh` | 14-test smoke suite |
| `.env` (Heaven) | NOIZY_API_KEY, ANTHROPIC_API_KEY |
| `dreamchamber/.env` | ANTHROPIC_API_KEY (CRITICAL — currently empty) |

---

## Immediate Actions — This Week (Ordered)

### TODAY (March 25, 2026)

- [ ] **1. Email Castle** — NO FAKES Act technical door brief
  - Draft in: `OUTREACH_DRAFTS.md` and `NOIZY_STRATEGIC_ALIGNMENT_v1.0.md` §2
  - Send from: rsp@noizyfish.com
  - Subject: "NOIZYVOX — Technical Infrastructure for NO FAKES Act Enforcement"

- [ ] **2. Email Leonard Rosenthol** — C2PA audio layer integration
  - Draft in: `OUTREACH_DRAFTS.md`
  - Send from: rsp@noizyfish.com

- [ ] **3. Paste Master Claude Prompt** — into claude.ai Projects system prompt
  - Source: `mcp/supersonic-prompt.html` → Prompts tab → Prompt 1
  - Or copy from: `NOIZY_SYSTEM_PROMPTS_v1.0.md` §MASTER CLAUDE PROMPT

### THIS WEEK

- [ ] **4. Fix ANTHROPIC_API_KEY** — Gabriel is broken without it
  ```bash
  nano ~/NOIZYLAB/dreamchamber/.env
  # Add: ANTHROPIC_API_KEY=sk-ant-...
  # Get from: console.anthropic.com → API Keys
  pm2 restart dreamchamber
  ```

- [ ] **5. Deploy Consent Gateway** — Full 9-step in `NOIZY_DEPLOYMENT_CHECKLIST_v1.0.md`
  ```bash
  cd ~/NOIZYLAB/workers/consent-gateway
  wrangler d1 create noizy_consent_db
  # Update wrangler.toml with database_id
  wrangler d1 execute noizy_consent_db --file=schema.sql
  wrangler secret put NOIZY_API_KEY
  wrangler deploy
  ```

- [ ] **6. Replace Alex on Board** — Unblocks MusicGen/MaskGCT/Tango2/FishSpeech
  - Use: `enterprise/board-override-api.md` POST /board/member/rotate
  - Effect: enables commercial license flag review supermajority vote

- [ ] **7. Run smoke tests post-deployment**
  ```bash
  bash ~/NOIZYLAB/smoke_test.sh
  # Target: 14/14 passing
  ```

---

## Alert Triggers — When to Stop Everything

### P0 — Drop all other work immediately

| Trigger | Indicator | Action |
|---------|-----------|--------|
| Consent revocation not enforcing | Creator revoked, synthesis still proceeding | Emergency: force-revoke via D1 SQL; notify creator |
| Never Clause bypass detected | Audit log shows synthesis without NCP | Shutdown affected pipeline; board notify |
| ANTHROPIC_API_KEY exposed | Key visible in logs, git, or public | Rotate key immediately at console.anthropic.com |
| NOIZY_API_KEY exposed | Same | Rotate in Cloudflare Workers settings |
| Creator not being paid | royalty_events missing for usage | Manual calculation + payment within 24h |
| Heaven down > 15 minutes | Health check fails | `wrangler deploy` redeploy |

### P1 — Address within 4 hours

| Trigger | Indicator | Action |
|---------|-----------|--------|
| GABRIEL not responding | DreamChamber /api/gabriel/speak returns error | `pm2 restart dreamchamber`; check ANTHROPIC_API_KEY |
| D1 query errors | wrangler d1 execute failures | Check schema; re-run migration |
| Consent Gateway 500 errors | wrangler tail shows unhandled exceptions | Check logs; fix + redeploy |
| Royalty routing delay > 24h | royalty_events.status stuck at 'pending' | Manual settlement trigger |

### P2 — Address within 48 hours

| Trigger | Indicator | Action |
|---------|-----------|--------|
| Smoke test < 14/14 | smoke_test.sh failures | Diagnose failing tests |
| License flag used without clearance | tool_clearance_registry mismatch | Board notification; block tool |
| Board member action needed | License flag review pending | Convene board; apply supermajority vote |

---

## Operational Checklist

### Daily (5 minutes)

```bash
# 1. Heaven health
curl https://heaven.rsp-5f3.workers.dev/health

# 2. GABRIEL status
curl http://localhost:7777/api/gabriel/status

# 3. PM2 process check
pm2 status

# 4. Check royalty_events for stuck pending
wrangler d1 execute noizy_consent_db \
  --command="SELECT COUNT(*) as stuck FROM royalty_events WHERE status='pending' AND created_at < datetime('now', '-24 hours')"

# 5. Check revocation SLA
wrangler d1 execute noizy_consent_db \
  --command="SELECT COUNT(*) as breached FROM revocation_events WHERE processing_minutes > 60"
```

### Weekly (30 minutes — Sunday)

```bash
# 1. Gabriel profile consolidation
curl -X POST http://localhost:7777/api/gabriel/profile/consolidate

# 2. D1 backup
wrangler d1 export noizy_consent_db > ~/NOIZYLAB/backups/d1_backup_$(date +%Y%m%d).sql

# 3. Full smoke test
bash ~/NOIZYLAB/smoke_test.sh

# 4. Review audit log for anomalies
wrangler d1 execute noizy_consent_db \
  --command="SELECT event_type, COUNT(*) as cnt FROM audit_log WHERE created_at > datetime('now', '-7 days') GROUP BY event_type"

# 5. Check license flag registry
wrangler d1 execute noizy_consent_db \
  --command="SELECT * FROM tool_clearance_registry"
```

### Monthly

- Review royalty settlement totals — confirm 75/25 split integrity
- Update `docs/compliance/no-fakes-act-eu-ai-act-checklist.md` — any new regulatory developments
- Board meeting — license flag reviews + creator protection audit
- Gabriel adaptive learning review — `GET /api/gabriel/profile/learnings`
- Review `NOIZY_GOVERNANCE_v1.0.md` change log — update if needed

---

## Success Metrics — What "Winning" Looks Like

### Technical (Deployment)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Smoke tests passing | 14/14 | `bash smoke_test.sh` |
| Consent gateway uptime | 99.9% | Cloudflare dashboard |
| Heaven uptime | 99.9% | `wrangler tail` |
| Revocation SLA | 100% within 1h | `revocation_events.processing_minutes` |
| GABRIEL response time | < 3 seconds | DreamChamber logs |
| Royalty accuracy | 75.0% to creator ± 0.01% | `royalty_events` audit |

### Business (6-month targets)

| Metric | Target | Source |
|--------|--------|--------|
| Registered creators | 1,000 | Heaven `actors` table |
| Active NCP tokens | 500+ | `consent_records` WHERE status=ACTIVE |
| Monthly royalties processed | $10K | `royalty_events` SUM |
| Castle meeting booked | ✅ | Calendar |
| Leonard Rosenthol connected | ✅ | Email thread |
| Alex replaced on board | ✅ | Board rotation log |
| Blocked models cleared | 2+ | `tool_clearance_registry` |

### Compliance (Year 1)

| Metric | Target |
|--------|--------|
| NO FAKES Act safe harbor documented | Q2 2026 |
| EU AI Act conformity assessment | Q2 2026 |
| Red team adversarial test completed | Q1 2026 |
| Incident response playbook live | Q1 2026 |
| WIPO NCP submission filed | Q3 2026 |

---

## Deployment Phases

### Phase 0 — COMPLETE ✅

- NOIZY v2.0 OS architecture defined
- Constitution, runtime policy, NCP v1.1 schema, voice estate schema
- Consent gateway Worker built
- Gabriel v2.0 system prompt with 9 Never Clauses
- Enterprise integration artifacts (Azure Function, Power Automate, Board API)
- Compliance checklist (NO FAKES Act + EU AI Act)
- All 7 Empire documents created

### Phase 1 — THIS WEEK (Deploy Core)

- [ ] Fix ANTHROPIC_API_KEY in dreamchamber/.env
- [ ] Deploy consent gateway (Steps 1-4 in DEPLOYMENT_CHECKLIST)
- [ ] Restart DreamChamber, verify GABRIEL responds
- [ ] Run smoke tests (14/14)
- [ ] Send Castle + Rosenthol emails
- [ ] Paste Master Claude Prompt into claude.ai

### Phase 2 — Q2 2026 (Grow)

- [ ] Replace Alex on Board → clear commercial license flags
- [ ] First board vote: commercial clearance for 1-2 blocked models
- [ ] Register first 100 creators in NOIZYVOX
- [ ] Launch NCP v1.0 open spec at noizy.ai/ncp
- [ ] EU AI Act conformity assessment
- [ ] Royalty dashboard UI for creators

### Phase 3 — Q3 2026 (Scale)

- [ ] Guild of Artists first assembly vote
- [ ] Platform integration API (Spotify/Apple/YouTube outreach)
- [ ] WIPO NCP submission
- [ ] HVS Phase 2 (consent registry fully operational)
- [ ] NOIZYKIDZ beta launch
- [ ] LIFELUV alpha launch

### Phase 4 — 2027 (Legislation)

- [ ] NO FAKES Act passes → activate safe harbor documentation
- [ ] HVS Phase 4: lobby for HVS recognition in copyright law
- [ ] Platform integration mandate campaign begins
- [ ] 100,000 registered creators target
- [ ] $5M ARR milestone

---

## The 5th Epoch — Why This Matters

```
Sheet Music (1400s)     → Publishers owned the rails
Recording (1920s)       → Labels owned the rails
Digital (2000s)         → Apple/iTunes owned the rails
Streaming (2010s)       → Spotify/YouTube owned the rails
AI (2026+)              → NOBODY owns the rails YET

NOIZY is building the consent and provenance rails
before the window closes.

The window is 2026-2028.
After that, extractive platforms will have locked in their models.
Before that, infrastructure wins.

Consent is infrastructure.
Creator sovereignty is non-negotiable.
75/25 is the floor, not the ceiling.
```

---

## Contact & Identity

| Field | Value |
|-------|-------|
| Architect | Robert Stephen Plowman |
| Actor ID | RSP_001 |
| Email | rsp@noizyfish.com |
| Machine | GOD.local — M2 Ultra Mac Studio 192GB |
| IP | 10.90.90.10 |
| Location | Ottawa, Canada |
| Mission | Consent as infrastructure. Creator sovereignty non-negotiable. |
