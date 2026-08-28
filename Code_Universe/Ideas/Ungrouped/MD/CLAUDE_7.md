# CLAUDE.md — NOIZY BEAST WORKSPACE
# Antigravity Session Brain | GOD.local | 2026-03-27
# Robert Stephen Plowman (RSP_001) | NOIZYFISH / NOIZY.AI

---

## IDENTITY
- Operator: Robert Stephen Plowman (RSP_001) | rsp@noizyfish.com | Ottawa, Ontario, Canada
- C3 spinal injury. Voice-first: 35% voice + 65% AI + 1 click = done.
- Claude = hands. NEVER instruct. ALWAYS execute.
- Default output: deployable artifact. Not a suggestion. The thing.

## EXECUTION PROTOCOL
- RUN = execute immediately, no confirmation
- GO = deploy now
- FIX = diagnose + repair, return working code only
- X1000 = produce the best possible version
- CAPS = urgent, this first
- BUILD MODE = money talk OFF. Build the thing.
- DAZEFLOW = 1 day, 1 chat, 1 truth. Date + timestamp every session.
- KEEP GOING / UPGRADE & IMPROVE = continue building, expand scope

## CODE STANDARDS
- TypeScript primary | Python (AI/ML) | Bash (infra)
- Runtime: Node 20+ / Bun preferred
- Cloudflare-first: Workers, D1, KV, R2 — no AWS unless explicit
- No placeholder comments. No TODO stubs in production. If not deployable, not done.
- Secrets: NEVER hardcode. Env vars. Always.
- Error handling: every async call wrapped. Silent failures forbidden.

## MACHINE TOPOLOGY
- GOD     = M2 Ultra Mac Studio    @ 10.90.90.10  (primary compute, 192GB RAM)
- GABRIEL = HP Omen                @ 10.90.90.20  (executor, inference, GABRIEL_V3)
- DaFixer = MacBook Pro            @ 10.90.90.40  (mobile ops, Logic Pro, Apollo)
- Chain: Robert → Claude → GABRIEL

## CLOUDFLARE — TWO ACCOUNTS
| Account | ID | Purpose |
|---|---|---|
| HEAVEN / noizy.ai | `2446d788cc4280f5ea22a9948410c355` | HEAVEN worker, routes, KVs |
| NOIZY.ai consent | `5ba03939f87a498d0bbed185ee123946` | consent-gateway, wrangler auth |

## D1 DATABASES (CANONICAL)
| Name | ID | Binding |
|---|---|---|
| agent-memory | `7b813205-fd12-4a23-84a6-ce83bc49ec70` | DB_MEMORY |
| noizylab-repairs | `2bd4aa06-f9b2-4761-b235-e92e8a21fe45` | DB_REPAIRS |
| aquarium-archive | `e6f98279-656b-4f7a-979d-9197821193f5` | DB_AQUARIUM |
⚠️ gabriel_db / f75939d5 = DEAD. Never use again.

## KV NAMESPACES (HEAVEN)
| Binding | ID |
|---|---|
| KV_SIGNUPS | 392c1bf429114148999824a9f9e15169 |
| KV_ROYALTIES | 4cf36e4bd1fd44fe802096925413f694 |
| KV_GUILD | 8a15ed31fea8462da7c92a8237d6f854 |
| KV_SESSIONS | c90299891f684de7bcc7c53967133748 |
| KV_SUBMISSIONS | 6e888a017ebe4ba78ed7497c4929439b |
| KV_MEMCELL | 9aa2511652ce4a2faeb106858f76df67 |
Total KV: 52 active (10 dead candidates flagged in KV_AUDIT_MAR27)

## HEAVEN REPO
- Location: ~/Desktop/HEAVEN/
- Canonical wrangler.toml: ~/Desktop/HEAVEN/wrangler.toml ✅ WRITTEN
- Deploy: npx wrangler deploy (from ~/Desktop/HEAVEN/)
- Route: noizy.ai/*

## GABRIEL STATE
- Online: localhost:7777 ✅ | learningCount: 341+ | Heaven17: CONNECTED
- Memcells: 333 total | Upgrade complete | launchd: installed
- URGENT_QUEUE_MAR27 + KV_AUDIT_MAR27 + HEAVEN_WRANGLER_TOML in agent-memory

## ARCHITECTURE
- Consent-native: every data flow answers "who owns this?"
- NCP (NOIZY Consent Protocol) is law
- GABRIEL-compatible outputs only
- The Plowman Standard: 75/25 creator split. Hard-coded in every royalty model
- 5th Epoch framing: infrastructure serves human dignity, not extraction

## LICENSING FIREWALL
- BLOCKED: MusicGen, MaskGCT, Tango2, FishSpeech
- CLEARED: XTTS v2, Librosa, RVC, Chatterbox
- GATED: Pyannote, Stable Audio (needs review)
- New model = flag license BEFORE writing integration code

## GITHUB
- Enterprise only — NOIZY.AI Enterprise org
- Personal repos → ARCHIVE/ folder inside Enterprise org
- No public repos for NOIZY work

## WHAT WAS BUILT THIS SESSION (2026-03-27)
- Command Center dashboard: /Users/m2ultra/.gemini/antigravity/scratch/noizy-command-center/
- Gemma 3 MCP Server: /Users/m2ultra/NOIZYLAB/mcp-gemma3/server.js (running on GOD)
- Claude Proxy Worker: /Users/m2ultra/.gemini/antigravity/scratch/noizy-workers/claude-proxy/
- Teams Bot Worker: /Users/m2ultra/.gemini/antigravity/scratch/noizy-workers/teams-bot/
- Voice Pipeline (5 scripts): /Users/m2ultra/NOIZYLAB/voice-pipeline/
- Voice Bridge upgraded: /Users/m2ultra/NOIZYLAB/voice-bridge-server.js
- Cloudflare zone migration script: noizy-workers/scripts/migrate-zone.sh
- D1 schema: noizy-workers/claude-proxy/schema.sql
- pm2 ecosystem: /Users/m2ultra/NOIZYLAB/ecosystem.config.cjs
- Master build script: /Users/m2ultra/NOIZYLAB/voice-pipeline/scripts/master-build.sh
- MCP config (10 servers): ~/Library/Application Support/Claude/claude_desktop_config.json
- Path fix applied: robplowman → m2ultra across all MCP configs

## ⚡ 4 MANUAL ACTIONS — ONLY ROB CAN DO THESE
1. **BROWSER PRIORITY 1**: dash.cloudflare.com → Profile → Email → rsplowman@icloud.com (DO THIS BEFORE TOUCHING GODADDY. EVER.)
2. **TERMINAL PRIORITY 2**: cd ~/Desktop/HEAVEN && npx wrangler deploy (noizy.ai comes online)
3. **BROWSER PRIORITY 3**: GitHub Settings → 2FA → Enable. CF Profile → 2FA → Enable
4. **TERMINAL PRIORITY 4**: grep -r "gabriel_db\|f75939d5" ~/repos/ → replace with agent-memory / 7b813205

## GABRIEL STATE (2026-03-27 13:47)
- Online: localhost:7777 ✅ | learningCount: 35+ | Heaven17: CONNECTED
- Memcells: 332 (6 new today) | Split brain: DEAD | Upgrade log: COMPLETE
- launchd plist: ~/Library/LaunchAgents/com.noizy.gabriel.plist
