**NOIZYLAB Labs Checklist**

**Lab 1 — MTU 9000 End-to-End**
- Check host: `networksetup -getMTU Ethernet` and `ifconfig en0 | grep mtu`.
- Switch: enable jumbo frames; set ports to 9000/9216.
- Guest: set `mtu 9000` and validate with `ping -M do -s 8972`.
- Record baseline throughput before/after.

**Lab 2 — SMB/NAS Tuning**
- Exclude volume from Spotlight; confirm `mdutil -s`.
- Enable `aio`, increase `rsize/wsize`, confirm server jumbo frames.
- Run `dd` speed tests; log MB/s and system load.

**Lab 3 — Safe Upgrade + Rollback**
- Create backup of config files.
- Apply changes with verbose logging.
- Validate; if failure, execute rollback steps; document result.

**Lab 4 — Wrangler Deploy Readiness**
- `wrangler whoami` and `wrangler login`.
- Verify `wrangler.toml` and account/project bindings.
- Dry-run deploy; capture logs; fix errors.

**Lab 5 — Conflict Resolution Roleplay**
- Scenario: customer upset; practice de-escalation.
- Use structured updates: context, action, risk, next steps.
- Receive feedback; iterate.

**Recording**
- Log steps, commands, outputs, metrics, and lessons learned per lab.