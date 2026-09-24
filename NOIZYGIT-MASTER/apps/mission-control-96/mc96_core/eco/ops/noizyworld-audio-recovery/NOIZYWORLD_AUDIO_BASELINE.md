# NOIZYWORLD Audio Baseline

Snapshot from the first local-drive inventory pass on 2026-06-16.

This baseline is not a deletion authority. It is the starting map for deeper scans, recovery triage, and duplicate-proofing.

## Total Found

At least 2,843,540 audio files were found across mounted local drives.

Some earlier counts were interrupted or flushed at shutdown, so treat this as a lower-bound baseline until a full SQLite run completes.

## Drive Counts

| Drive | Audio files found | Notes |
|---|---:|---|
| `4TB BLK` | 1,014,868 | largest audio archive; mostly WAV |
| `6TB` | 261,739 | large OGG collection plus WAV |
| `4TB Lacie` | 245,764 | mostly WAV and AIF |
| `JOE` | 234,387 | scan reported one input/output warning |
| `4TB_02` | 223,009 | mostly WAV |
| `SAMPLE_MASTER` | 204,820 | sample-library master; almost full |
| `3TB-GRF` | 204,604+ | partial/interrupted-style count; large CAF set |
| `12TB` | 164,316+ | partial/interrupted-style count |
| `2TB_SGW` | 146,192 | WAV plus large MP3 count |
| `SOUND_DESIGN` | 63,730 | later shallow reads reported interrupted system call; recheck health |
| `MAG 4TB` | 43,735 | mostly WAV and AIF |
| `RED DRAGON` | 35,368 | includes clone/recovery staging material |
| `M2ULTRA_USER` | 1,008 | indexed user-volume audio; includes Google Drive cache and voice demos |

## Format Counts

| Format | Count |
|---|---:|
| WAV | 2,376,366 |
| AIF | 222,563 |
| OGG | 110,558 |
| CAF | 75,439 |
| MP3 | 48,070 |
| AIFF | 8,115 |
| FLAC | 1,014 |
| M4A | 980 |
| SND | 411 |
| AU | 24 |

## Immediate Priorities

1. Recheck `SOUND_DESIGN` health because shallow reads later returned `Interrupted system call`.
2. Run extension-mode SQLite scans per drive, one drive at a time.
3. Review scan errors before deep recovery.
4. Run `--mode deep` on recovery-heavy folders and clone folders.
5. Run `--hash full` only when preparing an actual prune plan.
6. Never delete based on size or filename alone.
