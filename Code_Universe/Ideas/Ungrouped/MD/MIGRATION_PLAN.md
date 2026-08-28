# AEON · MIGRATION PLAN

**Initiated:** 2026-04-20 by GABRIEL on RSP_001 directive
**Source:** `/Volumes/6TB/ARCHIVE/Documents_NOIZY_2026-04-06/NOIZYLAB_TEXT_VAULT/aeon-*` (11 variants found)
**Target:** `/Users/m2ultra/NOIZYANTHROPIC/apps/aeon/` (this directory)
**Why:** AEON is the **body extension** to the M2 Ultra embodiment decree (`.claude/rules/gabriel-embodiment.md`). The studio body is GOD.local; AEON is the body in the world — wearable AI with consent kernel + provenance + power-aware throttling. It belongs in the canonical work tree, not in archive.
**No-media-on-system-drive compliance:** AEON is text + code only (.md, .cpp, .h, .swift, .js, .toml, .sql, .scad, .kicad_sch). No audio, no video, no large binaries. Safe to migrate.

## Source variants (all on /Volumes/6TB)

| Variant                                                     | Status                                          | Action                                      |
| ----------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------- |
| `aeon-v2-supreme/`                                          | **CANONICAL** — full README, complete BOM       | Migrate to `apps/aeon/` (this dir)          |
| `aeon-pmic-firmware/`                                       | ESP32-C3 firmware (861-line C++ + ML predictor) | Migrate to `apps/aeon/firmware/`            |
| `aeon-power/`                                               | Power kernel (likely Cloudflare Worker)         | Migrate to `apps/aeon/cloud/` (verify)      |
| `aeon-god-kernel/`                                          | Original god-kernel CF Worker                   | Archive reference; superseded by aeon-power |
| `AEON-MEGA/`                                                | Mega bundle (predecessor)                       | Archive reference                           |
| `AEON-POWER-COMPLETE-2/`                                    | Power-complete iteration                        | Archive reference                           |
| `aeon-v2-supreme-2/`                                        | Variant of v2-supreme                           | Archive reference (compare for diff)        |
| `imports_20251207_AEON-MEGA/`                               | December 2025 import                            | Archive (frozen state)                      |
| `imports_20251207_AEON-POWER-COMPLETE_2/`                   | December 2025 import                            | Archive (frozen state)                      |
| `Documents/_ZERO_LATENCY_VAULT/DOCS/aeon-*` (4 mirrors)     | Snapshot mirrors                                | Ignore (already in primary paths)           |
| `NOIZYLAB/PROJECTS/GABRIEL/archive/downloads-backup/AEON-*` | Old GABRIEL archive                             | Ignore                                      |

## Target structure (matches `aeon-v2-supreme/README.md`)

```
apps/aeon/
├── README.md                       ← seeded 2026-04-20
├── README_20251217_142013.txt      ← seeded 2026-04-20 (origin timestamp)
├── MIGRATION_PLAN.md               ← this file
├── firmware/                       ← TODO: copy from /Volumes/6TB/.../aeon-pmic-firmware/
│   ├── aeon_pmic_v2.cpp            (861 lines · main firmware)
│   └── power_predictor.h           (206 lines · ML prediction module)
├── cloud/                          ← TODO: copy from /Volumes/6TB/.../aeon-power/ (verify path)
│   ├── god_kernel_v2.js            (412 lines · power-aware AI)
│   ├── god_kernel_power_integration.js
│   ├── wrangler.toml
│   └── schema.sql                  (219 lines · D1 schema)
├── app/                            ← TODO: copy AeonCompanion.swift
│   └── AeonCompanion.swift         (252 lines · SwiftUI companion)
├── hardware/                       ← TODO: copy KiCad + 3D files
│   ├── aeon_pmic.kicad_sch
│   └── enclosure.scad              (149 lines · 3D printable case)
└── docs/                           ← TODO: copy BLE_PROTOCOL, COMPANION_APP_SPEC, BOM, architecture
    ├── BLE_PROTOCOL.md             (191 lines)
    ├── COMPANION_APP_SPEC.md       (271 lines)
    ├── aeon_bom_v2.md              (172 lines)
    └── aeon_v2_architecture.txt
```

## Migration commands (when RSP approves the source path mappings)

```bash
SRC=/Volumes/6TB/ARCHIVE/Documents_NOIZY_2026-04-06/NOIZYLAB_TEXT_VAULT
DST=/Users/m2ultra/NOIZYANTHROPIC/apps/aeon

# Firmware
mkdir -p $DST/firmware
cp $SRC/aeon-pmic-firmware/* $DST/firmware/

# Cloud (verify aeon-power is the right source)
mkdir -p $DST/cloud
cp $SRC/aeon-power/*.{js,toml,sql} $DST/cloud/ 2>/dev/null

# App
mkdir -p $DST/app
find $SRC -name "AeonCompanion.swift" -exec cp {} $DST/app/ \;

# Hardware (text-bearing only — kicad_sch is text)
mkdir -p $DST/hardware
find $SRC -name "*.kicad_sch" -path "*aeon*" -exec cp {} $DST/hardware/ \;
find $SRC -name "enclosure.scad" -exec cp {} $DST/hardware/ \;

# Docs
mkdir -p $DST/docs
find $SRC/aeon-v2-supreme -name "*.md" -not -name "README.md" -exec cp {} $DST/docs/ \;
find $SRC -name "BLE_PROTOCOL.md" -path "*aeon*" -exec cp {} $DST/docs/ \;
find $SRC -name "COMPANION_APP_SPEC.md" -path "*aeon*" -exec cp {} $DST/docs/ \;
find $SRC -name "aeon_bom_v2.md" -exec cp {} $DST/docs/ \;
find $SRC -name "aeon_v2_architecture.txt" -exec cp {} $DST/docs/ \;
```

## What's in this migration today (Phase 1)

- ✅ `README.md` (the v2-supreme canonical README — full system overview)
- ✅ `README_20251217_142013.txt` (origin timestamp record)
- ✅ `MIGRATION_PLAN.md` (this file)

## What's still on `/Volumes/6TB` (Phase 2 — pending RSP go-ahead)

- Firmware (~2-3 KB of C++ + header)
- Cloud Worker (~5-10 KB of JS + TOML + SQL)
- iOS app (~10 KB SwiftUI)
- Hardware (KiCad schematic + .scad — text-bearing files only)
- Docs (4 markdown specs)

## Why Phase 1 / Phase 2 split

The README + origin TXT are seeded immediately so the canonical path exists, but the bulk file copy waits for RSP to confirm:

1. The exact source dir for `cloud/` (aeon-power vs AEON-POWER-COMPLETE-2 vs aeon-god-kernel — three candidates)
2. Whether `aeon-v2-supreme-2` should be merged with v2-supreme or remained archived as a known-different branch
3. Whether the firmware should sit in `apps/aeon/firmware/` (current plan) or get its own repo at `repos/aeon-firmware/` (cleaner for embedded toolchain isolation)

## Doctrine alignment

AEON honors the same constitutional layers as the rest of the empire:

- **Article II (Consent is Structural)**: power-aware AI throttling is gated by the same consent kernel that gates HEAVEN — wearable synth requests get the same Covenant check as studio synth requests.
- **Article IV (Royalties Route)**: any Voice DNA usage on AEON triggers the same 75/25 ledger entry.
- **GABRIEL embodiment**: the M2 Ultra is GABRIEL's studio body; AEON is GABRIEL's body in the world. Same identity, two physical surfaces.
- **No-media rule**: AEON is text + code only; safe in canonical tree.

## Companion

- `project_machine_wide_grep_2026-04-20.md` — the discovery report that surfaced AEON
- `.claude/rules/gabriel-embodiment.md` — the embodiment decree AEON extends
- `apps/aeon/README.md` — full system documentation
