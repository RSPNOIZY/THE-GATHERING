# NOIZY SAFE RECOVERY v3 (DreamChamber)

This is the non-destructive recovery system for **MICKY-P → GOD**.

## Doctrine (3-pass)
1) Discover + Copy (non-destructive)
2) Verify + Classify (hashes + manifests)
3) Selective migration only after review
Cleanup is always manual.

## Requirements
- GOD can SSH into MICKY-P.
- No cloud services required.
- This script never installs plugins or changes DAW configs.

## Quick Start
```bash
chmod +x noizy_safe_recovery_v3.sh
./noizy_safe_recovery_v3.sh            # default: audit
./noizy_safe_recovery_v3.sh extract-code
./noizy_safe_recovery_v3.sh copy-media
./noizy_safe_recovery_v3.sh copy-plugins
./noizy_safe_recovery_v3.sh verify
./noizy_safe_recovery_v3.sh report
```

## Outputs (on GOD)

`~/Recovered/`

- `runs/<run_id>/manifests/` (CSV + hashes)
- `code-gold/<run_id>/` (copied code/config/docs)
- `media/<run_id>/` (copied sessions/audio)
- `plugins-quarantine/<run_id>/` (copied plugins, not installed)

## Commands

### audit (default)

Creates inventory files on MICKY-P and copies them to GOD.
No copying of assets yet.

### extract-code

Copies "code-gold" only:

- .git
- package.json
- wrangler.toml / wrangler.jsonc
- docker-compose.yml
- *.swift *.ts *.js *.py *.md *.sh
- *.xcodeproj *.xcworkspace

### copy-media

Copies:

- *.logicx *.band
- *.wav *.aiff *.mp3 *.m4a *.flac
- *.mid *.midi

### copy-plugins

Copies AU/VST/VST3/AAX into quarantine only.
**Never installs them into /Library/Audio/Plug-Ins on GOD.**

### verify

Writes:

- `manifest_hashes.txt` (sha256)
- `verify_counts.csv`

### cleanup

Disabled in SAFE MODE. Manual only.

### keith

Not executed here. Separate opt-in installer after validation.

## Safety Guarantees

- No deletes
- No overwrites
- No plugin installs
- No Logic automation

## Troubleshooting

- SSH failure: confirm Remote Login on MICKY-P, correct user, reachable IP.
- Permissions: you may need to grant Full Disk Access on MICKY-P for Terminal if scanning user Library folders.
- Large transfers: run media copy overnight, or restrict scope by moving projects into a staging folder first.
