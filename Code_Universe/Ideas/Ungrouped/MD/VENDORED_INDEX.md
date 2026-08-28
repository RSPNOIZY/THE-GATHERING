# VENDORED INDEX — Paths empire scans must SKIP

**Sealed:** 2026-04-20 by GABRIEL per RSP cleanup directive Item 5
**Why this file lives in NOIZYANTHROPIC:** the canonical work tree is writable; the archive volumes (especially /Volumes/12TB) are mounted read-only, so per-directory `VENDORED.md` markers there can't be placed. This index serves the same purpose centrally.

## Scan-skip paths (vendored upstream code · NOT empire IP)

These directories contain third-party upstream code. Empire audits, file trackers, and doctrinal-corpus indexers MUST skip them.

| Path                                                               | Upstream                                                              | Last upstream commit              | Commits  |
| ------------------------------------------------------------------ | --------------------------------------------------------------------- | --------------------------------- | -------- |
| `/Users/m2ultra/NOIZYANTHROPIC/tools/turbo-console-log`            | https://github.com/Chakroun-Anas/turbo-console-log                    | (varies)                          | (varies) |
| `/Volumes/12TB/CODEMASTER/NOIZYLAB_ARCHIVES/6tb_archive/rvc_train` | https://github.com/RVC-Project/Retrieval-based-Voice-Conversion-WebUI | 2024-11-24                        | 888      |
| `/Volumes/12TB/CODEMASTER/NOIZYLAB_ARCHIVES/6tb_archive/sys`       | https://github.com/golang/sys                                         | 2025-12-18                        | 1714     |
| `/Volumes/6TB/NOIZYLAB_ARCHIVES/LOCAL_LLM/GLM-4.7/llama.cpp`       | https://github.com/ggerganov/llama.cpp                                | (presumed; .git is broken/sparse) | 0        |
| `/Volumes/6TB/NOIZYLAB_ARCHIVES/LOCAL_LLM/OpenManus/OpenManus`     | (likely OpenManus AI agent project)                                   | (presumed; .git is broken/sparse) | 0        |

## How empire scanners should consume this index

```bash
# In ops/healing-audit.sh, mc96-file-tracker.json, etc.:
VENDORED_PATHS=$(grep -oE '`/[^`]+`' tools/CODEMASTER/turbo-scripts/VENDORED_INDEX.md | tr -d '`')
for path in $VENDORED_PATHS; do
  # skip during scans
done
```

Or per-line: any path appearing in this file's table SKIP.

## Why vendored matters

Per `coding-standards.md` security + Article VII (Auditability):

- Empire IP must be distinguishable from external dependency
- Audit reports must classify vendored code as VENDORED, not as "topic-organization issue"
- License compliance: vendored upstream carries upstream's license, not empire's

## Disposition

For the writable copy at `tools/turbo-console-log`:

- Has its own `VENDORED.md` marker in-place (NOIZYANTHROPIC is writable)
- Marked for demotion via `ops/demote-turbo-console-log.sh` (replace with VS Code marketplace install)

For the read-only copies on /Volumes/12TB and /Volumes/6TB:

- This index is the marker (cannot write VENDORED.md to RO mount)
- If volumes ever remount writable, copy `VENDORED.md` template into each upstream dir for redundancy

## Companion

- `tools/turbo-console-log/VENDORED.md` — per-dir marker (writable copy)
- `.claude/rules/mc96-file-tracking.md` — file tracker that consults this index
- `ops/healing-audit.sh` — weekly audit that consults this index
- `ops/cleanup-broken-gitdirs.sh` — companion cleanup (sister to this list)
