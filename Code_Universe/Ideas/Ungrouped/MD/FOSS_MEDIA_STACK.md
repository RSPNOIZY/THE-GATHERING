# NOIZY — Completely FOSS Creative Media Stack
**macOS / Apple Silicon (M2 Ultra) · verified June 2026**

"FOSS" here means a real open-source license (GPL/LGPL/MIT/BSD/Apache/MPL/AGPL) —
not merely "free to use." Where a project's *source* is FOSS but its official
*binary* ships under a different EULA, that's flagged.

---

## TOP 5 — if you install nothing else
1. **Blender** (GPL-2.0+) — 3D, rigging, animation, compositor + video editor. Native Apple Silicon. The pipeline anchor.
2. **FFmpeg** (LGPL/GPL) — universal transcode/glue engine everything leans on.
3. **Ardour** (GPL-2.0+) — production-grade multitrack DAW (pair with Surge XT + LSP plugins).
4. **Kdenlive** (GPL-3.0) — mature non-linear video editor. Apple Silicon native.
5. **OBS Studio** (GPL-2.0+) — screen capture + live streaming in one. Native ARM.

---

## ANIMATION
- **2D vector / cutout** — **Synfig Studio** (GPL-3.0). Tweening + bone rigging. macOS via Rosetta.
- **Pixel / sprite** — **LibreSprite** (GPL-2.0). The license-clean fork of Aseprite. (Aseprite binary is paid + source-available, *not* FOSS.)
- **Hand-drawn frames** — **Pencil2D** (GPL-2.0+). Simplest cel-style frame-by-frame. Runs on Apple Silicon.
- **Traditional cel & tweening** — **Tahoma2D** (BSD) — pick this over **OpenToonz** (same Ghibli-lineage engine, far more active). macOS via Rosetta.
- **3D (model/rig/animate)** — **Blender** (GPL). Native Apple Silicon; Rigify auto-rig in-box.
- **Motion graphics** — **Blender Geometry Nodes** + **Natron** (GPL-2.0+) for After-Effects-style node motion.

## AUDIO
- **DAW (production)** — **Ardour** (GPL). The only true production-grade FOSS DAW. (Project's binary asks pay-what-you-want; build from source is free.)
- **Beat/loop electronic** — **LMMS** (GPL). Best for beatmaking / MIDI.
- **Waveform editor** — **Audacity** (GPL), or **Tenacity** (GPL fork) if you want zero telemetry.
- **Mastering / loudness** — **Ardour + LSP plugins + x42/dpMeter** (GPL/LGPL) for EBU R128 / streaming LUFS.
- **Synthesis / sound design** — **SuperCollider** (GPL-3.0) + **Sonic Pi** (MIT, live coding) + **Csound** (LGPL).
- **FOSS synth plugins** — **Surge XT** (GPL-3.0, top pick), **Vitalium** (GPL rebuild of Vital — use this, *not* the proprietary Vital binary), **Dexed** (DX7/FM), **Cardinal** (VCV Rack as a plugin).
- **Notation** — **MuseScore Studio 4** (GPL-3.0). Native Apple Silicon.
- **Open plugin standard** — **LV2** + bundles: **LSP**, **x42**, **Zam**, **DISTRHO/DPF** (CLAP/VST3/LV2).

## VIDEO
- **Editor (NLE)** — **Kdenlive** (GPL-3.0, most mature). Lighter alt: **Shotcut** (GPL).
- **Compositing / VFX / tracking** — **Natron** (GPL-2.0+) node compositor w/ tracking; or Blender's compositor+tracker (more actively maintained — verify a current Natron macOS build before depending on it).
- **Color grading** — no dedicated FOSS app. Use Kdenlive/Blender color tools + **OpenColorIO** (BSD-3). ⚠️ DaVinci Resolve is free but **proprietary, not FOSS**.
- **Screen capture + streaming** — **OBS Studio** (GPL-2.0+). Native Apple Silicon.
- **Encoding / transcoding** — **FFmpeg** (engine) + **HandBrake** (GPL-2.0, GUI).
- **Subtitles** — **Aegisub** (BSD-style; use the TypesettingTools fork) for ASS/SSA; **Subtitle Edit** (GPL) for heavy SRT/OCR (Windows-first).

## GLUE / UTILITIES
- **FFmpeg** (LGPL/GPL) — the central pipe between every tool.
- **ImageMagick** (Apache-style) — batch image conversion/compositing.
- **OpenColorIO** (BSD-3) + **OpenImageIO** (Apache/BSD) — color + image I/O shared by Blender/Natron.
- **LosslessCut** (GPL-2.0) — instant lossless trim/merge on FFmpeg. Apple Silicon.
- **MLT Framework** (LGPL/GPL) — engine under Kdenlive/Shotcut; scripted/headless render.
- **Olive** (GPL-3.0) — node-based NLE; promising but pre-1.0 — watch, don't depend yet.

---

## ⚠️ FREE BUT NOT FOSS — avoid under an all-FOSS rule
- **DaVinci Resolve** — proprietary freeware → use OCIO-based grading instead.
- **Vital** (official binary) — proprietary EULA despite GPL source → use **Vitalium**.
- **Aseprite** — paid binary, source-available (not open-licensed) → use **LibreSprite**.
- **HitFilm / CapCut / Canva / Adobe Express**, **Cakewalk / Studio One Prime / Tracktion Free** — all proprietary.

---

## The two repos you sent (both Apache-2.0, both AI-agent tooling — neither is a media app)
- **revfactory/harness** — a Claude Code plugin that generates multi-agent "teams" (`.claude/agents/` + skills) from six orchestration patterns (Pipeline, Fan-out, Expert Pool, Producer-Reviewer, Supervisor, Hierarchical). **Use:** scaffold the *agents that drive* your media pipeline (it even ships webtoon/YouTube example harnesses). Not a creative tool itself.
- **pbakaus/impeccable** — a frontend-design skill + CLI (23 `/impeccable` commands, anti-"AI-slop" lint rules) by Paul Bakaus. **Use:** polish your NOIZY web portals/dashboards. Adjacent to media, not part of the production chain.

---

## Apple Silicon note
Almost everything here is ARM-native. The one soft spot: the cel-animation tools
(**Tahoma2D / OpenToonz**) still run under **Rosetta** — fine on an M2 Ultra, just
not native yet.
