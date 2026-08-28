# DreamChamber Layer Map — operational matrix

> **Source**: doctrine in `GABRIEL/DREAMCHAMBER.md` · **Purpose**: exact app × hostname × device × accessibility-trigger × Zero Trust status for every DreamChamber surface · **Status**: versioned here; install order enforced; revise as tools land.

## Master table

| #   | Surface / App                                      | Layer | Hostname / Location                                           | Primary Device                         | Primary a11y trigger                            | Fallback trigger                     | ZT status                                                   |
| --- | -------------------------------------------------- | ----- | ------------------------------------------------------------- | -------------------------------------- | ----------------------------------------------- | ------------------------------------ | ----------------------------------------------------------- |
| 1   | Cloudflare Zero Trust org                          | 0     | `noizy.cloudflareaccess.com`                                  | Any (web)                              | Access App Launcher (SSO)                       | WARP posture check                   | **IS** the perimeter                                        |
| 2   | Cloudflare Tunnel (cloudflared)                    | 0     | background daemon on GOD                                      | M2 Ultra                               | `launchctl list \| grep cloudflared`            | `cloudflared tunnel run`             | n/a (outbound only)                                         |
| 3   | Access App Launcher                                | 0     | `https://noizy.cloudflareaccess.com`                          | iPad / Mac / iPhone                    | Voice Control: "open noizy launcher"            | large-target bookmark on home screen | **IS** front door                                           |
| 4   | WARP client                                        | 0     | installed on each device                                      | Mac / iPad / iPhone                    | menu bar toggle                                 | iOS Control Center widget            | required for admin posture                                  |
| 5   | macOS Voice Control                                | 1     | System Settings                                               | M2 Ultra                               | "Hey Voice Control" wake phrase                 | keyboard shortcut ⌃⌥⌘V (custom)      | n/a                                                         |
| 6   | macOS Switch Control                               | 1     | System Settings                                               | M2 Ultra                               | single adaptive switch press                    | Accessibility Keyboard tap           | n/a                                                         |
| 7   | Accessibility Keyboard + panels                    | 1     | onscreen, macOS                                               | M2 Ultra                               | single tap via dwell/switch                     | Voice Control: "click [panel]"       | n/a                                                         |
| 8   | Live Speech / Personal Voice / Vocal Shortcuts     | 1     | macOS + iOS                                                   | any Apple device                       | custom trigger phrase ("gabriel kill switch")   | Switch Control panel                 | n/a                                                         |
| 9   | iPad Eye Tracking + Switch Control                 | 2     | iPadOS Accessibility                                          | iPad                                   | eye dwell                                       | switch press                         | n/a                                                         |
| 10  | iPhone Head Tracking + Vocal Shortcuts             | 2     | iOS Accessibility                                             | iPhone                                 | head gesture                                    | voice shortcut                       | n/a                                                         |
| 11  | **LUCY on iPad (native app)**                      | 2     | native app `GABRIEL/ios/LUCY/`                                | iPad                                   | Voice Control or Switch                         | tap                                  | **behind Access** (session token from App Launcher)         |
| 12  | **LUCY on iPhone (native app)**                    | 2     | native app                                                    | iPhone                                 | Vocal Shortcut                                  | tap                                  | **behind Access**                                           |
| 13  | **LUCY PWA** (fallback)                            | 2     | `/lucy` on GABRIEL daemon                                     | any                                    | same as native                                  | browser tap                          | **behind Access**                                           |
| 14  | Logic Pro (macOS)                                  | 3     | app                                                           | M2 Ultra                               | Voice Control: "open composition mode" (custom) | keyboard shortcut                    | local only (no ZT needed)                                   |
| 15  | Logic Pro (iPad)                                   | 3     | app                                                           | iPad                                   | touch + VoiceOver                               | Bluetooth keyboard                   | local only                                                  |
| 16  | Final Cut Pro (macOS)                              | 3     | app                                                           | M2 Ultra                               | Voice Control: "start narration" (custom)       | keyboard shortcut                    | local only                                                  |
| 17  | Final Cut Pro (iPad)                               | 3     | app                                                           | iPad                                   | touch + VoiceOver                               | Bluetooth keyboard                   | local only                                                  |
| 18  | AI branding tool (TBD: Looka / Brandmark / Logoai) | 3     | web app                                                       | iPad (primary) / Mac                   | Voice Control typing                            | Switch Control form navigation       | public web (rate-limit via n8n)                             |
| 19  | **n8n editor + admin**                             | 4     | `n8n.noizy.ai` (proxied through Tunnel)                       | M2 Ultra / iPad                        | Voice Control: "open n8n"                       | App Launcher click                   | **behind Access + WARP posture**                            |
| 20  | **n8n webhook surface** (minimal)                  | 4     | `api.noizy.ai/hooks/*` (Worker Route)                         | any (server→server)                    | n/a (machine)                                   | n/a                                  | public but `x-api-key` gated                                |
| 21  | **GABRIEL daemon (operator UI)**                   | 4     | `gabriel.noizy.ai` (proxied)                                  | M2 Ultra / iPad / iPhone               | Voice Control: "gabriel"                        | App Launcher                         | **behind Access + WARP posture**                            |
| 22  | **GABRIEL CLI (local)**                            | 4     | `/Users/m2ultra/NOIZYANTHROPIC/GABRIEL`                       | M2 Ultra                               | Voice Control: "gabriel chat"                   | Terminal macro                       | local only (stdin/stdout)                                   |
| 23  | **MCP fleet (17 servers)**                         | 4     | stdio children of GABRIEL                                     | M2 Ultra                               | GABRIEL dispatch                                | n/a                                  | local only (spawned by GABRIEL)                             |
| 24  | **Heaven operator console**                        | 4     | `heaven.noizy.ai/dashboard` (after redeploy)                  | M2 Ultra / iPad                        | App Launcher                                    | direct bookmark                      | **behind Access** for write paths; `/dashboard` public read |
| 25  | **Heaven public read endpoints**                   | 4     | `heaven.noizy.ai/{health,status,gabriel,/}`                   | any                                    | n/a                                             | n/a                                  | public                                                      |
| 26  | **Governance / receipt dashboard**                 | 4     | Notion "DreamChamber / Receipts" DB + Heaven `/api/v1/ledger` | any                                    | App Launcher → Notion                           | direct Notion URL                    | **behind Access** (Notion SSO + CF Access on audit console) |
| 27  | **Supabase (truth vault)**                         | 4     | `<project>.supabase.co`                                       | M2 Ultra (admin) / server (automation) | App Launcher                                    | direct URL                           | **behind Access** for Studio; service_role via Worker only  |
| 28  | **Cloudflare R2 (voice DNA vault)**                | 4     | R2 buckets via Heaven                                         | server only                            | n/a                                             | n/a                                  | Heaven-gated (consent tokens required)                      |
| 29  | **Cloudflare Stream (A/V delivery)**               | 4     | `customer-*.cloudflarestream.com`                             | end-users (public)                     | signed tokens from Heaven                       | n/a                                  | public playback; ingest behind Heaven                       |
| 30  | **Notion "DreamChamber" hub**                      | 4     | Notion workspace                                              | iPad (primary) / Mac                   | Voice Control                                   | App Launcher bookmark                | Notion SSO; optionally fronted by Access for teamspaces     |

## ZT status legend

- **Public** — internet-reachable with no Access check (landing pages, Heaven read endpoints, Stream playback)
- **behind Access** — Cloudflare Access identity check required before the app loads
- **behind Access + WARP posture** — Access check AND device posture check (admin-only surfaces)
- **local only** — loopback / macOS app; not exposed through Tunnel
- **Heaven-gated** — consent token required; enforced in Worker code, not just network perimeter

## Install order checklist (execute top-to-bottom)

### Phase A — Perimeter (Layer 0)

- [ ] Create CF Zero Trust organization; choose team name (e.g. `noizy`)
- [ ] Bind identity provider(s): Apple ID via SSO + email OTP as backup
- [ ] Install cloudflared on GOD: `brew install cloudflared`
- [ ] Create tunnel: `cloudflared tunnel create noizy-god`
- [ ] Install tunnel credentials at `/Users/m2ultra/.cloudflared/<tunnel-id>.json` with 0600
- [ ] Add CNAME for each private hostname (n8n, gabriel, heaven admin)
- [ ] Write Access policy per hostname (identity group: `rsp@noizy.ai` only for admin; add collaborators later)
- [ ] Install CF One Client / WARP on Mac + iPad + iPhone
- [ ] Require WARP posture for admin surfaces (gabriel, n8n)
- [ ] Enable branded App Launcher

### Phase B — Body-Access (Layer 1)

- [ ] Voice Control: enable, download enhanced dictation model, add custom vocabulary (`gabriel`, `noizy`, `heaven`, `dazeflow`, `rsp_001`, `noizyvox`, etc.)
- [ ] Voice Control: add custom commands (map phrases → GABRIEL CLI invocations)
- [ ] Switch Control: configure if adaptive switches present; design panels (transport, scene, capture, gabriel-ops)
- [ ] Accessibility Keyboard: build panel set for common GABRIEL actions
- [ ] Personal Voice: record + export if Rob wants GABRIEL to use his voice for TTS fallback

### Phase C — Companion Devices (Layer 2)

- [ ] iPad: enable Eye Tracking + Switch Control; test dwell on LUCY PWA
- [ ] iPad: mount or gooseneck positioning for sustained use
- [ ] iPhone: enable Head Tracking + Vocal Shortcuts
- [ ] Install LUCY native apps on both (build + sideload, or TestFlight if beta route chosen)
- [ ] Verify handoff: voice memo on iPhone → GABRIEL inbox on Mac within 10s

### Phase D — Creative Core (Layer 3)

- [ ] Logic Pro (Mac) — install + configure VoiceOver / reduced-motion prefs
- [ ] Logic Pro (iPad) — install + test touch workflow
- [ ] Final Cut Pro (Mac) — install + set Voice Isolation default
- [ ] Final Cut Pro (iPad) — install
- [ ] AI branding tool — pick ONE from CREATIVE_ECOSYSTEM.md rubric; sign up; test voice-input workflow

### Phase E — Orchestration (Layer 4)

- [ ] n8n self-hosted in Docker — `docker compose -f ops/docker-compose.n8n.yml up -d`
- [ ] n8n behind Access (CNAME `n8n.noizy.ai` → tunnel)
- [ ] Configure env vars (no secrets in workflow JSON)
- [ ] GABRIEL daemon (Phase 2 build) — port 9777, behind Access
- [ ] Build the first n8n workflow: `WF_01_BRANDING_PIPELINE` (per CREATIVE_ECOSYSTEM.md § n8n)
- [ ] Heaven redeploy (fixes the 522) — `cd /Users/m2ultra/Desktop/CLAUDE\ TODAY/10_INFRASTRUCTURE/cloudflare-workers/heaven && npx wrangler deploy`
- [ ] Governance dashboard — Notion DB + Heaven `/api/v1/ledger` embed

### Phase F — DreamChamber Rituals (Layer 5)

- [ ] Define "open composition mode" command chain end-to-end
- [ ] Test: voice → GABRIEL → Logic → audio profile → capture arm → notes → n8n → receipt
- [ ] Define "start narration" command chain
- [ ] Define "kill switch {token}" chain (override path)
- [ ] Document each in Notion "Accessibility Playbook" DB
- [ ] Rehearse each at full speed under real creator conditions (tired, distracted, mid-session)

## Hostname plan (CF Access application list)

| Hostname             | Worker / Origin                                 | Access policy                                          | Notes                    |
| -------------------- | ----------------------------------------------- | ------------------------------------------------------ | ------------------------ |
| `noizy.ai`           | noizy-landing Worker                            | public                                                 | landing page, no Access  |
| `heaven.noizy.ai`    | heaven Worker                                   | split: public for read endpoints, Access for `/admin*` | new Custom Domain        |
| `mcp.noizy.ai`       | noizy-mcp Worker                                | behind Access (bearer token too)                       | MCP protocol endpoint    |
| `metabeast.noizy.ai` | Pages project                                   | behind Access                                          | operator UI              |
| `api.noizy.ai/*`     | multiple Worker routes                          | public + X-NOIZY-Key header                            | business APIs            |
| `n8n.noizy.ai`       | Tunnel → GOD:5678                               | behind Access + WARP                                   | n8n editor               |
| `gabriel.noizy.ai`   | Tunnel → GOD:9777                               | behind Access + WARP                                   | GABRIEL daemon           |
| `audit.noizy.ai`     | Tunnel → GOD → Heaven `/api/v1/ledger` OR Pages | behind Access                                          | governance console       |
| `dream.noizy.ai`     | landing/dreamchamber Worker                     | public                                                 | public creative showcase |

## Verification commands (per phase completion)

```bash
# Phase A: tunnel up?
launchctl list | grep com.cloudflare.cloudflared
dig +short CNAME gabriel.noizy.ai   # expect <tunnel-id>.cfargotunnel.com

# Phase A: Access gating?
curl -sI https://gabriel.noizy.ai/   # expect 302 to cloudflareaccess.com login

# Phase B: Voice Control vocabulary installed?
defaults read com.apple.speech.recognition.AppleSpeechRecognition.prefs

# Phase C: iPad Eye Tracking calibrated?
# (manual: iPad → Settings → Accessibility → Eye Tracking → Calibrate)

# Phase D: Logic opens via Voice Control?
# Say: "open composition mode" → observe Logic launch + template load

# Phase E: n8n behind Access?
curl -sI https://n8n.noizy.ai/    # expect 302 to access login
curl -sI -H "cf-access-token: <dev-token>" https://n8n.noizy.ai/rest/login   # expect 200

# Phase E: Heaven redeployed?
curl -s https://heaven.rsp-5f3.workers.dev/health | jq .status   # expect "LIVE"
curl -sI https://heaven.noizy.ai/  # expect 200 after custom domain bind

# Phase F: ritual works end-to-end?
# Say: "open composition mode" → measure time from utterance to capture-ready
# Target: < 30 seconds from utterance to ready state
```

## Drift alerts (what GABRIEL should warn on)

- Any new public hostname created without explicit "public" classification in this table → flag
- Any Access policy with "Bypass" rule → flag (CF docs explicitly caution against this)
- Any Worker that embeds a secret in wrangler.toml/jsonc → flag (Safety Contract Rule A/F)
- Any n8n workflow referencing a secret string directly instead of `$env.*` → flag
- Any new GABRIEL command without both a Voice Control phrase AND a Switch Control binding → flag
- Any install step that reorders phases (e.g. launching Layer 3 before Layer 0) → BLOCK

---

**Next update trigger**: when any of (a) CF Zero Trust Phase A completes, (b) an AI branding tool is picked from the rubric, (c) Heaven is redeployed and moves to `heaven.noizy.ai` custom domain, (d) RSP_001 changes a phase order or adds a new hostname.
