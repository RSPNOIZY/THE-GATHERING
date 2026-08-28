# QUICK START — NOIZYLAB

This guide gets you building, deploying, and healing fast on macOS (zsh).

## Prerequisites
- macOS with zsh
- Homebrew: `which brew` → install from https://brew.sh
- Node.js v20+ and Yarn v1.22+: `node -v`, `yarn -v`
- Python 3.10+ (optional for Python tooling)
- Cloudflare Wrangler: `npm i -g wrangler`

## First-Time Setup
```zsh
# From the workspace root (branch: xenodochial-almeida)
cd /Users/m2ultra/.claude-worktrees/NOIZYLAB/xenodochial-almeida

# Install dependencies where present
make install || true

# Verify versions
node -v && yarn -v && python3 --version && wrangler --version
```

## Build, Test, Lint
```zsh
# Build repo (Node or Python where available)
make build || true

# Run tests (pytest or npm), lint
make test || true
make lint || true
```

## Cloudflare Worker (NOIZYLAB)
- Worker source: `workers/noizylab/src/index.ts`
- Config: `wrangler.toml` (uses `placement.mode = "smart"`)

```zsh
cd workers/noizylab
npm install
npm run build
wrangler deploy
# Health check
curl -s https://noizylab.rsplowman.workers.dev/health
```

## Heal & Optimize (One Command)
Run the unified script to enable Spotlight, flush DNS, verify MTU 9000, deploy the Worker, build/test/lint, and perform a quick I/O check.
```zsh
/Users/m2ultra/.claude-worktrees/NOIZYLAB/xenodochial-almeida/scripts/heal_optimize_run.sh
```
Notes:
- Prompts for sudo to adjust Spotlight/DNS.
- Keeps external/SMB volumes indexing disabled to avoid UI stalls.

## Spotlight & DNS (Manual)
```zsh
# Enable Spotlight on system drive
sudo mdutil -i on /
sudo mdutil -E /
mdutil -s /

# Disable on externals
for v in /Volumes/*; do sudo mdutil -i off "$v"; done

# Flush DNS
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

## Network — Jumbo Frames
```zsh
# Verify MTU 9000 on en0
ifconfig en0 | grep -i mtu
```

## I/O Quick Tests
```zsh
# Write test (already performed)
# time dd if=/dev/zero of=/Volumes/12TB/speedtest bs=1m count=1000

# Read test if file exists
if [[ -f /Volumes/12TB/speedtest ]]; then
  time dd if=/Volumes/12TB/speedtest of=/dev/null bs=4m
fi
```

## Git Workflow
```zsh
# Check status
git status --short

# Commit
git add -A
git commit -m "chore: updates"

# Push current branch
git push origin xenodochial-almeida
```

## Troubleshooting
- Worker deploy error: ensure `wrangler.toml` has `placement.mode = "smart"` and `compatibility_date` set.
- Tests failing due to VS Code download: run in CI or skip in sandbox; unit tests may require VS Code.
- Lint failing: run `yarn lint src/ test/` to avoid linting build output.

## Paths Reference
- Worker: `workers/noizylab/src/index.ts`
- Config: `wrangler.toml`
- Heal script: `scripts/heal_optimize_run.sh`
- Makefile: `Makefile`

## Done
You’re ready to build, deploy, and heal on repeat. 🚀