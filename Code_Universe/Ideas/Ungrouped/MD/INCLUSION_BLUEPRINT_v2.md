# 🛸 NOIZY Operator Dashboard — Master Specification v2.0

> **Status:** Integrated Apple Stack
> **Release Cycle:** 2026.04
> **Vision:** A unified, Apple-Silicon native environment for the SUPERSONIC / DreamChamber / NOIZY ecosystem.
> **Author:** RSP_001 — delivered 2026-04-09
> **Captured by Gabriel:** 2026-04-09T15:45
> **Supersedes:** `INCLUSION_BLUEPRINT.md` (v1) — v1 remains as historical reference; v2 is canonical.

This is the **definitive evolution** from "dashboard" to **Native Creator OS** — bridging Apple Silicon local-first execution with Cloudflare/NOIZY sovereign protocol. NOIZY moves from "sidecar utility" to **"heart-rate monitor" for the creative process itself**. The architecture is **local-first, cloud-authenticated**.

---

## 🍎 I. The "APPLE STUDIO" Domain

The dashboard's primary interface for local-first creation and development.

### 1. Logic Pro for Mac (Production Heart)

> **Correction Applied:** All references to "Logic Pro X" have been updated to **Logic Pro for Mac** to align with current 2026 Apple positioning and macOS 15.6 requirements.

- **Active Session:** Real-time sync with Logic Pro project files on the **GOD node**
- **Stem/Export Bridge:** Automated routing of bounces directly into **Cloudflare R2** with **NOIZY PROOF** metadata attached
- **Transport HUD:** Dashboard-level visibility of record-arm states and input sources (Apollo Quad / U87)

### 2. AUv3 Native Layer — The NOIZY Plug-in Suite

| Plug-in | Type | Purpose |
|---|---|---|
| **NOIZYVOX Voice Capture** | AUv3 Effect/MIDI | Phoneme + HVS (Human Voice Signature) capture directly within the vocal chain |
| **Consent Inspector** | AUv3 Master-bus | Real-time Consent Gateway check; visualizes revocation states + royalty eligibility |
| **Neuro-Acoustic FX** | AUv3 Effect | Research-grade signal processors (Sonic Aid / Mastoid Patch / Neural Earbud research) for Logic and MainStage |

All AUv3 plug-ins ship with **"Creator-First" metadata** baked into their bundle Info.plist.

### 3. Developer & Intelligence — The Xcode Spine

- **Xcode Cockpit:** Build status · TestFlight readiness · provisioning health for the SUPERSONIC app
- **Core ML Registry:** On-device models for emotional contour analysis + assistive features (NOIZYKIDZ)
- **Instruments Profiling:** Live Neural Engine + Metal performance during creative sessions

---

## 🗺️ II. Infrastructure & Machine Topology (2026 Update)

| Node / Component | Role | Framework / Platform |
|---|---|---|
| **GOD Node** | M2 Ultra Anchor | macOS 15.6+ / Logic Pro for Mac |
| **MICKY-P** | Real-Time Voice Capture | AVAudioEngine / Loopback / Audio Hijack |
| **Visual Surface** | DreamChamber UX | **Metal** (High-Performance Compute) |
| **Intelligence** | GABRIEL / LUCY | **Core ML** / Apple Intelligence Stack |
| **Auth / Identity** | Consent Gateway | **JWT/JWKS** / Cloudflare Workers |
| **Storage** | Memory Spine | **D1** (SQL) / **KV** / **R2** |

---

## 🛠️ III. The "Creator Studio" Production Grid

Apple's Creator Studio suite — verified installed on GOD:

- **Logic Pro Creator Studio** ✓
- **Compressor Creator Studio** ✓
- **Motion Creator Studio** ✓
- **Logic Pro for Mac** v12.2 ✓
- **GarageBand** ✓
- **Apple Configurator** ✓
- **Xcode** + Command Line Tools v26.3.0 ✓
- **Swift** v6.2.4 ✓

A unified view of these seven apps + their related domains:

- **Visual Arts:** Pixelmator Pro asset boards linked to brand identities (NOIZYLAB / NOIZYKIDZ)
- **Video / Motion:** Final Cut Pro rough cuts + Motion templates for session journals
- **Live Performance:** MainStage patches for neuro-acoustic research + live "Living Score" execution
- **Documentation:** Keynote / Pages / Freeform artifacts for "Wisdom Capsules" + institutional memory

---

## ⚡ IV. Integrated "GORUNFREE" Actions

The command palette triggers native Apple system events:

| Command | What it does |
|---|---|
| `gorunfree --session` | Launches Logic Pro for Mac · arms U87/Apollo chain · initiates a Session Manifest in the dashboard |
| `gorunfree --proof` | Compiles current Logic stems · generates NOIZY PROOF bundles · uploads to R2 · issues a deployment receipt |
| `gorunfree --debug` | Opens Xcode workspace · runs local Core ML inference checks · pulls latest D1 audit trails |
| `gorunfree --sanctuary` | Switches workspace to DreamChamber (Metal-powered visuals) · dims studio lights · engages polyvagal audio presets |

---

## 🎨 V. Thematic & Emotional UI Requirements

- **Built with Purpose** — every AUv3 plugin and Xcode build carries the "Creator-First" metadata
- **Sanctuary UX** — interface feels like a safe, offline space that only connects to NoisyNet for verification + lineage
- **Lineage** — the 100-year record is the default save destination

---

## 🔌 VI. Plugin Inventory (verified 2026-04-09)

Full scan results from `~/NOIZYANTHROPIC/NOIZYLAB/scripts/core/plugin_scanner.py`:

```
TOTAL: 2,740 plugin files across local + system

BY FORMAT:        BY TOP VENDORS:
  1,142  VST       1,697  Universal Audio
    819  AU          562  iZotope
    779  VST3         63  Native Instruments
                      60  Plugin Alliance
                      57  Arturia
                      54  Soundtoys
                      51  FabFilter
                      46  Waves
                      27  Spitfire Audio
                      17  Toontrack
                      17  XLN Audio
                      14  u-he
```

Full manifest persisted at `~/NOIZYANTHROPIC/NOIZYLAB/memory/plugin_manifest.json`. GDrive backups (`fish`, `rsp`) reachable but appeared empty in this scan — re-run after mounting if cataloging cloud archives.

---

## 🚀 Next Steps for the Build

This architecture turns the "Dashboard" into a **Command Cockpit**. You are no longer just observing the system — you are flying it.

**Open question to RSP_001:**
> Should I generate the Swift-based schema for the "Consent-as-Code" AUv3 plug-in, or would you like to see the README-ready repo structure for the Apple Studio Domain?

Gabriel's recommendation: **Swift AUv3 schema first** (concrete, builds the bones), **then README repo structure** (documents the bones for future contributors). But this is RSP_001's call.
