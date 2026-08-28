# DREAMCHAMBER — SAFE RECOVERY CHECKLIST

*Print this. Pin it. Read it aloud before anyone touches a machine.*

---

## Invariant

- DEFAULT ACTION = **SCAN**
- **No deletes, no installs, no cleanup on first pass**
- SSH / SMB / SCP only
- GOD is the sole intake authority
- MICKY-P is a source mine, not a casualty

---

## Order (Non-Negotiable)

| # | Command | Gate |
|---|---------|------|
| 1 | `scan-drives` | Inventory all mounted volumes |
| 2 | `extract-code` | Copy code-gold only |
| 3 | `copy-plugins-to-quarantine` | Inventory + quarantine |
| 4 | `verify-manifests` | Counts + sizes + hashes |
| 5 | `studio_health` | Local runtime truth |
| 6 | `record_preflight` | Gate recording |
| 7 | `operate` | Only after green lights |
| 8 | `automate power` | Last, optional |

---

## First-Pass Rules

- Originals are immutable
- Plugin installs forbidden
- DAW automation forbidden
- Cleanup requires explicit manual approval

---

## Single Intake Tree

```
~/Recovered/
  code-gold/
  media/
  plugins-quarantine/
  manifests/
  events.jsonl
```

---

## Mantra

> **Scan first. Copy second. Verify third. Operate fourth. Automate power last.**
