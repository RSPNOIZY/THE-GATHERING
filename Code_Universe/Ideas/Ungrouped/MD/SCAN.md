# VOLUMES · GOD.local — full scan

**Scanned:** 2026-04-19
**Host:** GOD.local (Mac Studio M2 Ultra)
**Method:** `mount` + `df -h` + `diskutil list external` + shallow `ls` per volume

---

## 📊 Summary

| Metric                                | Value                           |
| ------------------------------------- | ------------------------------- |
| Mounted volumes (excluding system)    | **11**                          |
| Physical drives connected             | **12**                          |
| Connected but NOT mounted             | **1** (MAG 4TB · disk12)        |
| Aggregate external capacity (mounted) | **~40 TB**                      |
| Aggregate used                        | **~29 TB**                      |
| Aggregate free                        | **~11 TB**                      |
| Drives at 100% capacity               | **2** (SAMPLE_MASTER · 4TB BLK) |
| Drives ≥ 85% capacity                 | **4** (add 12TB · 6TB)          |

---

## 🔴 Critical — cannot write

| Volume          | Size   | Used     | Free       | Purpose (inferred)                                                                                               |
| --------------- | ------ | -------- | ---------- | ---------------------------------------------------------------------------------------------------------------- |
| `SAMPLE_MASTER` | 1.8 TB | **100%** | **38 MiB** | KH Orchestral · AUDIO_SFX_LIBRARY · NOIZYFISH_THE_AQAURIUM · Samples To Sort 2022                                |
| `4TB BLK`       | 3.6 TB | **100%** | **17 GiB** | Pure sample vault: EXPANSIONS · FXpansion · INSTRUMENTS · PLUGINS · PRESETS · Steven_Slate · Toontrack_EZDrummer |

Both drives are read-only for practical purposes. Any write operation (including Spotlight reindexing, metadata updates) risks silent failure.

---

## 🟡 Warning — ≥85% capacity

| Volume | Size   | Used | Free   | Role                                                                                     |
| ------ | ------ | ---- | ------ | ---------------------------------------------------------------------------------------- |
| `12TB` | 11 TB  | 87%  | 1.4 TB | Production: NOIZYLAB · CODEMASTER · GitHub · AUDIO_SFX_LIBRARY · FISH · MissionControl96 |
| `6TB`  | 5.5 TB | 86%  | 823 GB | Archives: ARCHIVE · NOIZYLAB_ARCHIVES · Sample_Libraries · backups · noizy               |

---

## 🟢 Healthy (safe headroom for cold-data moves)

| Volume           | Size   | Used    | Free       | Top-level                                                                                |
| ---------------- | ------ | ------- | ---------- | ---------------------------------------------------------------------------------------- |
| `4TB Lacie`      | 3.6 TB | **17%** | **3.0 TB** | 00_COLLECTED_AUDIO → 06_INSTALLERS · M2ULTRA_BACKUP_20260417 · \_MASTER_2026 · \_MP4     |
| `gorunfree test` | 2.7 TB | **1%**  | **2.7 TB** | only `MVS/` — essentially empty                                                          |
| `SOUND_DESIGN`   | 1.8 TB | 45%     | 1.0 TB     | EM_BACKUP_2026 · FEB2026_DOWNLOADS · RSP_media_move · \_2026_MASTER                      |
| `2TB_SGW`        | 1.8 TB | 66%     | 646 GB     | 2025 HEALTH · Music 2023 · FISHMUSIC_2026_MASTER · VoiceTrigger · iChats                 |
| `JOE`            | 3.6 TB | 56%     | 1.6 TB     | 00.CODE & DOCS 2026 · LIVE SHOW 2026 · Logic Pro Library.bundle · MUSIC THEORY · Samples |

---

## 🖥 Special

| Volume               | Notes                                                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `NOIZYWIN` (disk6s2) | 234 GB · Windows NTFS · Bootcamp/external Windows drive · contains `$RECYCLE.BIN`, `System Volume Information`, `Windows` |
| `M2ULTRA` (symlink)  | Points to `/` — internal system drive (1.8 TB, 887 GB used after this session's cleanup)                                  |

---

## ⚫ Connected but NOT mounted

| Drive                  | Size | FS        | Status                                                         |
| ---------------------- | ---- | --------- | -------------------------------------------------------------- |
| **MAG 4TB** (disk12s2) | 4 TB | Apple_HFS | Physical drive present · partition exists · NOT in `/Volumes/` |

**To mount:** `diskutil mount disk12s2` — if it refuses, the drive may need `diskutil repairVolume disk12s2` or `fsck_hfs` first.

---

## 🔁 Cross-volume duplicate candidates (consolidation opportunities)

From shallow top-level listings, the same directory names appear on multiple drives — likely duplicates, worth verifying before deletion:

| Folder / file                         | Appears on                     |
| ------------------------------------- | ------------------------------ |
| `NOIZYLAB_ARCHIVES`                   | `12TB`, `6TB`, `SAMPLE_MASTER` |
| `NOIZYLAB.CA - 01152026 - BUILD.pptx` | `12TB`, `SAMPLE_MASTER`        |
| `AUDIO_SFX_LIBRARY`                   | `12TB`, `SAMPLE_MASTER`        |
| `FISHMUSIC_2026_MASTER`               | `2TB_SGW`, `JOE`               |
| `KH ORCHESTRAL COLLECTION`            | `SAMPLE_MASTER` (check others) |

Full dedup audit requires a real per-file comparison — candidate for a Tier 3 cleanup compartment.

---

## 🎯 Proposed next compartments

Pick any — I can execute or draft:

1. **Mount MAG 4TB** — one command: `diskutil mount disk12s2`. Verify it's readable and decide its role (backup target? cold archive?).
2. **Move Music (11 GB system drive) → 4TB Lacie or gorunfree test** — resolves the no-A/V-on-system-drive rule violation. Requires Logic Pro to be pointed at new Sound Library location afterward.
3. **De-duplicate SAMPLE_MASTER ↔ 12TB** — both carry NOIZYLAB_ARCHIVES + AUDIO_SFX_LIBRARY. If contents match, freeing SAMPLE_MASTER gets you 1.8 TB back on a sample-vault drive.
4. **Empty `gorunfree test`** — 2.7 TB capacity used by one folder. Either repurpose as target for Music migration or as backup destination.
5. **Map NOIZYANTHROPIC/NOIZYLAB deps across volumes** — grep for `package.json`, `.git` dirs, `wrangler.jsonc` across all 11 mounted drives to find stranded project copies that should consolidate.

---

## 🔒 Ground rules for volume operations

- Never `diskutil eraseDisk` without explicit confirmation.
- Never `rm -rf` on any `/Volumes/*` path — always move to `.Trash` first, then delete when proven safe.
- The Apple_RAID pair (disk4 + disk5) that appears as `/Volumes/6TB` — do NOT break the RAID; destroying one member loses the set.
- `NOIZYWIN` is Windows NTFS — macOS writes can corrupt. Read-only unless a driver like Paragon/Tuxera is installed.

---

_Scan executed 2026-04-19 · re-run anytime via `df -h | grep /Volumes` + `diskutil list external`_
