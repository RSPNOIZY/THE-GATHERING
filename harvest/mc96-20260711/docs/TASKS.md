# TASKS.md — NOIZY Empire Active Work
# Robert Stephen Plowman (RSP_001)
# Last updated: 2026-03-20

---

## 🔴 IMMEDIATE (Rob's Action Required)

- [ ] **Deploy HEAVEN** → Run `bash ~/NOIZYLAB/deploy.sh` in Terminal
- [ ] **Enable R2 Storage** → Cloudflare Dashboard → Storage → R2 → Activate
- [ ] **Fix Mac Mail** → System Settings → Internet Accounts → remove rsplowman@outlook.com (inactive/bouncing)
- [ ] **First Voice DNA Session** → Record in Logic → hash output → write hvs_voice_dna row via POST /api/v1/actors/RSP_001/voice-dna (after deploy)

---

## 🟡 IN PROGRESS

- [~] **NOI-13** — Wire HEAVEN Worker Routes — code done, awaiting deploy
- [~] **Notion HVS Hub** — Architecture documentation hub being built

---

## 🟢 COMPLETED THIS SESSION

- [x] Deploy gabriel_db migration (13 tables, 6 views, 2 triggers)
- [x] Seed RSP_001 founding actor
- [x] Seed 9 Never Clauses (7 personal + 2 system)
- [x] Seed EST-RSP-001 estate record
- [x] Seed GENESIS-RSP-001 ledger entry
- [x] Seed rate table (4 tiers) + union tiers (5 tiers)
- [x] Write HEAVEN Worker (24 routes, version 17.0.0)
- [x] Write wrangler.toml with all bindings
- [x] Write CLAUDE.md working memory
- [x] Write TASKS.md (this file)
- [x] Create deploy.sh script

---

## 🔵 BACKLOG

### Infrastructure
- [ ] Create RSP_001 first real Voice DNA record (post-deploy)
- [ ] Create first Descendant record for RSP_001
- [ ] Set up R2 bucket (`noizy-voice-archive`) for PREMIS/OAIS storage
- [ ] Wire noizyvox-royalties KV for real-time royalty state
- [ ] Wire gorunfree-execution-state KV

### Consent Kernel
- [ ] Issue first real Consent Token for RSP_001
- [ ] Test kill switch end-to-end
- [ ] Build licensee onboarding flow
- [ ] First real Synth Request + Never Clause enforcement test

### Platform
- [ ] Notion HVS Architecture Hub (pages: Overview, Consent Kernel, Ledger, Actors, Rate Table)
- [ ] Linear milestone: "HVS v1.0 Live"
- [ ] C2PA integration spec
- [ ] PREMIS event logging from Worker to hvs_premis_events
- [ ] Enterprise audit endpoint documentation

### Business
- [ ] First licensee record
- [ ] Rate card finalization (community/professional/enterprise/broadcast)
- [ ] Union contribution policy documentation
- [ ] Legal: Never Clause enforceability review

---

## NOTES

- gabriel_db ID: f75939d5-5747-4a9c-8ac2-7710201fda09
- HEAVEN Worker URL (post-deploy): https://heaven.rsp-5f3.workers.dev
- All ledger writes are immutable (triggers prevent UPDATE/DELETE)
- RSP_001 Never Clauses apply to ALL descendants globally
