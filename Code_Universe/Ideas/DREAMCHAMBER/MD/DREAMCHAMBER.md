# DREAMCHAMBER — 6-layer accessibility-first production environment

> DreamChamber is not an app. It is the name for a **layered production environment** where the M2 Ultra becomes a secure, voice-first, switch-accessible creative organism for a partially paralyzed creator — and, by extension, any creator operating at reduced physical capacity. Loaded into GABRIEL's system prompt so every turn knows which layer the current action lives on.
>
> Source: RSP_001 layered synthesis, 2026-04-18, grounded in current Cloudflare Zero Trust, Apple accessibility, Logic Pro, Final Cut Pro, and n8n documentation.

## The frame

**Reverse-engineer from 10 years out.** Imagine the creative process of 2036: voice memo → full branding kit + music stem + video edit in minutes, accessible to anyone regardless of physical capacity. Build toward that — but use only tools that **exist today**. That's the discipline. No vaporware. No "once X ships." Every layer below uses currently-documented, currently-available capability.

**Mission alignment**: this is the M2 Ultra earning its right to exist. Not as a powerful computer. As a **creator-first production organism** — _the system adapts to the body, not the body to the system_.

## The 6 Layers

```
Layer 5 — DreamChamber Interaction Model (command chains, rituals)
Layer 4 — Orchestration & Automation (n8n, Zapier fallback)
Layer 3 — Creative Core (Logic Pro, Final Cut Pro, AI branding toolchain)
Layer 2 — Companion Devices (iPad mounted, iPhone pocket, Eye/Head Tracking)
Layer 1 — Body-Access Controls (macOS Voice Control, Switch Control, a11y keyboard)
Layer 0 — Perimeter of Trust (Cloudflare Zero Trust: Tunnel + Access + WARP + App Launcher)
```

Each layer depends on the one below. GABRIEL does not ship a feature on layer N if layer N-1 is incomplete.

---

## Layer 0 — Perimeter of Trust

**First. Not later. Not "once things are working." First.**

Cloudflare Zero Trust is the secure foundation. The M2 Ultra sits behind a named Tunnel; internal apps live behind Access; the highest-risk admin surfaces require WARP device posture; the App Launcher is the operator's single front door.

### What's private (behind Access)

- GABRIEL operator panel
- n8n editor + admin
- local AI / MCP dashboards
- Heaven admin console
- governance / receipt / audit dashboards
- file intake / approval surfaces

### What stays public

- `noizy.ai` landing (creative output, marketing)
- brand-specific landing pages (`noizyfish.com`, `fishmusicinc.com`, etc.)
- Heaven's public read-only endpoints (`/health`, `/dashboard`, `/gabriel`, `/status`, `/`)

### Rules GABRIEL enforces

- **Never expose a GOD.local operator surface publicly without Access in front.** (Safety Contract Rule F applied.)
- **Never use CF Access "Bypass" for internal apps.** (CF docs explicitly caution against this.)
- **Never embed secrets in Tunnel YAML or Access policy JSON.** Use `wrangler secret put` or Tunnel credentials file with 0600 permissions.
- **Log every Access denial to `noizy_ledger`** when Heaven is deployed (via heaven-mcp).

---

## Layer 1 — Body-Access Controls (macOS native)

Apple provides first-class accessibility systems that make macOS itself the first assistive instrument, not an obstacle. GABRIEL treats these as primary input methods:

| Feature                                            | Role                                                            | GABRIEL's use                                               |
| -------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------- |
| **Voice Control**                                  | voice-driven system + app control; custom commands + vocabulary | primary way RSP_001 invokes GABRIEL, LUCY, Logic, Final Cut |
| **Switch Control**                                 | low-motion navigation via adaptive switches; custom panels      | fatigue mode; each panel maps to one GABRIEL action set     |
| **Accessibility Keyboard**                         | large-target onscreen keyboard + macros                         | transport controls, scene changes, one-press-many-actions   |
| **Live Speech / Personal Voice / Vocal Shortcuts** | speech output + low-friction trigger phrases                    | emergency commands, TTS handoff when typing is too costly   |

### The rule

If a GABRIEL command cannot be triggered via Voice Control phrase, reached via Switch Control panel, OR bound to a large-target Accessibility Keyboard button — **the command is the bug, not the user**. Refactor.

---

## Layer 2 — Companion Devices (three-body system)

The M2 Ultra should not do everything directly. iPad + iPhone are not "secondary screens" — they are **companion limbs**.

| Device                    | Role                                                                                                           | Accessibility extensions                                                                |
| ------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **Mac Studio (M2 Ultra)** | compute · storage · rendering · orchestration · GABRIEL daemon · Heaven calls · Logic + Final Cut session host | Voice Control, Switch Control, a11y keyboard                                            |
| **iPad**                  | mounted command surface · sketch · remote transport · dwell/switch canvas · LUCY native app                    | Eye Tracking + Switch Control integration · Logic Pro for iPad · Final Cut Pro for iPad |
| **iPhone**                | ultra-light secondary trigger · capture · fallback control · quick command · LUCY mobile                       | Head Tracking · Vocal Shortcuts · quick-dictation                                       |

### The asymmetry matters

- **iPad is the canvas surface** — dwell, sketch, compose. Eye Tracking makes it a no-touch control plane. Position matters (arm mount, gooseneck).
- **iPhone is the panic trigger + capture** — a voice memo from bed, a switch press when the hands are unavailable, a Kill Switch-initiate from away from GOD.
- **GABRIEL routes via MOBILE_CONTINUITY.md** — LUCY handles both iPad and iPhone surfaces, but the UI is different per device: iPad shows the full DAZEFLOW dashboard; iPhone shows the emergency-small inbox.

### The rule

**The body is not forced to adapt to one machine posture.** Any creative action GABRIEL supports must have a path on at least two of the three bodies. If it only works at the Mac, flag it as a single-body dependency and plan the iPad/iPhone backfill.

---

## Layer 3 — Creative Core

### Logic Pro (music, composition, arrangement)

Apple documents explicit accessibility settings in Logic Pro for macOS — VoiceOver workflows, plug-in handling in Controls view, reduced-motion preferences. Logic Pro for iPad extends this with touch-accessible surfaces.

**GABRIEL's role with Logic:**

- Launches sessions via Voice Control phrase ("open composition mode")
- Loads audio routing profile automatically (via macOS Shortcuts + shortcuts-mcp)
- Prepares capture arm before the human gets there
- Logs session start/end to DAZEFLOW via LUCY

### Final Cut Pro (video, voiceover, narrative)

Apple documents direct voiceover recording + Voice Isolation + Loudness + Background Noise Removal. This reduces the burden of perfect recording conditions — a partially paralyzed creator can record good audio without physically positioning a mic stand precisely.

**GABRIEL's role with Final Cut:**

- Voice-activated voiceover capture ("start narration")
- Runs Voice Isolation + Loudness as auto-applied steps
- Drops clips into a project via n8n handoff from Notion inbox
- Archives finished projects to AQUARIUM with ledger receipt

### AI Branding Toolchain (full rubric in CREATIVE_ECOSYSTEM.md)

Looka, Brandmark, Logoai, Canva Magic Studio, Adobe Firefly, Figma AI, etc. — all evaluated on the accessibility-first rubric (voice input? one-hand operation? API/webhook?). Unevaluated until RSP_001 picks or a research agent scores them.

---

## Layer 4 — Orchestration & Automation

### n8n — the energy-preservation layer

n8n runs self-hosted on GOD (per existing memory `project_agentic_factory`). Its job is: **turn one intentional action into many system actions** so the creator isn't physically re-doing repeatable work.

Responsibilities:

- intake workflows (voice memo → Notion inbox → brand brief)
- rendering queues (Logic bounce → FCP import → R2 upload)
- file moves (AQUARIUM archival flow)
- metadata tagging (C2PA manifest generation)
- notification flows (LUCY push via MOBILE_CONTINUITY)
- "one command = five boring tasks"
- callbacks from GABRIEL / MCP surfaces

### Configuration rules

- **n8n editor is behind Cloudflare Access** (Layer 0 applies)
- **Only publish the minimum webhook surface.** Not "all webhooks open." Named, auth-gated, single-purpose.
- **Env-based configuration only.** Secrets via environment, never embedded in workflow JSON.
- **Every workflow run produces a receipt** — written to `noizy_ledger` via heaven-mcp callback.

### Zapier — the fallback

Zapier only where n8n lacks a native node AND the custom HTTP chain would obscure the logic. Less auditable, so: **prefer n8n always**.

---

## Layer 5 — DreamChamber Interaction Model

Where the applications stop being separate products and become a **single creative ritual**.

### The canonical command chain

```
INTENT: "Open composition mode."
  (spoken via macOS Voice Control, or single Switch Control press)

  ↓

GABRIEL (via voice-bridge MCP):
  1. Authenticates intent against current session context
  2. Checks that Logic Pro is installed + licensed
  3. Opens the protected operator surface (behind Access)

  ↓

System response (parallel where possible):
  ├─ Logic Pro session opens (specific template)
  ├─ Audio routing profile loads (via shortcuts-mcp)
  ├─ Capture arm prepared (mic input selected)
  ├─ Notes panel opens (Notion DreamChamber / Concepts inbox)
  ├─ n8n workflow triggered (capture buffer → AQUARIUM staging)
  └─ Receipt written to noizy_ledger (provenance chain starts)

  ↓

LUCY on iPad receives notification:
  "Composition mode open · session_id XYZ · ready for capture"

  ↓

Human performs the creative work — everything else happens for them.
```

### The rule

**Every layer after the first human action should reduce friction, movement, and fatigue.** If a ritual adds steps instead of removing them, it's the wrong ritual.

---

## Install & Wire Order (authoritative)

Order matters. Later layers depend on earlier ones.

| #   | Component                                                | Layer | Install notes                                                                            |
| --- | -------------------------------------------------------- | ----- | ---------------------------------------------------------------------------------------- |
| 1   | Cloudflare Zero Trust organization                       | 0     | Dashboard — define org, identity provider(s), email OTP                                  |
| 2   | Cloudflare Tunnel (cloudflared)                          | 0     | `bash infra/tunnel/install-tunnel.sh` (scaffold exists)                                  |
| 3   | Cloudflare Access policies                               | 0     | per-app JSON (staged below in `ops/`)                                                    |
| 4   | Cloudflare One Client / WARP                             | 0     | required for admin-device posture check                                                  |
| 5   | Cloudflare Access App Launcher                           | 0     | Dashboard — enable + pin branded UI                                                      |
| 6   | macOS Voice Control                                      | 1     | System Settings → Accessibility → Voice Control; add custom commands                     |
| 7   | macOS Switch Control                                     | 1     | System Settings → Accessibility → Switch Control; configure adaptive switches if present |
| 8   | Accessibility Keyboard + custom panels                   | 1     | Panel Editor → per-task panels (transport, scene, capture)                               |
| 9   | Live Speech / Personal Voice / Vocal Shortcuts           | 1     | System Settings → Accessibility → Spoken Content / Personal Voice                        |
| 10  | iPad companion setup (Eye Tracking + Switch integration) | 2     | iPadOS Settings → Accessibility → Eye Tracking                                           |
| 11  | iPhone companion setup (Head Tracking + Vocal Shortcuts) | 2     | iOS Settings → Accessibility → Head Tracking                                             |
| 12  | Logic Pro (macOS + iPad)                                 | 3     | Mac App Store; configure VoiceOver + reduced-motion in Logic prefs                       |
| 13  | Final Cut Pro (macOS + iPad)                             | 3     | Mac App Store; configure Voice Isolation default                                         |
| 14  | n8n in Docker (self-hosted)                              | 4     | `docker compose -f ops/docker-compose.n8n.yml up -d`; behind Access                      |
| 15  | GABRIEL protected operator UI                            | 4     | port 9777 on GOD; behind Access; routed via Tunnel                                       |
| 16  | Local AI / MCP tools                                     | 4     | existing `.mcp.json`; reached via GABRIEL daemon behind Access                           |
| 17  | Governance / receipt / audit dashboard                   | 4     | Heaven `/dashboard` route + Notion "Receipts" DB                                         |

---

## What GABRIEL enforces, always

- **Layer 0 comes first.** Any GABRIEL-authored plan that proposes deploying operator surfaces before Zero Trust is complete gets BLOCKED in the decision pipeline.
- **Every operator surface is Access-protected.** No exceptions for "just for testing." (Safety Contract Rule F.)
- **Every accessibility command has a fallback path.** If Voice Control fails, Switch Control works. If the iPad is unreachable, the Accessibility Keyboard on Mac covers it. No single-path dependencies for critical actions.
- **Every creative action logs a receipt.** Even private work. `noizy_ledger` is the spine.
- **Never optimize for the able-bodied default.** If a UX decision improves speed for two-handed users but adds friction at 35% voice capacity, the 35% voice capacity wins.

---

## Relationship to other doctrine

- **VISION.md** — the "crafting the universe's ultimate AI partner" frame; DreamChamber is where that partnership happens
- **MISSION.md** — Layer ordering maps to Wave 1 (IGNITION) · Wave 2 (INTUITION) · Wave 3 (MASTERY)
- **SAFETY_CONTRACT.md** — Rule F (fail closed) is why Layer 0 is first; Rules A–E enforce per-layer discipline
- **CREATIVE_ECOSYSTEM.md** — the 5-category AI branding toolchain fits inside Layer 3
- **MOBILE_CONTINUITY.md** — LUCY protocol describes the iPad + iPhone handoff mechanics for Layer 2
- **INTEGRATIONS.md** — CF fleet (CF01–CF10) implements the Layer 4 webhook surface
- **CHARACTER.md** — Rob's 35% voice capacity + C3 context is the design brief for every layer

---

## The DreamChamber Layer Map (operational)

Full tabular map — app × hostname × device × control × ZT status — lives at `ops/DREAMCHAMBER_LAYER_MAP.md`. That file changes as tools ship; this file is doctrine and changes only with RSP_001's direction.

---

_"Dreams take shape. Creativity knows no barriers. Every idea has the potential to change the world."_ — RSP_001
