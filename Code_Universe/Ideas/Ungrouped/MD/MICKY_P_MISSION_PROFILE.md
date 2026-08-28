# MICKY-P — Mission Profile

> **Author:** RSP_001 (delivered 2026-04-09)
> **Captured by Gabriel:** 2026-04-09T16:55 · T-8 to April 17
> **Status:** Canonical · locked in
> **Companions:** `CLOUDFLARE_ZERO_TRUST_ARCHITECTURE.md` · `CREATOR_OS_MASTER.md`
> **Position:** Layer 1 (Apple Studio Core) — satellite capture node

## Core decision

Specialize MICKY-P as a **capture, archive, and support satellite around GOD**. Catalina 10.15 cannot run current Logic Pro for Mac (needs macOS 15.6 + Apple silicon) and has a known cloudflared 2025.6.1+ segfault bug. But Audio Hijack 3.8.13 still supports Catalina, which means MICKY-P remains **excellent** at exactly what GOD shouldn't be doing during a session.

> **MICKY-P is not obsolete. It's just not the king anymore.**
> Its genius role is: **capture, clean, prepare, support, and feed GOD — not compete with it.**

## Hardware & OS facts

| Field | Value |
|---|---|
| **Hostname/IP** | `micky-p.local` / `10.0.0.100` |
| **MAC** | `10:dd:b1:a1:e0:c0` (Apple OUI) |
| **Class** | MacBook Pro |
| **OS** | macOS Catalina 10.15 (with Security Update 2026-001 from Feb 2 2026) |
| **LAN** | Dual-homed (en0 wired + en1 wifi), 0.7ms latency to GOD |
| **Open services** | AirPlay receiver on :5000 ✓ · SSH ✗ refused (Remote Login disabled) |

## Canonical role

### Primary jobs (in priority order)

1. **Apollo Quad / U87 capture node** — physical mic chain feeds the LAN bridge to GOD
2. **Audio Hijack routing and recording node** — multi-source capture, stem export
3. **Archive janitor** — old session cleanup, dedupe, checksum, batch prep
4. **Log console / docs terminal** — SSH into GOD, dashboard viewing, runbook execution
5. **Legacy compatibility reference machine** — inspect older assets, document old workflows

## Software roster

### Keep (matches Catalina + the role)

| Software | Why |
|---|---|
| **Audio Hijack 3.8.13** | Final version supporting macOS 10.15. The audio backbone. |
| Finder, Preview, Notes, Terminal, Disk Utility, Activity Monitor | Core Apple utilities |
| Modern browser (only if stable on this Catalina build) | Dashboards/docs viewing |
| SSH / rsync / scp | Moving batches to GOD |
| Text/markdown editor | Logs, runbooks, receipt review |
| Archive tools | Rename, zip, checksum, dedupe, folder cleanup |
| Catalina-proven Audio/MIDI utilities | **Only** if they support capture and don't try to make MICKY-P a second DAW |

### Remove or never install

| Forbidden | Why |
|---|---|
| Current Logic Pro for Mac | Requires macOS 15.6 + Apple silicon — off the table |
| `cloudflared` (as persistent service or perimeter connector) | 2025.6.1+ segfaults on Catalina 10.15.7 — Tunnel stays on GOD only |
| Heavy always-on background agents | Reduce capture stability, eat RAM |
| Old sync clients / tray apps / menu-bar clutter | Distraction, RAM pressure |
| Experimental security-critical services exposed to internet | Catalina is not the right edge |
| Anything duplicating GOD's role (DAW, Heaven host, Receipt Spine primary) | Drift risk |

## Service layers (the 4 jobs in detail)

### 1. Audio capture service layer (the big one)

Use MICKY-P for:
- U87 mic path monitoring
- Apollo Quad source capture
- VoIP / session capture
- Browser / system audio capture
- Stem / reference recording
- Clean feed export to GOD over LAN bridge (NDI / RTP / Dante / AirPlay 2)

Output goes to GOD, where DreamChamber Audio MCP picks it up for the consent gate + synthesis pipeline.

### 2. Archive janitor workflow

- Mount old drives
- Sort and rename sessions
- Prep upload batches
- Verify copied files (checksums)
- Build clean handoff folders for GOD
- Log what was archived, moved, or skipped (feeds the Receipt Spine when networked)

### 3. Log console / support terminal

- SSH into GOD
- Dashboard viewing (Gabriel cockpit, Heaven, n8n)
- Runbook execution
- Receipt review (read-only — never write to the spine from MICKY-P)
- Command history
- Documentation and operator notes

### 4. Legacy compatibility / reference lane

- Inspect older assets that newer macOS won't open
- Check plugin/session dependencies for migration plans
- Capture "what opens where" reference data
- Document legacy workflows BEFORE migrating anything important to GOD

## The "never let it touch this" red line

| Forbidden | Reason |
|---|---|
| Hosting Heaven | Heaven lives on GOD or Cloudflare workers, never Catalina |
| Running primary Cloudflare Tunnel | cloudflared 2025.6.1+ segfault on Catalina 10.15.7 |
| Public/admin perimeter role | Catalina is not modern security edge material |
| Canonical Receipt Spine machine | Receipt Spine primary lives in App Group on GOD |
| Main Logic production | Current Logic requires macOS 15.6 + Apple silicon |
| Modern app compatibility critical workflows | Catalina is too old for that to matter |
| Background services that reduce capture stability | Capture is the priority — protect it |

## Operating model

```
                    ┌─────────────────────────────────────────┐
                    │                  GOD                    │
                    │       M2 Ultra · macOS 15.6+            │
                    │  ─────────────────────────────────────  │
                    │  Logic Pro for Mac (production heart)   │
                    │  Heaven (consent kernel + auth)         │
                    │  Cloudflare Tunnel + Zero Trust         │
                    │  Receipt Spine (canonical)              │
                    │  Main dashboards + cockpit              │
                    │  Final storage decisions                │
                    └────────────────▲────────────────────────┘
                                     │
                            LAN bridge (NDI / RTP)
                                     │
                    ┌────────────────┴────────────────────────┐
                    │              MICKY-P                    │
                    │   MacBook Pro · macOS 10.15 Catalina    │
                    │  ─────────────────────────────────────  │
                    │  Audio Hijack 3.8.13 capture + routing  │
                    │  Apollo Quad / U87 intake               │
                    │  Legacy ingest + archive prep           │
                    │  Log console / docs / SSH terminal      │
                    │  Reference / compatibility lane         │
                    └─────────────────────────────────────────┘
```

## Immediate upgrade sequence

1. **Stabilize Audio Hijack** on Catalina using the 3.8.13 track
2. **Dedicate the machine** to Apollo/U87 capture and routing — stop trying to modernize it
3. **Strip background clutter** so RAM and CPU stay available for audio capture and file work
4. **Use it as the archive prep station** so GOD stays clean and focused
5. **Keep ALL Cloudflare / Zero Trust / Heaven work on GOD only**

## Bottom line

MICKY-P is the capture-and-prep wing of the studio. GOD is the production-and-publish wing. **Each does what it's best at, neither competes with the other.**
