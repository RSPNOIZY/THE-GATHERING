# DREAMCHAMBER — SAFE RECOVERY CHECKLIST

**Print this. Pin it. Read it aloud before anyone touches a machine.**

---

## Invariant

- STOP Default action = SCAN
- STOP No deletes, no installs, no cleanup on first pass
- GO SSH / SMB / SCP only
- GO GOD is the sole intake authority
- GO MICKY-P is a source mine, not a casualty

## Order (Non-Negotiable)

```text
1. scan-drives         inventory all mounted volumes
2. extract-code        copy code-gold only
3. copy-plugins        inventory + quarantine (never install)
4. verify-manifests    counts + sizes + hashes
5. studio_health       local runtime truth
6. record_preflight    gate recording session
7. operate             ONLY after all green lights
8. automate power      last, optional, explicit approval
```

## First-Pass Rules

- Originals are immutable
- Plugin installs forbidden
- DAW automation forbidden
- Cleanup requires explicit manual approval
- Every action logged to events.jsonl

## Single Intake Tree

```text
~/Recovered/
  code-gold/              .git, package.json, source files
  media/                  audio, video, Logic projects
  plugins-quarantine/     AU/VST/VST3/AAX — never installed
  manifests/              machine-readable scan output
  events.jsonl            append-only recovery event log
```

## Transport Decision

| Need              | Use   |
| ----------------- | ----- |
| Truth + scripting | SSH   |
| Browse + validate | SMB   |
| Automated copying | rsync |
| Emergency         | Cable |

## Quick Commands

```bash
make                    # always runs scan first
make operate            # enforces every gate in order
make scan-dry           # preview without writing manifest
make scan-remote        # run scan on MICKY-P via SSH
make tail-events        # live event stream
make health-only        # standalone health check
```

## Recovery Preamble (every script emits)

```text
host:        GOD
user:        m2ultra
command:     scan-drives
source:      (mounted volumes + approved paths)
destination: ~/Recovered/manifests
dry-run:     false
```

---

## Mantra

**Scan first. Copy second. Verify third. Operate fourth. Automate power last.**

---

_NOIZY EMPIRE — GORUNFREE_
