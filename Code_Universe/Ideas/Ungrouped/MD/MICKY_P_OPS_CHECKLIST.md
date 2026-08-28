# MICKY-P — One-Page Ops Checklist

> **Print this. Tape it next to MICKY-P.**
> Companion: `MICKY_P_MISSION_PROFILE.md`
> Captured by Gabriel · 2026-04-09

---

## ☀ STARTUP ROUTINE

```
[ ] 1. Power on. Wait for login.
[ ] 2. Verify network: ping 10.0.0.1 (router) + ping <GOD.local IP>
[ ] 3. Open Activity Monitor — confirm CPU < 20% idle, RAM < 50% used
[ ] 4. Quit anything launched at login that isn't on the keep-list
       (menu-bar tray apps, sync clients, browsers if not needed)
[ ] 5. Open Audio Hijack 3.8.13
       → confirm Apollo Quad detected as input
       → confirm U87 input gain looks right
       → load the saved capture session
[ ] 6. Open Terminal → tail -f ~/micky-p-session.log (or wherever logs go)
[ ] 7. SSH check: ssh god 'echo ok'   (if SSH key trust is set up)
[ ] 8. READY indicator: green dot in Audio Hijack + ping clean to GOD
```

---

## 🎙 CAPTURE WORKFLOW

```
[ ] 1. In Audio Hijack: load the session matching today's mission
       (vocal_take · voiceover · stem_capture · interview · etc.)
[ ] 2. Confirm input chain: U87 → Apollo Quad → Audio Hijack
[ ] 3. Set output device:
       → Loopback "NOIZY-MICKY-P" (for live LAN bridge to GOD)
       → AND/OR Recorder block to local AIFF (24-bit 48kHz)
[ ] 4. Hit RECORD — verify meters move and disk file grows
[ ] 5. Speak/play test phrase. Verify on GOD that signal arrived.
[ ] 6. Lock the session — do NOT touch anything else until done
[ ] 7. STOP recording. Save the take with descriptive name:
       YYYY-MM-DD_<purpose>_take<NN>.aiff
[ ] 8. Move file to ~/MICKY-P/Captures/<today>/
[ ] 9. rsync to GOD's archive prep folder when ready:
       rsync -av ~/MICKY-P/Captures/<today>/ god:~/NOIZY/Captures/incoming/
```

---

## 📦 ARCHIVE WORKFLOW

```
[ ] 1. Mount the source drive (old drive, USB, network share)
[ ] 2. Inventory: ls -la <source> | tee ~/MICKY-P/Logs/inventory_<date>.txt
[ ] 3. Identify candidates for the Aquarium archive (Logic projects,
       voice memos, scoring sessions, anything with creator value)
[ ] 4. Generate checksums BEFORE moving:
       shasum -a 256 <files> > ~/MICKY-P/Checksums/<batch>.txt
[ ] 5. Stage in ~/MICKY-P/Stage/<batch>/ — never operate on originals
[ ] 6. Rename consistently:
       <date>_<actor>_<context>_<sequence>.<ext>
[ ] 7. Re-checksum after rename — file content must match
[ ] 8. Build a manifest.json for the batch (what · why · when · from)
[ ] 9. rsync to GOD's archive intake:
       rsync -av --checksum ~/MICKY-P/Stage/<batch>/ god:~/NOIZY/Archive/incoming/<batch>/
[ ] 10. Log the action — write to ~/MICKY-P/Logs/archive_<date>.md
        (Receipt Spine on GOD will pick it up via the rsync target)
[ ] 11. Verify on GOD: ssh god 'ls -la ~/NOIZY/Archive/incoming/<batch>/'
[ ] 12. ONLY THEN delete from source (or leave originals in place)
```

---

## 🌙 SHUTDOWN ROUTINE

```
[ ] 1. Stop all Audio Hijack recordings — verify all sessions saved
[ ] 2. Close Audio Hijack (don't leave it running overnight unless capturing)
[ ] 3. Final rsync of any captures still in ~/MICKY-P/Captures/<today>/
[ ] 4. Append today's summary to ~/MICKY-P/Logs/daily_<date>.md
       (what was captured · what was archived · any anomalies)
[ ] 5. Eject any external drives
[ ] 6. Verify free disk space > 20GB (don't run MICKY-P below this)
[ ] 7. Close all browser tabs / unnecessary apps
[ ] 8. Sleep or shutdown — your call
```

---

## 🚫 RED LINE — DO NOT RUN ON MICKY-P

```
✗ Logic Pro for Mac (any current version) — needs macOS 15.6 + Apple silicon
✗ cloudflared (tunnel/connector daemon) — segfault on Catalina 10.15.7
✗ Any Heaven worker code or local Heaven mirror
✗ Any code that writes to the Receipt Spine database
✗ Any public-facing service or admin perimeter
✗ Any modern browser-based AI tool requiring current Chromium/WebKit
✗ Cluster mode for anything (PM2, redis, postgres workers, etc.)
✗ Heavy containerization (Docker, Kubernetes, kind, qdrant, neo4j, grafana)
✗ Anything that says "modern macOS only"
```

---

## 🔧 EMERGENCY: MICKY-P ACTING WEIRD

```
[ ] 1. Activity Monitor → kill any process > 200% CPU or > 4GB RAM
       that isn't Audio Hijack
[ ] 2. Check disk: df -h /  → must have > 5GB free or capture will fail
[ ] 3. Check Audio MIDI Setup → Apollo Quad still listed?
       If no: unplug + replug Apollo USB cable
[ ] 4. Restart coreaudiod:  sudo killall coreaudiod
[ ] 5. If audio still broken: reboot and rerun STARTUP ROUTINE
[ ] 6. If reboot doesn't fix it: SSH from GOD and check
       /var/log/system.log for hardware errors
[ ] 7. LAST RESORT: Capture directly on GOD's Apollo until MICKY-P is back
```

---

## 📞 ESCALATION

```
Stuck for > 15 min on a non-capture problem:
  → Stop. Open Gabriel cockpit on GOD. Type: "mickyp issue: <description>"
  → MICKY-P is a SUPPORT machine. Don't burn studio time fixing it
    when GOD can carry the load.

Capture failure during a real session:
  → Switch input directly to GOD's Apollo immediately
  → Investigate MICKY-P AFTER the session
```

---

## 📝 DAILY LOG TEMPLATE

```
~/MICKY-P/Logs/daily_2026-04-09.md

# 2026-04-09

## Captures
- 14:32  vocal_take_warm_phrasing  → 12.4s  → god:~/NOIZY/Captures/incoming/
- 14:48  voiceover_intro           → 8.2s   → god:~/NOIZY/Captures/incoming/

## Archives
- batch_old_logic_2018  →  17 files  →  god:~/NOIZY/Archive/incoming/batch_old_logic_2018/

## Anomalies
- Apollo Quad dropped at 14:18 — replugged, recovered. No data loss.

## Next session
- Continue archiving fish_music_inc legacy folder
```
