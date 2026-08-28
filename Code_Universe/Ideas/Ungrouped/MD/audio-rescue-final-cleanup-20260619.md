# Audio Rescue Cleanup Run

Generated: 2026-06-19

Target:
`/Users/m2ultra/Library/CloudStorage/GoogleDrive-rspplowman@gmail.com/My Drive/_AUDIO_RESCUE`

## Tooling Fixed

- Added CloudStorage preflight checks to avoid false empty duplicate reports.
- Added per-file hash timeouts so Google Drive read failures cannot stall the full scan.
- Added incomplete-read detection so placeholder files cannot be mistaken for empty duplicate files.
- Added `approve-safe` and `--min-size-mb` support to the cleanup tool.
- Added a local-block auditor to distinguish cloud apparent size from real local disk usage.

## Duplicate Scan Result

Deep scan threshold: 1 MB

- Files indexed: 10,479
- Same-size candidates hash-checked: 6,906
- Verified duplicate groups found: 0
- Verified reclaimable local duplicate space: 0 B
- Plan generated: `/Users/m2ultra/duplicate-scans/audio-rescue/audio-rescue-dupes-20260619-181942.plan.json`
- Approved plan generated: `/Users/m2ultra/duplicate-scans/audio-rescue/audio-rescue-dupes-20260619-181942.plan.approved.json`
- Quarantine actions approved: 0

No verified duplicate files were moved or deleted.

## Google Drive Placeholder Result

Unreadable/cloud-backed worklist:
`/Users/m2ultra/duplicate-scans/audio-rescue/audio-rescue-unreadable-20260619.json`

- Total access failures: 8,903
- Directory listing failures: 1,997
- File hash/read failures: 6,906

Top problem buckets:

- `RSP_001/_MCDONALD'S MASTER/HS MUSIC MASTER`: 2,165
- `RSP_001/_ALL_GIRL_ARCADE/AUDIO FILES`: 731
- `RSP_001/_LEAFY LANDINGS copy/_AUDIO`: 625
- `RSP_001/M2ULTRA_BACKUP_20260417/Library-selected`: 522
- `RSP_001/MissionControl96/noizylab_2026`: 327
- `NOIZYEMPIRE/MC96/INFRASTRUCTURE`: 299
- `NOIZYEMPIRE/NOIZYFISH/LIVE_SHOWS`: 108

## Local Disk Usage Result

Local block report:
`/Users/m2ultra/duplicate-scans/audio-rescue/audio-rescue-local-blocks-20260619.json`

- Files seen: 25,308
- Apparent cloud size: 87.0 GB
- Actual local disk blocks: 416.0 KB

This folder is overwhelmingly cloud placeholder metadata, not local disk usage.

## Conclusion

There are no safe verified duplicate files to delete from local `_AUDIO_RESCUE` storage right now. The apparent 87 GB is cloud-side logical size; locally it uses only about 416 KB. The next cleanup pass requires making the top problem buckets available offline in Google Drive, then rerunning the scanner.
