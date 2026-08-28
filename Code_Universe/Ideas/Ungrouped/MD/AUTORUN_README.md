**Mission Autorun — Usage & Outputs**

**Purpose**
- Run core diagnostics quickly: MTU validation, storage speed baseline, Wrangler auth/dry-run, and environment snapshots.

**Prerequisites**
- macOS with zsh; Cloudflare Wrangler installed (`npm i -g wrangler`).
- Access to `/Volumes/12TB` or adjust the path in `autorun.sh`.

**Run**
```
chmod +x ./autorun.sh
./autorun.sh
```

**Outputs**
- Created under `mission-run-YYYYMMDD-HHMMSS/`:
  - `mtu.txt` — MTU status for Ethernet/Thunderbolt/en0
  - `speedtest.txt` — 16GiB `dd` test with `oflag=direct`
  - `wrangler.txt` — `whoami` and `deploy --dry-run`
  - `env.txt` — Spotlight/DNS/uptime snapshot
  - `run.log` — overall steps and status

**Next Steps**
- Tune storage per `STORAGE_TUNING.md` and re-run to compare MB/s.
- If `wrangler deploy` fails, follow `WRANGLER_DEPLOY_GUIDE.md`.
- Track metrics in `KPI_DASHBOARD.md`.

---

**Auto-Run on Boot**

**macOS (M2 Ultra)**
- Alias added to `~/.zshrc`:
  ```
  alias noizylab-autorun="/path/to/autorun.sh"
  ```
- Auto-run on login added to `~/.zlogin`:
  ```
  nohup /path/to/autorun.sh > /tmp/noizylab-autorun.log 2>&1 &
  ```

**Windows (HP-OMEN)**
- Open PowerShell and edit your profile:
  ```
  notepad $PROFILE
  ```
- Add the following (adjust path as needed):
  ```powershell
  # NOIZYLAB autorun on startup
  Start-Process -NoNewWindow -FilePath "wsl" -ArgumentList "bash /mnt/c/path/to/autorun.sh" -RedirectStandardOutput "$env:TEMP\noizylab-autorun.log"
  ```
- If not using WSL, create a native `.ps1` script with equivalent checks and add it to Task Scheduler or `shell:startup`.