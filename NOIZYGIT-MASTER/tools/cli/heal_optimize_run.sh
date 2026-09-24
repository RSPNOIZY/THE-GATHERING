#!/usr/bin/env zsh
set -euo pipefail

ts=$(date +%Y%m%d-%H%M%S)
logdir="$HOME/noizylab-heal-logs"
mkdir -p "$logdir"
logfile="$logdir/heal-$ts.log"

log() { echo "[$(date +%H:%M:%S)] $1" | tee -a "$logfile"; }

log "=== NOIZYLAB Heal/Optimize/Run — $ts ==="

log "Step 1: Spotlight — enable on /, disable on externals"
sudo mdutil -i on / 2>&1 | tee -a "$logfile"
sudo mdutil -E / 2>&1 | tee -a "$logfile"
for v in /Volumes/*; do sudo mdutil -i off "$v" 2>&1 | tee -a "$logfile" || true; done
mdutil -s / | tee -a "$logfile"

log "Step 2: DNS — flush caches"
sudo dscacheutil -flushcache 2>&1 | tee -a "$logfile" || true
sudo killall -HUP mDNSResponder 2>&1 | tee -a "$logfile" || true

log "Step 3: Network — verify jumbo frames (MTU 9000)"
networksetup -getMTU Ethernet 2>&1 | tee -a "$logfile" || true
networksetup -getMTU 'Thunderbolt Bridge' 2>&1 | tee -a "$logfile" || true
ifconfig en0 | grep -i mtu | tee -a "$logfile" || true

log "Step 4: Worker — build and deploy"
if [[ -d workers/noizylab ]]; then
  pushd workers/noizylab >/dev/null
  npm install 2>&1 | tee -a "$logfile"
  npm run build 2>&1 | tee -a "$logfile"
  wrangler deploy 2>&1 | tee -a "$logfile" || log "Deploy failed; check wrangler.toml and auth"
  popd >/dev/null
else
  log "workers/noizylab not found; skipping deploy"
fi

log "Step 5: Health check — Cloudflare Worker"
curl -s -o /dev/null -w "HTTP %{http_code}\n" https://noizylab.rsplowman.workers.dev | tee -a "$logfile" || true

log "Step 6: Repo — build, test, lint (if Makefile exists)"
if [[ -f Makefile ]]; then
  make install 2>&1 | tee -a "$logfile" || true
  make build 2>&1 | tee -a "$logfile" || true
  make test 2>&1 | tee -a "$logfile" || true
  make lint 2>&1 | tee -a "$logfile" || true
else
  log "No Makefile; skipping repo build steps"
fi

log "Step 7: I/O — quick storage speed test"
if [[ -d /Volumes/12TB ]]; then
  log "Writing 1GB test file..."
  time dd if=/dev/zero of=/Volumes/12TB/speedtest bs=1m count=1000 2>&1 | tee -a "$logfile" || true
  ls -lh /Volumes/12TB/speedtest 2>&1 | tee -a "$logfile" || true
  rm /Volumes/12TB/speedtest 2>&1 | tee -a "$logfile" || true
else
  log "/Volumes/12TB not found; skipping I/O test"
fi

log "Step 8: Environment snapshot"
uptime | tee -a "$logfile"
scutil --dns | head -20 | tee -a "$logfile" || true

log "=== Done. Logs saved to $logfile ==="