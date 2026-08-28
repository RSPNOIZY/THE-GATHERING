# NOIZYLAB — GATHERING MANIFEST

*Code, markdown, and Python files across every mounted source. Generated 2026-04-16.*

**Scope:** `.md`, `.py`, `.js`, `.ts`, `.tsx`, `.jsx`, `.go`, `.rs`, `.swift`, `.sh`, `.rb`, `.java`, `.c`, `.cpp`, `.h`, `.sql`
**Excluded:** `node_modules`, `.git`, `__pycache__`, `venv`, `.venv`, `dist`, `build`, `.next`, macOS `Library/`, `.Trash`

---

## TOTALS

| Source | Files | Status | Path list |
|--------|------:|--------|-----------|
| `/Users/m2ultra/` (home) | **184,383** | ✅ complete | [`sources/home.paths.txt`](sources/home.paths.txt) |
| `/Volumes/6TB/` | **20,674** | ✅ complete | [`sources/6tb.paths.txt`](sources/6tb.paths.txt) |
| `/Volumes/12TB/` | ~1,750+ | 🟡 scan in progress | (pending) |
| `/Volumes/MAG 4TB/` | **89** | ✅ complete (sparse — audio drive) | [`sources/mag4tb.paths.txt`](sources/mag4tb.paths.txt) |
| `OneDrive-Personal(2)` | — | ⏸ not scanned (may trigger cloud fetches) | — |
| `GoogleDrive-rsplowman@icloud.com` | — | ⏸ not scanned (may trigger cloud fetches) | — |
| `GoogleDrive-rp@fishmusicinc.com` | — | ⏸ archive snapshot, appears offline | — |

---

## HOME — `/Users/m2ultra/`

184K files catalogued. Roughly **half is dependency cache noise** (`go/pkg`, `.cache`, `.vscode/extensions`) — the real primary-source NOIZY code is ~80K files concentrated in:

| Count | Path |
|------:|------|
| 69,826 | `NOIZYANTHROPIC/_archive` |
| 37,035 | `NOIZYANTHROPIC/.claude` |
| 1,782 | `swift-library/che-logic-pro-mcp` |
| 1,229 | `NOIZYANTHROPIC.worktrees/copilot` |
| 1,068 | `NOIZYANTHROPIC/tools` |
| 837 | `NOIZYANTHROPIC/repos` |
| 792 | `noizy-workspace/THE-GATHERING` |
| 514 | `Desktop/CLAUDE TODAY` |

### Extension breakdown (home)

| Ext | Count | Notes |
|-----|------:|-------|
| `.go` | 120,074 | mostly `go/pkg` dep cache |
| `.py` | 28,469 | |
| `.md` | 11,558 | |
| `.js` | 8,864 | |
| `.h` | 8,437 | |
| `.ts` | 2,269 | |
| `.swift` | 1,842 | |
| `.sh` | 1,715 | |
| `.c` | 535 | |
| `.tsx` | 211 | |
| `.sql` | 184 | |

---

## 6TB — `/Volumes/6TB/`

20,674 files. Almost entirely in one archive tree:

| Count | Path |
|------:|------|
| 20,040 | `ARCHIVE/` |
| 613 | `NOIZYLAB_ARCHIVES/` |
| 21 | `_ORGANIZED/` |

---

## MAG 4TB — `/Volumes/MAG 4TB/`

89 code/md files (drive is mostly audio — 2.9 TiB used, sparse code). All under one project:

| Count | Path |
|------:|------|
| 57 | `NOIZYFISH_THE_AQAURIUM/_04.Utilities/` |
| 18 | `NOIZYFISH_THE_AQAURIUM/_D0C MASTER/` |
| 8 | `NOIZYFISH_THE_AQAURIUM/docs/` |
| 4 | `NOIZYFISH_THE_AQAURIUM/librosa_agent/` |
| 1 | `NOIZYFISH_THE_AQAURIUM/tools/` |
| 1 | `NOIZYFISH_THE_AQAURIUM/README.md` |

---

## 12TB — `/Volumes/12TB/` *(scan in progress)*

Partial results at generation time:

| Count | Path |
|------:|------|
| 1,299 | `.gemini_data/` |
| 377 | `_01.AUDIO FROM ALL/` |
| 57 | `_04.Utilities/` |
| 11 | `_D0C MASTER/` |

*This section will be refreshed when the scan completes.*

---

## NOT YET SCANNED (need user approval)

- **OneDrive-Personal(2)** — symlinked into `NOIZYANTHROPIC/OneDrive`. Scanning may trigger downloads of cloud-only files.
- **GoogleDrive-rsplowman@icloud.com** — has `Claude Archive/` and `NOIZYLAB_WORKSPACES/`. Same risk.
- **GoogleDrive-rp@fishmusicinc.com (2026-01-19 3:55 AM)** — folder name is a snapshot timestamp; content not visible via `ls`, likely offline archive.

Run them on request.

---

## USAGE

Full path lists are in [`sources/`](sources/). Grep examples:

```bash
# Every Python file across all scanned sources
cat brands/NOIZYLAB/sources/*.paths.txt | grep -i '\.py$'

# Every markdown file mentioning "consent"
cat brands/NOIZYLAB/sources/*.paths.txt | grep '\.md$' | \
  xargs grep -l -i 'consent' 2>/dev/null

# Every Swift file on the 6TB drive
grep '\.swift$' brands/NOIZYLAB/sources/6tb.paths.txt
```
