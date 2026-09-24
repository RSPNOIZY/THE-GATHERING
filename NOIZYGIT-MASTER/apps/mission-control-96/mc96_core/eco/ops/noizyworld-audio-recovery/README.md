# NOIZYWORLD Audio Recovery Control Plane

This is the MC96ECOUNIVERSE non-destructive system for organizing, pruning, and recovering audio across local drives.

The rule is simple: scan first, report second, approve third. This toolkit does not move, rename, or delete source files.

## What It Builds

- A SQLite catalog of discovered audio files.
- Per-drive and per-extension inventory reports.
- Flagged recovery candidates:
  - audio magic with missing or wrong extension
  - unreadable headers
  - zero-byte or suspiciously tiny audio candidates
  - DAW-generated asset folders such as `UNDO DATA`
- Duplicate candidate reports.
- Scan error reports for unreadable folders or failing drives.

## Location

Reports and database are written to:

```text
/Users/m2ultra/NOIZYANTHROPIC/mc96/eco/logs/noizyworld-audio-recovery
```

That path is intentionally under `logs/`, which is ignored by git.

## Commands

List configured drives:

```bash
cd /Users/m2ultra/NOIZYANTHROPIC/mc96/eco
python3 ops/noizyworld-audio-recovery/scripts/noizyworld_audio_recovery.py list-drives
```

Fast inventory by audio extensions:

```bash
python3 ops/noizyworld-audio-recovery/scripts/noizyworld_audio_recovery.py scan --mode extensions
```

Deep recovery triage by file signature:

```bash
python3 ops/noizyworld-audio-recovery/scripts/noizyworld_audio_recovery.py scan --mode deep
```

Full duplicate proofing with hashes:

```bash
python3 ops/noizyworld-audio-recovery/scripts/noizyworld_audio_recovery.py scan --mode extensions --hash full
```

Smoke test one drive:

```bash
python3 ops/noizyworld-audio-recovery/scripts/noizyworld_audio_recovery.py scan --drive SOUND_DESIGN --limit-per-drive 1000
```

Regenerate reports for the latest run:

```bash
python3 ops/noizyworld-audio-recovery/scripts/noizyworld_audio_recovery.py report
```

## Operating Doctrine

1. `extensions` mode is the first pass. It finds normal audio files quickly.
2. `deep` mode is the recovery pass. It reads file headers to catch audio with missing or wrong extensions.
3. `--hash full` is the proof pass. It is slow, but it is the only safe basis for dedupe pruning.
4. Deletion is not part of this tool. Prune plans must be reviewed outside the scanner.

## Recommended Order

1. Run a smoke test against `SOUND_DESIGN`.
2. Run extension scans for all drives.
3. Review `run_*_scan_errors.csv`.
4. Run deep mode on drives with suspicious folders or recovery history.
5. Run full hashes only on duplicate-heavy drives.
6. Create a reviewed move/delete plan only after hashes prove duplicates.

## Current Known Drives

The drive registry lives in:

```text
ops/noizyworld-audio-recovery/config/drives.json
```

Update that file when new NOIZYWORLD drives are attached.
