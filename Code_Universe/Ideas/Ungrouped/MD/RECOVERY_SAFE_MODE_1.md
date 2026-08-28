# RECOVERY SAFE MODE — Doctrine

## Law

**Scan first. Copy second. Verify third. Operate fourth. Automate power last.**

## Default Command

The first command on any machine, every time, is `scan-drives.sh`.
No exceptions. No shortcuts. No "I'll just check one thing first."

## First Pass Rules

1. **Non-destructive.** Nothing is deleted, moved, renamed, or overwritten.
2. **Originals are immutable.** Source drives are read-only targets.
3. **Plugin installs are forbidden.** No AU/VST/VST3/AAX touches GOD's live stack.
4. **Cleanup is opt-in and manual.** Automated cleanup does not exist on first pass.
5. **GOD is the intake authority.** All recovered material flows to `~/Recovered/` on GOD.
6. **MICKY-P is a source mine, not a casualty.** Extract from it. Do not "fix" it.

## Intake Tree (on GOD)

```
~/Recovered/
  code-gold/           # .git, package.json, wrangler.toml, source files
  media/               # Audio, video, Logic projects, sessions
  plugins-quarantine/  # AU/VST/VST3/AAX bundles — never installed
  manifests/           # Machine-readable scan output
  events.jsonl         # Append-only recovery event log
```

## Script Execution Order

| #   | Script                          | Purpose                                            |
| --- | ------------------------------- | -------------------------------------------------- |
| 1   | `scan-drives.sh`                | Enumerate volumes, count artifacts, emit manifests |
| 2   | `extract-code.sh`               | Copy code-gold only — no deletes, no installs      |
| 3   | `copy-plugins-to-quarantine.sh` | Inventory + quarantine audio plugins               |
| 4   | `verify-manifests.sh`           | Compare counts, sizes, hashes — pass/fail          |
| 5   | `studio_health.json`            | Local studio state snapshot                        |
| 6   | `record_preflight.sh`           | Gate recording sessions behind health checks       |

## Transport

- **Local:** Direct filesystem access on GOD
- **Remote (MICKY-P, others):** SSH/SFTP via macOS Remote Login or SMB file sharing
- **Fallback:** `scp` — built into macOS, works over SSH, no setup required

### SSH vs SMB Decision Matrix

| Need                           | Use                                 | Why                                                                                                            |
| ------------------------------ | ----------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Truth and scripting            | **SSH** (Remote Login)              | Exact file counts, hashes, permissions. Scripts execute on the remote machine. `scan-drives.sh` runs natively. |
| Browsing and manual validation | **SMB** (File Sharing)              | Finder-friendly. Drag-and-drop verification. Visual confirmation of folder structure.                          |
| Automated recovery pipeline    | **SSH first**                       | `rsync`, `scp`, `find` all work over SSH. SMB mount can follow for manual spot-checks.                         |
| Emergency (no network config)  | **Target Disk Mode / direct mount** | Physical cable. No network. Last resort.                                                                       |

**Rule**: Use SSH when you need to _know_. Use SMB when you need to _see_.
Run `scan-drives.sh` over SSH before connecting via Finder/Terminal remote.

## Events Log

Every script appends one JSON line per action to `~/Recovered/events.jsonl`:

```json
{
  "ts": "2026-04-12T...",
  "script": "scan-drives",
  "machine": "GOD",
  "action": "volume_found",
  "detail": { "path": "/Volumes/LaCie", "free_gb": 2100 }
}
```

This is the recovery spine. n8n orchestration sits on top of these facts — not instead of them.

## Scan Scope Rule

`scan-drives.sh` scans **mounted volumes and approved user paths only**. Never `find /`.

**Scanned:**

- `/Volumes/*` — all mounted external/internal volumes
- `/Users/*` — user home directories (excluding Shared)
- `$NOIZY_APPROVED_PATHS` — colon-separated list of additional paths (env var)

**Never scanned:**

- `/System`, `/Library`, `/private`, `/usr`, `/sbin`, `/bin`, `/etc`
- Any TCC-protected location (macOS Privacy & Security controls)

**Why:** Broad filesystem walks on macOS hit privacy-protected locations and generate
permission-denied noise. Scoping to volumes + user paths keeps output clean, fast,
and actionable.

## Recovery Preamble (mandatory)

Every recovery script emits this block before any work:

```text
═══════════════════════════════════════════════════
 host:        GOD
 user:        m2ultra
 command:     scan-drives
 source:      (mounted volumes + approved paths)
 destination: ~/Recovered/manifests
 dry-run:     false
═══════════════════════════════════════════════════
```

Fields: `host`, `user`, `command`, `source`, `destination`, `dry-run`.
Each field is also logged to `events.jsonl` on script start.

## Workers Config Doctrine

Heaven and all newer Workers projects use `wrangler.jsonc` (not `.toml`).

| Rule                 | Detail                                                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Config format        | `wrangler.jsonc` — supports comments, JSON-native tooling                                                                       |
| `compatibility_date` | Keep current. Update on each deploy cycle.                                                                                      |
| Deploy status        | "Worker deployed" and "Custom domain active" are **separate milestones** — never conflate them.                                 |
| Deploy order         | Source frozen -> Config upgraded -> Worker deployed -> Zone active -> Custom domain active -> Tunnel live -> Email routing live |
| Account              | `5f36aa9795348ea681d0b21910dfc82a` (rsp@noizy.ai) — canonical                                                                   |

This matches Cloudflare's current Wrangler and Workers best-practices model.
