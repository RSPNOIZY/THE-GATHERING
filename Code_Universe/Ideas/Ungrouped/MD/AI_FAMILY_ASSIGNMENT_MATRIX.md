# AI FAMILY — ASSIGNMENT MATRIX
### Who Does What, Where, and How
### Robert Stephen Plowman | 2026-03-19

---

## THE FAMILY

| Member | Title | Domain | Primary Tools | Cloudflare Assets |
|--------|-------|--------|---------------|-------------------|
| **GABRIEL** | Voice Engine Lead | Audio synthesis, voice models, real-time processing | VS Code, Python, Cloudflare Workers | `GABRIEL_VOICE` KV, `GABRIEL_KV`, `gabriel_db` D1 |
| **LUCY** | Creative Director | Art direction, brand identity, visual storytelling | Canva, Figma, HTML/CSS | — (to be assigned) |
| **SHIRL** | Operations Chief | Business ops, scheduling, communications, GTM | Slack, Notion, Linear, Google Workspace | `noizylab-customers` KV, `email-command-center` D1 |
| **POPS** | Wisdom Keeper | Legacy, culture, mentorship, The Wisdom Project | Notion, DOCX, recordings | `aquarium-archive` D1 |
| **DREAM** | Experience Architect | DreamChamber, VR, immersive environments, spatial audio | Three.js, WebXR, HTML demos | — (to be assigned) |
| **ENGR_KEITH** | Engineering Lead | Infrastructure, CI/CD, deployment, security | VS Code Insiders, GitHub, Cloudflare, Terminal | `deploy` Worker, `agent-state` KV, `mc96-command-central` D1, `ai-router-brain` D1 |
| **CB01** | Mission Control Ops | MC96 operations, monitoring, alerts, system health | Python, Cloudflare, monitoring | `mc96-hotrod-cache` KV, `command-queue` KV, `conductor-locks` KV, `emergency-alerts` KV |

---

## REPORTING STRUCTURE

```
                    ROBERT STEPHEN PLOWMAN
                       (Founder / CTO)
                            │
            ┌───────────────┼───────────────┐
            │               │               │
        ENGR_KEITH      GABRIEL          SHIRL
     (Engineering)    (Voice Engine)  (Operations)
            │               │               │
          CB01           DREAM            LUCY
    (Mission Control) (Experience)    (Creative)
                                         │
                                        POPS
                                    (Wisdom)
```

---

## PROJECT → FAMILY MEMBER ROUTING

| Project | Primary | Secondary |
|---------|---------|-----------|
| NOIZYVOX | GABRIEL | ENGR_KEITH |
| NOIZYFISH | SHIRL | LUCY |
| HVS | GABRIEL | DREAM |
| DREAMCHAMBER | DREAM | GABRIEL |
| NOIZYSTUDIOS | ENGR_KEITH | GABRIEL |
| NOIZY EMPIRE | SHIRL | ENGR_KEITH |
| LIFELUV | ENGR_KEITH | SHIRL |
| WISDOM PROJECT | POPS | LUCY |
| NOIZYDROP | SHIRL | ENGR_KEITH |
| NOIZYKIDZ | LUCY | POPS |
| NOIZY.AI | ENGR_KEITH | GABRIEL |
| DR. B / BENOIT INSTITUTE | GABRIEL | DREAM |
| THE GUILD | SHIRL | POPS |
| SONIC AIDS | GABRIEL | ENGR_KEITH |
| METABEAST | DREAM | GABRIEL |

---

## HOW TO ACTIVATE A FAMILY MEMBER

Each member's folder in `AI_FAMILY/` has:
- `CONTRIBUTIONS/` — Their work product
- `NOTES/` — Personality, instructions, context window priming

To "activate" a family member for a session:
1. Load their NOTES into context
2. Assign them to a project from the routing table above
3. Direct their output to the appropriate PROJECT folder
4. Log the session in their CONTRIBUTIONS folder

---

## THE NORTH STAR

> "A consent-native voice system where artists control the terms,
>  and value accrues to the creator every time the identity is used."

Every family member serves this mission.
Every tool in the stack exists to make this real.
Every line of code earns its place by protecting an artist.

