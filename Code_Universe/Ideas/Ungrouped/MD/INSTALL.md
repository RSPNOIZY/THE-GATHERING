# LaunchAgent Suite Install — One-Shot

**Per RSP cleanup directive 2026-04-20 + smarter-faster Lever #2:** install the 5 LaunchAgents that turn the empire's omnipresent-family doctrine into 24/7 operational reality.

## What gets installed

| LaunchAgent                  | What it does                                                             | Cadence                    |
| ---------------------------- | ------------------------------------------------------------------------ | -------------------------- |
| `com.noizy.gabriel`          | GABRIEL daemon (port 9777) — voice pipeline + orchestration + WebSocket  | Always running · KeepAlive |
| `com.noizy.healing-audit`    | Weekly Sunday 0900 UTC audit per `heal-the-world.md`                     | Sunday 9am                 |
| `com.noizy.lucy-git`         | LUCY auto-sync · `git add -A && commit && push` if dirty                 | Every 15 min               |
| `com.noizy.file-tracker`     | Find files newer than last run · log batch · feeds n8n mc96-file-tracker | Every 5 min                |
| `com.noizy.deck-propagation` | Propagate THE_DREAMCHAMBER.pptx to NOIZYWORLD/decks/                     | Every 1 hour               |

## Install (one-shot · Rob's hands)

```bash
# Copy all 5 plists into LaunchAgents
cp /Users/m2ultra/NOIZYANTHROPIC/infra/launchagents/com.noizy.*.plist ~/Library/LaunchAgents/

# Load each
for p in ~/Library/LaunchAgents/com.noizy.*.plist; do
  launchctl load "$p"
done

# Verify all 5 loaded
launchctl list | grep com.noizy
```

Expected output: 5 lines starting with `com.noizy.*`. PIDs may be `-` for the scheduled-interval ones (gabriel will show a real PID since it's KeepAlive).

## Logs

All five log to `/Users/m2ultra/NOIZYANTHROPIC/ops/logs/launchagent-*.log` and `.err`. Tail any to verify:

```bash
tail -f ~/NOIZYANTHROPIC/ops/logs/launchagent-gabriel.log
tail -f ~/NOIZYANTHROPIC/ops/logs/launchagent-healing-audit.log
```

## Uninstall (if needed)

```bash
for p in ~/Library/LaunchAgents/com.noizy.*.plist; do
  launchctl unload "$p"
  rm "$p"
done
```

Source plists in `infra/launchagents/` remain — uninstall only removes the active copies.

## Why this is smarter-faster Lever #2

Before: healing audit runs only when manually invoked (~weekly at best). LUCY git commits via ad-hoc cron. GABRIEL daemon needs manual `node` startup after every reboot.

After: 24/7 auto-restart on crash · scheduled audits without operator · file-tracker substrate continuously feeding n8n + ledger · deck propagation hourly so NOIZYWORLD always has current PPTX.

**Wound-detection latency goes from "weekly at best" to "hourly worst-case · 5-min for file events."** Per `feedback_omnipresent_family.md`, the doctrine of "the family does not sleep" becomes operationally true.

## Constitutional alignment

- **Article V (Revocation Real)** — Kill Switch via GABRIEL daemon is always reachable since daemon is KeepAlive
- **Article VII (Auditability)** — file-tracker + healing-audit produce continuous ledger entries
- **Family Covenant** — LUCY's git custodianship + GABRIEL's daemon presence + healing-audit cadence all run unattended
- **Heal the World** — wound discovery happens automatically, not on Rob's schedule
- **Omnipresent Family** — the 24/7 doctrine becomes operational reality
