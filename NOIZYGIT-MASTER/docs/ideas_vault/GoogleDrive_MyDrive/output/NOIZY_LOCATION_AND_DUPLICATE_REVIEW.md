# NOIZY Location & Duplicate Review

**Scope:** Google Drive My Drive root and selected project folders
**Method:** Non-destructive filename, folder, metadata, manifest, and document-structure review
**Status:** Review only — no files moved, overwritten, or deleted

## Recommended canonical locations

| Content | Canonical location | Reason |
|---|---|---|
| Active planning, code, and operational workspace | `NOIZYLAB_WORKSPACES/` | Already has numbered areas, shared space, and a workspace file |
| Master audio/video assets | `NOIZY_AUDIO_VIDEO_VAULT/` | Already has numbered media categories and a 31,568-file manifest |
| Historical source material and rescue work | `RSP_001/` | Clearly functions as the long-term source/archive tree |
| Recoverable code and migration tooling | `_AUDIO_RESCUE/` | Git repository with `audio_library_scripts`, `ingest`, `cli`, and integrity logs |
| Compressed backups and session archives | `NOIZY-BACKUP/` and `Claude Archive/` | Keep separate from active work; do not mix with working files |
| Installers/downloaded packages | `M2ULTRA_DOWNLOADS/` | Already named as a staging area; archive or remove only after verification |

## High-confidence duplicate candidates

1. `NOIZY-AI-GLOBAL-AUDIT-2026-04-13.docx` and `(2).docx` are both 23,596 bytes and both parse as the same 157-child DOCX outline. Keep the earlier canonical file; retain `(2)` temporarily for checksum confirmation.
2. In the vault manifest, these entries share the same SHA-256 head and are duplicate media copies: `Clocks 1.mp4` / `Clocks 2.mp4`; `Yellow.mp4` / `Coldplay - Yellow.mp4`; `Little Sister.mp4` / `Little Sister 1.mp4`; `Video Killed The Radio Star.mp4` / `Video Killed The Radio Star 2.mp4`; `Ashes To Ashes.mp4` / `David Bowie - Ashes To Ashes.mp4`; `Let's Dance.mp4` / `Let's Dance 1.mp4`; `David Bowie - Let's Dance.mp4` / `Let's Dance 1.mp4`.
3. `RSP_001` contains obvious name-level project duplicates or variants: `LEAFY LANDINGS`, `LEAFY_LANDINGS`, `_LEAFY LANDINGS`, and `_LEAFY LANDINGS copy`. These need content comparison before merging.

## Suspected duplicates — preserve until checked

- `NOIZY_EMPIRE_AUDIT_2026-03-28.xlsx` vs `(1).xlsx`: not identical. The `(1)` file is larger and has extra chart/sheet tabs; likely an enriched version.
- `NOIZY-AI-GLOBAL-AUDIT-2026-04-13 (1).docx`: 13.6 MB, unreadable/slow from the synced Drive mount. Download or make available offline before comparing.
- Repeated founder blueprint files: `NOIZY-Founder-Blueprint-2026.docx`, `(1).docx`, and `.gdoc` may represent exports plus a live Google Doc, not simple duplicates.
- Repeated presentations: `The Audio Infrastructure Revolution.gslides` and `(1).gslides` should be checked as live Google files before consolidation.

## Location issues to refine

- The root contains many active documents mixed with archives, installers, exports, images, and project folders. Move candidates should be sorted into `NOIZYLAB_WORKSPACES`, `NOIZY_AUDIO_VIDEO_VAULT`, `RSP_001`, `M2ULTRA_DOWNLOADS`, or an explicit archive—not deleted.
- `RSP_001` and `_AUDIO_RESCUE/RSP_001` both contain large RSP/source trees. Treat `_AUDIO_RESCUE` as a rescue working copy and `RSP_001` as the source/archive tree until file-level comparison proves otherwise.
- The inventory flags `Claude Archive/n8n-credentials.txt` as credentials in cloud storage. Do not open or copy its contents. Rotate the credential, then remove it only after a secure replacement is confirmed.

## Safe next action requiring approval

Create a dated quarantine folder such as `output/REVIEW_ONLY_2026-08-30` and place only confirmed duplicate *copies* there, leaving originals recoverable. No deletion should occur until checksums, project references, and Google Drive sync status are confirmed.
