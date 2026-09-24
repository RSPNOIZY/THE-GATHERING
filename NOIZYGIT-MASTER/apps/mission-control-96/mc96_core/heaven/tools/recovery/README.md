# NOIZY SAFE RECOVERY v3 (DreamChamber)

Non-destructive recovery system for **MICKY-P → GOD**.

## Doctrine (3-pass)
1. **Discover + Copy** (non-destructive)
2. **Verify + Classify** (hashes + manifests)
3. **Selective migration** only after review

Cleanup is always manual.

## Requirements
- GOD can SSH into MICKY-P (`rsp@10.0.0.100`)
- Enable Remote Login on MICKY-P: System Settings → General → Sharing → Remote Login → ON
- No cloud services required

## Quick Start
```bash
chmod +x noizy_safe_recovery_v3.sh

./noizy_safe_recovery_v3.sh              # audit (default)
./noizy_safe_recovery_v3.sh extract-code # copy code to GOD
./noizy_safe_recovery_v3.sh copy-media   # copy audio/sessions to GOD
./noizy_safe_recovery_v3.sh copy-plugins # quarantine plugins (no installs)
./noizy_safe_recovery_v3.sh verify       # SHA-256 hash all artifacts
./noizy_safe_recovery_v3.sh report       # print run summary
```

## Outputs (on GOD)

```
~/Recovered/
├── runs/<run_id>/
│   ├── manifests/
│   │   ├── inventory_apps.csv
│   │   ├── inventory_code.csv
│   │   ├── inventory_media.csv
│   │   ├── inventory_plugins.csv
│   │   ├── disk_usage_summary.txt
│   │   ├── manifest_hashes.txt
│   │   └── verify_counts.csv
│   ├── logs/
│   │   └── rsync_*.log
│   └── events.jsonl
├── code-gold/<run_id>/       (copied code/config/docs)
├── media/<run_id>/           (copied sessions/audio)
└── plugins-quarantine/<run_id>/ (copied plugins, NOT installed)
```

## Commands

| Command | What it does | Destructive? |
|---------|-------------|-------------|
| `audit` | Inventory MICKY-P, copy manifests to GOD | ❌ No |
| `extract-code` | Copy .swift/.ts/.js/.py/.md/.sh etc. | ❌ No |
| `copy-media` | Copy .logicx/.band/.wav/.aiff/.mp3/.flac | ❌ No |
| `copy-plugins` | Copy AU/VST/VST3 to quarantine | ❌ No |
| `verify` | SHA-256 hash all copied artifacts | ❌ No |
| `cleanup` | Disabled (manual only) | ⛔ Blocked |
| `keith` | ENGR_KEITH (opt-in only) | ⛔ Blocked |
| `report` | Print run summary | ❌ No |

## Safety Guarantees
- ✅ No deletes
- ✅ No overwrites
- ✅ No plugin installs
- ✅ No Logic/DAW automation
- ✅ Every action logged to events.jsonl
- ✅ Every copy hashed for verification

## Environment Overrides
```bash
MICKY_HOST=10.0.0.100       # Mickey-P IP (confirmed via ping)
MICKY_SSH_USER=rsp           # SSH user on Mickey-P
OUTROOT=~/Recovered          # Where to store on GOD
```

## Troubleshooting
- **SSH failure**: Confirm Remote Login is ON on MICKY-P, correct user, reachable IP
- **Permissions**: Grant Full Disk Access on MICKY-P for Terminal if scanning ~/Library
- **Large transfers**: Run media copy overnight, or use scope filters
