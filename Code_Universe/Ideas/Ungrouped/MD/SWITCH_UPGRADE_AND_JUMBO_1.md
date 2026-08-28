# DGS-1210-10 (MC96) Firmware + Jumbo Checklist

Use this to upgrade firmware, move management to LAN, and enable jumbo frames.

## 1) Verify Model & Backup
- Model: `DGS-1210-10`, Hardware Rev: `F1` (Device Info page)
- Current FW (example): `6.32.008`
- Backup config: `Maintenance/Tools > Configuration > Save/Backup`

## 2) Firmware Upgrade (F1 only)
1. Download the latest F1 firmware from D-Link support for DGS-1210-10.
2. Web UI: `Maintenance/Tools > Firmware Upgrade` (label may vary)
3. Upload `.hex`/`.bin` file; select "Keep configuration" if available
4. Start upgrade; do not power-cycle. Switch reboots automatically
5. After reboot: confirm new FW on Device Info; `Configuration > Save`

## 3) Migrate Management IP to LAN
- Web UI: `Management > IPv4 Interface`
- Set IP: `10.0.0.90`, Netmask: `255.255.255.0`, Gateway: `10.0.0.1`
- Apply, then `Configuration > Save`
- On macOS, remove temporary alias and verify:
  ```zsh
  scripts/switch_finalize.sh alias-remove
  scripts/switch_finalize.sh check 10.0.0.90
  ```

## 4) Enable Jumbo Frames and Port Options
- Jumbo Frames: `System > Jumbo Frame` → `9216`
- Port Settings: `EEE: Off`, `Flow Control: On` (as desired)
- `Configuration > Save`

## 5) Sanity Check & Throughput Test
- Confirm Device Info: updated FW, correct IP/gateway, Jumbo enabled
- Optional I/O test on local 12TB volume:
  ```zsh
  scripts/switch_finalize.sh throughput /Volumes/12TB
  ```

Notes:
- Match hardware revision exactly (F1). Wrong images can brick the device
- If the UI exposes primary/secondary images, flash the inactive image first
- Plan 10–15 minutes maintenance window
