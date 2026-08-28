**NOIZYLAB Team Enablement Plan**

**Objectives**
- **Computing History:** Understand milestones from early mainframes to cloud/edge.
- **Scripting Foundations:** Bash/zsh, PowerShell, Python — patterns and safety.
- **Systems Knowledge:** macOS + Windows internals, networking (MTU/jumbo), storage.
- **Conflict Resolution:** De-escalation, active listening, empathy, boundaries.
- **Brand Representation:** Clear, calm, factual, and helpful — always.

**Curriculum Tracks**
- **Track A — Apple/macOS**
  - Networking: `networksetup`, `ifconfig`, MTU/jumbo validation.
  - Storage: Spotlight, APFS, SMB tuning.
  - Automation: `launchd`, Homebrew, zsh scripting best practices.
- **Track B — Windows/PC**
  - Networking: MTU via `netsh`, NIC drivers, jumbo frames checks.
  - Storage: NTFS, SMB client tuning, PowerShell automation.
  - Admin: Event Viewer, Services, scheduled tasks.
- **Track C — Scripting & Pipelines**
  - Bash/zsh: idempotent scripts, error handling, logging.
  - PowerShell: modules, remoting, secure credential handling.
  - CI/CD: Wrangler deploys, environment config, rollback plans.
- **Track D — Networking & Performance**
  - D-Link DGS‑1210‑10: Jumbo frames, port configs, firmware.
  - Throughput testing: `dd`, `iperf3`, monitoring baselines.
  - VM Performance: Parallels bridged NICs, guest MTU, storage placement.
- **Track E — Soft Skills**
  - Calm under pressure: techniques, breathing, timeboxing.
  - Communication: structured updates, expectation management.
  - Boundaries: avoid scope creep; escalate appropriately.

**Exercises & Labs**
- Configure MTU 9000 end-to-end and verify with ping fragmentation tests.
- Optimize SMB shares; measure before/after throughput.
- Write a safe upgrade script with backup/rollback and verbose logs.
- Roleplay: handle a rude customer, maintain calm, resolve technically.

**Resources**
- Internal docs: `NOIZYLAB_INTEGRATION_MAP.md`, `AI_WORKERS_READINESS.md`.
- External: Apple Platform Security, Microsoft Docs, vendor manuals.
- Tooling: `wrangler`, `mdutil`, `scutil`, `iperf3`.

**Assessment**
- Practical: Pass MTU setup lab; deploy with rollback ready.
- Written: Short quiz on computing history and scripting principles.
- Behavioral: Observe conflict resolution and communication in roleplay.

**KPIs**
- Reduced incident time-to-resolution.
- Fewer deployment rollbacks.
- Higher customer satisfaction scores.
- Consistent adherence to safety and logging.

**Cadence**
- Weekly workshops (90 minutes) + monthly capstone lab.
- Pair programming and shadowing for new team members.

**Notes**
- Keep automation local-only until remote readiness is met.
- Document everything; practice calm, clear, and concise updates.