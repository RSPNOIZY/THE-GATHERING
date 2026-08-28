# CloudStorage Duplicate Cleanup Findings

Generated: 2026-06-18
Root scanned: `/Users/m2ultra/Library/CloudStorage`

## What was attempted

- A full `fdupes` content-duplicate scan was started, but it stalled while enumerating generated project/dependency folders inside cloud-backed Google Drive paths.
- A custom read-only large-file scanner was created at `/Users/m2ultra/duplicate-scans/scan_large_dupes.py`.
- Multiple large-file passes were attempted with generated/cache folders excluded.
- No files or folders were deleted.

## Top-level CloudStorage sizes captured

- `GoogleDrive-rsplowman@icloud.com`: 27 GB
- `GoogleDrive-rspplowman@gmail.com`: 4.8 GB
- `GoogleDrive-rspplowman@gmail.com (2026-6-4 18:49)`: 409 MB
- `OneDrive-Personal`: 383 MB
- `OneDrive-Personal(2)`: 8.2 MB
- `iCloudDrive-iCloudDrive (2026-6-3 21:38)`: 136 KB
- `GoogleDrive-rspplowman@gmail.com (2026-6-10 12:29)`: 0 B
- `iCloudDrive-iCloudDrive (2026-6-6 22:28)`: 0 B

## Timeout-heavy roots

These paths repeatedly produced cloud-provider `Operation timed out` errors during read-only scanning, so they were not verified as duplicate-safe:

- `/Users/m2ultra/Library/CloudStorage/GoogleDrive-rspplowman@gmail.com/My Drive/_AUDIO_RESCUE/RSP_001/M2ULTRA_BACKUP_20260417`
- `/Users/m2ultra/Library/CloudStorage/GoogleDrive-rspplowman@gmail.com/My Drive/_AUDIO_RESCUE/RSP_001/_ALL_GIRL_ARCADE`
- `/Users/m2ultra/Library/CloudStorage/GoogleDrive-rspplowman@gmail.com/My Drive/_AUDIO_RESCUE/RSP_001/_MCDONALD'S MASTER`
- `/Users/m2ultra/Library/CloudStorage/GoogleDrive-rspplowman@gmail.com/My Drive/M2ULTRA_DOWNLOADS/web/modules`
- `/Users/m2ultra/Library/CloudStorage/GoogleDrive-rspplowman@gmail.com/My Drive/RSP_001/projects/gemini_data_12TB`
- `/Users/m2ultra/Library/CloudStorage/GoogleDrive-rspplowman@gmail.com/My Drive/RSP_001/projects/CODEMASTER_12TB`
- `/Users/m2ultra/Library/CloudStorage/GoogleDrive-rspplowman@gmail.com/My Drive/RSP_001/originals/RSP_MS_BACKUP`

## Conservative cleanup candidates

These are candidates for manual review before deletion:

- Empty dated provider roots:
  - `/Users/m2ultra/Library/CloudStorage/GoogleDrive-rspplowman@gmail.com (2026-6-10 12:29)`
  - `/Users/m2ultra/Library/CloudStorage/iCloudDrive-iCloudDrive (2026-6-6 22:28)`
- Tiny stale iCloud provider root:
  - `/Users/m2ultra/Library/CloudStorage/iCloudDrive-iCloudDrive (2026-6-3 21:38)`
- Older dated Google Drive provider root:
  - `/Users/m2ultra/Library/CloudStorage/GoogleDrive-rspplowman@gmail.com (2026-6-4 18:49)`

## Recommendation

Do not run automatic duplicate deletion yet. First, review the dated provider roots and the timeout-heavy archive roots in Finder or the cloud provider UI. After confirming which roots are stale backups, delete whole stale roots rather than individual files inside partially readable cloud-backed directories.
